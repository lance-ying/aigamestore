// game.js - Main game file

import { gameState, getGameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Player } from './entities.js';
import { initializeBoard } from './board.js';
import { initializeCards } from './cards.js';
import { startGame, nextTurn } from './game_logic.js';
import { handlePlayerInput, executeAITurn } from './player_controller.js';
import { renderStartScreen, renderGame, renderGameOver } from './renderer.js';
import get_automated_testing_action from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let lastAIActionFrame = 0;
  const AI_ACTION_DELAY = 30; // Frames between AI actions
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.randomSeed(42);
    p.frameRate(60);
    
    // Initialize logs
    p.logs = {
      "game_info": [],
      "inputs": [],
      "player_info": []
    };
    
    // Initialize game
    initializeGame();
    
    p.logs.game_info.push({
      data: { phase: "INITIALIZED" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    if (gameState.gamePhase === GAME_PHASES.START) {
      renderStartScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING || gameState.gamePhase === GAME_PHASES.PAUSED) {
      renderGame(p);
      
      // Handle AI players in automated testing mode
      if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.controlMode !== "HUMAN") {
        if (p.frameCount - lastAIActionFrame > AI_ACTION_DELAY) {
          const action = get_automated_testing_action(gameState);
          if (action && action.keyCode) {
            simulateKeyPress(action.keyCode);
          }
          lastAIActionFrame = p.frameCount;
        }
      }
      
      // Log player position periodically
      if (p.frameCount % 60 === 0 && gameState.players.length > 0) {
        const player = gameState.players[gameState.currentPlayerIndex];
        p.logs.player_info.push({
          screen_x: 0,
          screen_y: 0,
          game_x: gameState.currentPlayerIndex,
          game_y: player.score,
          framecount: p.frameCount
        });
      }
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
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
      if (gameState.gamePhase === GAME_PHASES.START) {
        startGame(p);
      }
      return;
    }
    
    if (p.keyCode === 27) { // ESC
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
      return;
    }
    
    if (p.keyCode === 82) { // R
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        initializeGame();
        gameState.gamePhase = GAME_PHASES.START;
        p.logs.game_info.push({
          data: { phase: "RESTART" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      return;
    }
    
    // Gameplay controls
    if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.controlMode === "HUMAN") {
      handlePlayerInput(p.keyCode, p);
    }
  };
  
  function initializeGame() {
    // Reset game state
    gameState.gamePhase = GAME_PHASES.START;
    gameState.players = [];
    gameState.currentPlayerIndex = 0;
    gameState.turnPhase = "CHOOSE_ACTION";
    gameState.selectedAction = null;
    gameState.selectedRouteIndex = -1;
    gameState.selectedCardIndices = [];
    gameState.cardsDrawnThisTurn = 0;
    gameState.tempDestinations = [];
    gameState.menuSelection = 0;
    gameState.showingDestinations = false;
    gameState.finalRound = false;
    gameState.finalRoundStartPlayer = -1;
    gameState.longestRoutePlayer = -1;
    gameState.longestRouteLength = 0;
    
    // Create players
    gameState.players.push(new Player("You", 0));
    gameState.players.push(new Player("AI 1", 1));
    gameState.players.push(new Player("AI 2", 2));
    
    // Initialize board and cards
    initializeBoard(p);
    initializeCards(p);
  }
  
  function simulateKeyPress(keyCode) {
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: String.fromCharCode(keyCode), keyCode: keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (gameState.currentPlayerIndex === 0) {
        // Human player controlled by AI
        handlePlayerInput(keyCode, p);
      } else {
        // AI players use simpler logic
        executeAITurn(p);
      }
    }
  }
});

// Expose game instance globally
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