// game.js - Main game file with p5.js instance

const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Bodies, Body, Events } = Matter;

import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT, ABILITIES } from './globals.js';
import { Grid } from './entities.js';
import { initPhysics, updatePhysics } from './physics.js';
import { placeShipsRandomly } from './shipPlacement.js';
import { renderStartScreen, renderGame, renderPausedOverlay, renderGameOver } from './rendering.js';
import { handleKeyPressed } from './controls.js';
import { executeAITurn } from './combat.js';
import { updateAbilityCooldowns } from './abilities.js';
import { runAutomatedTest } from './testAutomation.js';

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize physics
    initPhysics();
    
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
    
    // Initialize game
    initializeGame(p);
  };
  
  p.draw = function() {
    // Update physics
    updatePhysics();
    
    // Run automated tests if in test mode
    if (gameState.controlMode !== "HUMAN") {
      runAutomatedTest(p);
    }
    
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
  
  p.keyPressed = function() {
    const shouldReset = handleKeyPressed(p);
    if (shouldReset) {
      resetGame(p);
    }
    return false;
  };
});

function initializeGame(p) {
  // Initialize grids
  gameState.playerGrid = new Grid();
  gameState.aiGrid = new Grid();
  
  // Place ships
  gameState.playerShips = placeShipsRandomly(true);
  gameState.aiShips = placeShipsRandomly(false);
  
  // Initialize abilities
  gameState.selectedAbility = Object.keys(ABILITIES)[0];
  
  // Reset game state
  gameState.score = 0;
  gameState.turnNumber = 1;
  gameState.isPlayerTurn = true;
  gameState.cursorX = 0;
  gameState.cursorY = 0;
  gameState.playerResources = 3;
  gameState.effects = [];
  gameState.aiTargetQueue = [];
  gameState.aiLastHit = null;
  gameState.testTimer = 0;
  gameState.testPhase = 0;
  gameState.testTargets = [];
  
  for (let key in gameState.abilityCooldowns) {
    gameState.abilityCooldowns[key] = 0;
  }
}

function updateGame(p) {
  // Update effects
  gameState.effects = gameState.effects.filter(effect => effect.update());
  
  // Update ability cooldowns
  if (gameState.isPlayerTurn) {
    updateAbilityCooldowns();
  }
  
  // AI turn logic
  if (!gameState.isPlayerTurn && gameState.controlMode === "HUMAN") {
    // Delay AI turn for visibility
    if (p.frameCount % 60 === 30) {
      executeAITurn(p);
    }
  }
}

function resetGame(p) {
  gameState.gamePhase = "START";
  initializeGame(p);
  
  p.logs.game_info.push({
    data: { gamePhase: "START", action: "reset" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

// Expose globally
window.gameInstance = gameInstance;

// Control mode setter for UI buttons
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
  
  const activeBtn = document.getElementById(mode === "HUMAN" ? 'humanModeBtn' : 
                                           mode === "TEST_1" ? 'test_1_ModeBtn' :
                                           'test_2_ModeBtn');
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  // Reset game when changing modes
  resetGame(gameInstance);
};