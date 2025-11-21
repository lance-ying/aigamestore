// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS, PHASE_PLAYING } from './globals.js';
import { updateGame } from './game_logic.js';
import { handleKeyPressed, handleKeyReleased, processInputs } from './input_handler.js';
import { renderGame } from './renderer.js';

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
      data: { phase: gameState.gamePhase, initialized: true },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  // Draw loop
  p.draw = function() {
    // Apply slow motion if active
    if (gameState.gamePhase === PHASE_PLAYING && gameState.slowMotion) {
      if (p.frameCount % 2 !== 0) {
        return; // Skip every other frame for slow-mo effect
      }
    }
    
    // Process inputs
    processInputs();
    
    // Update game
    updateGame();
    
    // Render
    renderGame(p);
  };
  
  // Input handlers
  p.keyPressed = function() {
    handleKeyPressed(p, p.key, p.keyCode);
  };
  
  p.keyReleased = function() {
    handleKeyReleased(p, p.key, p.keyCode);
  };
});

// Expose globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn', 'test_4_ModeBtn'];
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
    'TEST_4': 'test_4_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};