// game.js - Main game file

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, getGameState } from './globals.js';
import { handleKeyPressed } from './input.js';
import { updateAnimation } from './gameLogic.js';
import { 
  renderStartScreen, 
  renderPlayingScreen, 
  renderPausedScreen, 
  renderLevelComplete,
  renderGameOverWin,
  renderGameOverLose 
} from './rendering.js';
import { getTestAction, applyTestAction } from './testController.js';

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
    p.randomSeed(42);
    p.frameRate(60);
    
    // Initialize game state
    gameState.gamePhase = GAME_PHASES.START;
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Handle test mode
    if (gameState.controlMode !== 'HUMAN') {
      const testAction = getTestAction(p);
      if (testAction) {
        applyTestAction(testAction, p);
      }
    }
    
    // Update animations
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      updateAnimation(p);
    }
    
    // Render based on game phase
    if (gameState.gamePhase === GAME_PHASES.START) {
      renderStartScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      renderPlayingScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      renderPausedScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.LEVEL_COMPLETE) {
      renderLevelComplete(p);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
      renderGameOverWin(p);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      renderGameOverLose(p);
    }
    
    // Log player info periodically
    if (p.frameCount % 60 === 0) {
      p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y,
        game_x: gameState.player.x,
        game_y: gameState.player.y,
        framecount: p.frameCount
      });
    }
  };
  
  p.keyPressed = function() {
    handleKeyPressed(p);
    return false; // Prevent default
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button styles
  document.querySelectorAll('.control-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  if (mode === 'HUMAN') {
    document.getElementById('humanModeBtn').classList.add('active');
  } else if (mode === 'TEST_1') {
    document.getElementById('test_1_ModeBtn').classList.add('active');
  } else if (mode === 'TEST_2') {
    document.getElementById('test_2_ModeBtn').classList.add('active');
  }
};