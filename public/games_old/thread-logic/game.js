// game.js - Main game file
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Cursor } from './cursor.js';
import { Screw } from './screw.js';
import { loadLevel, checkLevelComplete } from './level.js';
import { handleKeyPressed } from './input.js';
import { drawBackground, drawUI, drawStartScreen, drawPausedOverlay, drawLevelCompleteScreen, drawGameOverScreen } from './render.js';
import { updateTestMode, resetTestMode } from './testing.js';

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
    
    // Initialize cursor
    const cursor = new Cursor();
    gameState.player = cursor;
    gameState.entities.push(cursor);
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Single background call
    drawBackground(p);
    
    // Handle different game phases
    if (gameState.gamePhase === GAME_PHASES.START) {
      drawStartScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      // Update test mode
      if (gameState.controlMode !== "HUMAN") {
        updateTestMode(p);
      }
      
      // Update entities
      for (let entity of gameState.entities) {
        if (entity.update) {
          entity.update(p);
        }
      }
      
      // Update screws
      for (let screw of gameState.screws) {
        screw.update(p);
      }
      
      // Draw screw paths
      for (let screw of gameState.screws) {
        screw.drawPath(p);
      }
      
      // Draw entities
      for (let entity of gameState.entities) {
        if (entity.draw) {
          entity.draw(p);
        }
      }
      
      // Draw UI
      drawUI(p);
      
      // Check level completion
      checkLevelComplete();
      
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      // Draw game state underneath
      for (let screw of gameState.screws) {
        screw.drawPath(p);
      }
      for (let entity of gameState.entities) {
        if (entity.draw) {
          entity.draw(p);
        }
      }
      drawUI(p);
      drawPausedOverlay(p);
      
    } else if (gameState.gamePhase === GAME_PHASES.LEVEL_COMPLETE) {
      // Draw game state underneath
      for (let entity of gameState.entities) {
        if (entity.draw) {
          entity.draw(p);
        }
      }
      drawUI(p);
      drawLevelCompleteScreen(p);
      
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER) {
      drawGameOverScreen(p);
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
  resetTestMode();
  
  // Update button states
  document.querySelectorAll('.control-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  if (mode === "HUMAN") {
    document.getElementById('humanModeBtn').classList.add('active');
  } else if (mode === "TEST_1") {
    document.getElementById('test_1_ModeBtn').classList.add('active');
  } else if (mode === "TEST_2") {
    document.getElementById('test_2_ModeBtn').classList.add('active');
  }
};