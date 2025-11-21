// game.js - Main game file

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, GAME_PHASES, resetGameState } from './globals.js';
import { Player } from './player.js';
import { initializeWorld, updateWorld } from './world.js';
import { renderWorld, renderUI, renderStartScreen, renderGameOverScreen } from './renderer.js';
import { getPlayerActions, handleKeyPressed, handleKeyReleased } from './input.js';
import './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs (write-only)
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize game
    resetGameState();
    initializeWorld(p);
    
    // Create player
    gameState.player = new Player(0, 30, 0);
    
    // Log initial game state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase, message: "Game initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    p.background(5, 5, 10);
    
    if (gameState.gamePhase === GAME_PHASES.START) {
      renderStartScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING || 
               gameState.gamePhase === GAME_PHASES.PAUSED) {
      
      // Update game (only when not paused)
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        const actions = getPlayerActions(p);
        
        // Apply automated testing actions if not in HUMAN mode
        if (gameState.controlMode !== "HUMAN") {
          const testAction = window.get_automated_testing_action(gameState);
          if (testAction) {
            if (testAction.interact) {
              if (gameState.nearbyObject) {
                gameState.player.interactWithObject(gameState.nearbyObject);
              }
            }
            if (testAction.toggleFlashlight) {
              gameState.flashlightOn = !gameState.flashlightOn;
            }
          }
        }
        
        gameState.player.update(p, actions);
        updateWorld(p);
        
        // Log player info periodically
        if (p.frameCount % 60 === 0) {
          const pos = gameState.player.getScreenPosition();
          p.logs.player_info.push({
            screen_x: pos.screen_x,
            screen_y: pos.screen_y,
            game_x: pos.game_x,
            game_y: pos.game_y,
            framecount: p.frameCount
          });
        }
      }
      
      // Render
      renderWorld(p, gameState.player);
      renderUI(p, gameState.player);
      
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
               gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      // Render last frame of gameplay in background
      renderWorld(p, gameState.player);
      renderGameOverScreen(p);
      
      // Log game over once
      if (p.frameCount % 60 === 0) {
        p.logs.game_info.push({
          data: { 
            gamePhase: gameState.gamePhase, 
            finalScore: gameState.score,
            cluesCollected: gameState.cluesCollected 
          },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  };

  p.keyPressed = function() {
    handleKeyPressed(p);
    
    // Prevent default browser behavior for game keys
    if ([32, 37, 38, 39, 40].includes(p.keyCode)) {
      return false;
    }
  };

  p.keyReleased = function() {
    handleKeyReleased(p);
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn', 'test_4_ModeBtn', 'test_5_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const modeMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn',
    'TEST_3': 'test_3_ModeBtn',
    'TEST_4': 'test_4_ModeBtn',
    'TEST_5': 'test_5_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  console.log(`Control mode set to: ${mode}`);
};