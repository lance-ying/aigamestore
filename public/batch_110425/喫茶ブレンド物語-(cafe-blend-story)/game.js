// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, initializeGameState, PHASE_PLAYING } from './globals.js';
import { handleKeyPressed, processAutomatedInput } from './input.js';
import { renderGame } from './render.js';
import { spawnCustomer, updateCustomers } from './customer.js';
import { checkGameProgress } from './progression.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Setup function
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
    
    // Initialize game state
    initializeGameState();
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase, action: 'game_initialized' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  // Draw function
  p.draw = function() {
    // Process automated testing input
    processAutomatedInput(p);
    
    // Update game logic
    if (gameState.gamePhase === PHASE_PLAYING) {
      updateGameLogic(p);
    }
    
    // Render
    renderGame(p);
    
    // Log player info periodically
    if (p.frameCount % 30 === 0 && gameState.gamePhase === PHASE_PLAYING) {
      p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y,
        game_x: gameState.player.x,
        game_y: gameState.player.y,
        framecount: p.frameCount
      });
    }
  };
  
  // Key pressed handler
  p.keyPressed = function() {
    handleKeyPressed(p, p.key, p.keyCode);
    return false; // Prevent default
  };
  
  function updateGameLogic(p) {
    // Update customers
    updateCustomers();
    
    // Spawn customers
    gameState.customerSpawnTimer++;
    if (gameState.customerSpawnTimer >= gameState.customerSpawnDelay) {
      spawnCustomer(p);
      gameState.customerSpawnTimer = 0;
    }
    
    // Check progression
    checkGameProgress();
    
    // Advance day periodically
    if (p.frameCount % 1800 === 0) {
      gameState.day++;
    }
  }
});

// Expose globally
window.gameInstance = gameInstance;

// Control mode setter
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
  
  const activeBtn = document.getElementById(mode === 'HUMAN' ? 'humanModeBtn' : 
                                           mode === 'TEST_1' ? 'test_1_ModeBtn' : 
                                           'test_2_ModeBtn');
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};

export default gameInstance;