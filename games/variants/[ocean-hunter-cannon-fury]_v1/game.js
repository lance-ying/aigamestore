import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { initGame, updateGame } from './gameLogic.js';
import { renderGame } from './render.js';
import { handleKeyPressed, handleKeyReleased, processContinuousInput } from './input.js';


const p5 = window.p5;

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    initGame(p);
  };
  
  p.draw = function() {
    // Process continuous input (held keys)
    processContinuousInput(p);
    
    // Update game logic
    updateGame(p);
    
    // Render
    renderGame(p);
  };
  
  p.keyPressed = function() {
    handleKeyPressed(p);
    return false; // Prevent default
  };
  
  p.keyReleased = function() {
    handleKeyReleased(p);
    return false; // Prevent default
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;
// Expose level loading for dev mode
window.loadLevel = function(levelNum) {
  const state = window.getGameState ? window.getGameState() : (window.gameState || (window.gameInstance && window.gameInstance.gameState));
  if (state) {
    state.currentLevel = levelNum;
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

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn']; // Only human mode button remains
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const modeMap = {
    'HUMAN': 'humanModeBtn',
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};

// Difficulty mode setter
window.setDifficultyMode = function(mode) {
  gameState.difficultyMode = mode;
  
  // Update button states
  const buttons = ['normalModeBtn', 'easyModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const modeMap = {
    'NORMAL': 'normalModeBtn',
    'EASY': 'easyModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};