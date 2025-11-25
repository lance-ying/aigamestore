// game.js - Main game file

import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE } from './globals.js';
import { handleKeyPressed } from './input.js';
import { renderGame } from './rendering.js';
import { initializeGameState } from './game_logic.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Setup function
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize logs (write-only!)
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    // Initialize game state
    initializeGameState(p);
    
    // Log initial game state
    p.logs.game_info.push({
      data: { event: "game_initialized", phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  // Draw function
  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === PHASE.PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action !== null) {
        handleKeyPressed(p, action);
      }
    }
    
    // Render
    renderGame(p);
  };
  
  // Key pressed handler
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p, p.keyCode);
    }
    return false; // Prevent default
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn', 'test_4_ModeBtn', 'test_5_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const modeMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn',
    'TEST_3': 'test_3_ModeBtn',
    'TEST_4': 'test_4_ModeBtn',
    'TEST_5': 'test_5_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};