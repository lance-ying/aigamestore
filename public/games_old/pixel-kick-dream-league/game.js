// game.js - Main game file
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { initializeGame, updateGame } from './gameLogic.js';
import { renderGame } from './render.js';
import { setupInput, getTestingAction, executeTestAction } from './input.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize logs (write-only)
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    // Setup input handling
    setupInput(p);
    
    // Initialize game
    initializeGame(p);
  };
  
  p.draw = function() {
    // Handle testing mode
    if (gameState.controlMode !== 'HUMAN') {
      const action = getTestingAction(p);
      if (action) {
        executeTestAction(action);
      }
    }
    
    // Update game logic
    updateGame(p);
    
    // Render game
    renderGame(p);
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Expose getGameState function
window.getGameState = function() {
  return gameState;
};

// Expose setControlMode function
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
  
  const activeBtn = document.getElementById(`${mode === 'HUMAN' ? 'human' : mode.toLowerCase()}ModeBtn`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  gameInstance.logs.game_info.push({
    data: { controlMode: mode },
    framecount: gameInstance.frameCount,
    timestamp: Date.now()
  });
};