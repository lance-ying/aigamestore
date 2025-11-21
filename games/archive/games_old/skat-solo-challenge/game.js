// game.js - Main game file

import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { initializeGame, updateBidding, updateAIGameTypeSelection, updateAITurn } from './gameLogic.js';
import { handleKeyPressed } from './input.js';
import { updateTestController } from './testController.js';
import {
  drawStartScreen,
  drawGameOverScreen,
  drawPausedIndicator,
  drawHand,
  drawSkat,
  drawTrick,
  drawUI,
  drawBiddingUI,
  drawGameTypeSelectionUI,
  drawDiscardUI,
  drawRoundEnd,
  drawLevelComplete
} from './rendering.js';

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
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize player entity for logging
    gameState.player = {
      screenX: CANVAS_WIDTH / 2,
      screenY: CANVAS_HEIGHT - 50,
      gameX: CANVAS_WIDTH / 2,
      gameY: CANVAS_HEIGHT - 50,
      cardPlayed: null
    };
    
    gameState.entities.push(gameState.player);
    
    // Log initial game state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    p.background(30, 80, 50);
    
    if (gameState.gamePhase === "START") {
      drawStartScreen(p);
    } else if (gameState.gamePhase === "GAME_OVER_WIN") {
      drawGameOverScreen(p, true);
    } else if (gameState.gamePhase === "GAME_OVER_LOSE") {
      drawGameOverScreen(p, false);
    } else if (gameState.gamePhase === "PLAYING") {
      // Update test controller if in test mode
      if (gameState.controlMode !== "HUMAN") {
        updateTestController(p);
      }
      
      // Game rendering
      drawUI(p);
      
      if (gameState.biddingPhase) {
        drawBiddingUI(p);
        updateBidding(p);
      } else if (!gameState.skatTaken && gameState.declarer >= 0) {
        if (gameState.declarer !== 0) {
          updateAIGameTypeSelection();
        } else {
          // Show Skat
          drawSkat(p, gameState.skatCards, false);
          p.fill(255);
          p.textAlign(p.CENTER);
          p.textSize(14);
          p.text("Press SHIFT to take Skat", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
        }
      } else if (gameState.cardsToDiscard > 0) {
        drawDiscardUI(p);
      } else if (!gameState.gameType && gameState.declarer >= 0) {
        if (gameState.declarer !== 0) {
          updateAIGameTypeSelection();
        } else {
          drawGameTypeSelectionUI(p);
        }
      } else if (gameState.gameType && !gameState.roundComplete) {
        // Active gameplay
        drawTrick(p, gameState.currentTrick);
        
        // Draw hands
        drawHand(p, gameState.playerHands[0], 0, gameState.selectedCardIndex);
        drawHand(p, gameState.playerHands[1], 1);
        drawHand(p, gameState.playerHands[2], 2);
        
        // Update AI turns
        updateAITurn(p);
      } else if (gameState.roundComplete) {
        // Show round results
        if (gameState.roundsInLevel >= 2) {
          drawLevelComplete(p);
        } else {
          drawRoundEnd(p);
        }
      }
      
      // Log player info periodically
      if (p.frameCount % 10 === 0 && gameState.player) {
        p.logs.player_info.push({
          screen_x: gameState.player.screenX,
          screen_y: gameState.player.screenY,
          game_x: gameState.player.gameX,
          game_y: gameState.player.gameY,
          framecount: p.frameCount
        });
      }
    } else if (gameState.gamePhase === "PAUSED") {
      // Draw paused state
      drawUI(p);
      drawPausedIndicator(p);
    }
  };
  
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p);
    }
    return false;
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  document.querySelectorAll('.control-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  if (mode === "HUMAN") {
    document.getElementById('humanModeBtn').classList.add('active');
  } else if (mode === "TEST_1") {
    document.getElementById('test_1_ModeBtn').classList.add('active');
  } else if (mode === "TEST_2") {
    document.getElementById('test_2_ModeBtn').classList.add('active');
  }
  
  // Initialize game if not already started
  if (gameState.gamePhase === "START" || gameState.deck.length === 0) {
    initializeGame(gameInstance);
  }
};

// Initialize game on load
initializeGame(gameInstance);