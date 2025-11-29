// game.js
import { gameState, GAME_PHASES, CONTROL_MODES, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS } from './globals.js';
import { initializeGame, updateGame } from './game_logic.js';
import { handleKeyPress, handleGameplayInput } from './input_handler.js';
import { renderStartScreen, renderGameScreen, renderPauseOverlay, renderGameOverScreen } from './renderer.js';
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
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Initialize game
    initializeGame();
  };
  
  // Draw function
  p.draw = function() {
    // Handle automated testing input
    if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.controlMode !== CONTROL_MODES.HUMAN) {
      const action = get_automated_testing_action(gameState);
      if (action !== null) {
        handleGameplayInput(action);
      }
    }
    
    // Render based on game phase
    if (gameState.gamePhase === GAME_PHASES.START) {
      renderStartScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      updateGame();
      renderGameScreen(p);
      
      // Log player info periodically
      if (p.frameCount % 60 === 0) {
        p.logs.player_info.push({
          screen_x: 0,
          screen_y: 0,
          game_x: 0,
          game_y: 0,
          framecount: p.frameCount
        });
      }
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      renderGameScreen(p);
      renderPauseOverlay(p);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
               gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      renderGameOverScreen(p);
    }
  };
  
  // Key pressed handler
  p.keyPressed = function() {
    const keyCode = p.keyCode;
    
    // ENTER - Start game
    if (keyCode === 13 && gameState.gamePhase === GAME_PHASES.START) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      initializeGame();
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    // ESC - Pause/Unpause
    else if (keyCode === 27) {
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
        p.logs.game_info.push({
          data: { gamePhase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        p.logs.game_info.push({
          data: { gamePhase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    // R - Restart
    else if (keyCode === 82 && (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
                                  gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE)) {
      gameState.gamePhase = GAME_PHASES.START;
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    // Gameplay input
    else {
      handleKeyPress(p, keyCode);
    }
    
    return false; // Prevent default
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Expose getGameState function
window.getGameState = function() {
  return gameState;
};

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = {
    HUMAN: document.getElementById('humanModeBtn'),
    TEST_1: document.getElementById('test_1_ModeBtn'),
    TEST_2: document.getElementById('test_2_ModeBtn')
  };
  
  for (const [key, button] of Object.entries(buttons)) {
    if (button) {
      if (key === mode) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    }
  }
};

export default gameInstance;