// game.js - Main game file

import { 
  gameState, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS,
  PHASE_START, PHASE_PLAYING
} from './globals.js';
import { renderGame } from './rendering.js';
import { updateGame, resetLevel } from './gameLogic.js';
import { handleKeyPressed, handleKeyReleased, updateInputFromTestController } from './input.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: PHASE_START, action: "game_initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    // Update test controller if not in human mode
    if (gameState.controlMode !== "HUMAN") {
      updateInputFromTestController(p);
      
      // Auto-start for test modes
      if (gameState.gamePhase === PHASE_START) {
        gameState.gamePhase = PHASE_PLAYING;
        gameState.currentLevel = 1;
        gameState.score = 0;
        resetLevel(p);
      }
    }

    // Update game logic
    updateGame(p);

    // Render
    renderGame(p);
  };

  p.keyPressed = function() {
    handleKeyPressed(p);
    return false; // Prevent default behavior
  };

  p.keyReleased = function() {
    handleKeyReleased(p);
    return false;
  };
});

// Expose game instance and state globally
window.gameInstance = gameInstance;
// Expose level loading for dev mode
window.loadLevel = function(levelNum) {
  const state = window.getGameState ? window.getGameState() : (window.gameState || (window.gameInstance && window.gameInstance.gameState));
  if (state) {
    // Set level using the property this game uses
    state.currentLevel = levelNum;
    state.currentLevel = levelNum; // Also set for compatibility
    // Try common reset/start patterns
    if (typeof resetGame === 'function') {
      resetGame();
    }
    if (typeof startGame === 'function') {
      startGame();
    } else if (state.gamePhase !== undefined) {
      state.gamePhase = "PLAYING";
    }
  }
};
// Expose level loading for dev mode
// Expose level loading for dev mode

window.getGameState = function() {
  return gameState;
};

window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = document.querySelectorAll('.control-button');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  if (mode === "HUMAN") {
    document.getElementById('humanModeBtn').classList.add('active');
  } else if (mode === "TEST_1") {
    document.getElementById('test_1_ModeBtn').classList.add('active');
  } else if (mode === "TEST_2") {
    document.getElementById('test_2_ModeBtn').classList.add('active');
  }
  
  gameInstance.logs.game_info.push({
    data: { action: "control_mode_changed", mode: mode },
    framecount: gameInstance.frameCount,
    timestamp: Date.now()
  });
};