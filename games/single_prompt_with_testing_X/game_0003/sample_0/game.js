// game.js - Main game file with p5.js instance
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { initGame, updateGame } from './game_manager.js';
import { handleInput, logInput } from './input_handler.js';
import { renderGame } from './renderer.js';

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
    
    // Log game start
    p.logs.game_info.push({
      data: { gamePhase: "START" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    // Render current game state
    renderGame(p);

    // Update game logic only when playing
    if (gameState.gamePhase === "PLAYING") {
      handleInput(p);
      updateGame(p);
    }
  };

  p.keyPressed = function() {
    logInput(p, p.key, p.keyCode, 'keyPressed');

    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === "START") {
        gameState.gamePhase = "PLAYING";
        initGame(p);
        p.logs.game_info.push({
          data: { gamePhase: "PLAYING" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === "PLAYING") {
        gameState.gamePhase = "PAUSED";
        p.logs.game_info.push({
          data: { gamePhase: "PAUSED" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === "PAUSED") {
        gameState.gamePhase = "PLAYING";
        p.logs.game_info.push({
          data: { gamePhase: "PLAYING" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (p.keyCode === 82) { // R
      if (gameState.gamePhase.startsWith("GAME_OVER")) {
        gameState.gamePhase = "START";
        p.logs.game_info.push({
          data: { gamePhase: "START" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }

    return false; // Prevent default behavior
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
};