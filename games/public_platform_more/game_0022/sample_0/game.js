// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN } from './globals.js';
import { updateGame } from './gameLogic.js';
import { renderStartScreen, renderGameScreen, renderGameOverScreen } from './rendering.js';
import { handleKeyPressed, getAutomatedAction, executeAutomatedAction } from './input.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
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
      data: { phase: PHASE_START, message: "Game initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === PHASE_PLAYING) {
      if (p.frameCount % 10 === 0) { // Execute action every 10 frames for visibility
        const action = getAutomatedAction();
        if (action) {
          executeAutomatedAction(action);
        }
      }
    }
    
    // Update game logic
    if (gameState.gamePhase === PHASE_PLAYING) {
      updateGame();
      
      // Log player info periodically
      if (p.frameCount % 60 === 0) {
        p.logs.player_info.push({
          screen_x: 0,
          screen_y: 0,
          game_x: 0,
          game_y: 0,
          framecount: p.frameCount
        });
      }
    }
    
    // Render
    if (gameState.gamePhase === PHASE_START) {
      renderStartScreen(p);
    } else if (gameState.gamePhase === PHASE_PLAYING || gameState.gamePhase === PHASE_PAUSED) {
      renderGameScreen(p);
    } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN) {
      renderGameOverScreen(p);
    }
  };
  
  p.keyPressed = function() {
    handleKeyPressed(p);
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;