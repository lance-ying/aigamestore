// game.js - Main game file with p5.js instance

const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World } = Matter;

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, getGameState } from './globals.js';
import { initializeLevel, updateLayerSelection } from './levels.js';
import { handleGameplayInput, resetTestStates } from './controls.js';
import { renderStartScreen, renderGame, renderPausedOverlay, renderGameOver } from './render.js';

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Create Matter.js engine and world
    const engine = Engine.create();
    const world = engine.world;
    world.gravity.y = 0; // No gravity needed for this game
    
    gameState.engine = engine;
    gameState.world = world;
    
    // Initialize p5.logs
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
    
    // Initialize first level
    initializeLevel(p, 0);
  };
  
  p.draw = function() {
    // Update Matter.js physics (not really used for physics, but keeps it running)
    Engine.update(gameState.engine, 1000 / 60);
    
    // Update game based on phase
    switch (gameState.gamePhase) {
      case "START":
        renderStartScreen(p);
        break;
        
      case "PLAYING":
        updateGame(p);
        renderGame(p);
        break;
        
      case "PAUSED":
        renderGame(p);
        renderPausedOverlay(p);
        break;
        
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        renderGameOver(p);
        break;
    }
  };
  
  function updateGame(p) {
    // Handle input
    handleGameplayInput(p);
    
    // Update terrain layers
    gameState.terrainLayers.forEach(layer => {
      layer.update();
    });
    
    // Update old man
    if (gameState.oldMan) {
      gameState.oldMan.update();
    }
    
    // Check level completion
    if (gameState.levelComplete) {
      // Advance to next level
      gameState.currentLevel++;
      
      if (gameState.currentLevel >= gameState.totalLevels) {
        // Game complete
        gameState.gamePhase = "GAME_OVER_WIN";
        p.logs.game_info.push({
          data: { gamePhase: "GAME_OVER_WIN", finalLevel: gameState.currentLevel },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else {
        // Load next level
        initializeLevel(p, gameState.currentLevel);
        resetTestStates();
      }
    }
  }
  
  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Store key state
    gameState.keys[p.keyCode] = true;
    
    // Phase-specific controls
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === "START") {
        gameState.gamePhase = "PLAYING";
        p.logs.game_info.push({
          data: { gamePhase: "PLAYING" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === "GAME_OVER_WIN") {
        // Continue to next level or restart
        if (gameState.currentLevel < gameState.totalLevels) {
          gameState.gamePhase = "PLAYING";
          p.logs.game_info.push({
            data: { gamePhase: "PLAYING" },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
      }
    }
    
    if (p.keyCode === 27) { // ESC - Pause/Unpause
      if (gameState.gamePhase === "PLAYING") {
        gameState.gamePhase = "PAUSED";
        p.logs.game_info.push({
          data: { gamePhase: "PAUSED" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === "PAUSED") {
        gameState.gamePhase = "PLAYING";
        p.logs.game_info.push({
          data: { gamePhase: "PLAYING" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    if (p.keyCode === 82) { // R - Restart
      if (gameState.gamePhase === "GAME_OVER_WIN" || 
          gameState.gamePhase === "GAME_OVER_LOSE" ||
          gameState.gamePhase === "PLAYING") {
        resetGame(p);
      }
    }
    
    return false; // Prevent default
  };
  
  p.keyReleased = function() {
    // Clear key state
    gameState.keys[p.keyCode] = false;
    return false;
  };
  
  function resetGame(p) {
    gameState.currentLevel = 0;
    gameState.levelComplete = false;
    gameState.isMoving = false;
    gameState.keys = {};
    
    initializeLevel(p, 0);
    resetTestStates();
    
    gameState.gamePhase = "START";
    p.logs.game_info.push({
      data: { gamePhase: "START", action: "restart" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
});

// Expose globally
window.gameInstance = gameInstance;

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
  
  const modeMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  // Reset test states when switching modes
  resetTestStates();
};