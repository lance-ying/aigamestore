// game.js - Main game file

const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World } = Matter;

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, getGameState } from './globals.js';
import { initializeGrid, clearAllSelections } from './grid.js';
import { setupPhysics } from './physics.js';
import { 
  handleKeyPressed, 
  handleKeyReleased,
  handleMousePressed,
  handleMouseDragged,
  handleMouseReleased
} from './input.js';
import { 
  renderStartScreen, 
  renderGame, 
  renderPausedOverlay, 
  renderGameOver 
} from './render.js';
import { updateAI, resetAI } from './ai.js';

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);

    // Create Matter.js engine and world
    const engine = Engine.create();
    const world = engine.world;
    world.gravity.y = 0; // No gravity for this game

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

    // Setup physics
    setupPhysics();
    
    // Initialize game
    initializeGame(p);
  };

  p.draw = function() {
    // Update Matter.js physics engine
    Engine.update(gameState.engine, 1000 / 60);

    // Update game logic based on game phase
    switch (gameState.gamePhase) {
      case "START":
        renderStartScreen(p);
        break;
      case "PLAYING":
        if (gameState.controlMode !== "HUMAN") {
          updateAI(p);
        }
        renderGame(p);
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
    handleKeyPressed(p);
    
    // Handle restart from game over
    if (p.keyCode === 82) { // R
      if (gameState.gamePhase === "GAME_OVER_WIN" || 
          gameState.gamePhase === "GAME_OVER_LOSE") {
        resetGame(p);
      }
    }
    
    return false;
  };

  p.keyReleased = function() {
    handleKeyReleased(p);
    return false;
  };

  p.mousePressed = function() {
    handleMousePressed(p);
    return false;
  };

  p.mouseDragged = function() {
    handleMouseDragged(p);
    return false;
  };

  p.mouseReleased = function() {
    handleMouseReleased(p);
    return false;
  };
});

function initializeGame(p) {
  // Reset game state
  gameState.score = 0;
  gameState.moves = 0;
  gameState.level = 1;
  gameState.targetScore = 500;
  gameState.maxMoves = 20;
  gameState.entities = [];
  gameState.currentPath = [];
  gameState.selectedDots = [];
  gameState.animatingDots = [];
  gameState.fallingDots = [];
  gameState.particleEffects = [];
  gameState.dotsCleared = {};
  gameState.isConnecting = false;
  gameState.squareDetected = false;
  
  // Initialize grid
  initializeGrid(p);
  
  resetAI();
}

function resetGame(p) {
  // Clear all entities
  gameState.entities.forEach(entity => {
    if (entity.destroy) {
      entity.destroy();
    }
  });
  
  gameState.gamePhase = "START";
  
  p.logs.game_info.push({
    data: { gamePhase: "START" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  initializeGame(p);
}

// Expose globally
window.gameInstance = gameInstance;

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = document.querySelectorAll('.control-button');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  if (mode === 'HUMAN') {
    document.getElementById('humanModeBtn').classList.add('active');
  } else if (mode === 'TEST_1') {
    document.getElementById('test_1_ModeBtn').classList.add('active');
  } else if (mode === 'TEST_2') {
    document.getElementById('test_2_ModeBtn').classList.add('active');
  }
  
  resetAI();
};