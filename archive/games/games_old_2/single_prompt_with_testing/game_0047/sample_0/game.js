// game.js
const p5 = window.p5;

import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  gameState,
  PLAYERS
} from './globals.js';
import { initializeBoard, checkWinCondition } from './board.js';
import { 
  renderStartScreen, 
  renderGame, 
  renderPausedOverlay, 
  renderGameOver 
} from './rendering.js';
import { 
  handleGameInput, 
  handleCursorMovement, 
  toggleDropMode 
} from './input.js';
import { executeAIMove } from './ai.js';

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);

    // Initialize p5.logs (write-only, never reset!)
    p.logs = {
      game_info: [],
      player_info: [],
      inputs: []
    };

    // Log initial game state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    // Initialize game
    initializeGame(p);
  };

  p.draw = function() {
    switch (gameState.gamePhase) {
      case "START":
        renderStartScreen(p);
        break;
      case "PLAYING":
        updateGame(p);
        renderGame(p);
        break;
      case "PAUSED":
        renderGame(p);
        renderPausedOverlay(p);
        break;
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        renderGameOver(p);
        break;
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

    // Handle phase controls
    if (p.keyCode === 13 && gameState.gamePhase === "START") { // ENTER
      gameState.gamePhase = "PLAYING";
      p.logs.game_info.push({
        data: { gamePhase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }

    if (p.keyCode === 27) { // ESC - Pause/Unpause
      if (gameState.gamePhase === "PLAYING") {
        gameState.gamePhase = "PAUSED";
        p.logs.game_info.push({
          data: { gamePhase: "PAUSED" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === "PAUSED") {
        gameState.gamePhase = "PLAYING";
        p.logs.game_info.push({
          data: { gamePhase: "PLAYING" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }

    if (p.keyCode === 82) { // R - Restart
      if (gameState.gamePhase === "GAME_OVER_WIN" ||
          gameState.gamePhase === "GAME_OVER_LOSE") {
        resetGame(p);
        gameState.gamePhase = "START";
        p.logs.game_info.push({
          data: { gamePhase: "START" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }

    // Handle gameplay inputs
    if (gameState.gamePhase === "PLAYING") {
      if (gameState.controlMode === "HUMAN") {
        // Cursor movement
        if ([37, 38, 39, 40].includes(p.keyCode)) {
          handleCursorMovement(p);
        }
        
        // Space for selection/confirmation
        if (p.keyCode === 32) {
          handleGameInput(p);
        }
        
        // D for drop mode
        if (p.keyCode === 68) {
          toggleDropMode(p);
        }
      }
    }

    return false; // Prevent default
  };
});

function initializeGame(p) {
  gameState.board = initializeBoard();
  gameState.currentPlayer = PLAYERS.PLAYER1;
  gameState.selectedPiece = null;
  gameState.selectedRow = -1;
  gameState.selectedCol = -1;
  gameState.validMoves = [];
  gameState.player1Hand = [];
  gameState.player2Hand = [];
  gameState.cursorRow = 2;
  gameState.cursorCol = 1;
  gameState.dropMode = false;
  gameState.selectedHandIndex = -1;
  gameState.winner = null;
  gameState.testSequenceIndex = 0;
  gameState.lastLoggedPosition = { row: -1, col: -1 };
}

function updateGame(p) {
  // Execute AI moves if in test mode
  if (gameState.controlMode !== 'HUMAN') {
    executeAIMove(p);
  }
  
  // Check for win condition periodically
  if (p.frameCount % 10 === 0) {
    const winner = checkWinCondition(gameState.board);
    if (winner && gameState.gamePhase === 'PLAYING') {
      gameState.winner = winner;
      gameState.gamePhase = 'GAME_OVER_WIN';
      
      p.logs.game_info.push({
        data: { gamePhase: 'GAME_OVER_WIN', winner: winner },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
}

function resetGame(p) {
  initializeGame(p);
}

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Reset test sequence when changing modes
  if (mode !== 'HUMAN') {
    gameState.testSequenceIndex = 0;
    if (gameState.gamePhase === 'START') {
      gameState.gamePhase = 'PLAYING';
    }
    resetGame(p);
  }
  
  // Update button styles
  document.querySelectorAll('.control-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  if (mode === 'HUMAN') {
    document.getElementById('humanModeBtn').classList.add('active');
  } else if (mode === 'TEST_1') {
    document.getElementById('test_1_ModeBtn').classList.add('active');
  } else if (mode === 'TEST_2') {
    document.getElementById('test_2_ModeBtn').classList.add('active');
  }
};

// Expose globally
window.gameInstance = gameInstance;