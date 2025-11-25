// game.js - Main game file

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Player } from './player.js';
import { initGame, updateGame, drawGame } from './game_logic.js';
import { handleKeyPressed, processAutomatedInput } from './input_handler.js';
import { drawStartScreen, drawGameUI, drawGameOverScreen } from './ui.js';

const p5 = window.p5;

let particles = [];

let gameInstance = new p5(p => {
  let player;

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

    // Initialize player
    player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    gameState.player = player;

    // Log initial state
    p.logs.game_info.push({
      data: { phase: "START" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    // Process automated input
    processAutomatedInput(p);

    // Render based on game phase
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        drawStartScreen(p);
        break;

      case GAME_PHASES.PLAYING:
      case GAME_PHASES.PAUSED:
        updateGame(p, particles);
        drawGame(p, particles);
        drawGameUI(p);
        break;

      case GAME_PHASES.GAME_OVER_WIN:
        drawGame(p, particles);
        drawGameUI(p);
        drawGameOverScreen(p, true);
        break;

      case GAME_PHASES.GAME_OVER_LOSE:
        drawGame(p, particles);
        drawGameUI(p);
        drawGameOverScreen(p, false);
        break;
    }
  };

  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p, p.key, p.keyCode);
    }

    // Handle game phase transitions even in automated mode
    if (p.keyCode === 13 || p.keyCode === 27 || p.keyCode === 82) {
      handleKeyPressed(p, p.key, p.keyCode);
    }

    // Special handling for game start/restart
    if (p.keyCode === 13 && gameState.gamePhase === GAME_PHASES.START) {
      initGame(p, player);
      particles = [];
    }

    if (p.keyCode === 82 && (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
                              gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE)) {
      initGame(p, player);
      particles = [];
    }
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

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
};