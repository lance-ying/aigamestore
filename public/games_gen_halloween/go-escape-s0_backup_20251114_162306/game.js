// game.js - Main game logic with p5.js and Matter.js integration

const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Body } = Matter;

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Player } from './entities.js';
import { setupCollisionHandling, setLoadLevelFunction } from './physics.js';
import { createLevel } from './levels.js';

let gameInstance = new p5(p => {
  let testFrameCounter = 0;
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Create Matter.js engine and world
    const engine = Engine.create();
    const world = engine.world;
    world.gravity.y = 1;
    
    gameState.engine = engine;
    gameState.world = world;
    
    // Initialize p5.logs
    p.logs = {
      game_info: [],
      player_info: [],
      inputs: []
    };
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Setup collision handling
    setupCollisionHandling(p);
    
    // Set load level function for physics module
    setLoadLevelFunction(loadLevel);
  };
  
  p.draw = function() {
    // Update Matter.js physics
    if (gameState.gamePhase === "PLAYING") {
      Engine.update(gameState.engine, 1000 / 60);
    }
    
    // Handle game phases
    switch (gameState.gamePhase) {
      case "START":
        renderStartScreen(p);
        break;
      case "PLAYING":
        updateGame(p);
        renderGame(p);
        handleAutomatedTests(p);
        break;
      case "PAUSED":
        renderGame(p);
        renderPausedOverlay(p);
        break;
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        renderGame(p);
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
    
    // Phase control keys
    if (p.keyCode === 13 && gameState.gamePhase === "START") { // ENTER
      startGame(p);
    }
    
    if (p.keyCode === 27) { // ESC
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
    
    if (p.keyCode === 82) { // R
      if (gameState.gamePhase === "GAME_OVER_WIN" || 
          gameState.gamePhase === "GAME_OVER_LOSE") {
        resetGame(p);
      }
    }
    
    // Gameplay keys (only in PLAYING phase and HUMAN mode)
    if (gameState.gamePhase === "PLAYING" && gameState.controlMode === "HUMAN") {
      if (p.keyCode === 32) { // SPACE - Jump
        if (gameState.player) {
          gameState.player.jump();
        }
      }
    }
    
    return false;
  };
  
  function startGame(p) {
    gameState.gamePhase = "PLAYING";
    gameState.currentLevel = 1;
    gameState.score = 0;
    testFrameCounter = 0;
    
    p.logs.game_info.push({
      data: { gamePhase: "PLAYING", level: 1 },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    loadLevel(p, 1);
  }
  
  function loadLevel(p, levelNum) {
    // Clear existing entities
    clearEntities();
    
    // Create level
    const level = createLevel(p, levelNum);
    
    gameState.platforms = level.platforms;
    gameState.obstacles = level.obstacles;
    gameState.entities = [...level.platforms, ...level.obstacles];
    
    if (level.goal) {
      gameState.entities.push(level.goal);
    }
    
    // Create player
    gameState.player = new Player(p, level.playerStart.x, level.playerStart.y);
    gameState.entities.push(gameState.player);
    
    gameState.goalReached = false;
    gameState.levelStartTime = p.frameCount;
    testFrameCounter = 0;
  }
  
  window.loadLevel = loadLevel; // Expose for physics.js
  
  function clearEntities() {
    // Remove all bodies from world
    gameState.entities.forEach(entity => {
      if (entity.body) {
        World.remove(gameState.world, entity.body);
      }
    });
    
    if (gameState.player && gameState.player.body) {
      World.remove(gameState.world, gameState.player.body);
    }
    
    gameState.entities = [];
    gameState.platforms = [];
    gameState.obstacles = [];
    gameState.player = null;
  }
  
  function resetGame(p) {
    clearEntities();
    gameState.gamePhase = "START";
    gameState.currentLevel = 1;
    gameState.score = 0;
    testFrameCounter = 0;
    
    p.logs.game_info.push({
      data: { gamePhase: "START" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function updateGame(p) {
    // Update all entities
    gameState.entities.forEach(entity => {
      if (entity.update) {
        entity.update();
      }
    });
  }
  
  function renderStartScreen(p) {
    p.background(20, 30, 50);
    
    // Title
    p.fill(255, 200, 0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text("GO ESCAPE!", CANVAS_WIDTH / 2, 80);
    
    // Description
    p.fill(200, 200, 255);
    p.textSize(14);
    p.text("Guide your ball through challenging platforms!", CANVAS_WIDTH / 2, 140);
    p.text("Time your jumps to clear gaps and avoid obstacles.", CANVAS_WIDTH / 2, 160);
    
    // Instructions
    p.fill(255, 255, 255);
    p.textSize(16);
    p.text("CONTROLS", CANVAS_WIDTH / 2, 200);
    p.textSize(12);
    p.text("SPACE - Jump", CANVAS_WIDTH / 2, 225);
    p.text("ESC - Pause", CANVAS_WIDTH / 2, 245);
    
    // Platform legend
    p.textSize(14);
    p.text("PLATFORM TYPES", CANVAS_WIDTH / 2, 285);
    
    // Normal platform
    p.fill(100, 200, 100);
    p.rectMode(p.CENTER);
    p.rect(200, 310, 60, 15);
    p.fill(255);
    p.textSize(11);
    p.text("Normal", 200, 335);
    
    // Vanishing platform
    p.fill(200, 100, 200);
    p.rect(300, 310, 60, 15);
    p.fill(255);
    p.text("Vanishing", 300, 335);
    
    // Obstacle
    p.fill(200, 50, 50);
    p.rect(400, 310, 30, 30);
    p.fill(255);
    p.text("Obstacle", 400, 345);
    
    // Start prompt
    p.fill(255, 255, 0);
    p.textSize(20);
    const flashAlpha = p.map(p.sin(p.frameCount * 0.1), -1, 1, 100, 255);
    p.fill(255, 255, 0, flashAlpha);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 380);
  }
  
  function renderGame(p) {
    // Sky background
    p.background(135, 206, 235);
    
    // Ground
    p.fill(100, 150, 100);
    p.noStroke();
    p.rect(0, CANVAS_HEIGHT - 40, CANVAS_WIDTH, 40);
    
    // Render all entities
    gameState.entities.forEach(entity => {
      if (entity.render) {
        entity.render();
      }
    });
    
    // UI
    renderUI(p);
  }
  
  function renderUI(p) {
    // Level indicator
    p.fill(255);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(16);
    p.text(`Level: ${gameState.currentLevel}/${gameState.totalLevels}`, 10, 10);
    
    // Score
    p.text(`Score: ${gameState.score}`, 10, 30);
    
    // Control mode indicator
    if (gameState.controlMode !== "HUMAN") {
      p.fill(255, 255, 0);
      p.textAlign(p.RIGHT, p.TOP);
      p.text(`Mode: ${gameState.controlMode}`, CANVAS_WIDTH - 10, 10);
    }
  }
  
  function renderPausedOverlay(p) {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    
    p.textSize(16);
    p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
  }
  
  function renderGameOver(p) {
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    
    if (gameState.gamePhase === "GAME_OVER_WIN") {
      p.fill(0, 255, 0);
      p.textSize(48);
      p.text("YOU WIN!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
      
      p.fill(255);
      p.textSize(24);
      p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      p.text("All levels completed!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
    } else {
      p.fill(255, 100, 100);
      p.textSize(48);
      p.text("GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
      
      p.fill(255);
      p.textSize(20);
      p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      p.text(`Level: ${gameState.currentLevel}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 25);
    }
    
    p.fill(255, 255, 0);
    p.textSize(18);
    p.text("Press R to restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
  }
  
  function handleAutomatedTests(p) {
    testFrameCounter++;
    
    if (gameState.controlMode === "TEST_1") {
      // TEST_1: Jump every 60 frames
      if (testFrameCounter % 60 === 0 && gameState.player) {
        gameState.player.jump();
      }
    } else if (gameState.controlMode === "TEST_2") {
      // TEST_2: Timed jumps to complete all levels
      const jumpFrames = [120, 240, 360, 480, 600, 750, 900, 1050, 1200];
      if (jumpFrames.includes(testFrameCounter) && gameState.player) {
        gameState.player.jump();
      }
    } else if (gameState.controlMode === "TEST_3") {
      // TEST_3: Never jump (fall into first gap)
      // Do nothing - let the ball fall
    } else if (gameState.controlMode === "TEST_4") {
      // TEST_4: Jump to test vanishing platforms
      const jumpFrames = [100, 220, 340];
      if (jumpFrames.includes(testFrameCounter) && gameState.player) {
        gameState.player.jump();
      }
    } else if (gameState.controlMode === "TEST_5") {
      // TEST_5: Jump into moving obstacle in level 2
      if (gameState.currentLevel === 1) {
        // Complete level 1
        const jumpFrames = [120, 240, 360];
        if (jumpFrames.includes(testFrameCounter) && gameState.player) {
          gameState.player.jump();
        }
      } else if (gameState.currentLevel === 2) {
        // Intentionally collide with moving obstacle
        const jumpFrames = [100, 220, 340];
        if (jumpFrames.includes(testFrameCounter) && gameState.player) {
          gameState.player.jump();
        }
      }
    } else if (gameState.controlMode === "TEST_6") {
      // TEST_6: Complete level 1 and observe level 2
      if (gameState.currentLevel === 1) {
        const jumpFrames = [120, 240, 360];
        if (jumpFrames.includes(testFrameCounter) && gameState.player) {
          gameState.player.jump();
        }
      } else if (gameState.currentLevel === 2) {
        const jumpFrames = [100, 220, 340, 480, 620];
        if (jumpFrames.includes(testFrameCounter) && gameState.player) {
          gameState.player.jump();
        }
      }
    } else if (gameState.controlMode === "TEST_7") {
      // TEST_7: Test pause/resume functionality (automated)
      if (testFrameCounter === 120) {
        // Simulate ESC press
        gameState.gamePhase = "PAUSED";
        p.logs.game_info.push({
          data: { gamePhase: "PAUSED", automated: true },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (testFrameCounter === 240) {
        // Resume
        gameState.gamePhase = "PLAYING";
        p.logs.game_info.push({
          data: { gamePhase: "PLAYING", automated: true },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      
      // Normal jumps
      const jumpFrames = [80, 200, 320];
      if (jumpFrames.includes(testFrameCounter) && gameState.player) {
        gameState.player.jump();
      }
    }
  }
});

// Expose globally
window.gameInstance = gameInstance;