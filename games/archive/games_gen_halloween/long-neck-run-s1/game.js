// game.js
import { 
  CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS,
  PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_LOSE,
  PLAYER_START_X, PLAYER_START_Y, INITIAL_NECK_LENGTH,
  gameState, getGameState
} from './globals.js';
import { Player } from './player.js';
import { handleKeyPressed, handleContinuousInput } from './input.js';
import { updateGame } from './gamelogic.js';
import { renderGame, renderStartScreen, renderGameOverScreen } from './rendering.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Setup function
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    // Initialize logs (write-only)
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    // Log initial game state
    p.logs.game_info.push({
      data: { phase: PHASE_START, event: "game_initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  // Draw function
  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === PHASE_PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action) {
        if (action.left && gameState.player) {
          gameState.player.moveLeft();
        }
        if (action.right && gameState.player) {
          gameState.player.moveRight();
        }
        if (action.space && gameState.player) {
          gameState.player.changeColor(p);
        }
      }
    }
    
    // Handle continuous input for human mode
    handleContinuousInput(p);
    
    // Update game logic
    updateGame(p);
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case PHASE_START:
        renderStartScreen(p);
        break;
      case PHASE_PLAYING:
      case PHASE_PAUSED:
        renderGame(p);
        break;
      case PHASE_GAME_OVER_LOSE:
        renderGameOverScreen(p);
        break;
    }
  };
  
  // Key pressed handler
  p.keyPressed = function() {
    handleKeyPressed(p, p.key, p.keyCode);
    return false; // Prevent default
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
  
  const activeBtn = document.getElementById(
    mode === 'HUMAN' ? 'humanModeBtn' : 
    mode === 'TEST_1' ? 'test_1_ModeBtn' : 
    'test_2_ModeBtn'
  );
  
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};

export default gameInstance;