// Main game file
import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS } from './globals.js';
import { initializeGame, updateGame, resetToNewPuzzle } from './game_logic.js';
import { handleKeyPressed, processAutomatedInput } from './input.js';
import { renderStartScreen, renderPlayingScreen, renderGameOverScreen } from './renderer.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    // Initialize game
    initializeGame(p);
    
    p.logs.game_info.push({
      data: { event: "setup_complete", phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === "PLAYING") {
      const action = get_automated_testing_action(gameState);
      if (action) {
        processAutomatedInput(p, action);
      }
    }
    
    // Update game logic
    updateGame(p);
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case "START":
        renderStartScreen(p);
        break;
      case "PLAYING":
      case "PAUSED":
        renderPlayingScreen(p);
        break;
      case "GAME_OVER_WIN":
        renderPlayingScreen(p);
        renderGameOverScreen(p, true);
        break;
      case "GAME_OVER_LOSE":
        renderPlayingScreen(p);
        renderGameOverScreen(p, false);
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

// Control mode switching
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
  
  const activeBtn = document.getElementById(
    mode === "HUMAN" ? "humanModeBtn" : 
    mode === "TEST_1" ? "test_1_ModeBtn" : 
    "test_2_ModeBtn"
  );
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  // Restart game if playing
  if (gameState.gamePhase === "PLAYING") {
    resetToNewPuzzle(gameInstance);
  }
};

export default gameInstance;