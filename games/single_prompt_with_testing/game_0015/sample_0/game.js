// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_PLAYING } from './globals.js';
import { handleKeyPressed } from './input_handler.js';
import { render } from './renderer.js';
import { executeDealerTurn } from './dealer_ai.js';
import get_automated_testing_action from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let lastDealerTurnTime = 0;
  
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
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === PHASE_PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action && p.frameCount % 15 === 0) {
        handleKeyPressed(p, String.fromCharCode(action.keyCode), action.keyCode);
      }
    }
    
    // Auto-trigger dealer turn
    if (gameState.gamePhase === PHASE_PLAYING && 
        gameState.currentTurn === "DEALER" &&
        gameState.turnState === "CHOOSE_ACTION" &&
        Date.now() - lastDealerTurnTime > 1000) {
      lastDealerTurnTime = Date.now();
      executeDealerTurn(p);
    }
    
    // Render
    render(p);
    
    // Log player info
    if (gameState.player && gameState.gamePhase === PHASE_PLAYING) {
      if (p.frameCount % 60 === 0) {
        p.logs.player_info.push({
          screen_x: gameState.player.x,
          screen_y: gameState.player.y,
          game_x: gameState.player.x,
          game_y: gameState.player.y,
          framecount: p.frameCount
        });
      }
    }
  };
  
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p, p.key, p.keyCode);
    }
    return false;
  };
});

// Expose globally
window.gameInstance = gameInstance;

// Control mode management
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
  
  const modeMap = {
    "HUMAN": "humanModeBtn",
    "TEST_1": "test_1_ModeBtn",
    "TEST_2": "test_2_ModeBtn"
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add("active");
  }
};