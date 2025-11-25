// game.js - Main game file

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { updateGame } from './game_logic.js';
import { renderGame } from './rendering.js';
import { getInputs, handleKeyPressed, handleKeyReleased } from './input_handler.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Store current inputs
  let currentInputs = {
    left: false,
    right: false,
    up: false,
    down: false,
    shoot: false,
    sprint: false,
    switchWeapon: false
  };

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
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    // Increment frame counter
    gameState.frameCount = p.frameCount;
    
    // Get inputs
    currentInputs = getInputs(p);
    
    // Update game
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      updateGame(p, currentInputs);
    }
    
    // Render
    renderGame(p);
  };

  p.keyPressed = function() {
    const result = handleKeyPressed(p, p.key, p.keyCode);
    if (result && result.switchWeapon) {
      currentInputs.switchWeapon = true;
    }
    return false; // Prevent default
  };

  p.keyReleased = function() {
    handleKeyReleased(p, p.key, p.keyCode);
    currentInputs.switchWeapon = false;
    return false;
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn', 'test_4_ModeBtn', 'test_5_ModeBtn'];
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