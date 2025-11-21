// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { createDeck, shuffleDeck } from './card.js';
import { dealCards, updateCardPositions, checkWinCondition, drawFromStockpile, autoMoveToFoundation, hasValidMoves } from './gameLogic.js';
import { handleKeyPressed, startGame } from './input.js';
import { drawStartScreen, drawPlayingScreen, drawGameOverScreen } from './renderer.js';
import { runTestController } from './testController.js';

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
    p.randomSeed(42);
    
    // Initialize deck
    gameState.deck = shuffleDeck(createDeck(), p);
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: "START", level: gameState.level },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    // Run test controller if in test mode
    if (gameState.controlMode !== "HUMAN") {
      runTestController(p);
    }

    // Render based on game phase
    if (gameState.gamePhase === "START") {
      drawStartScreen(p);
    } else if (gameState.gamePhase === "PLAYING" || gameState.gamePhase === "PAUSED") {
      drawPlayingScreen(p);
      
      // Update timer
      if (gameState.gamePhase === "PLAYING") {
        const currentTime = Date.now();
        if (gameState.lastFrameTime === 0) {
          gameState.lastFrameTime = currentTime;
        }
        
        if (currentTime - gameState.lastFrameTime >= 1000) {
          gameState.timer--;
          gameState.lastFrameTime = currentTime;
          
          // Check time out
          if (gameState.timer <= 0) {
            gameState.gamePhase = "GAME_OVER_LOSE";
            p.logs.game_info.push({
              data: { phase: "GAME_OVER_LOSE", reason: "time_out" },
              framecount: p.frameCount,
              timestamp: Date.now()
            });
          }
        }
        
        // Check win condition
        if (checkWinCondition()) {
          gameState.gamePhase = "GAME_OVER_WIN";
          gameState.score += gameState.timer * 2; // Time bonus
          p.logs.game_info.push({
            data: { phase: "GAME_OVER_WIN", finalScore: gameState.score },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
      }
    } else if (gameState.gamePhase === "GAME_OVER_WIN") {
      drawGameOverScreen(p, true);
    } else if (gameState.gamePhase === "GAME_OVER_LOSE") {
      drawGameOverScreen(p, false);
    }
  };

  p.keyPressed = function() {
    handleKeyPressed(p);
    
    // Special handling for game over states
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === "GAME_OVER_WIN") {
        // Next level
        gameState.level++;
        gameState.timer = Math.max(180, 300 - gameState.level * 20);
        gameState.moves = 0;
        gameState.numStockpileResets = 0;
        gameState.undoStack = [];
        gameState.lastFrameTime = 0;
        
        // Reset and deal new game
        gameState.deck = shuffleDeck(createDeck(), p);
        gameState.tableauPiles = [[], [], [], [], [], [], []];
        gameState.foundationPiles = [[], [], [], []];
        gameState.stockpile = [];
        gameState.wastePile = [];
        
        dealCards(p);
        gameState.gamePhase = "PLAYING";
        
        p.logs.game_info.push({
          data: { phase: "PLAYING", level: gameState.level },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === "START") {
        // Initial deal
        gameState.deck = shuffleDeck(createDeck(), p);
        gameState.tableauPiles = [[], [], [], [], [], [], []];
        gameState.foundationPiles = [[], [], [], []];
        gameState.stockpile = [];
        gameState.wastePile = [];
        gameState.lastFrameTime = 0;
        
        dealCards(p);
        startGame(p);
      }
    }
  };
});

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
  
  const activeBtn = document.getElementById(mode === 'HUMAN' ? 'humanModeBtn' : 
                                            mode === 'TEST_1' ? 'test_1_ModeBtn' : 
                                            'test_2_ModeBtn');
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};