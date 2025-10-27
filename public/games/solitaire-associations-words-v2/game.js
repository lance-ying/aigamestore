// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS } from './globals.js';
import { initializeLevel, advanceToNextLevel } from './levelManager.js';
import { handleKeyPressed, processAutomatedInput } from './input.js';
import { drawStartScreen, drawPlayingScreen, drawPausedScreen, drawGameOverScreen } from './render.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Setup function
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    // Initialize logs (write-only)
    p.logs = {
      "game_info": [],
      "inputs": [],
      "player_info": []
    };
    
    // Initialize first level
    initializeLevel(p, 1);
    
    // Log initialization
    p.logs.game_info.push({
      data: { phase: "START", initialized: true },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  // Draw function
  p.draw = function() {
    // Process automated input if in test mode
    if (gameState.controlMode !== "HUMAN") {
      processAutomatedInput(p);
    }
    
    // Handle level complete transition
    if (gameState.levelComplete && !gameState.showingLevelComplete && gameState.gamePhase === "GAME_OVER_WIN") {
      // Automatically advance to next level after a short delay
      // This happens after the animation finishes
    }
    
    // If animation just finished and we're still in win state, advance
    if (gameState.levelComplete && gameState.showingLevelComplete === false && 
        gameState.gamePhase === "GAME_OVER_WIN" && gameState.levelCompleteTimer > 0) {
      // Wait a bit before advancing
      if (p.frameCount % 30 === 0) {
        advanceToNextLevel(p);
        gameState.gamePhase = "PLAYING";
        gameState.levelCompleteTimer = 0;
      }
    }
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case "START":
        drawStartScreen(p);
        break;
      case "PLAYING":
        drawPlayingScreen(p);
        break;
      case "PAUSED":
        drawPausedScreen(p);
        break;
      case "GAME_OVER_WIN":
        if (gameState.showingLevelComplete) {
          drawPlayingScreen(p);
        } else {
          drawGameOverScreen(p, true);
        }
        break;
      case "GAME_OVER_LOSE":
        drawGameOverScreen(p, false);
        break;
    }
    
    // Log player info periodically (every 60 frames)
    if (p.frameCount % 60 === 0 && gameState.gamePhase === "PLAYING") {
      p.logs.player_info.push({
        screen_x: gameState.currentCard ? gameState.currentCard.x : 0,
        screen_y: gameState.currentCard ? gameState.currentCard.y : 0,
        game_x: gameState.currentCard ? gameState.currentCard.x : 0,
        game_y: gameState.currentCard ? gameState.currentCard.y : 0,
        framecount: p.frameCount
      });
    }
  };
  
  // Key pressed handler
  p.keyPressed = function() {
    if (p.keyCode) {
      handleKeyPressed(p, p.keyCode);
    }
    return false; // Prevent default behavior
  };
}, document.body);

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  gameState.testFrameCounter = 0;
  gameState.testActionIndex = 0;
  
  // Update button styles
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
  
  console.log(`Control mode set to: ${mode}`);
};