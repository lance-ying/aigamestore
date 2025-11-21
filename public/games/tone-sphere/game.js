// game.js - Main game file

import {
  gameState,
  setControlMode,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  TARGET_FPS,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE
} from './globals.js';
import { InputHandler } from './input.js';
import { initializeGame, updateGame, progressToNextLevel } from './game_logic.js';
import { renderStartScreen, renderGame, renderGameOverScreen } from './ui.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let inputHandler;
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    // Initialize input handler
    inputHandler = new InputHandler(p);
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: PHASE_START },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === PHASE_PLAYING) {
      const actions = get_automated_testing_action(gameState);
      
      // Simulate key presses
      const allGameplayKeys = [32, 37, 38, 39, 40, 90, 16];
      
      // Release keys that are no longer in actions
      allGameplayKeys.forEach(keyCode => {
        if (inputHandler.isKeyPressed(keyCode) && !actions.includes(keyCode)) {
          inputHandler.handleKeyRelease(keyCode);
        }
      });
      
      // Press keys that are in actions
      actions.forEach(keyCode => {
        if (!inputHandler.isKeyPressed(keyCode)) {
          inputHandler.handleKeyPress(keyCode);
        }
      });
    }
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case PHASE_START:
        renderStartScreen(p, gameState);
        break;
      case PHASE_PLAYING:
        updateGame(p, inputHandler);
        renderGame(p, gameState, inputHandler);
        break;
      case PHASE_PAUSED:
        renderGame(p, gameState, inputHandler);
        break;
      case PHASE_GAME_OVER_WIN:
      case PHASE_GAME_OVER_LOSE:
        renderGameOverScreen(p, gameState);
        break;
    }
    
    // Clear frame-specific inputs
    inputHandler.clearFrameInputs();
  };
  
  p.keyPressed = function() {
    const keyCode = p.keyCode;
    
    // Handle phase transition keys
    if (keyCode === 13) { // ENTER
      if (gameState.gamePhase === PHASE_START) {
        gameState.gamePhase = PHASE_PLAYING;
        initializeGame(p);
      } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN) {
        // Progress to next level on win
        progressToNextLevel(p);
      }
      return;
    }
    
    if (keyCode === 27) { // ESC
      if (gameState.gamePhase === PHASE_PLAYING) {
        gameState.gamePhase = PHASE_PAUSED;
        p.logs.game_info.push({
          data: { gamePhase: PHASE_PAUSED },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === PHASE_PAUSED) {
        gameState.gamePhase = PHASE_PLAYING;
        p.logs.game_info.push({
          data: { gamePhase: PHASE_PLAYING },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      return;
    }
    
    if (keyCode === 82) { // R
      if (gameState.gamePhase === PHASE_GAME_OVER_WIN || 
          gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
        // Reset to level 1
        gameState.currentDifficulty = 1;
        gameState.gamePhase = PHASE_START;
        p.logs.game_info.push({
          data: { gamePhase: PHASE_START, action: 'restart_from_beginning' },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      return;
    }
    
    // Handle gameplay keys only in HUMAN mode
    if (gameState.controlMode === "HUMAN" && gameState.gamePhase === PHASE_PLAYING) {
      inputHandler.handleKeyPress(keyCode);
    }
  };
  
  p.keyReleased = function() {
    const keyCode = p.keyCode;
    
    // Handle gameplay keys only in HUMAN mode
    if (gameState.controlMode === "HUMAN" && gameState.gamePhase === PHASE_PLAYING) {
      inputHandler.handleKeyRelease(keyCode);
    }
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
    // Tone sphere uses currentDifficulty to select songs
    state.currentDifficulty = levelNum;
    state.currentSongIndex = levelNum - 1; // 0-indexed
    
    // Try common reset/start patterns
    if (typeof resetGame === 'function') {
      resetGame();
    }
    if (typeof startGame === 'function') {
      startGame();
    } else if (state.gamePhase !== undefined) {
      state.gamePhase = PHASE_PLAYING;
      // Initialize game with new difficulty/song
      const p = window.gameInstance || window.p;
      if (p && typeof initializeGame === 'function') {
        initializeGame(p);
      }
    }
  }
};
// Expose level loading for dev mode
// Expose level loading for dev mode