import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { updateGame, handleKeyPressed, handleKeyReleased } from './game_logic.js';
import { drawStartScreen, drawPlayingScreen, drawGameOverScreen } from './rendering.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs - write-only!
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);

    // Initialize game state
    gameState.gamePhase = GAME_PHASES.START;

    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, event: "game_initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      const action = get_automated_testing_action(gameState);
      
      // Reset input state
      gameState.inputState.leftPressed = false;
      gameState.inputState.rightPressed = false;
      
      // Apply action
      if (action && action.keyCode) {
        if (action.keyCode === 37) {
          gameState.inputState.leftPressed = true;
        } else if (action.keyCode === 39) {
          gameState.inputState.rightPressed = true;
        }
      }
    }

    // Update game logic
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      updateGame(p);
    }

    // Render based on game phase
    if (gameState.gamePhase === GAME_PHASES.START) {
      drawStartScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING || gameState.gamePhase === GAME_PHASES.PAUSED) {
      drawPlayingScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      drawGameOverScreen(p);
    }
  };

  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p, p.keyCode);
    }
    return false; // Prevent default
  };

  p.keyReleased = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyReleased(p, p.keyCode);
    }
    return false; // Prevent default
  };
});

// Expose globally
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

  const modeMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn'
  };

  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }

  gameInstance.logs.game_info.push({
    data: { event: "control_mode_changed", mode: mode },
    framecount: gameInstance.frameCount,
    timestamp: Date.now()
  });
};