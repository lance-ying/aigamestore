// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS, PHASE_PLAYING } from './globals.js';
import { Player } from './player.js';
import { initRenderer, renderGame } from './rendering.js';
import { initInput, handleKeyPressed, updateHoveredElements } from './input.js';
import { initGameLogic, updateGame } from './game_logic.js';
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
    
    // Initialize subsystems
    initRenderer(p);
    initInput(p);
    initGameLogic(p);
    
    // Log setup
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, action: "setup_complete" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    p.background(20);
    
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === PHASE_PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action && action.keyCode) {
        simulateKeyPress(action.keyCode);
      }
    }
    
    // Update game logic
    updateGame();
    
    // Update hovered elements
    if (gameState.gamePhase === PHASE_PLAYING && !gameState.inventoryOpen && !gameState.mapOpen) {
      updateHoveredElements();
    }
    
    // Render
    renderGame();
  };
  
  p.keyPressed = function() {
    handleKeyPressed();
    return false;
  };
  
  function simulateKeyPress(keyCode) {
    p.keyCode = keyCode;
    
    // Set p.key based on keyCode
    if (keyCode >= 65 && keyCode <= 90) {
      p.key = String.fromCharCode(keyCode).toLowerCase();
    } else if (keyCode === 32) {
      p.key = ' ';
    } else {
      p.key = String.fromCharCode(keyCode);
    }
    
    handleKeyPressed();
  }
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ["humanModeBtn", "test_1_ModeBtn", "test_2_ModeBtn"];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove("active");
    }
  });
  
  const activeBtn = document.getElementById(mode === "HUMAN" ? "humanModeBtn" : 
                                           mode === "TEST_1" ? "test_1_ModeBtn" :
                                           mode === "TEST_2" ? "test_2_ModeBtn" : "humanModeBtn");
  if (activeBtn) {
    activeBtn.classList.add("active");
  }
  
  // Reset testing state
  if (mode !== "HUMAN") {
    gameState.testingFrameCount = 0;
    gameState.positionHistory = [];
  }
};