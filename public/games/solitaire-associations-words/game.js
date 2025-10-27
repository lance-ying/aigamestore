// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, LEVEL_DEFINITIONS } from './globals.js';
import { initializeLevel } from './levelManager.js';
import { handleKeyPressed, handleMousePressed, handleMouseDragged, handleMouseReleased } from './input.js';
import { updateAnimation } from './gameLogic.js';
import { renderStartScreen, renderPlaying, renderPaused, renderGameOver } from './render.js';
import { initializeTestMode, updateTestMode } from './testing.js';

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
    
    // Initialize game state
    gameState.gamePhase = "START";
    gameState.score = 0;
    gameState.currentLevel = 1;
    
    // Initialize level 1
    initializeLevel(p, 1);
    
    p.logs.game_info.push({
      data: { phase: "START", action: "game_initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Handle testing mode
    if (gameState.controlMode !== "HUMAN") {
      updateTestMode(p);
    }
    
    // Update animations
    if (gameState.gamePhase === "PLAYING") {
      updateAnimation(p);
    }
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case "START":
        renderStartScreen(p);
        break;
      case "PLAYING":
        renderPlaying(p);
        break;
      case "PAUSED":
        renderPaused(p);
        break;
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        renderGameOver(p);
        break;
    }
  };
  
  p.keyPressed = function() {
    handleKeyPressed(p);
    
    // Special handling for advancing to next level
    if (p.keyCode === 13 && gameState.gamePhase === "GAME_OVER_WIN") {
      if (gameState.currentLevel < LEVEL_DEFINITIONS.length) {
        // Next level
        gameState.currentLevel++;
        initializeLevel(p, gameState.currentLevel);
        gameState.gamePhase = "PLAYING";
        
        p.logs.game_info.push({
          data: { phase: "PLAYING", level: gameState.currentLevel, action: "next_level" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  };
  
  p.mousePressed = function() {
    handleMousePressed(p);
  };
  
  p.mouseDragged = function() {
    handleMouseDragged(p);
  };
  
  p.mouseReleased = function() {
    handleMouseReleased(p);
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Expose getGameState function
window.getGameState = function() {
  return gameState;
};

// Expose setControlMode function
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = document.querySelectorAll('.control-button');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  if (mode === "HUMAN") {
    document.getElementById('humanModeBtn').classList.add('active');
  } else if (mode === "TEST_1") {
    document.getElementById('test_1_ModeBtn').classList.add('active');
  } else if (mode === "TEST_2") {
    document.getElementById('test_2_ModeBtn').classList.add('active');
  }
  
  // Initialize test mode if needed
  if (mode !== "HUMAN") {
    initializeTestMode(gameInstance, mode);
  }
};