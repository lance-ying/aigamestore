// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, getGameState } from './globals.js';
import { Player } from './player.js';
import { renderStartScreen, renderGameOverScreen, renderPlayingScreen, renderPauseOverlay } from './ui.js';
import { handleKeyPressed, processAutomatedInput } from './input_handler.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Setup
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
    
    // Initialize player entity (for logging)
    gameState.player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    gameState.entities.push(gameState.player);
    
    // Log initial state
    p.logs.game_info.push({
      data: { event: "game_initialized", phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    p.logs.player_info.push({
      screen_x: gameState.player.screen_x,
      screen_y: gameState.player.screen_y,
      game_x: gameState.player.game_x,
      game_y: gameState.player.game_y,
      framecount: p.frameCount
    });
  };
  
  // Draw
  p.draw = function() {
    // Process automated testing input if in test mode
    if (gameState.controlMode !== "HUMAN") {
      if (p.frameCount % 20 === 0) { // Every 20 frames for controlled speed
        const action = get_automated_testing_action(gameState);
        if (action) {
          processAutomatedInput(p, action);
        }
      }
    }
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        renderStartScreen(p);
        break;
      case GAME_PHASES.PLAYING:
        renderPlayingScreen(p);
        break;
      case GAME_PHASES.PAUSED:
        renderPlayingScreen(p);
        renderPauseOverlay(p);
        break;
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        renderGameOverScreen(p);
        break;
    }
    
    // Log player info periodically during gameplay
    if (gameState.gamePhase === GAME_PHASES.PLAYING && p.frameCount % 60 === 0) {
      p.logs.player_info.push({
        screen_x: gameState.player.screen_x,
        screen_y: gameState.player.screen_y,
        game_x: gameState.player.game_x,
        game_y: gameState.player.game_y,
        framecount: p.frameCount
      });
    }
  };
  
  // Key pressed handler
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p, p.key, p.keyCode);
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

// Control mode management
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
  
  const activeBtn = mode === "HUMAN" ? 'humanModeBtn' : 
                    mode === "TEST_1" ? 'test_1_ModeBtn' :
                    mode === "TEST_2" ? 'test_2_ModeBtn' :
                    mode === "TEST_3" ? 'test_3_ModeBtn' : null;
  
  if (activeBtn) {
    const btn = document.getElementById(activeBtn);
    if (btn) {
      btn.classList.add('active');
    }
  }
};

// Expose getGameState globally
window.getGameState = getGameState;