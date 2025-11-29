// game.js - Main game file

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, resetGameState } from './globals.js';
import { Player } from './player.js';
import { updateTextReveal, advanceDialogue } from './narrative_engine.js';
import { 
  renderStartScreen, 
  renderPlayingScreen, 
  renderPausedScreen, 
  renderGameOverScreen 
} from './rendering.js';
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
    
    // Initialize player
    gameState.player = new Player();
    
    // Initialize game state
    gameState.gamePhase = GAME_PHASES.START;
    
    // Log initialization
    p.logs.game_info.push({
      data: { event: "game_initialized", phase: GAME_PHASES.START },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      handleAutomatedTesting(p);
    }
    
    // Update game logic
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      updateTextReveal(p);
    }
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        renderStartScreen(p);
        break;
      case GAME_PHASES.PLAYING:
        renderPlayingScreen(p);
        break;
      case GAME_PHASES.PAUSED:
        renderPausedScreen(p);
        break;
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        renderGameOverScreen(p);
        break;
    }
  };
  
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p);
    }
    return false; // Prevent default behavior
  };
  
  function handleAutomatedTesting(p) {
    // Throttle automated actions
    if (p.frameCount - gameState.lastActionFrame < 10) {
      return;
    }
    
    const action = get_automated_testing_action(gameState);
    
    if (action) {
      // Simulate key press
      p.keyCode = action.keyCode;
      p.key = action.key;
      handleKeyPressed(p);
      gameState.lastActionFrame = p.frameCount;
    }
  }
  
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode setter
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
  
  const activeBtn = document.getElementById(mode === 'HUMAN' ? 'humanModeBtn' : `${mode.toLowerCase()}_ModeBtn`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};

export default gameInstance;