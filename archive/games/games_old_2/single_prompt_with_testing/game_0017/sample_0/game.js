// game.js - Main game file

import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS, GAME_PHASES } from './globals.js';
import { createPlayer } from './player.js';
import { spawnEnemies } from './enemy.js';
import { initializeGrid, applyGravity } from './grid.js';
import { handleKeyPressed, setCursor } from './input.js';
import { enemyTurn, checkFloorComplete } from './combat.js';
import { renderStartScreen, renderGameScreen, renderPausedScreen, renderGameOverScreen } from './render.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Setup
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    // Initialize logs (write-only)
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: GAME_PHASES.START },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Initialize game
    initializeGame(p);
  };
  
  // Draw
  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== 'HUMAN') {
      handleAutomatedTesting(p);
    }
    
    // Update game logic
    updateGame(p);
    
    // Render
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        renderStartScreen(p);
        break;
      case GAME_PHASES.PLAYING:
        renderGameScreen(p);
        break;
      case GAME_PHASES.PAUSED:
        renderPausedScreen(p);
        break;
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        renderGameOverScreen(p);
        break;
    }
    
    // Log player info periodically
    if (p.frameCount % 60 === 0 && gameState.player) {
      p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y,
        game_x: gameState.player.x,
        game_y: gameState.player.y,
        framecount: p.frameCount
      });
    }
  };
  
  // Key handlers
  p.keyPressed = function() {
    handleKeyPressed(p, p.keyCode);
  };
  
  function initializeGame(p) {
    // Create player
    createPlayer();
    
    // Initialize grid
    initializeGrid(p);
    
    // Set cursor to center
    setCursor(2, 2);
    
    // Spawn initial enemies
    spawnEnemies(gameState.currentFloor);
  }
  
  function updateGame(p) {
    if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
    
    // Handle turn delay
    if (gameState.turnDelay > 0) {
      gameState.turnDelay--;
      
      if (gameState.turnDelay === 0) {
        // Execute enemy turn
        if (gameState.enemies.length > 0) {
          enemyTurn();
        }
        
        // Check floor completion
        checkFloorComplete();
      }
    }
    
    // Update animations
    if (gameState.animationTimer > 0) {
      gameState.animationTimer--;
    }
  }
  
  function handleAutomatedTesting(p) {
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      const action = get_automated_testing_action(gameState);
      
      if (action !== null && action !== undefined) {
        // Simulate key press
        p.keyCode = action;
        
        // Map keyCode to key string for logging
        const keyMap = {
          37: 'ArrowLeft',
          38: 'ArrowUp',
          39: 'ArrowRight',
          40: 'ArrowDown',
          32: ' ',
          16: 'Shift',
          90: 'z'
        };
        p.key = keyMap[action] || String.fromCharCode(action);
        
        handleKeyPressed(p, action);
      }
    }
  }
});

// Expose game instance
window.gameInstance = gameInstance;

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn'];
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
    'TEST_3': 'test_3_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};

export default gameInstance;