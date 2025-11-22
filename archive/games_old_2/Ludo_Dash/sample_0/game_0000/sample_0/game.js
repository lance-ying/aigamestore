// game.js - Main game file

import { gameState, GAME_PHASES, TURN_PHASES, PLAYERS, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { initializeGame, updateAnimation } from './gameLogic.js';
import { handleKeyPress, getTestingAction, executeTestAction } from './controls.js';
import { renderBoard } from './board.js';
import { renderPieces, renderDice, renderUI, renderStartScreen, renderGameOver } from './rendering.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let testActionTimer = 0;
  const testActionDelay = 20; // frames between automated actions
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Initialize game
    initializeGame(p);
  };
  
  p.draw = function() {
    p.background(40, 80, 120);
    
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN") {
      testActionTimer++;
      if (testActionTimer >= testActionDelay) {
        testActionTimer = 0;
        const action = getTestingAction(p);
        executeTestAction(p, action);
      }
    }
    
    // Render based on game phase
    if (gameState.gamePhase === GAME_PHASES.START) {
      renderStartScreen(p);
      return;
    }
    
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      // Render board and pieces behind overlay
      renderBoard(p, gameState.boardPath, gameState.safeSpots, gameState.trapSpots);
      renderPieces(p, gameState.playerPieces, true, [], 0);
      renderPieces(p, gameState.aiPieces, false, [], 0);
      renderGameOver(p, gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN);
      return;
    }
    
    // Playing or Paused
    if (gameState.gamePhase === GAME_PHASES.PLAYING || 
        gameState.gamePhase === GAME_PHASES.PAUSED) {
      
      // Update animation if not paused
      if (gameState.gamePhase === GAME_PHASES.PLAYING && 
          gameState.currentTurnPhase === TURN_PHASES.ANIMATE_MOVE) {
        updateAnimation(p);
      }
      
      // Render game
      renderBoard(p, gameState.boardPath, gameState.safeSpots, gameState.trapSpots);
      
      // Render pieces
      const eligibleForHighlight = gameState.currentPlayer === PLAYERS.PLAYER && 
                                   gameState.currentTurnPhase === TURN_PHASES.SELECT_PIECE ? 
                                   gameState.eligiblePieces : [];
      
      renderPieces(p, gameState.playerPieces, true, eligibleForHighlight, gameState.selectedPieceIndex);
      renderPieces(p, gameState.aiPieces, false, [], 0);
      
      // Render dice
      const isRolling = gameState.currentTurnPhase === TURN_PHASES.ROLL_DICE && 
                       gameState.diceValue === 0;
      renderDice(p, gameState.diceValue, isRolling);
      
      // Render UI
      renderUI(p);
    }
  };
  
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPress(p, p.keyCode);
    }
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Expose getGameState function
window.getGameState = function() {
  return gameState;
};

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
  
  const activeBtn = document.getElementById(mode === 'HUMAN' ? 'humanModeBtn' : 
                                           mode === 'TEST_1' ? 'test_1_ModeBtn' : 
                                           'test_2_ModeBtn');
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};