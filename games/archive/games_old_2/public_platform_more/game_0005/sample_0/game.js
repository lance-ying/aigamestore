// game.js - Main game file

import { gameState, GAME_PHASES, getGameState } from './globals.js';
import { renderStartScreen, renderGameScreen, renderGameOver } from './render.js';
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
    
    // Initialize selected card index
    gameState.selectedCardIndex = 0;
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN") {
      const action = get_automated_testing_action(gameState);
      if (action && action.keyCode) {
        handleKeyPressed(p, String.fromCharCode(action.keyCode), action.keyCode);
      }
    }
    
    // Update animations
    gameState.animations = gameState.animations.filter(anim => {
      anim.update();
      return !anim.completed;
    });
    
    // Log player info periodically
    if (gameState.player && p.frameCount % 60 === 0) {
      p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y,
        game_x: gameState.player.x,
        game_y: gameState.player.y,
        framecount: p.frameCount
      });
    }
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        renderStartScreen(p);
        break;
      case GAME_PHASES.PLAYING:
      case GAME_PHASES.PAUSED:
        renderGameScreen(p);
        break;
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        renderGameOver(p);
        break;
    }
  };
  
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p, p.key, p.keyCode);
    }
    return false;
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
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
  
  const activeBtn = document.getElementById(
    mode === "HUMAN" ? "humanModeBtn" :
    mode === "TEST_1" ? "test_1_ModeBtn" :
    mode === "TEST_2" ? "test_2_ModeBtn" :
    mode === "TEST_3" ? "test_3_ModeBtn" :
    "humanModeBtn"
  );
  
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};

export default gameInstance;