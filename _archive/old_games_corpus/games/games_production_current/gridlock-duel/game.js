// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, getGameState } from './globals.js';
import { initInput, handleKeyPressed, handleKeyReleased } from './input.js';
import { initGameLogic, updateGame } from './gameLogic.js';
import { initRenderer, render } from './renderer.js';
import { initTesting, updateTesting, setControlMode } from './testing.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // p5.js setup
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
    
    // Initialize modules
    initInput(p);
    initGameLogic(p);
    initRenderer(p);
    initTesting();
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: "START", status: "TITLE_SCREEN" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  // p5.js draw loop
  p.draw = function() {
    // Update game logic
    updateGame();
    
    // Update testing if in testing mode
    updateTesting();
    
    // Render
    render();
  };
  
  // TAP-BASED INPUT: p5.js key pressed (fires once per physical key press)
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p.key, p.keyCode);
    }
    return false; // Prevent default behavior
  };
  
  // TAP-BASED INPUT: Reset key state when released
  p.keyReleased = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyReleased(p.keyCode);
    }
    return false; // Prevent default behavior
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;
// Expose level loading for dev mode
window.loadLevel = function(levelNum) {
  const state = window.getGameState ? window.getGameState() : (window.gameState || (window.gameInstance && window.gameInstance.gameState));
  if (state) {
    // Set level using the property this game uses
    state.currentLevel = levelNum;
    state.currentLevel = levelNum; // Also set for compatibility
    // Try common reset/start patterns
    if (typeof resetGame === 'function') {
      resetGame();
    }
    if (typeof startGame === 'function') {
      startGame();
    } else if (state.gamePhase !== undefined) {
      state.gamePhase = "PLAYING";
    }
  }
};
// Expose level loading for dev mode
// Expose level loading for dev mode

// Expose getGameState function
window.getGameState = getGameState;

// Expose setControlMode function
window.setControlMode = setControlMode;