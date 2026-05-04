// game.js - Main game file

import { 
  gameState, 
  initializeGrid, 
  getGameState,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  TARGET_FPS,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE
} from './globals.js';

import {
  updateGuests,
  updateRankings,
  updateYearProgress
} from './game_logic.js';

import {
  renderStartScreen,
  renderPlayingScreen,
  renderPausedOverlay,
  renderGameOverScreen
} from './rendering.js';

import { handleKeyPressed } from './input_handler.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs
  p.logs = {
    "game_info": [],
    "inputs": [],
    "player_info": []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    // Initialize game
    initializeGrid();
    
    p.logs.game_info.push({
      data: { event: "game_initialized", phase: PHASE_START },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Single background call
    p.background(40, 120, 60);
    
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === PHASE_PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action && action.keyCode) {
        simulateKeyPress(p, action.keyCode);
      }
    }
    
    // Render based on game phase
    if (gameState.gamePhase === PHASE_START) {
      renderStartScreen(p);
    } else if (gameState.gamePhase === PHASE_PLAYING) {
      renderPlayingScreen(p);
      updateGame(p);
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      renderPlayingScreen(p);
      renderPausedOverlay(p);
    } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN || 
               gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      renderGameOverScreen(p);
    }
  };
  
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p, p.key, p.keyCode);
    }
    return false;
  };
  
  function updateGame(p) {
    // Update attractions
    for (const attraction of gameState.attractions) {
      attraction.update(p);
    }
    
    // Update guests
    updateGuests(p);
    
    // Update mascots
    for (const mascot of gameState.mascots) {
      mascot.update(p);
    }
    
    // Update year progress
    updateYearProgress(p);
    
    // Update rankings
    updateRankings();
    
    // Log player info periodically
    if (p.frameCount % 60 === 0) {
      p.logs.player_info.push({
        screen_x: 0,
        screen_y: 0,
        game_x: gameState.cursorX,
        game_y: gameState.cursorY,
        framecount: p.frameCount
      });
    }
  }
  
  function simulateKeyPress(p, keyCode) {
    const key = String.fromCharCode(keyCode);
    handleKeyPressed(p, key, keyCode);
  }
});

// Expose game instance globally
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