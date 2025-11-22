// game.js - Main game file

import {
  gameState,
  getGameState,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  TARGET_FPS,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  CONTROL_HUMAN,
  initializeCafeGrid
} from './globals.js';

import {
  drawStartScreen,
  drawGameOverScreen,
  drawCafeGrid,
  drawFurniture,
  drawCustomers,
  drawUI,
  drawMenu,
  drawPlacementPreview
} from './rendering.js';

import {
  handleKeyPressed,
  processAutomatedAction
} from './input_handler.js';

import {
  spawnCustomer,
  updateCustomers
} from './customer_system.js';

import {
  calculateAtmosphere,
  updateCustomerSpawnRate
} from './cafe_management.js';

import {
  checkGameOver
} from './game_state.js';

import { get_automated_testing_action } from './automated_testing_controller.js';

// p5.js instance mode
const p5 = window.p5;

let gameInstance = new p5(p => {
  // Setup function
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
    
    // Initialize game state
    initializeCafeGrid();
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: PHASE_START, event: "game_initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  // Draw function
  p.draw = function() {
    p.background(50, 40, 60);
    
    // Handle different game phases
    if (gameState.gamePhase === PHASE_START) {
      drawStartScreen(p);
    } else if (gameState.gamePhase === PHASE_PLAYING || gameState.gamePhase === PHASE_PAUSED) {
      // Update game logic (only if not paused)
      if (gameState.gamePhase === PHASE_PLAYING) {
        updateGameLogic(p);
      }
      
      // Render game
      drawCafeGrid(p);
      drawFurniture(p);
      drawCustomers(p);
      drawPlacementPreview(p);
      drawUI(p);
      drawMenu(p);
      
    } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      drawGameOverScreen(p, gameState.gamePhase === PHASE_GAME_OVER_WIN);
    }
  };
  
  // Update game logic
  function updateGameLogic(p) {
    gameState.frameCount++;
    
    // Process automated testing actions
    if (gameState.controlMode !== CONTROL_HUMAN) {
      const action = get_automated_testing_action(gameState);
      processAutomatedAction(p, action);
    }
    
    // Update customer spawning
    if (gameState.frameCount - gameState.lastCustomerSpawn >= gameState.customerSpawnRate) {
      if (gameState.menu.length > 0 && gameState.customers.length < 5) {
        spawnCustomer(p);
        gameState.lastCustomerSpawn = gameState.frameCount;
      }
    }
    
    // Update customers
    updateCustomers();
    
    // Update atmosphere
    calculateAtmosphere();
    updateCustomerSpawnRate();
    
    // Check win condition
    checkGameOver(p);
    
    // Log player info periodically
    if (gameState.frameCount % 60 === 0) {
      p.logs.player_info.push({
        screen_x: 200,
        screen_y: 200,
        game_x: 200,
        game_y: 200,
        framecount: p.frameCount
      });
    }
  }
  
  // Key press handler
  p.keyPressed = function() {
    handleKeyPressed(p, p.keyCode);
    return false; // Prevent default
  };
});

// Expose game instance globally
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
  
  // Reset test frame count when switching modes
  gameState.testFrameCount = 0;
};