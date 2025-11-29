// game.js - Main game loop and p5.js instance

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { handleKeyPress, handleKeyRelease } from './input.js';
import { updateGame } from './game_logic.js';
import { 
  renderStartScreen, 
  renderGame, 
  renderPauseScreen, 
  renderGameOver 
} from './ui.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs
  p.logs = {
    "game_info": [],
    "inputs": [],
    "player_info": []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize game state
    gameState.gamePhase = "START";
    gameState.controlMode = "HUMAN";
    gameState.frameCount = 0;
    gameState.lastFrameTime = p.millis();
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Update frame count and delta time
    gameState.frameCount = p.frameCount;
    const currentTime = p.millis();
    gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
    gameState.lastFrameTime = currentTime;
    
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN") {
      const action = get_automated_testing_action(gameState);
      if (action && action.keyCode) {
        // Simulate key press
        p.keyCode = action.keyCode;
        handleKeyPress(p);
        
        // Simulate key release after a few frames
        setTimeout(() => {
          p.keyCode = action.keyCode;
          handleKeyRelease(p);
        }, 50);
      }
    }
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case "START":
        renderStartScreen(p);
        break;
      case "PLAYING":
        updateGame(p);
        renderGame(p);
        break;
      case "PAUSED":
        updateGame(p);
        renderGame(p);
        renderPauseScreen(p);
        break;
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        renderGame(p);
        renderGameOver(p);
        break;
    }
  };
  
  p.keyPressed = function() {
    handleKeyPress(p);
    return false; // Prevent default behavior
  };
  
  p.keyReleased = function() {
    handleKeyRelease(p);
    return false; // Prevent default behavior
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode management
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  document.querySelectorAll('.control-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const buttonMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn'
  };
  
  const buttonId = buttonMap[mode];
  if (buttonId) {
    const button = document.getElementById(buttonId);
    if (button) {
      button.classList.add('active');
    }
  }
  
  // Log mode change
  if (gameInstance.logs && gameInstance.logs.game_info) {
    gameInstance.logs.game_info.push({
      data: { controlMode: mode },
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
};