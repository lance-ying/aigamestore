// game.js - Main game file with p5.js instance mode and Matter.js integration

const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Bodies, Body, Events } = Matter;

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, getGameState } from './globals.js';
import { Player } from './entities.js';
import { setupCollisionHandlers } from './physics.js';
import { createLevel } from './level.js';
import { handlePlayerInput, setControlMode } from './controls.js';
import { renderStartScreen, renderGame, renderUI, renderPausedOverlay, renderGameOver } from './render.js';

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);

    // Create Matter.js engine and world
    const engine = Engine.create();
    const world = engine.world;
    world.gravity.y = 0.8;

    gameState.engine = engine;
    gameState.world = world;

    // Setup collision handlers
    setupCollisionHandlers(engine, p);

    // Initialize p5.logs (write-only)
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

    // Initialize keys object
    gameState.keys = {};
  };

  p.draw = function() {
    // Update Matter.js physics
    Engine.update(gameState.engine, 1000 / 60);

    // Update game based on phase
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        renderStartScreen(p);
        break;

      case GAME_PHASES.PLAYING:
        updateGame(p);
        renderGame(p);
        break;

      case GAME_PHASES.PAUSED:
        renderGame(p);
        renderPausedOverlay(p);
        break;

      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        renderGameOver(p);
        break;
    }
  };

  function updateGame(p) {
    // Handle input
    handlePlayerInput(p);

    // Update all entities
    if (gameState.player) {
      gameState.player.update();
    }

    gameState.enemies.forEach(enemy => {
      if (!enemy.defeated) {
        enemy.update();
      }
    });

    gameState.coins.forEach(coin => {
      if (!coin.collected) {
        coin.update();
      }
    });

    gameState.cloverleaves.forEach(clover => {
      if (!clover.collected) {
        clover.update();
      }
    });
  }

  function initializeGame(p) {
    // Reset game state
    gameState.score = 0;
    gameState.currentLevel = 1;
    gameState.camera = { x: 0, y: 0 };
    gameState.testFrameCount = 0;

    // Clear world
    if (gameState.world) {
      World.clear(gameState.world, false);
    }

    // Create level
    createLevel(p, gameState.currentLevel);

    // Create player
    const player = new Player(p, 100, CANVAS_HEIGHT - 100);
    gameState.player = player;
    gameState.entities.push(player);

    // Log player creation
    p.logs.player_info.push({
      screen_x: player.body.position.x,
      screen_y: player.body.position.y,
      game_x: player.body.position.x,
      game_y: player.body.position.y,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  function resetGame(p) {
    initializeGame(p);
    gameState.gamePhase = GAME_PHASES.START;
    
    p.logs.game_info.push({
      data: { gamePhase: GAME_PHASES.START },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    // Store key state
    gameState.keys[p.keyCode.toString()] = true;

    // Handle phase transitions
    if (p.keyCode === 13 && gameState.gamePhase === GAME_PHASES.START) { // ENTER
      initializeGame(p);
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { gamePhase: GAME_PHASES.PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }

    if (p.keyCode === 27) { // ESC - Pause/Unpause
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
        p.logs.game_info.push({
          data: { gamePhase: GAME_PHASES.PAUSED },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        p.logs.game_info.push({
          data: { gamePhase: GAME_PHASES.PLAYING },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }

    if (p.keyCode === 82) { // R - Restart
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN ||
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        resetGame(p);
      }
    }

    return false;
  };

  p.keyReleased = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyReleased",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    // Clear key state
    gameState.keys[p.keyCode.toString()] = false;

    return false;
  };
});

// Expose globally
window.gameInstance = gameInstance;