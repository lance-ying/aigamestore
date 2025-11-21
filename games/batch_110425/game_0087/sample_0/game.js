// game.js - Main game file

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Player } from './player.js';
import { createCards } from './cards.js';
import { handleKeyPressed, handleKeyReleased } from './input.js';
import { drawStartScreen, drawPlayingScreen, drawPausedOverlay, drawGameOverScreen } from './rendering.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  
  // Initialize logs (write-only)
  p.logs = {
    "game_info": [],
    "inputs": [],
    "player_info": []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize player
    gameState.player = new Player(50, 340);
    gameState.entities.push(gameState.player);
    
    // Create cards
    createCards(p);
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: "START" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN") {
      const action = get_automated_testing_action(gameState);
      if (action && action.keyCode) {
        handleKeyPressed(p, p.key, action.keyCode);
      }
    }
    
    // Update game
    updateGame(p);
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        drawStartScreen(p);
        break;
        
      case GAME_PHASES.PLAYING:
        drawPlayingScreen(p);
        break;
        
      case GAME_PHASES.PAUSED:
        drawPlayingScreen(p);
        drawPausedOverlay(p);
        break;
        
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        drawGameOverScreen(p);
        break;
    }
  };
  
  function updateGame(p) {
    // Update entities
    for (let entity of gameState.entities) {
      if (entity.update) {
        entity.update();
      }
    }
    
    // Check Z key for vision viewing (hold)
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.viewingVision = p.keyIsDown(90); // Z key
    }
  }
  
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p, p.key, p.keyCode);
    }
  };
  
  p.keyReleased = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyReleased(p, p.key, p.keyCode);
    }
  };
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
};