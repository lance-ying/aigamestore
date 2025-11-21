// game.js
import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { renderStartScreen, renderPlaying, renderGameOver } from './rendering.js';
import { handleKeyPressed, handleKeyReleased, applyAutomatedAction } from './input_handler.js';
import { updateGame } from './game_logic.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      "game_info": [],
      "inputs": [],
      "player_info": []
    };
    
    // Log initialization
    p.logs.game_info.push({
      data: { phase: "START", event: "game_initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    p.background(20, 20, 40);
    
    // Apply automated testing actions
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === "PLAYING") {
      const action = get_automated_testing_action(gameState);
      applyAutomatedAction(action);
    }
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case "START":
        renderStartScreen(p);
        break;
      case "PLAYING":
        updateGame(p);
        renderPlaying(p);
        break;
      case "PAUSED":
        renderPlaying(p);
        break;
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        renderGameOver(p);
        break;
    }
  };
  
  p.keyPressed = function() {
    handleKeyPressed(p);
    return false;
  };
  
  p.keyReleased = function() {
    handleKeyReleased(p);
    return false;
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode setter
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
  
  const activeBtn = mode === "HUMAN" ? 'humanModeBtn' : 
                    mode === "TEST_1" ? 'test_1_ModeBtn' :
                    mode === "TEST_2" ? 'test_2_ModeBtn' : null;
  
  if (activeBtn) {
    const btn = document.getElementById(activeBtn);
    if (btn) {
      btn.classList.add('active');
    }
  }
  
  gameInstance.logs.game_info.push({
    data: { event: "control_mode_changed", mode: mode },
    framecount: gameInstance.frameCount,
    timestamp: Date.now()
  });
};