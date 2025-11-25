// game.js - Main game file with p5.js instance

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, 
         PHASE_START, PHASE_PLAYING, PHASE_PAUSED,
         PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';
import { initGame, updateGame } from './game_logic.js';
import { handleKeyPressed, handleKeyReleased } from './input.js';
import { drawStartScreen, drawPlayingScreen, drawPausedScreen, drawGameOverScreen } from './rendering.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Setup
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
    
    // Log game start
    p.logs.game_info.push({
      data: { phase: PHASE_START, action: "game_initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Initialize game
    initGame(p);
  };
  
  // Draw
  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === PHASE_PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action && action.keyCode) {
        simulateKeyPress(p, action.keyCode);
      }
    }
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case PHASE_START:
        drawStartScreen(p);
        break;
      case PHASE_PLAYING:
        updateGame(p);
        drawPlayingScreen(p);
        break;
      case PHASE_PAUSED:
        drawPausedScreen(p);
        break;
      case PHASE_GAME_OVER_WIN:
      case PHASE_GAME_OVER_LOSE:
        drawGameOverScreen(p);
        break;
    }
  };
  
  // Key handlers
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p, p.key, p.keyCode);
    }
  };
  
  p.keyReleased = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyReleased(p, p.key, p.keyCode);
    }
  };
  
  // Simulate key press for automated testing
  function simulateKeyPress(p, keyCode) {
    let key = String.fromCharCode(keyCode);
    
    // Map keyCodes to keys
    if (keyCode === 37) key = 'ArrowLeft';
    else if (keyCode === 38) key = 'ArrowUp';
    else if (keyCode === 39) key = 'ArrowRight';
    else if (keyCode === 40) key = 'ArrowDown';
    else if (keyCode === 32) key = ' ';
    else if (keyCode === 16) key = 'Shift';
    else if (keyCode === 90) key = 'z';
    
    handleKeyPressed(p, key, keyCode);
  }
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 
                   'test_3_ModeBtn', 'test_4_ModeBtn', 'test_5_ModeBtn'];
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
    'TEST_4': 'test_4_ModeBtn',
    'TEST_5': 'test_5_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};

export default gameInstance;