// game.js - Main game file

import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT, initializeGrid } from './globals.js';
import { PHASE_START, PHASE_PLAYING, PHASE_PAUSED } from './globals.js';
import { renderGame } from './rendering.js';
import { handleKeyPress, processAutomatedInput } from './input.js';
import { updateGame, loadLevel } from './game_logic.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
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

    // Initialize game state
    initializeGrid();
    gameState.gamePhase = PHASE_START;

    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: PHASE_START },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && 
        (gameState.gamePhase === PHASE_PLAYING || gameState.gamePhase === PHASE_PAUSED)) {
      if (gameState.gamePhase === PHASE_PLAYING) {
        const action = get_automated_testing_action(gameState);
        if (action) {
          processAutomatedInput(p, action);
        }
      }
    }

    // Update game logic
    updateGame();

    // Render
    renderGame(p);
  };

  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPress(p, p.keyCode);
    }
    return false; // Prevent default behavior
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

  const modeMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn',
    'TEST_3': 'test_3_ModeBtn',
    'TEST_4': 'test_4_ModeBtn'
  };

  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};

export default gameInstance;