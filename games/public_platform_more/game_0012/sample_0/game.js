// game.js - Main game file

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { initializeGame, updateGame } from './game_logic.js';
import { renderStartScreen, renderGame, renderGameOverScreen, renderPausedIndicator } from './rendering.js';
import { handleKeyPressed, processAutomatedAction } from './input.js';
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
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: "START", action: "game_initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  // Draw
  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (p.frameCount % 10 === 0) { // Take action every 10 frames
        const action = get_automated_testing_action(gameState);
        processAutomatedAction(p, action);
      }
    }
    
    // Update game logic
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      updateGame();
      
      // Log player info periodically
      if (p.frameCount % 60 === 0 && gameState.player) {
        p.logs.player_info.push({
          screen_x: gameState.player.x,
          screen_y: gameState.player.y,
          game_x: gameState.player.gameX,
          game_y: gameState.player.gameY,
          framecount: p.frameCount
        });
      }
    }
    
    // Render
    if (gameState.gamePhase === GAME_PHASES.START) {
      renderStartScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      renderGame(p);
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      renderGame(p);
      renderPausedIndicator(p);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
               gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      renderGameOverScreen(p);
    }
  };
  
  // Key pressed
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p, p.key, p.keyCode);
    }
    return false; // Prevent default
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode setter
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
  
  const activeBtn = mode === 'HUMAN' ? 'humanModeBtn' : 
                    mode === 'TEST_1' ? 'test_1_ModeBtn' :
                    mode === 'TEST_2' ? 'test_2_ModeBtn' :
                    mode === 'TEST_3' ? 'test_3_ModeBtn' : null;
  
  if (activeBtn) {
    const btn = document.getElementById(activeBtn);
    if (btn) {
      btn.classList.add('active');
    }
  }
  
  console.log(`Control mode set to: ${mode}`);
};