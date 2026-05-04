// game.js - Main game file
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_PLAYING } from './globals.js';
import { handleKeyPressed } from './input.js';
import { updateGame } from './gameLogic.js';
import { drawGame } from './renderer.js';
import { TestController } from './testController.js';

const p5 = window.p5;

let testController = null;

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
    
    // Log initial state
    p.logs.game_info.push({
      data: { event: 'setup_complete', gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== 'HUMAN' && testController) {
      const action = testController.getAction(p);
      if (action) {
        handleKeyPressed(p, action.key, action.keyCode);
      }
    }

    // Update game logic
    updateGame(p);

    // Render
    drawGame(p);
  };

  p.keyPressed = function() {
    if (gameState.controlMode === 'HUMAN') {
      handleKeyPressed(p, p.key, p.keyCode);
    }
    return false;
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
  
  const activeBtn = document.getElementById(mode === 'HUMAN' ? 'humanModeBtn' : `${mode}_ModeBtn`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }

  // Create test controller if needed
  if (mode !== 'HUMAN') {
    testController = new TestController(mode);
  } else {
    testController = null;
  }

  console.log(`Control mode set to: ${mode}`);
};