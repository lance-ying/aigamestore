// game.js - Main game file with p5.js instance and game loop

const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Bodies, Body, Events } = Matter;

import {
  gameState,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_LOSE,
  INTERSECTION_Y_START,
  getGameState
} from './globals.js';

import { Player } from './entities.js';
import { setupCollisionHandling } from './physics.js';
import { updateTrafficSpawning, clearAllTraffic } from './traffic.js';
import { AIController } from './ai.js';
import {
  renderStartScreen,
  renderGame,
  renderPausedOverlay,
  renderGameOver
} from './render.js';

let aiController;

function initializeGame(p) {
  // Clear existing entities
  gameState.entities.forEach(entity => {
    if (entity && entity.remove) {
      entity.remove();
    }
  });
  
  gameState.entities = [];
  gameState.coins = [];
  clearAllTraffic();
  
  // Reset game state
  gameState.score = 0;
  gameState.crossingsCompleted = 0;
  gameState.currentDifficulty = 1;
  gameState.isAccelerating = false;
  gameState.canAccelerate = true;
  gameState.intersectionY = INTERSECTION_Y_START;
  gameState.trafficSpawnTimer = 0;
  gameState.framesSinceLastCrossing = 0;
  
  // Create player
  const player = new Player(p, 300, 50);
  gameState.player = player;
  gameState.entities.push(player);
  
  // Setup collision handling
  setupCollisionHandling(p);
  
  // Log initialization
  p.logs.game_info.push({
    data: { event: 'game_initialized' },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function resetGame(p) {
  initializeGame(p);
  
  p.logs.game_info.push({
    data: { event: 'game_reset', gamePhase: PHASE_START },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function updateGame(p) {
  // Update frame counter for crossing detection
  gameState.framesSinceLastCrossing++;
  
  // Update player
  if (gameState.player) {
    gameState.player.update();
  }
  
  // Update traffic spawning and movement
  updateTrafficSpawning(p);
  
  // Update coins
  gameState.coins.forEach((coin, index) => {
    coin.update();
    if (coin.collected) {
      coin.remove();
      gameState.coins.splice(index, 1);
      const entityIndex = gameState.entities.indexOf(coin);
      if (entityIndex > -1) {
        gameState.entities.splice(entityIndex, 1);
      }
    }
  });
  
  // Update AI if active
  if (aiController && gameState.controlMode !== 'HUMAN') {
    aiController.update(p);
  }
}

// Create p5 instance
let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Create Matter.js engine and world
    const engine = Engine.create();
    const world = engine.world;
    world.gravity.y = 0; // No gravity for top-down style
    
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
    
    // Initialize AI controller
    aiController = new AIController();
    
    // Initialize game
    initializeGame(p);
  };
  
  p.draw = function() {
    // Update Matter.js physics
    Engine.update(gameState.engine, 1000 / 60);
    
    // Handle game phases
    switch (gameState.gamePhase) {
      case PHASE_START:
        renderStartScreen(p);
        break;
        
      case PHASE_PLAYING:
        updateGame(p);
        renderGame(p);
        break;
        
      case PHASE_PAUSED:
        renderGame(p);
        renderPausedOverlay(p);
        break;
        
      case PHASE_GAME_OVER_LOSE:
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
    
    // Phase control - ENTER to start
    if (p.keyCode === 13 && gameState.gamePhase === PHASE_START) {
      gameState.gamePhase = PHASE_PLAYING;
      p.logs.game_info.push({
        data: { gamePhase: PHASE_PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    // ESC to pause/unpause
    if (p.keyCode === 27) {
      if (gameState.gamePhase === PHASE_PLAYING) {
        gameState.gamePhase = PHASE_PAUSED;
        p.logs.game_info.push({
          data: { gamePhase: PHASE_PAUSED },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === PHASE_PAUSED) {
        gameState.gamePhase = PHASE_PLAYING;
        p.logs.game_info.push({
          data: { gamePhase: PHASE_PLAYING },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    // R to restart from game over
    if (p.keyCode === 82) {
      if (gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
        resetGame(p);
        gameState.gamePhase = PHASE_START;
        p.logs.game_info.push({
          data: { gamePhase: PHASE_START },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    // Gameplay controls - SPACE to accelerate
    if (gameState.gamePhase === PHASE_PLAYING && gameState.controlMode === 'HUMAN') {
      if (p.keyCode === 32) { // SPACE
        if (gameState.player) {
          gameState.player.accelerate();
        }
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
    
    // Stop accelerating when SPACE released
    if (gameState.gamePhase === PHASE_PLAYING && gameState.controlMode === 'HUMAN') {
      if (p.keyCode === 32) {
        if (gameState.player) {
          gameState.player.stopAccelerating();
        }
      }
    }
    
    return false;
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching function
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  if (mode === 'HUMAN') {
    aiController.setStrategy('IDLE');
  } else {
    aiController.setStrategy(mode);
  }
  
  // Update button states
  document.querySelectorAll('.control-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const buttonMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn'
  };
  
  const activeBtn = document.getElementById(buttonMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  console.log(`Control mode set to: ${mode}`);
};

export { gameInstance };