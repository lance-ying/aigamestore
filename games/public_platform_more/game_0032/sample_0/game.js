// game.js - Main game file

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { initGame, updateGame } from './game_logic.js';
import { render } from './rendering.js';
import { handleKeyPressed, processAutomatedInput, updateHoveredPlot } from './input.js';

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

    // Initialize game state
    gameState.gamePhase = GAME_PHASES.START;

    p.logs.game_info.push({
      data: { phase: "SETUP_COMPLETE" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    // Process automated testing input
    processAutomatedInput(p);

    // Update game logic
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      updateGame(p);
      updateHoveredPlot(p);
    }

    // Render
    render(p);
  };

  p.keyPressed = function() {
    handleKeyPressed(p);
    return false; // Prevent default
  };
});

// Expose game instance
window.gameInstance = gameInstance;

// Expose getGameState function
window.getGameState = function() {
  return gameState;
};

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ["humanModeBtn", "test_1_ModeBtn", "test_2_ModeBtn", "test_3_ModeBtn", "test_4_ModeBtn", "test_5_ModeBtn"];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove("active");
    }
  });

  const modeMap = {
    "HUMAN": "humanModeBtn",
    "TEST_1": "test_1_ModeBtn",
    "TEST_2": "test_2_ModeBtn",
    "TEST_3": "test_3_ModeBtn",
    "TEST_4": "test_4_ModeBtn",
    "TEST_5": "test_5_ModeBtn"
  };

  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add("active");
  }

  gameInstance.logs.game_info.push({
    data: { control_mode: mode },
    framecount: gameInstance.frameCount,
    timestamp: Date.now()
  });
};