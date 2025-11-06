// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { initializeGame, updateGameLogic } from './game_logic.js';
import { handleInput, handleKeyPressed, handleKeyReleased, processAutomatedInput } from './input_handler.js';
import { renderGame, logPlayerInfo } from './renderer.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

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
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize game
    initializeGame(p);
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== 'HUMAN' && gameState.gamePhase === 'PLAYING') {
      const action = get_automated_testing_action(gameState);
      processAutomatedInput(action, p);
    }
    
    // Handle human input
    if (gameState.controlMode === 'HUMAN') {
      handleInput(p);
    }
    
    // Update game logic
    updateGameLogic(p);
    
    // Render
    renderGame(p);
    
    // Log player info periodically
    logPlayerInfo(p);
  };

  p.keyPressed = function() {
    handleKeyPressed(p);
  };

  p.keyReleased = function() {
    handleKeyReleased(p);
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Expose getGameState function
window.getGameState = function() {
  return gameState;
};

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
  
  // Reinitialize game when switching modes
  if (gameState.gamePhase === 'PLAYING') {
    initializeGame(gameInstance);
    gameState.gamePhase = 'PLAYING';
  }
};