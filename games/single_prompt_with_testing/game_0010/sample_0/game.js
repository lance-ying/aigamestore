// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';
import { updateGame } from './game_logic.js';
import { drawStartScreen, drawGame, drawGameOver } from './rendering.js';
import { handleKeyPressed } from './input_handler.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs (write-only)
  p.logs = {
    "game_info": [],
    "inputs": [],
    "player_info": []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize game
    gameState.gamePhase = PHASE_START;
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: PHASE_START },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === PHASE_PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action && action.keyCode) {
        handleKeyPressed(p, String.fromCharCode(action.keyCode), action.keyCode);
      }
    }
    
    // Update game logic
    if (gameState.gamePhase === PHASE_PLAYING) {
      updateGame(p);
    }
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case PHASE_START:
        drawStartScreen(p);
        break;
      case PHASE_PLAYING:
      case PHASE_PAUSED:
        drawGame(p);
        break;
      case PHASE_GAME_OVER_WIN:
      case PHASE_GAME_OVER_LOSE:
        drawGameOver(p);
        break;
    }
  };
  
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p, p.key, p.keyCode);
    }
    return false; // Prevent default
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ["humanModeBtn", "test_1_ModeBtn", "test_2_ModeBtn", "test_3_ModeBtn"];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove("active");
    }
  });
  
  const modeMap = {
    "HUMAN": "humanModeBtn",
    "TEST_1": "test_1_ModeBtn",
    "TEST_2": "test_2_ModeBtn",
    "TEST_3": "test_3_ModeBtn"
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add("active");
  }
};