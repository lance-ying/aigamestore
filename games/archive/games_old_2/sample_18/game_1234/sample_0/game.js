// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { handleKeyPressed } from './input.js';
import { updateGame, renderGame } from './gameLoop.js';
import { getTestAction, executeTestAction } from './testController.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs (write-only)
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };
  
  let testActionTimer = 0;
  const TEST_ACTION_INTERVAL = 30; // frames between test actions
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Load high score from localStorage
    if (typeof localStorage !== 'undefined') {
      const savedHighScore = localStorage.getItem('triviaHighScore');
      if (savedHighScore) {
        gameState.highScore = parseInt(savedHighScore);
      }
    }
    
    // Log initial game state
    p.logs.game_info.push({
      data: "Game initialized",
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Handle test mode actions
    if (gameState.controlMode !== "HUMAN") {
      testActionTimer++;
      if (testActionTimer >= TEST_ACTION_INTERVAL) {
        testActionTimer = 0;
        const action = getTestAction(p);
        if (action) {
          executeTestAction(p, action);
        }
      }
    }
    
    // Update game logic
    updateGame(p);
    
    // Render game
    renderGame(p);
  };
  
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p);
    }
    return false; // Prevent default behavior
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  document.querySelectorAll('.control-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  if (mode === "HUMAN") {
    document.getElementById('humanModeBtn').classList.add('active');
  } else if (mode === "TEST_1") {
    document.getElementById('test_1_ModeBtn').classList.add('active');
  } else if (mode === "TEST_2") {
    document.getElementById('test_2_ModeBtn').classList.add('active');
  }
  
  console.log(`Control mode set to: ${mode}`);
};