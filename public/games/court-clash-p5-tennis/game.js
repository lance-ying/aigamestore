import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, getGameState } from './globals.js';
import { initializeGame, startGame, updateGame, resetRound, startServe, startNextLevel } from './gameLogic.js';
import { renderGame } from './rendering.js';
import { InputHandler } from './inputHandler.js';
import { TestController1, TestController2 } from './testControllers.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let inputHandler;
  let testController;

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

    // Initialize game
    initializeGame(p);
    inputHandler = new InputHandler(p);
    window.inputHandlerInstance = inputHandler;

    // Log initial state
    p.logs.game_info.push({
      data: { phase: 'START', initialized: true },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    // Handle test controllers
    if (gameState.controlMode === 'TEST_1') {
      if (!testController || !(testController instanceof TestController1)) {
        testController = new TestController1(p);
      }
      const action = testController.getAction();
      if (action) {
        if (Array.isArray(action)) {
          action.forEach(key => simulateKeyPress(key));
        } else {
          simulateKeyPress(action);
        }
      }
    } else if (gameState.controlMode === 'TEST_2') {
      if (!testController || !(testController instanceof TestController2)) {
        testController = new TestController2(p);
      }
      const action = testController.getAction();
      if (action) {
        if (Array.isArray(action)) {
          action.forEach(key => simulateKeyPress(key));
        } else {
          simulateKeyPress(action);
        }
      }
    }

    // Update game logic
    if (gameState.controlMode === 'HUMAN' && inputHandler) {
      inputHandler.update();
    }
    
    updateGame(p);

    // Render
    renderGame(p);
  };

  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: 'keyPressed',
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    // Handle phase transitions
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === 'START') {
        startGame(p);
      } else if (gameState.gamePhase === 'GAME_OVER_WIN' && gameState.level < 4) {
        startNextLevel(p);
      }
    } else if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === 'PLAYING') {
        gameState.gamePhase = 'PAUSED';
        p.logs.game_info.push({
          data: { phase: 'PAUSED' },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === 'PAUSED') {
        gameState.gamePhase = 'PLAYING';
        p.logs.game_info.push({
          data: { phase: 'PLAYING' },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (p.keyCode === 82) { // R
      gameState.gamePhase = 'START';
      gameState.level = 1;
      gameState.score = { player: 0, opponent: 0, total: 0 };
      p.logs.game_info.push({
        data: { phase: 'START', action: 'restart' },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }

    // Pass to input handler
    if (gameState.controlMode === 'HUMAN' && inputHandler) {
      inputHandler.handleKeyPressed(p.keyCode);
    }

    return false;
  };

  p.keyReleased = function() {
    // Log input
    p.logs.inputs.push({
      input_type: 'keyReleased',
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    // Pass to input handler
    if (gameState.controlMode === 'HUMAN' && inputHandler) {
      inputHandler.handleKeyReleased(p.keyCode);
    }

    return false;
  };

  function simulateKeyPress(keyCode) {
    p.keyCode = keyCode;
    p.key = String.fromCharCode(keyCode);
    p.keyPressed();
    setTimeout(() => {
      p.keyReleased();
    }, 50);
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

  const activeBtn = document.getElementById(
    mode === 'HUMAN' ? 'humanModeBtn' :
    mode === 'TEST_1' ? 'test_1_ModeBtn' :
    'test_2_ModeBtn'
  );
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};