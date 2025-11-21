// game.js - Main game file

import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS } from './globals.js';
import { setupGame } from './game-logic.js';
import { initGameLogic, updateGame } from './game-logic.js';
import { initRenderer, renderGame } from './renderer.js';
import { initInput, handleKeyPressed, handleKeyReleased } from './input.js';
import { initInteraction, handleMousePressed } from './interaction.js';
import { getAutomatedAction, executeAutomatedAction } from './automated-testing.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };
  
  p.setup = function() {
    const canvas = p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    // Initialize modules
    initGameLogic(p);
    initRenderer(p);
    initInput(p);
    initInteraction(p);
    
    // Setup game
    setupGame();
    
    // Log game setup
    p.logs.game_info.push({
      data: { phase: "START", event: "game_initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN") {
      const action = getAutomatedAction();
      if (action) {
        executeAutomatedAction(action);
      }
    }
    
    // Update game
    updateGame();
    
    // Render game
    renderGame();
  };
  
  p.keyPressed = function() {
    handleKeyPressed(p.key, p.keyCode);
    return false;
  };
  
  p.keyReleased = function() {
    handleKeyReleased(p.key, p.keyCode);
    return false;
  };
  
  p.mousePressed = function() {
    handleMousePressed();
    return false;
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Expose getGameState globally
window.getGameState = getGameState;

// Control mode switching
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