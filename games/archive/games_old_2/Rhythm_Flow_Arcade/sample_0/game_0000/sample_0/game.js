// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS } from './globals.js';
import { generateChart, LEVEL_DEFINITIONS } from './levels.js';
import { handleKeyPressed, handleKeyReleased } from './input.js';
import { updateGameplay, handleNoteHit } from './gameplay.js';
import { renderGame } from './rendering.js';
import { updateTestController } from './testing.js';

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
    
    // Initialize game state
    gameState.currentChart = generateChart(gameState.currentLevel);
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: 'START', initialized: true },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Update test controller if in testing mode
    updateTestController(p);
    
    // Update gameplay
    updateGameplay(p);
    
    // Render
    renderGame(p);
  };
  
  p.keyPressed = function() {
    if (gameState.controlMode !== 'HUMAN') return;
    
    handleKeyPressed(p, p.keyCode);
    
    // Handle note hits during gameplay
    if (gameState.gamePhase === 'PLAYING') {
      handleNoteHit(p, p.keyCode);
    }
  };
  
  p.keyReleased = function() {
    if (gameState.controlMode !== 'HUMAN') return;
    
    handleKeyReleased(p, p.keyCode);
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = {
    'HUMAN': document.getElementById('humanModeBtn'),
    'TEST_1': document.getElementById('test_1_ModeBtn'),
    'TEST_2': document.getElementById('test_2_ModeBtn')
  };
  
  Object.keys(buttons).forEach(key => {
    if (buttons[key]) {
      if (key === mode) {
        buttons[key].classList.add('active');
      } else {
        buttons[key].classList.remove('active');
      }
    }
  });
  
  // Restart game when switching modes
  gameState.gamePhase = 'START';
  gameState.currentLevel = 1;
  gameState.currentChart = generateChart(gameState.currentLevel);
};