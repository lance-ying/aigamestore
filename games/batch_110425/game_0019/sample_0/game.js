// game.js - Main game file

import { gameState, getGameState, GAME_PHASES } from './globals.js';
import { handleKeyPressed } from './input.js';
import { renderGame } from './render.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let lastAutomatedActionTime = 0;
  const automatedActionDelay = 100; // ms between automated actions

  p.setup = function() {
    p.createCanvas(600, 400);
    p.frameRate(60);
    
    // Set random seed for reproducibility
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    // Log initial game state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN") {
      const now = Date.now();
      if (now - lastAutomatedActionTime > automatedActionDelay) {
        const action = get_automated_testing_action(gameState);
        if (action && action.keyCode && action.keyCode !== 0) {
          simulateKeyPress(action.keyCode);
        }
        lastAutomatedActionTime = now;
      }
    }
    
    // Render
    renderGame(p);
  };

  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p);
    }
    return false;
  };

  function simulateKeyPress(keyCode) {
    p.keyCode = keyCode;
    
    // Map keyCode to key
    const keyMap = {
      13: 'Enter',
      27: 'Escape',
      32: ' ',
      37: 'ArrowLeft',
      38: 'ArrowUp',
      39: 'ArrowRight',
      40: 'ArrowDown',
      82: 'r',
      90: 'z',
      16: 'Shift'
    };
    p.key = keyMap[keyCode] || '';
    
    handleKeyPressed(p);
  }
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn'];
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
    'TEST_3': 'test_3_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};

// Export game instance
export default gameInstance;