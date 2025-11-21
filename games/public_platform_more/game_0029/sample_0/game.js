// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, MODE_HUMAN } from './globals.js';
import { drawStartScreen, drawPlayingScreen, drawPausedScreen, drawGameOverScreen } from './ui.js';
import { updateGame } from './game_logic.js';
import { handleKeyPressed, processAutomatedInput } from './input_handler.js';
import get_automated_testing_action from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize the logs
  p.logs = {
    "game_info": [],
    "inputs": [],
    "player_info": []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    // Log initial game state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, action: "initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Single background call at the top
    p.background(40, 50, 80);
    
    // Handle automated testing input
    if (gameState.controlMode !== MODE_HUMAN) {
      const action = get_automated_testing_action(gameState);
      if (action) {
        processAutomatedInput(p, action);
      }
    }
    
    // Update game logic
    if (gameState.gamePhase === PHASE_PLAYING) {
      updateGame(p);
    }
    
    // Render based on game phase
    if (gameState.gamePhase === PHASE_START) {
      drawStartScreen(p);
    } else if (gameState.gamePhase === PHASE_PLAYING) {
      drawPlayingScreen(p);
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      drawPausedScreen(p);
    } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      drawGameOverScreen(p);
    }
    
    // Log player info every 30 frames during gameplay
    if (gameState.gamePhase === PHASE_PLAYING && p.frameCount % 30 === 0 && gameState.player) {
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
    if (gameState.controlMode === MODE_HUMAN) {
      handleKeyPressed(p);
    }
    return false; // Prevent default behavior
  };
}, document.body);

// Expose the game instance globally
window.gameInstance = gameInstance;

// Expose getGameState function
window.getGameState = function() {
  return gameState;
};

// Control mode switching
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
  
  const activeBtn = mode === MODE_HUMAN ? 'humanModeBtn' : 
                    mode === 'TEST_1' ? 'test_1_ModeBtn' : 
                    'test_2_ModeBtn';
  const btn = document.getElementById(activeBtn);
  if (btn) {
    btn.classList.add('active');
  }
};