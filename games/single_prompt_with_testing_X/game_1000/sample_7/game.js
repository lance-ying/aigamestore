// game.js - Main game logic with p5.js and Matter.js

const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Bodies, Body, Events } = Matter;

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, DAYS_PER_SEASON } from './globals.js';
import { Player } from './entities.js';
import { setupCollisionHandling } from './physics.js';
import { initializeFarmGrid, advanceDay } from './utils.js';
import { handleHumanControls, handleInteraction, switchSeed, handleTestControls_1, handleTestControls_2 } from './controls.js';
import { renderStartScreen, renderGame, renderPausedOverlay, renderGameOver } from './render.js';

function initializeGame(p) {
  // Initialize farm grid
  initializeFarmGrid();
  
  // Create player
  gameState.player = new Player(p, 100, 100);
  gameState.entities.push(gameState.player);
  
  // Setup collision handling
  setupCollisionHandling();
  
  // Reset game state
  gameState.score = 0;
  gameState.day = 1;
  gameState.season = 0;
  gameState.energy = gameState.maxEnergy;
  gameState.farmingLevel = 1;
  gameState.farmingXP = 0;
  gameState.harvests = 0;
  gameState.timeOfDay = 0;
  gameState.framesSinceDay = 0;
  gameState.selectedSeed = "WHEAT";
}

function resetGame(p) {
  // Clear Matter.js world
  World.clear(gameState.world, false);
  Engine.clear(gameState.engine);
  
  // Reset entities
  gameState.entities = [];
  gameState.player = null;
  
  // Reinitialize
  initializeGame(p);
}

function updateGame(p) {
  // Handle controls based on mode
  switch (gameState.controlMode) {
    case "HUMAN":
      handleHumanControls(p);
      break;
    case "TEST_1":
      handleTestControls_1(p);
      break;
    case "TEST_2":
      handleTestControls_2(p);
      break;
  }
  
  // Update player
  if (gameState.player) {
    gameState.player.update();
  }
  
  // Update time of day
  gameState.framesSinceDay++;
  gameState.timeOfDay = Math.min(1, gameState.framesSinceDay / gameState.dayLength);
  
  // Advance day when time runs out
  if (gameState.framesSinceDay >= gameState.dayLength) {
    advanceDay(p);
  }
  
  // Energy depletion check
  if (gameState.energy <= 0 && gameState.day > 5) {
    // Give player some time to learn before failing
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
  }
}

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Create Matter.js engine and world
    const engine = Engine.create();
    const world = engine.world;
    world.gravity.y = 0; // No gravity for top-down view
    
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
    
    // Initialize game
    initializeGame(p);
  };
  
  p.draw = function() {
    // Update Matter.js physics engine
    Engine.update(gameState.engine, 1000 / 60);
    
    // Update game logic based on game phase
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
  
  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Handle phase controls
    if (p.keyCode === 13 && gameState.gamePhase === GAME_PHASES.START) { // ENTER
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
        gameState.gamePhase = GAME_PHASES.START;
        p.logs.game_info.push({
          data: { gamePhase: GAME_PHASES.START },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    // Gameplay controls
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (p.keyCode === 32) { // Space - Interact
        handleInteraction(p);
      }
      
      if (p.keyCode === 90) { // Z - Switch seed
        switchSeed(p);
      }
    }
    
    return false; // Prevent default
  };
  
  p.keyReleased = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyReleased",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    return false;
  };
});

// Expose globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const modeMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  gameInstance.logs.game_info.push({
    data: { event: "control_mode_change", mode: mode },
    framecount: gameInstance.frameCount,
    timestamp: Date.now()
  });
};