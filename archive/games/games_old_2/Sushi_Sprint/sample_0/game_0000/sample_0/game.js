// game.js - Main game file

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, getGameState } from './globals.js';
import { updateGameLogic } from './gameLogic.js';
import { drawStartScreen, drawPlaying, drawGameOver } from './rendering.js';
import { handleKeyPressed, handleMousePressed } from './input.js';

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
    
    // Initial game state log
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: 0,
      timestamp: Date.now()
    });
  };
  
  // Draw
  p.draw = function() {
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        drawStartScreen(p);
        break;
        
      case GAME_PHASES.PLAYING:
        updateGameLogic(p);
        drawPlaying(p);
        break;
        
      case GAME_PHASES.PAUSED:
        drawPlaying(p);
        break;
        
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        drawGameOver(p);
        break;
    }
  };
  
  // Input handlers
  p.keyPressed = function() {
    handleKeyPressed(p);
  };
  
  p.mousePressed = function() {
    handleMousePressed(p);
  };
});

// Expose globally
window.gameInstance = gameInstance;
window.getGameState = getGameState;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = {
    'HUMAN': document.getElementById('humanModeBtn'),
    'TEST_1': document.getElementById('test_1_ModeBtn'),
    'TEST_2': document.getElementById('test_2_ModeBtn')
  };
  
  for (const [modeName, btn] of Object.entries(buttons)) {
    if (btn) {
      if (modeName === mode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    }
  }
  
  // Execute test modes
  if (mode === 'TEST_1') {
    executeTest1();
  } else if (mode === 'TEST_2') {
    executeTest2();
  }
};

// Test mode 1: Basic functionality test
function executeTest1() {
  gameState.gamePhase = GAME_PHASES.START;
  setTimeout(() => {
    // Start game
    gameInstance.keyPressed = function() {};
    gameInstance._onkeydown({ keyCode: 13 });
    
    if (gameInstance.logs) {
      gameInstance.logs.game_info.push({
        data: { test: "TEST_1_started" },
        framecount: gameInstance.frameCount,
        timestamp: Date.now()
      });
    }
  }, 100);
}

// Test mode 2: Win test
function executeTest2() {
  gameState.gamePhase = GAME_PHASES.START;
  setTimeout(() => {
    // Start game
    gameInstance._onkeydown({ keyCode: 13 });
    
    setTimeout(() => {
      // Cheat to win
      gameState.gold = 1000;
      gameState.customersServed = 15;
      gameState.reputation = 500;
      
      if (gameInstance.logs) {
        gameInstance.logs.game_info.push({
          data: { test: "TEST_2_win_conditions_set" },
          framecount: gameInstance.frameCount,
          timestamp: Date.now()
        });
      }
    }, 500);
  }, 100);
}