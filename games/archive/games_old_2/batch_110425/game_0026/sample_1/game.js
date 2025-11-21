// game.js - Main game file

import { gameState, getGameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Grid } from './grid.js';
import { updateGameLogic } from './game_logic.js';
import { handleKeyPressed, handlePlacementMode, resetGame } from './input_handler.js';
import { renderGame, logPlayerInfo } from './renderer.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Setup
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
    gameState.grid = new Grid();
    gameState.player = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 }; // Dummy player for logging
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: "START" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  // Draw
  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action && action.keyCode) {
        simulateKeyPress(p, action.keyCode);
      }
    }
    
    // Update game logic
    updateGameLogic(p);
    
    // Handle placement mode
    handlePlacementMode(p);
    
    // Render
    renderGame(p);
    
    // Log player info
    logPlayerInfo(p);
  };
  
  // Key handling
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p, p.key, p.keyCode);
    }
  };
  
  function simulateKeyPress(p, keyCode) {
    const key = String.fromCharCode(keyCode);
    handleKeyPressed(p, key, keyCode);
  }
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = document.querySelectorAll('.control-button');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  if (mode === "HUMAN") {
    document.getElementById('humanModeBtn')?.classList.add('active');
  } else if (mode === "TEST_1") {
    document.getElementById('test_1_ModeBtn')?.classList.add('active');
  } else if (mode === "TEST_2") {
    document.getElementById('test_2_ModeBtn')?.classList.add('active');
  } else if (mode === "TEST_3") {
    document.getElementById('test_3_ModeBtn')?.classList.add('active');
  }
};

export default gameInstance;