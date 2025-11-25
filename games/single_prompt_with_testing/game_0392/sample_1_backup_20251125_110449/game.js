// game.js - Main game file with p5.js instance mode

import {
  gameState,
  initializeGameState,
  getGameState,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PLAY_AREA_LEFT,
  PLAY_AREA_RIGHT,
  PLAY_AREA_TOP,
  PLAY_AREA_BOTTOM
} from './globals.js';

import { Player } from './entities.js';
import { setupInput, handleInput } from './input.js';
import { updateGameLogic, updateEntities, renderEntities } from './game_logic.js';
import { renderStartScreen, renderPlayingUI, renderPausedOverlay, renderGameOver } from './ui.js';
import { get_automated_testing_action } from './automated_testing.js';

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
    p.randomSeed(42); // Set seed ONCE
    
    // Initialize game state
    initializeGameState();
    
    // Setup input handlers
    setupInput(p);
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Update frame count
    gameState.frameCount = p.frameCount;
    
    // Update delta time
    const currentTime = p.millis();
    gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
    gameState.lastFrameTime = currentTime;
    
    // CRITICAL: Exactly one background() call
    p.background(20, 20, 30);
    
    // Handle different game phases
    switch (gameState.gamePhase) {
      case "START":
        renderStartScreen(p);
        break;
        
      case "PLAYING":
        // Handle automated testing
        if (gameState.controlMode !== "HUMAN") {
          const action = get_automated_testing_action(gameState);
          if (action) {
            // Simulate key press
            p.keyCode = action.keyCode;
            p.keyPressed();
            
            // Simulate key release after a few frames
            setTimeout(() => {
              if (p.keyReleased) {
                p.keyCode = action.keyCode;
                p.keyReleased();
              }
            }, 100);
          }
        } else {
          // Human input
          handleInput(p);
        }
        
        // Update game logic
        updateGameLogic(p);
        
        // Update entities
        updateEntities(p);
        
        // Render play area background
        p.fill(5, 5, 20);
        p.noStroke();
        p.rect(PLAY_AREA_LEFT, PLAY_AREA_TOP, 
          PLAY_AREA_RIGHT - PLAY_AREA_LEFT, 
          PLAY_AREA_BOTTOM - PLAY_AREA_TOP);
        
        // Render entities
        renderEntities(p);
        
        // Render UI
        renderPlayingUI(p);
        break;
        
      case "PAUSED":
        // Render game (frozen)
        p.fill(5, 5, 20);
        p.noStroke();
        p.rect(PLAY_AREA_LEFT, PLAY_AREA_TOP, 
          PLAY_AREA_RIGHT - PLAY_AREA_LEFT, 
          PLAY_AREA_BOTTOM - PLAY_AREA_TOP);
        
        renderEntities(p);
        renderPlayingUI(p);
        renderPausedOverlay(p);
        break;
        
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        // Render final game state
        p.fill(5, 5, 20);
        p.noStroke();
        p.rect(PLAY_AREA_LEFT, PLAY_AREA_TOP, 
          PLAY_AREA_RIGHT - PLAY_AREA_LEFT, 
          PLAY_AREA_BOTTOM - PLAY_AREA_TOP);
        
        renderEntities(p);
        renderPlayingUI(p);
        renderGameOver(p);
        break;
    }
  };
}, document.body);

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode setter
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
  
  // Log mode change
  if (gameInstance && gameInstance.logs) {
    gameInstance.logs.game_info.push({
      data: { controlMode: mode },
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
};