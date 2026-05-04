// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { LEVELS } from './levels.js';
import { findAllWordPaths } from './wordPaths.js';
import { renderStartScreen, renderPlayingScreen, renderPausedScreen, renderGameOverScreen } from './rendering.js';
import { handleKeyPress, updateElapsedTime } from './input.js';
import { initTestMode, updateTestMode } from './testing.js';

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
    
    // Pre-process levels to find word paths
    for (const level of LEVELS) {
      level.wordPaths = findAllWordPaths(level);
    }
    
    // Initialize game state
    gameState.gamePhase = 'START';
    gameState.controlMode = 'HUMAN';
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: 'START' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Update testing mode
    if (gameState.controlMode !== 'HUMAN') {
      updateTestMode(p);
    }
    
    // Update elapsed time
    updateElapsedTime();
    
    // Render based on game phase
    if (gameState.gamePhase === 'START') {
      renderStartScreen(p);
    } else if (gameState.gamePhase === 'PLAYING') {
      renderPlayingScreen(p);
    } else if (gameState.gamePhase === 'PAUSED') {
      renderPausedScreen(p);
    } else if (gameState.gamePhase === 'GAME_OVER_WIN') {
      renderGameOverScreen(p, true);
    } else if (gameState.gamePhase === 'GAME_OVER_LOSE') {
      renderGameOverScreen(p, false);
    }
  };
  
  p.keyPressed = function() {
    if (gameState.controlMode === 'HUMAN') {
      handleKeyPress(p, p.keyCode, p.key);
    }
    return false; // Prevent default
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  document.querySelectorAll('.control-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  if (mode === 'HUMAN') {
    document.getElementById('humanModeBtn').classList.add('active');
  } else if (mode === 'TEST_1') {
    document.getElementById('test_1_ModeBtn').classList.add('active');
    initTestMode('TEST_1');
  } else if (mode === 'TEST_2') {
    document.getElementById('test_2_ModeBtn').classList.add('active');
    initTestMode('TEST_2');
  }
};