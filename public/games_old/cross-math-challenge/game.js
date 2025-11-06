// game.js - Main game file

import { gameState, GAME_PHASES } from './globals.js';
import { handleKeyPressed, handleTestingInput } from './input.js';
import { render } from './renderer.js';
import { startLevel } from './levelManager.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(600, 400);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize logs (write-only)
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    // Log initial state
    p.logs.game_info.push({
      event: "game_initialized",
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Handle testing mode inputs
    if (gameState.controlMode !== "HUMAN") {
      if (gameState.gamePhase === GAME_PHASES.START && p.frameCount === 30) {
        startLevel(1);
      } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        handleTestingInput(p);
      } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN && p.frameCount % 60 === 0) {
        if (gameState.currentLevel <= gameState.totalLevels) {
          startLevel(gameState.currentLevel);
        }
      } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE && p.frameCount % 60 === 0) {
        startLevel(gameState.currentLevel);
      }
    }
    
    // Render
    render(p);
    
    // Log player info periodically
    if (gameState.gamePhase === GAME_PHASES.PLAYING && p.frameCount % 60 === 0) {
      p.logs.player_info.push({
        screen_x: gameState.selectedCell.col * gameState.cellSize + gameState.gridOffsetX,
        screen_y: gameState.selectedCell.row * gameState.cellSize + gameState.gridOffsetY,
        game_x: gameState.selectedCell.col,
        game_y: gameState.selectedCell.row,
        framecount: p.frameCount
      });
    }
  };
  
  p.keyPressed = function() {
    handleKeyPressed(p, p.key, p.keyCode);
    return false; // Prevent default
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button styles
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const activeBtn = document.getElementById(mode === 'HUMAN' ? 'humanModeBtn' : 
                                           mode === 'TEST_1' ? 'test_1_ModeBtn' : 'test_2_ModeBtn');
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  // Log control mode change
  if (gameInstance && gameInstance.logs) {
    gameInstance.logs.game_info.push({
      event: "control_mode_changed",
      data: { controlMode: mode },
      framecount: gameInstance.frameCount,
      timestamp: Date.now()
    });
  }
};