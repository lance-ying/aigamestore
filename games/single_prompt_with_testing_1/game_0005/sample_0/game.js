// game.js
const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World } = Matter;

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES } from './globals.js';
import { setupPhysics, updatePhysics } from './physics.js';
import { loadLevel } from './levels.js';
import { handleGameplayInput, updateSimulation } from './input.js';
import { renderStartScreen, renderGame, renderPausedOverlay, renderGameOver } from './render.js';

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Create Matter.js engine and world
    const engine = Engine.create();
    const world = engine.world;
    world.gravity.y = 0.5;
    
    gameState.engine = engine;
    gameState.world = world;
    
    // Initialize p5.logs
    p.logs = {
      game_info: [],
      player_info: [],
      inputs: []
    };
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Setup physics
    setupPhysics();
    
    // Load first level
    loadLevel(1);
  };
  
  p.draw = function() {
    // Update Matter.js physics
    if (gameState.gamePhase === "PLAYING" && gameState.isSimulating) {
      Engine.update(gameState.engine, 1000 / 60);
      updatePhysics();
      updateSimulation(p);
    }
    
    // Handle control modes
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === "PLAYING") {
      handleGameplayInput(p, null);
    }
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        renderStartScreen(p);
        break;
      case GAME_PHASES.PLAYING:
        renderGame(p);
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
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Handle phase controls
    if (p.keyCode === 13 && gameState.gamePhase === GAME_PHASES.START) { // ENTER
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { gamePhase: GAME_PHASES.PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    if (p.keyCode === 27) { // ESC - Pause/Unpause
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
        p.logs.game_info.push({
          data: { gamePhase: GAME_PHASES.PAUSED },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        p.logs.game_info.push({
          data: { gamePhase: GAME_PHASES.PLAYING },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    if (p.keyCode === 82) { // R - Restart
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN ||
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        resetGame(p);
        gameState.gamePhase = GAME_PHASES.START;
        p.logs.game_info.push({
          data: { gamePhase: GAME_PHASES.START },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    // Handle gameplay inputs
    if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.controlMode === "HUMAN") {
      handleGameplayInput(p, p.keyCode);
    }
    
    return false;
  };
});

function resetGame(p) {
  // Remove all vehicles
  gameState.vehicles.forEach(vehicle => {
    vehicle.remove();
  });
  
  // Remove all segments
  gameState.segments.forEach(segment => {
    if (segment.constraint) {
      World.remove(gameState.world, segment.constraint);
    }
  });
  
  // Remove terrain
  gameState.terrain.forEach(terrain => {
    World.remove(gameState.world, terrain.body);
  });
  
  // Reset state
  gameState.placedNodes = [];
  gameState.segments = [];
  gameState.vehicles = [];
  gameState.vehiclesSpawned = 0;
  gameState.vehiclesCrossed = 0;
  gameState.spentBudget = 0;
  gameState.isSimulating = false;
  gameState.simulationStarted = false;
  gameState.currentMaterial = "ROAD";
  gameState.cursor = { x: 150, y: 200 };
  
  // Reload level
  loadLevel(gameState.currentLevel);
}

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
  
  const activeBtn = document.getElementById(mode === 'HUMAN' ? 'humanModeBtn' : 
                                           mode === 'TEST_1' ? 'test_1_ModeBtn' : 
                                           'test_2_ModeBtn');
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  // Reset game when switching modes
  if (gameState.gamePhase !== GAME_PHASES.START) {
    resetGame(gameInstance);
    gameState.gamePhase = GAME_PHASES.START;
  }
};

// Expose globally
window.gameInstance = gameInstance;