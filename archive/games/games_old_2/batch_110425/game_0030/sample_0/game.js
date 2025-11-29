// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, getGameState } from './globals.js';
import { initializeGame, updateGameLogic } from './game_logic.js';
import { handleKeyPressed, processAutomatedAction } from './input_handler.js';
import { renderStartScreen, renderGameOverScreen, renderMenu, renderHUD, renderGrid, renderCursor } from './ui.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
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
    
    // Initialize game
    initializeGame();
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: "START" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    p.background(80, 180, 220);
    
    if (gameState.gamePhase === "START") {
      renderStartScreen(p);
    } else if (gameState.gamePhase === "GAME_OVER") {
      renderGameplay(p);
      renderGameOverScreen(p);
    } else if (gameState.gamePhase === "PLAYING") {
      // Process automated testing
      if (gameState.controlMode !== "HUMAN") {
        const action = get_automated_testing_action(gameState);
        if (action) {
          processAutomatedAction(action);
        }
      }
      
      updateGameLogic(p);
      renderGameplay(p);
      
      // Log player info periodically
      if (p.frameCount % 60 === 0) {
        p.logs.player_info.push({
          screen_x: gameState.cursorX * 40,
          screen_y: gameState.cursorY * 40,
          game_x: gameState.cursorX,
          game_y: gameState.cursorY,
          framecount: p.frameCount
        });
      }
    }
  };
  
  function renderGameplay(p) {
    // Background pattern
    p.fill(100, 220, 255);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH - 150, CANVAS_HEIGHT);
    
    // Grid
    renderGrid(p);
    
    // Facilities
    gameState.facilities.forEach(facility => facility.render(p));
    
    // Customers
    gameState.customers.forEach(customer => customer.render(p));
    
    // Cursor
    renderCursor(p);
    
    // Menu
    renderMenu(p);
    
    // HUD
    renderHUD(p);
  }
  
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p);
    }
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

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
  
  const activeBtn = mode === "HUMAN" ? "humanModeBtn" : 
                    mode === "TEST_1" ? "test_1_ModeBtn" :
                    mode === "TEST_2" ? "test_2_ModeBtn" : null;
  
  if (activeBtn) {
    const btn = document.getElementById(activeBtn);
    if (btn) {
      btn.classList.add('active');
    }
  }
  
  // Restart game when switching modes
  if (gameState.gamePhase !== "START") {
    initializeGame();
    gameState.gamePhase = "START";
  }
};