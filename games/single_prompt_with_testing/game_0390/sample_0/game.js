// game.js - Main game file

import { gameState, initializeGameState, GAME_PHASES } from './globals.js';
import { render } from './rendering.js';
import { handleKeyPressed } from './input.js';
import get_automated_testing_action from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };
  
  p.setup = function() {
    p.createCanvas(600, 400);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize game state
    initializeGameState();
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (p.frameCount % 5 === 0) { // Execute action every 5 frames
        const action = get_automated_testing_action(gameState);
        if (action) {
          handleKeyPressed(p, String.fromCharCode(action), action);
        }
      }
    }
    
    // Render
    render(p);
    
    // Log player info periodically
    if (p.frameCount % 30 === 0) {
      p.logs.player_info.push({
        screen_x: gameState.playerX,
        screen_y: gameState.playerY,
        game_x: gameState.playerX,
        game_y: gameState.playerY,
        framecount: p.frameCount
      });
    }
  };
  
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p, p.key, p.keyCode);
    }
    return false; // Prevent default
  };
});

// Expose globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ["humanModeBtn", "test_1_ModeBtn", "test_2_ModeBtn"];
  buttons.forEach(id => {
    const btn = document.getElementById(id);
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
};

export default gameInstance;