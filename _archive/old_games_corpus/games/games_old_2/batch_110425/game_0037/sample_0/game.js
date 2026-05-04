// game.js - Main game file

import { gameState, initializeGameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS, GAME_PHASES } from './globals.js';
import { updateShops, renderShops } from './shop.js';
import { updateCustomers, renderCustomers } from './customer.js';
import { renderBuilding, updateRating } from './building.js';
import { renderUI, renderStartScreen, renderGameOverScreen } from './ui.js';
import { handleKeyPressed } from './input.js';
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
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    initializeGameState();
    
    p.logs.game_info.push({
      data: { event: 'game_initialized', gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    p.background(135, 206, 235); // Sky blue background
    
    // Handle game phases
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        renderStartScreen(p);
        break;
        
      case GAME_PHASES.PLAYING:
      case GAME_PHASES.PAUSED:
        // Update game state only if playing
        if (gameState.gamePhase === GAME_PHASES.PLAYING) {
          updateGame(p);
        }
        
        // Render game
        renderGame(p);
        break;
        
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        renderGame(p); // Render game in background
        renderGameOverScreen(p);
        break;
    }
    
    // Handle automated testing
    if (gameState.controlMode !== 'HUMAN' && gameState.gamePhase === GAME_PHASES.PLAYING) {
      handleAutomatedInput(p);
    }
    
    gameState.frameCount = p.frameCount;
  };
  
  function updateGame(p) {
    gameState.gameTime++;
    
    // Update shops
    updateShops(p);
    
    // Update customers
    updateCustomers(p);
    
    // Update hover detection for shops
    updateHoverDetection();
    
    // Update rating
    const hasWon = updateRating();
    if (hasWon) {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
      p.logs.game_info.push({
        data: { event: 'game_won', gamePhase: gameState.gamePhase, rating: gameState.rating },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    // Log player info periodically
    if (p.frameCount % 60 === 0) {
      p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y,
        game_x: gameState.player.gameX,
        game_y: gameState.player.gameY,
        framecount: p.frameCount
      });
    }
  }
  
  function renderGame(p) {
    // Render building
    renderBuilding(p);
    
    // Render shops
    renderShops(p);
    
    // Render customers
    renderCustomers(p);
    
    // Render UI
    renderUI(p);
  }
  
  function updateHoverDetection() {
    // Simple hover detection based on current floor
    gameState.hoveredShop = null;
    
    if (gameState.currentFloorIndex >= 0 && gameState.currentFloorIndex < gameState.floors.length) {
      const floor = gameState.floors[gameState.currentFloorIndex];
      if (floor.shops.length > 0) {
        // Just hover over the first shop for simplicity
        gameState.hoveredShop = floor.shops[0];
      }
    }
  }
  
  function handleAutomatedInput(p) {
    // Get action from automated testing controller
    const action = get_automated_testing_action(gameState);
    
    if (action !== null) {
      // Simulate key press
      handleKeyPressed(p, action);
    }
  }
  
  p.keyPressed = function() {
    if (gameState.controlMode === 'HUMAN') {
      handleKeyPressed(p, p.keyCode);
    }
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
};