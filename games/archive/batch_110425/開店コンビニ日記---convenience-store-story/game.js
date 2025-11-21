// game.js - Main game file with p5.js instance

import { gameState, getGameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { updateGame } from './game_logic.js';
import { renderStartScreen, renderGame, renderGameOverScreen } from './rendering.js';
import { handleKeyPressed, handleKeyReleased } from './input_handler.js';
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
    p.frameRate(60);
    p.randomSeed(42);
    
    p.logs.game_info.push({
      data: { phase: "START", message: "Game initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action && action.keyCode) {
        simulateKeyPress(p, action.keyCode);
      }
    }

    // Render based on game phase
    if (gameState.gamePhase === GAME_PHASES.START) {
      renderStartScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING || gameState.gamePhase === GAME_PHASES.PAUSED) {
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        updateGame(p);
      }
      renderGame(p);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      renderGameOverScreen(p);
    }
  };

  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p, p.key, p.keyCode);
    }
    return false;
  };

  p.keyReleased = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyReleased(p, p.key, p.keyCode);
    }
    return false;
  };
});

// Simulate key press for automated testing
function simulateKeyPress(p, keyCode) {
  let key = String.fromCharCode(keyCode);
  
  // Handle special keys
  if (keyCode === 16) key = 'Shift';
  if (keyCode === 32) key = ' ';
  if (keyCode === 37) key = 'ArrowLeft';
  if (keyCode === 38) key = 'ArrowUp';
  if (keyCode === 39) key = 'ArrowRight';
  if (keyCode === 40) key = 'ArrowDown';
  
  handleKeyPressed(gameInstance, key, keyCode);
  
  // Auto-release for non-shift keys
  if (keyCode !== 16) {
    setTimeout(() => {
      handleKeyReleased(gameInstance, key, keyCode);
    }, 50);
  }
}

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
  
  const activeBtn = mode === 'HUMAN' ? 'humanModeBtn' : `test_${mode.split('_')[1]}_ModeBtn`;
  const btn = document.getElementById(activeBtn);
  if (btn) {
    btn.classList.add('active');
  }
};