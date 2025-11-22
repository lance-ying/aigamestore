// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS, PHASE_PLAYING, PHASE_PAUSED, KEY_ENTER, KEY_ESC, KEY_R } from './globals.js';
import { updateGame, initializeGame, showNextLetter } from './game_logic.js';
import { handleKeyPressed, handleKeyHeld, logPlayerInfo } from './input_handler.js';
import { renderGame } from './renderer.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Setup
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, message: "Game Initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  // Draw loop
  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === PHASE_PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action !== null && action !== undefined) {
        // Simulate key press
        handleKeyPressed(p, action);
        gameState.lastActionFrame = p.frameCount;
      }
    }
    
    // Handle held keys (for dragging)
    if (gameState.gamePhase === PHASE_PLAYING) {
      handleKeyHeld(p);
    }
    
    // Update game logic
    if (gameState.gamePhase === PHASE_PLAYING) {
      updateGame();
      showNextLetter();
      
      // Log player info periodically
      if (p.frameCount % 60 === 0) {
        logPlayerInfo(p);
      }
    }
    
    // Render
    renderGame(p);
  };
  
  // Key pressed handler
  p.keyPressed = function() {
    // Only process human inputs if not reserved keys
    if (gameState.controlMode === "HUMAN") {
      const keyCode = p.keyCode;
      
      // Don't handle ENTER, ESC, R here for testing - they're phase control keys
      if (keyCode === KEY_ENTER || keyCode === KEY_ESC || keyCode === KEY_R) {
        handleKeyPressed(p, keyCode);
        return;
      }
      
      // Handle gameplay keys
      if (gameState.gamePhase === PHASE_PLAYING) {
        handleKeyPressed(p, keyCode);
      }
    }
    
    return false; // Prevent default
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      if ((mode === 'HUMAN' && btnId === 'humanModeBtn') ||
          (mode === 'TEST_1' && btnId === 'test_1_ModeBtn') ||
          (mode === 'TEST_2' && btnId === 'test_2_ModeBtn') ||
          (mode === 'TEST_3' && btnId === 'test_3_ModeBtn')) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    }
  });
  
  console.log(`Control mode set to: ${mode}`);
};

// Initialize with human mode
window.setControlMode('HUMAN');

export default gameInstance;