// game.js - Main game file

import { gameState, GAME_PHASE, CANVAS_WIDTH, CANVAS_HEIGHT, resetGameState } from './globals.js';
import { Player } from './player.js';
import { createInteractables } from './interactables.js';
import { renderStartScreen, renderGameOver, renderShip, renderUI, renderHallucinations } from './rendering.js';
import { updateGameLogic, handleInteraction } from './game_logic.js';
import './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize the logs
  p.logs = {
    "game_info": [],
    "inputs": [],
    "player_info": []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Log initial game info
    p.logs.game_info.push({
      data: { phase: "START" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Single background call at top
    p.background(20, 15, 25);
    
    if (gameState.gamePhase === GAME_PHASE.START) {
      renderStartScreen(p);
    } else if (gameState.gamePhase === GAME_PHASE.PLAYING) {
      // Render game
      renderShip(p);
      
      // Update and render interactables
      for (let interactable of gameState.interactables) {
        interactable.render();
      }
      
      // Update and render player
      if (gameState.player) {
        gameState.player.render();
      }
      
      // Render hallucinations overlay
      renderHallucinations(p);
      
      // Update game logic
      updateGameLogic(p);
      
      // Render UI on top
      renderUI(p);
      
      // Handle automated testing input
      if (gameState.controlMode !== "HUMAN") {
        const action = window.get_automated_testing_action(gameState);
        if (action && action.key === ' ') {
          handleInteraction(p);
        }
      }
      
    } else if (gameState.gamePhase === GAME_PHASE.PAUSED) {
      // Render frozen game state
      renderShip(p);
      
      for (let interactable of gameState.interactables) {
        interactable.render();
      }
      
      if (gameState.player) {
        gameState.player.render();
      }
      
      renderHallucinations(p);
      renderUI(p);
      
    } else if (gameState.gamePhase === GAME_PHASE.GAME_OVER_WIN || 
               gameState.gamePhase === GAME_PHASE.GAME_OVER_LOSE) {
      renderGameOver(p);
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
    
    // Global controls
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === GAME_PHASE.START) {
        startGame(p);
      }
    } else if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === GAME_PHASE.PLAYING) {
        gameState.gamePhase = GAME_PHASE.PAUSED;
        p.logs.game_info.push({
          data: { phase: "PAUSED" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === GAME_PHASE.PAUSED) {
        gameState.gamePhase = GAME_PHASE.PLAYING;
        p.logs.game_info.push({
          data: { phase: "PLAYING" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (p.keyCode === 82) { // R
      if (gameState.gamePhase === GAME_PHASE.GAME_OVER_WIN || 
          gameState.gamePhase === GAME_PHASE.GAME_OVER_LOSE) {
        restartGame(p);
      }
    }
    
    // Gameplay controls (only in PLAYING phase and HUMAN mode)
    if (gameState.gamePhase === GAME_PHASE.PLAYING && gameState.controlMode === "HUMAN") {
      if (p.keyCode === 32) { // SPACE
        handleInteraction(p);
      } else if (p.keyCode === 90) { // Z
        gameState.showStatus = true;
        gameState.statusTimer = 180; // 3 seconds
      }
    }
  };
  
  function startGame(p) {
    resetGameState();
    gameState.gamePhase = GAME_PHASE.PLAYING;
    
    // Create player
    gameState.player = new Player(p, 150, 100);
    gameState.entities.push(gameState.player);
    
    // Create interactables
    gameState.interactables = createInteractables(p);
    
    p.logs.game_info.push({
      data: { phase: "PLAYING" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    p.logs.player_info.push({
      screen_x: gameState.player.x,
      screen_y: gameState.player.y,
      game_x: gameState.player.x,
      game_y: gameState.player.y,
      framecount: p.frameCount
    });
  }
  
  function restartGame(p) {
    resetGameState();
    gameState.gamePhase = GAME_PHASE.START;
    
    p.logs.game_info.push({
      data: { phase: "START" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
});

// Expose the game instance globally
window.gameInstance = gameInstance;

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn'];
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
    'TEST_3': 'test_3_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};

export default gameInstance;