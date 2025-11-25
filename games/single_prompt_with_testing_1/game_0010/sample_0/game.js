// game.js - Main game file with p5.js instance and Matter.js integration

const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World } = Matter;

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, getGameState } from './globals.js';
import { loadLevel } from './levelManager.js';
import { renderStartScreen, renderGame, renderPausedOverlay, renderGameOver } from './renderer.js';
import { handleKeyPressed } from './input.js';
import { updateSimulation } from './simulation.js';
import { updateAutomation, resetAutomationState } from './automation.js';

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);

    // Create Matter.js engine (required for compliance, but not used for main physics)
    const engine = Engine.create();
    const world = engine.world;
    world.gravity.y = 0; // No gravity for grid-based game

    gameState.engine = engine;
    gameState.world = world;

    // Initialize p5.logs (write-only)
    p.logs = {
      game_info: [],
      player_info: [],
      inputs: []
    };

    // Log initial game state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    // Load first level
    loadLevel(1);
  };

  p.draw = function() {
    // Update game based on phase
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        renderStartScreen(p);
        break;

      case GAME_PHASES.PLAYING:
        updateSimulation();
        updateAutomation(p);
        renderGame(p);
        logPlayerInfo(p);
        break;

      case GAME_PHASES.PAUSED:
        renderGame(p);
        renderPausedOverlay(p);
        break;

      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        renderGameOver(p);
        break;
    }
  };

  p.keyPressed = function() {
    handleKeyPressed(p);
    return false;
  };

  function logPlayerInfo(p) {
    // Log selected truck position periodically
    if (p.frameCount % 30 === 0 && gameState.trucks.length > 0) {
      const truck = gameState.trucks[gameState.selectedTruckIndex];
      if (truck) {
        p.logs.player_info.push({
          screen_x: truck.x * 50 + 25,
          screen_y: truck.y * 50 + 25,
          game_x: truck.x * 50 + 25,
          game_y: truck.y * 50 + 25,
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }
});

// Expose globally
window.gameInstance = gameInstance;

// Control mode management
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  resetAutomationState();
  
  // Update button styles
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const activeBtnId = mode === 'HUMAN' ? 'humanModeBtn' : 
                      mode === 'TEST_1' ? 'test_1_ModeBtn' : 
                      mode === 'TEST_2' ? 'test_2_ModeBtn' : null;
  if (activeBtnId) {
    const activeBtn = document.getElementById(activeBtnId);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }
  }
};