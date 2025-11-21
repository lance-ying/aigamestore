// game.js - Main game logic

const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Bodies, Body, Events } = Matter;

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_LENGTH, NUM_LANES, LANE_WIDTH } from './globals.js';
import { Player, Customer } from './entities.js';
import { setupCollisionHandling } from './physics.js';
import { generateLevel } from './levelGenerator.js';
import { renderStartScreen, renderGame, renderPausedOverlay, renderServingPhase, renderGameOver } from './rendering.js';
import { handleInput } from './controls.js';

let gameInstance = new p5(p => {
  let engine, world;

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);

    // Create Matter.js engine and world
    engine = Engine.create();
    world = engine.world;
    world.gravity.y = 0; // Top-down style, no gravity

    gameState.engine = engine;
    gameState.world = world;

    // Initialize p5.logs
    p.logs = {
      game_info: [],
      player_info: [],
      inputs: []
    };

    // Log initial game state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    // Setup collision handling
    setupCollisionHandling(engine, p);
    
    // Don't initialize game yet, wait for START phase
  };

  p.draw = function() {
    // Update Matter.js physics engine
    Engine.update(engine, 1000 / 60);

    // Update game logic based on game phase
    switch (gameState.gamePhase) {
      case "START":
        renderStartScreen(p);
        break;
      case "PLAYING":
        handleInput(p);
        updateGame(p);
        if (gameState.servingPhase) {
          renderServingPhase(p);
        } else {
          renderGame(p);
        }
        break;
      case "PAUSED":
        renderGame(p);
        renderPausedOverlay(p);
        break;
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        renderGameOver(p);
        break;
    }
  };

  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    // Handle phase controls
    if (p.keyCode === 13 && gameState.gamePhase === "START") { // ENTER
      initializeGame(p);
      gameState.gamePhase = "PLAYING";
      p.logs.game_info.push({
        data: { gamePhase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }

    if (p.keyCode === 27) { // ESC - Pause/Unpause
      if (gameState.gamePhase === "PLAYING") {
        gameState.gamePhase = "PAUSED";
        p.logs.game_info.push({
          data: { gamePhase: "PAUSED" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === "PAUSED") {
        gameState.gamePhase = "PLAYING";
        p.logs.game_info.push({
          data: { gamePhase: "PLAYING" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }

    if (p.keyCode === 82) { // R - Restart
      if (gameState.gamePhase === "GAME_OVER_WIN" ||
          gameState.gamePhase === "GAME_OVER_LOSE") {
        resetGame(p);
        gameState.gamePhase = "START";
        p.logs.game_info.push({
          data: { gamePhase: "START" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }

    return false; // Prevent default
  };

  function initializeGame(p) {
    // Clear existing entities
    gameState.entities.forEach(entity => {
      if (entity.body) {
        World.remove(world, entity.body);
      }
    });
    
    gameState.entities = [];
    gameState.score = 0;
    gameState.distanceTraveled = 0;
    gameState.cupsCollected = 0;
    gameState.obstaclesHit = 0;
    gameState.gatesPassed = 0;
    gameState.servingPhase = false;
    gameState.servingIndex = 0;
    gameState.servingTimer = 0;

    // Create player at starting position
    const startX = (1 + 0.5) * LANE_WIDTH; // Middle lane
    const startY = CANVAS_HEIGHT - 50;
    gameState.player = new Player(p, startX, startY);

    // Generate level
    const levelEntities = generateLevel(p);
    gameState.entities.push(...levelEntities);
    
    // Log initial player position
    p.logs.player_info.push({
      screen_x: startX,
      screen_y: startY,
      game_x: startX,
      game_y: 0,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  function updateGame(p) {
    if (gameState.servingPhase) {
      updateServingPhase(p);
      return;
    }
    
    // Move player forward automatically
    const moveSpeed = 2;
    gameState.distanceTraveled += moveSpeed;
    
    if (gameState.player && !gameState.player.isEmpty()) {
      gameState.player.cups.forEach(cup => {
        const newY = cup.body.position.y - moveSpeed;
        Body.setPosition(cup.body, { x: cup.body.position.x, y: newY });
      });
      
      gameState.player.update();
    }
    
    // Update entities
    gameState.entities.forEach(entity => {
      if (entity.update) entity.update();
    });
    
    // Check if player lost all cups
    if (gameState.player && gameState.player.isEmpty()) {
      gameState.gamePhase = 'GAME_OVER_LOSE';
      p.logs.game_info.push({
        data: { gamePhase: "GAME_OVER_LOSE", score: gameState.score },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    // Check if reached end
    if (gameState.distanceTraveled >= GAME_LENGTH) {
      startServingPhase(p);
    }
  }

  function startServingPhase(p) {
    gameState.servingPhase = true;
    gameState.servingIndex = 0;
    gameState.servingTimer = 0;
    
    // Create customers
    const numCups = gameState.player.cups.length;
    gameState.customers = [];
    
    for (let i = 0; i < numCups; i++) {
      const x = 50 + (i % 10) * 55;
      const y = 50 + Math.floor(i / 10) * 80;
      gameState.customers.push(new Customer(p, x, y, i));
    }
  }

  function updateServingPhase(p) {
    gameState.servingTimer++;
    
    // Serve one cup every 30 frames
    if (gameState.servingTimer >= 30) {
      if (gameState.servingIndex < gameState.player.cups.length) {
        const cup = gameState.player.cups[gameState.servingIndex];
        const customer = gameState.customers[gameState.servingIndex];
        
        customer.serve();
        gameState.score += cup.value;
        gameState.coins += cup.value;
        
        gameState.servingIndex++;
        gameState.servingTimer = 0;
      } else {
        // All cups served
        gameState.gamePhase = 'GAME_OVER_WIN';
        p.logs.game_info.push({
          data: { gamePhase: "GAME_OVER_WIN", score: gameState.score },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }

  function resetGame(p) {
    // Clear entities
    gameState.entities.forEach(entity => {
      if (entity.body) {
        World.remove(world, entity.body);
      }
    });
    
    if (gameState.player) {
      gameState.player.cups.forEach(cup => {
        World.remove(world, cup.body);
      });
    }
    
    gameState.entities = [];
    gameState.player = null;
    gameState.score = 0;
    gameState.distanceTraveled = 0;
    gameState.cupsCollected = 0;
    gameState.obstaclesHit = 0;
    gameState.gatesPassed = 0;
    gameState.servingPhase = false;
    gameState.customers = [];
    
    // Keep total coins accumulated across runs
  }
});

// Expose globally
window.gameInstance = gameInstance;