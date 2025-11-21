// game.js - Main game file
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS } from './globals.js';
import { updateGame } from './game_logic.js';
import { renderGame } from './rendering.js';
import { setupInputHandlers, processGameplayInputs, logPlayerInfo } from './input_handler.js';
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

    // Initial game state
    gameState.gamePhase = GAME_PHASES.START;
    
    // Setup input handlers
    setupInputHandlers(p);

    // Log initial state
    p.logs.game_info.push({
      data: { phase: "START", initialized: true },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    // Handle automated testing inputs
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      const testKeys = get_automated_testing_action(gameState);
      // Apply test inputs to gameState.keys
      for (let key in testKeys) {
        gameState.keys[key] = testKeys[key];
      }
    }

    // Process gameplay inputs
    processGameplayInputs(p);

    // Update game logic
    updateGame(p);

    // Render
    renderGame(p);

    // Log player info
    logPlayerInfo(p);
  };
}, document.body);

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

  console.log(`Control mode set to: ${mode}`);
};