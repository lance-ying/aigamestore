// game.js - Main game file

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, getGameState } from './globals.js';
import { GameManager } from './gameManager.js';
import { Renderer } from './renderer.js';
import { InputHandler } from './inputHandler.js';
import { TestController } from './testController.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let gameManager;
  let renderer;
  let inputHandler;
  let testController;

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
    p.rectMode(p.CENTER);
    p.imageMode(p.CENTER);

    // Initialize game systems
    gameManager = new GameManager(p);
    renderer = new Renderer(p);
    inputHandler = new InputHandler(p, gameManager);
    testController = new TestController(p, gameManager);

    gameManager.init();

    // Log initial state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    // Update test controller
    testController.update();

    // Update game logic
    gameManager.update();

    // Render
    renderer.draw();
  };

  p.keyPressed = function() {
    if (gameState.controlMode === 'HUMAN') {
      inputHandler.keyPressed();
    }
    return false; // Prevent default
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;
// Expose level loading for dev mode
window.loadLevel = function(levelNum) {
  const state = window.getGameState ? window.getGameState() : (window.gameState || (window.gameInstance && window.gameInstance.gameState));
  if (state) {
    // Set level using the property this game uses
    state.currentLevel = levelNum;
    state.currentLevel = levelNum; // Also set for compatibility
    // Try common reset/start patterns
    if (typeof resetGame === 'function') {
      resetGame();
    }
    if (typeof startGame === 'function') {
      startGame();
    } else if (state.gamePhase !== undefined) {
      state.gamePhase = "PLAYING";
    }
  }
};
// Expose level loading for dev mode
// Expose level loading for dev mode

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button styles
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

export { gameInstance };