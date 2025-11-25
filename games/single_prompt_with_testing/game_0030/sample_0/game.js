// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, CONTROL_HUMAN, CONTROL_TEST_1, CONTROL_TEST_2, CONTROL_TEST_3, CONTROL_TEST_4 } from './globals.js';
import { initGame, updateGame } from './game_logic.js';
import { handleInput, setupKeyHandlers } from './input_handler.js';
import { drawStartScreen, drawPausedIndicator, drawGameOverScreen, drawHUD, drawBackground } from './ui.js';
import { Spirit } from './spirit.js';

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
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    // Initialize game state
    gameState.gamePhase = PHASE_START;
    
    // Log setup
    p.logs.game_info.push({
      data: { phase: PHASE_START, message: "Game initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Setup key handlers
    setupKeyHandlers(p);
  };

  p.draw = function() {
    // Single background call to prevent flickering
    p.background(20, 30, 50);
    
    if (gameState.gamePhase === PHASE_START) {
      drawStartScreen(p, gameState);
    } else if (gameState.gamePhase === PHASE_PLAYING) {
      // Initialize game on first frame of playing
      if (!gameState.player) {
        initGame(p);
      }
      
      // Draw background
      drawBackground(p);
      
      // Handle input
      handleInput(p);
      
      // Update game
      updateGame(p);
      
      // Draw game entities
      drawGameEntities(p);
      
      // Draw HUD
      drawHUD(p, gameState);
      
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      // Draw frozen game state
      drawBackground(p);
      drawGameEntities(p);
      drawHUD(p, gameState);
      drawPausedIndicator(p);
      
    } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      // Draw final game state
      drawBackground(p);
      drawGameEntities(p);
      drawGameOverScreen(p, gameState, gameState.gamePhase === PHASE_GAME_OVER_WIN);
    }
  };

  function drawGameEntities(p) {
    // Draw boat
    if (gameState.boat) {
      gameState.boat.draw(p);
    }
    
    // Draw islands
    for (let island of gameState.islands) {
      island.draw(p);
    }
    
    // Draw everdoor
    if (gameState.everdoor) {
      gameState.everdoor.draw(p);
    }
    
    // Draw spirits
    for (let spirit of gameState.spirits) {
      spirit.draw(p);
    }
    
    // Draw spirit name tags
    for (let spirit of gameState.spirits) {
      spirit.drawNameTag(p);
    }
    
    // Draw player
    if (gameState.player) {
      gameState.player.draw(p);
    }
  }
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn', 'test_4_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const activeBtn = mode === CONTROL_HUMAN ? 'humanModeBtn' : 
                    mode === CONTROL_TEST_1 ? 'test_1_ModeBtn' :
                    mode === CONTROL_TEST_2 ? 'test_2_ModeBtn' :
                    mode === CONTROL_TEST_3 ? 'test_3_ModeBtn' :
                    mode === CONTROL_TEST_4 ? 'test_4_ModeBtn' : null;
  
  if (activeBtn) {
    const btn = document.getElementById(activeBtn);
    if (btn) {
      btn.classList.add('active');
    }
  }
  
  console.log(`Control mode set to: ${mode}`);
};