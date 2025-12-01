// game.js - Main game file
import { gameState, playerStats } from './globals.js';
import { PHASE_START, PHASE_PLAYING, PHASE_PAUSED, TARGET_FPS } from './globals.js';
import { drawGame } from './rendering.js';
import { handleKeyPressed, handleGameplayInput } from './input_handler.js';
import { updateGame } from './game_logic.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(600, 400);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);

    // Initialize logs
    p.logs = {
      "game_info": [],
      "inputs": [],
      "player_info": []
    };

    // Log initial state
    p.logs.game_info.push({
      data: { phase: PHASE_START, message: "Game Initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    // Handle automated testing or human input
    handleGameplayInput(p);

    // Update game logic
    if (gameState.gamePhase === PHASE_PLAYING && !gameState.showingUpgradeScreen) {
      updateGame(p);
    }

    // Render
    drawGame(p);
  };

  p.keyPressed = function() {
    handleKeyPressed(p);
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;
// Expose level loading for dev mode
window.loadLevel = function(levelNum) {
  const state = window.getGameState ? window.getGameState() : (window.gameState || (window.gameInstance && window.gameInstance.gameState));
  if (state) {
    state.currentLevel = levelNum;
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

// Expose getGameState function
window.getGameState = function() {
  return gameState;
};

// Control mode setter
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

  const modeMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn',
    'TEST_3': 'test_3_ModeBtn'
  };

  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }

  console.log(`Control mode set to: ${mode}`);
};