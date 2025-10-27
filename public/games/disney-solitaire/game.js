import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Card } from './card.js';
import { createDeck } from './deck.js';
import { createTableauLayout, setupTableau, updateCoveredStatus } from './tableau.js';
import { selectCard, drawFromStock, activatePowerUp, updateSelectableElements } from './gameplay.js';
import { getTestingAction, executeTestingAction } from './testing.js';
import { drawBackground, drawUI, drawStockPile, drawDiscardPile, drawTableau, drawStartScreen, drawLevelComplete, drawGameOver } from './rendering.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize the logs
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize game state
    gameState.gamePhase = 'START';
    gameState.controlMode = 'HUMAN';
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    if (gameState.gamePhase === 'START') {
      drawStartScreen(p);
    } else if (gameState.gamePhase === 'PLAYING') {
      drawBackground(p);
      drawTableau(p);
      drawStockPile(p);
      drawDiscardPile(p);
      drawUI(p);
      
      // Update animations
      for (let i = gameState.animatingCards.length - 1; i >= 0; i--) {
        const animInfo = gameState.animatingCards[i];
        animInfo.card.update();
        if (!animInfo.card.isAnimating) {
          if (animInfo.onComplete) {
            animInfo.onComplete();
          }
          gameState.animatingCards.splice(i, 1);
        }
      }
      
      // Update selectable elements
      updateSelectableElements(gameState);
      
      // Testing mode
      if (gameState.controlMode !== 'HUMAN' && gameState.animatingCards.length === 0) {
        if (p.frameCount % 15 === 0) { // Slow down testing
          const action = getTestingAction(p);
          executeTestingAction(action, p);
        }
      }
    } else if (gameState.gamePhase === 'PAUSED') {
      drawBackground(p);
      drawTableau(p);
      drawStockPile(p);
      drawDiscardPile(p);
      drawUI(p);
    } else if (gameState.gamePhase === 'LEVEL_COMPLETE') {
      drawBackground(p);
      drawTableau(p);
      drawStockPile(p);
      drawDiscardPile(p);
      drawLevelComplete(p);
    } else if (gameState.gamePhase === 'GAME_OVER_WIN') {
      drawBackground(p);
      drawGameOver(p, true);
    } else if (gameState.gamePhase === 'GAME_OVER_LOSE') {
      drawBackground(p);
      drawTableau(p);
      drawStockPile(p);
      drawDiscardPile(p);
      drawGameOver(p, false);
    }
  };
  
  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: 'keyPressed',
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    if (gameState.controlMode !== 'HUMAN') return;
    
    // ENTER - Start game
    if (p.keyCode === 13) {
      if (gameState.gamePhase === 'START') {
        startLevel(p, 1);
      } else if (gameState.gamePhase === 'LEVEL_COMPLETE') {
        gameState.currentLevel++;
        if (gameState.currentLevel <= gameState.maxLevel) {
          startLevel(p, gameState.currentLevel);
        }
      }
    }
    
    // ESC - Pause/Unpause
    if (p.keyCode === 27) {
      if (gameState.gamePhase === 'PLAYING') {
        gameState.gamePhase = 'PAUSED';
        p.logs.game_info.push({
          data: { phase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === 'PAUSED') {
        gameState.gamePhase = 'PLAYING';
        p.logs.game_info.push({
          data: { phase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    // R - Restart
    if (p.keyCode === 82) {
      gameState.gamePhase = 'START';
      gameState.currentLevel = 1;
      gameState.score = 0;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    if (gameState.gamePhase === 'PLAYING') {
      // Arrow keys - Navigate
      if (p.keyCode === 37 || p.keyCode === 38) {
        // Left or Up
        gameState.highlightedIndex = Math.max(0, gameState.highlightedIndex - 1);
      } else if (p.keyCode === 39 || p.keyCode === 40) {
        // Right or Down
        gameState.highlightedIndex = Math.min(
          gameState.selectableElements.length - 1,
          gameState.highlightedIndex + 1
        );
      }
      
      // Space - Select
      if (p.keyCode === 32) {
        const selected = gameState.selectableElements[gameState.highlightedIndex];
        if (selected) {
          if (selected.type === 'tableau') {
            selectCard(selected.index, p);
          } else if (selected.type === 'stock') {
            drawFromStock(p);
          } else if (selected.type === 'powerup') {
            activatePowerUp(p);
          }
        }
      }
      
      // Z - Power-up
      if (p.keyCode === 90) {
        activatePowerUp(p);
      }
    }
  };
  
  function startLevel(p, level) {
    gameState.currentLevel = level;
    gameState.gamePhase = 'PLAYING';
    gameState.powerUpsRemaining = 1;
    gameState.chain = 0;
    gameState.highlightedIndex = 0;
    gameState.animatingCards = [];
    gameState.lastMoves = [];
    gameState.movesWithoutTableau = 0;
    
    // Create and shuffle deck
    const deck = createDeck(p);
    
    // Setup tableau
    const layout = createTableauLayout(level);
    setupTableau(deck, layout, gameState);
    
    // Setup stock and discard
    gameState.stockPile = deck.slice(layout.length);
    for (let card of gameState.stockPile) {
      card.x = CANVAS_WIDTH / 2 - 80;
      card.y = CANVAS_HEIGHT / 2 + 100;
      card.targetX = card.x;
      card.targetY = card.y;
    }
    
    // Initial discard card
    if (gameState.stockPile.length > 0) {
      gameState.discardPile = gameState.stockPile.pop();
      gameState.discardPile.isFaceUp = true;
      gameState.discardPile.x = CANVAS_WIDTH / 2 + 80;
      gameState.discardPile.y = CANVAS_HEIGHT / 2 + 100;
      gameState.discardPile.targetX = gameState.discardPile.x;
      gameState.discardPile.targetY = gameState.discardPile.y;
    }
    
    updateSelectableElements(gameState);
    
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, level: gameState.currentLevel },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
});

// Expose the game instance globally
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
  
  const activeBtn = document.getElementById(mode === 'HUMAN' ? 'humanModeBtn' : mode.toLowerCase() + 'ModeBtn');
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};