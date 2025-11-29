// game.js - Main game file

import { gameState, GAME_PHASES, getGameState } from './globals.js';
import { initializeGame, startPlayerTurn, executeAITurn } from './game_logic.js';
import { drawStartScreen, drawPlayingScreen, drawGameOverScreen } from './rendering.js';
import { handleKeyPressed } from './input.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Setup
  p.setup = function() {
    p.createCanvas(600, 400);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: "INITIALIZED", gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  // Draw
  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action && action.keyCode) {
        p.keyCode = action.keyCode;
        handleKeyPressed(p);
      }
    }
    
    // Execute AI turn
    if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.currentPlayer !== 0) {
      if (p.frameCount % 30 === 0) { // AI acts every 30 frames
        executeAITurn(p);
      }
    }
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        drawStartScreen(p);
        break;
      case GAME_PHASES.PLAYING:
      case GAME_PHASES.PAUSED:
        drawPlayingScreen(p);
        break;
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        drawGameOverScreen(p);
        break;
    }
    
    // Log player info periodically
    if (gameState.player && p.frameCount % 10 === 0) {
      const player = gameState.players[0];
      p.logs.player_info.push({
        screen_x: 0,
        screen_y: 0,
        game_x: 0,
        game_y: 0,
        score: player.score,
        framecount: p.frameCount
      });
    }
  };
  
  // Key pressed handler
  p.keyPressed = function() {
    const keyCode = p.keyCode;
    
    // Handle phase transitions
    if (keyCode === 13) { // ENTER
      if (gameState.gamePhase === GAME_PHASES.START) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        initializeGame(p);
        startPlayerTurn(p);
        
        p.logs.game_info.push({
          data: { phase: "GAME_START" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      return false;
    }
    
    if (keyCode === 27) { // ESC
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
        p.logs.game_info.push({
          data: { phase: "PAUSED" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        p.logs.game_info.push({
          data: { phase: "RESUMED" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      return false;
    }
    
    if (keyCode === 82) { // R
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        gameState.gamePhase = GAME_PHASES.START;
        
        // Reset game state
        gameState.currentRound = 1;
        gameState.currentPlayer = 0;
        gameState.score = 0;
        gameState.selectedTerritory = null;
        gameState.selectedRaceCombo = null;
        
        p.logs.game_info.push({
          data: { phase: "RESTART" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      return false;
    }
    
    // Handle gameplay input
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      handleKeyPressed(p);
    }
    
    return false;
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode management
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
  
  const activeBtn = document.getElementById(
    mode === 'HUMAN' ? 'humanModeBtn' : 
    mode === 'TEST_1' ? 'test_1_ModeBtn' :
    'test_2_ModeBtn'
  );
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  console.log(`Control mode set to: ${mode}`);
};