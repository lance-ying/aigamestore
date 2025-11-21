// game.js - Main game file

import { gameState, GAME_PHASE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { setupInputHandlers } from './input.js';
import { updateGameplay, loadHighScore } from './gameplay.js';
import { renderGame } from './render.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };
  
  p.setup = () => {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Load high score
    loadHighScore();
    
    // Setup input handlers
    setupInputHandlers(p);
    
    // Initialize player reference for logging
    gameState.player = {
      x: 0,
      y: 0
    };
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = () => {
    // Update game logic
    updateGameplay(p);
    
    // Render
    renderGame(p);
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = (mode) => {
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
  
  console.log(`Control mode set to: ${mode}`);
};