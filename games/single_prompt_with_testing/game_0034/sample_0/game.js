// game.js - Main game file

import { gameState, getGameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { initializeWorld } from './world.js';
import { handleKeyPressed, handleKeyReleased, processGameplayInput } from './input.js';
import { updateGameLogic } from './gameplay.js';
import { renderGame } from './rendering.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let simulatedKeys = new Set();
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: "START" },
      framecount: 0,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    gameState.frameCount = p.frameCount;
    
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      handleAutomatedTesting(p);
    }
    
    // Process input
    processGameplayInput(p);
    
    // Update game logic
    updateGameLogic(p);
    
    // Render
    renderGame(p);
  };
  
  p.keyPressed = function() {
    handleKeyPressed(p);
    return false;
  };
  
  p.keyReleased = function() {
    handleKeyReleased(p);
    return false;
  };
  
  function handleAutomatedTesting(p) {
    // Clear previous simulated keys
    simulatedKeys.clear();
    
    // Get actions from automated testing controller
    const actions = get_automated_testing_action(gameState);
    
    // Simulate key presses
    if (actions && actions.length > 0) {
      actions.forEach(keyCode => {
        simulatedKeys.add(keyCode);
      });
    }
  }
  
  // Override keyIsDown for automated testing
  const originalKeyIsDown = p.keyIsDown.bind(p);
  p.keyIsDown = function(keyCode) {
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      return simulatedKeys.has(keyCode);
    }
    return originalKeyIsDown(keyCode);
  };
});

// Expose game instance globally
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