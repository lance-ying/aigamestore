// game.js - Main game file
import { gameState, GAME_PHASES, CONTROL_MODES, CANVAS_WIDTH, CANVAS_HEIGHT, getGameState } from './globals.js';
import { initializeGame, updateGame, drawGame, drawStartScreen, drawPauseOverlay, drawGameOverScreen, spawnMemoryLayer } from './gameLogic.js';
import { InputHandler } from './inputHandler.js';
import './automated_testing_controller.js';

const p5 = window.p5;

let inputHandler;

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
    
    inputHandler = new InputHandler();
    
    // Log initial game state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, event: "game_initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    // Handle different game phases
    if (gameState.gamePhase === GAME_PHASES.START) {
      drawStartScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      // Update and draw game
      const keys = inputHandler.updateKeys(p);
      updateGame(p, keys);
      drawGame(p);
      
      // Log player info periodically
      if (p.frameCount % 10 === 0 && gameState.player) {
        p.logs.player_info.push({
          screen_x: gameState.player.x,
          screen_y: gameState.player.y,
          game_x: gameState.player.x,
          game_y: gameState.player.y,
          framecount: p.frameCount
        });
      }
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      drawGame(p);
      drawPauseOverlay(p);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
      drawGameOverScreen(p, true);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      drawGameOverScreen(p, false);
    }
  };

  p.keyPressed = function() {
    inputHandler.handleKeyPress(p, p.key, p.keyCode);
    
    // Initialize game when starting
    if (p.keyCode === 13 && gameState.gamePhase === GAME_PHASES.START) {
      initializeGame(p);
    }
  };

  p.keyReleased = function() {
    inputHandler.handleKeyRelease(p, p.key, p.keyCode);
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode management
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