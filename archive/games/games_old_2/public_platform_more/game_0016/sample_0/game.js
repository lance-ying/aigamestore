// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS, initializeGameState } from './globals.js';
import { PHASE_PLAYING, CONTROL_HUMAN } from './globals.js';
import { renderGame } from './rendering.js';
import { handleKeyPressed } from './input.js';
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
    
    // Initialize game state
    initializeGameState();
    
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase, message: "Game Initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Handle automated testing
    if (gameState.gamePhase === PHASE_PLAYING && gameState.controlMode !== CONTROL_HUMAN) {
      const action = get_automated_testing_action(gameState);
      if (action && action.keyCode && action.keyCode !== 0) {
        simulateKeyPress(p, action.keyCode);
      }
    }
    
    // Render game
    renderGame(p);
    
    // Log player info periodically
    if (p.frameCount % 30 === 0 && gameState.gamePhase === PHASE_PLAYING) {
      const player = gameState.players[0];
      if (player) {
        p.logs.player_info.push({
          screen_x: 0,
          screen_y: 0,
          game_x: 0,
          game_y: 0,
          framecount: p.frameCount
        });
      }
    }
  };
  
  p.keyPressed = function() {
    handleKeyPressed(p, p.key, p.keyCode);
    return false;
  };
  
  function simulateKeyPress(p, keyCode) {
    handleKeyPressed(p, String.fromCharCode(keyCode), keyCode);
  }
});

// Expose globally
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
  
  const modeMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};

export default gameInstance;