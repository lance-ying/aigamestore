// game.js - Main game file

import { gameState, GAME_PHASES, CONTROL_MODES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { drawStartScreen, drawGameOverScreen, drawCafeView, drawRecipeLabView } from './ui.js';
import { initGameLogic, resetGame, updateGame } from './game_logic.js';
import { initInputHandler, handleInput, processKeyPress } from './input_handler.js';

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
    
    // Log initial state
    p.logs.game_info.push({
      data: {phase: "START"},
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Initialize systems
    initGameLogic(p);
    initInputHandler(p);
    resetGame();
  };
  
  // Draw
  p.draw = function() {
    // Handle automated testing input
    if (gameState.controlMode !== CONTROL_MODES.HUMAN) {
      handleInput(p);
    }
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        drawStartScreen(p);
        break;
        
      case GAME_PHASES.PLAYING:
        if (gameState.currentView === "CAFE") {
          drawCafeView(p);
        } else if (gameState.currentView === "RECIPE_LAB") {
          drawRecipeLabView(p);
        }
        updateGame(p);
        break;
        
      case GAME_PHASES.PAUSED:
        if (gameState.currentView === "CAFE") {
          drawCafeView(p);
        } else if (gameState.currentView === "RECIPE_LAB") {
          drawRecipeLabView(p);
        }
        break;
        
      case GAME_PHASES.GAME_OVER_WIN:
        drawGameOverScreen(p, true);
        break;
        
      case GAME_PHASES.GAME_OVER_LOSE:
        drawGameOverScreen(p, false);
        break;
    }
  };
  
  // Key pressed handler
  p.keyPressed = function() {
    if (gameState.controlMode === CONTROL_MODES.HUMAN) {
      processKeyPress(p.keyCode, p);
    }
    return false; // Prevent default
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Reset test state when switching modes
  if (mode !== CONTROL_MODES.HUMAN) {
    // Test mode activated
  }
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const activeBtnId = mode === CONTROL_MODES.HUMAN ? 'humanModeBtn' :
                      mode === CONTROL_MODES.TEST_1 ? 'test_1_ModeBtn' :
                      mode === CONTROL_MODES.TEST_2 ? 'test_2_ModeBtn' : null;
  
  if (activeBtnId) {
    const activeBtn = document.getElementById(activeBtnId);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }
  }
};

export default gameInstance;