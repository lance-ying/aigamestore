// game.js - Main game file
import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, initGameState } from './globals.js';
import { renderStartScreen, renderPlayingScreen, renderPausedOverlay, renderGameOverScreen } from './renderer.js';
import { handleKeyPressed, processAutomatedInput } from './input.js';
import { updateGame } from './game_logic.js';
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
    initGameState();
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: "START" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Process automated testing input if in test mode
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      const action = get_automated_testing_action(gameState);
      processAutomatedInput(p, action);
    }
    
    // Update game logic
    updateGame(p);
    
    // Render based on game phase
    switch(gameState.gamePhase) {
      case GAME_PHASES.START:
        renderStartScreen(p);
        break;
      case GAME_PHASES.PLAYING:
        renderPlayingScreen(p);
        break;
      case GAME_PHASES.PAUSED:
        renderPlayingScreen(p);
        renderPausedOverlay(p);
        break;
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        renderGameOverScreen(p);
        break;
    }
  };
  
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p, p.key, p.keyCode);
    }
    return false; // Prevent default browser behavior
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn', 'test_4_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const activeBtn = document.getElementById(
    mode === 'HUMAN' ? 'humanModeBtn' : 
    mode === 'TEST_1' ? 'test_1_ModeBtn' :
    mode === 'TEST_2' ? 'test_2_ModeBtn' :
    mode === 'TEST_3' ? 'test_3_ModeBtn' :
    'test_4_ModeBtn'
  );
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};