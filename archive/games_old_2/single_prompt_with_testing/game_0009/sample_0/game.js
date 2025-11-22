// game.js - Main game initialization and loop

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  TARGET_FPS,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  DESIGN_PHASE,
  SIMULATE_PHASE,
  gameState
} from './globals.js';

import { handleKeyPressed, handleKeyReleased, processAutomatedInput } from './input_handler.js';
import { drawStartScreen, drawGameUI, drawGameOverScreen, drawEntryExitPoints } from './ui.js';
import { updateDesignPhase, drawDesignPhase, initializeDesignPhase } from './design_phase.js';
import { updateSimulation, drawSimulation, initializeSimulation } from './simulation_phase.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Setup
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
    
    // Log game start
    p.logs.game_info.push({
      data: { event: "game_initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  // Draw
  p.draw = function() {
    p.background(40, 50, 60);
    
    // Process automated testing input
    if (gameState.controlMode !== "HUMAN") {
      const action = get_automated_testing_action(gameState);
      if (action) {
        processAutomatedInput(p, action);
      }
    }
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case PHASE_START:
        drawStartScreen(p);
        break;
        
      case PHASE_PLAYING:
      case PHASE_PAUSED:
        // Draw game background
        p.background(40, 50, 60);
        
        // Draw based on design/simulate phase
        if (gameState.designPhase === DESIGN_PHASE) {
          updateDesignPhase(p);
          drawDesignPhase(p);
        } else if (gameState.designPhase === SIMULATE_PHASE) {
          updateSimulation(p);
          drawSimulation(p);
        }
        
        // Draw entry/exit points
        drawEntryExitPoints(p);
        
        // Draw UI
        drawGameUI(p);
        break;
        
      case PHASE_GAME_OVER_WIN:
      case PHASE_GAME_OVER_LOSE:
        drawGameOverScreen(p);
        break;
    }
    
    // Log player info periodically
    if (p.frameCount % 60 === 0 && gameState.player) {
      p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y,
        game_x: gameState.player.x,
        game_y: gameState.player.y,
        framecount: p.frameCount
      });
    }
  };
  
  // Key handlers
  p.keyPressed = function() {
    handleKeyPressed(p, p.key, p.keyCode);
    return false; // Prevent default
  };
  
  p.keyReleased = function() {
    handleKeyReleased(p, p.key, p.keyCode);
    return false;
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Initialize design phase when simulation is triggered
window.addEventListener('load', () => {
  // Set up event listener for simulation initialization
  const originalStart = initializeSimulation;
  window.initializeSimulation = function(p) {
    originalStart(p);
  };
});