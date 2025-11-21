// game.js - Main game file
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { createDeck, shuffleDeck } from './card.js';
import { dealCards, updateCardPositions, checkWinCondition } from './gameLogic.js';
import { drawStartScreen, drawPlayingScreen, drawGameOverScreen, drawPausedOverlay } from './rendering.js';
import { handleKeyPressed, handleMousePressed, handleMouseDragged, handleMouseReleased } from './input.js';
import { runAutomatedTest, resetTestState } from './testing.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
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
      data: { gamePhase: 'START' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Create deck
    gameState.deck = createDeck(p);
    gameState.entities = [...gameState.deck];
  };
  
  p.draw = function() {
    const currentTime = Date.now();
    const deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
    gameState.lastFrameTime = currentTime;
    
    // Update card animations
    gameState.deck.forEach(card => card.update());
    
    // Handle time-based logic
    if (gameState.gamePhase === 'PLAYING' && gameState.currentLevel >= 3 && gameState.timeRemaining !== null) {
      gameState.timeRemaining -= deltaTime;
      if (gameState.timeRemaining <= 0) {
        gameState.timeRemaining = 0;
        gameState.gamePhase = 'GAME_OVER_LOSE';
        p.logs.game_info.push({
          data: { gamePhase: 'GAME_OVER_LOSE', reason: 'timeout' },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    // Check win condition
    if (gameState.gamePhase === 'PLAYING' && checkWinCondition()) {
      const timeBonus = gameState.timeRemaining > 0 ? Math.floor(gameState.timeRemaining * 5) : 0;
      gameState.score += 500 + timeBonus;
      gameState.gamePhase = 'GAME_OVER_WIN';
      p.logs.game_info.push({
        data: { gamePhase: 'GAME_OVER_WIN', finalScore: gameState.score },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    // Run automated tests
    runAutomatedTest();
    
    // Render based on game phase
    if (gameState.gamePhase === 'START') {
      drawStartScreen(p);
    } else if (gameState.gamePhase === 'PLAYING') {
      drawPlayingScreen(p);
    } else if (gameState.gamePhase === 'PAUSED') {
      drawPlayingScreen(p);
      drawPausedOverlay(p);
    } else if (gameState.gamePhase === 'GAME_OVER_WIN') {
      drawGameOverScreen(p, true);
    } else if (gameState.gamePhase === 'GAME_OVER_LOSE') {
      drawGameOverScreen(p, false);
    }
    
    // Log player info periodically
    if (p.frameCount % 60 === 0 && gameState.gamePhase === 'PLAYING') {
      p.logs.player_info.push({
        screen_x: 0,
        screen_y: 0,
        game_x: 0,
        game_y: 0,
        framecount: p.frameCount
      });
    }
  };
  
  p.keyPressed = function() {
    handleKeyPressed(p);
  };
  
  p.mousePressed = function() {
    handleMousePressed(p);
  };
  
  p.mouseDragged = function() {
    handleMouseDragged(p);
  };
  
  p.mouseReleased = function() {
    handleMouseReleased(p);
  };
});

// Expose globally
window.gameInstance = gameInstance;

// Set control mode function
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) btn.classList.remove('active');
  });
  
  if (mode === 'HUMAN') {
    document.getElementById('humanModeBtn')?.classList.add('active');
  } else if (mode === 'TEST_1') {
    document.getElementById('test_1_ModeBtn')?.classList.add('active');
  } else if (mode === 'TEST_2') {
    document.getElementById('test_2_ModeBtn')?.classList.add('active');
  }
  
  resetTestState();
};

// Initialize level
export function initializeLevel() {
  gameState.gamePhase = 'PLAYING';
  gameState.score = 0;
  gameState.moves = 0;
  gameState.selectedCards = null;
  gameState.selectedSource = null;
  gameState.hintActive = false;
  gameState.undoStack = [];
  gameState.wasteRecycled = false;
  gameState.levelStartTime = Date.now();
  
  // Set time limit based on level
  if (gameState.currentLevel === 3) {
    gameState.timeRemaining = 600; // 10 minutes
  } else if (gameState.currentLevel === 4) {
    gameState.timeRemaining = 900; // 15 minutes
  } else {
    gameState.timeRemaining = null;
  }
  
  // Shuffle and deal
  gameState.deck = shuffleDeck(gameState.deck, gameInstance);
  gameState.stockPile = [];
  gameState.wastePile = [];
  gameState.foundations = [[], [], [], []];
  gameState.tableau = [[], [], [], [], [], [], []];
  
  dealCards();
  
  gameInstance.logs.game_info.push({
    data: { gamePhase: 'PLAYING', level: gameState.currentLevel },
    framecount: gameInstance.frameCount,
    timestamp: Date.now()
  });
  
  resetTestState();
}