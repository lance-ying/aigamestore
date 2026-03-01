// game.js - Main game file
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { initializeLevel, findMatches, clearMatches, applyGravity, refillBoard, 
         removeMarkedTiles, checkObjectivesComplete, isStable } from './boardLogic.js';
import { handleKeyPressed, setupControlMode, updateTestMode } from './input.js';
import { renderStartScreen, renderGame, renderGameOver } from './rendering.js';

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
    p.randomSeed(42);
    p.frameRate(60);
    
    // Initialize control mode
    setupControlMode();
    
    // Initialize first level
    initializeLevel(1, p);
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: 'START', level: 1 },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    // Update test mode
    if (gameState.controlMode !== 'HUMAN') {
      updateTestMode(p);
    }

    // Render based on phase
    if (gameState.gamePhase === 'START') {
      renderStartScreen(p);
    } else if (gameState.gamePhase === 'PLAYING' || gameState.gamePhase === 'PAUSED') {
      // Update entities
      gameState.entities.forEach(tile => tile.update());
      
      // Handle animations and cascades
      if (gameState.isAnimating) {
        handleAnimations(p);
      }
      
      // Check win/lose conditions
      if (!gameState.isAnimating && gameState.movesRemaining === 0 && !checkObjectivesComplete()) {
        gameState.gamePhase = 'GAME_OVER_LOSE';
        p.logs.game_info.push({
          data: { phase: 'GAME_OVER_LOSE', finalScore: gameState.score },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (!gameState.isAnimating && checkObjectivesComplete() && gameState.movesRemaining >= 0) {
        // Add bonus
        const bonus = gameState.movesRemaining * 20;
        gameState.score += bonus;
        
        if (gameState.currentLevel < 5) {
          gameState.gamePhase = 'GAME_OVER_WIN';
          p.logs.game_info.push({
            data: { phase: 'GAME_OVER_WIN', finalScore: gameState.score, level: gameState.currentLevel },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        } else {
          gameState.gamePhase = 'GAME_OVER_WIN';
          gameState.totalScore += gameState.score;
          p.logs.game_info.push({
            data: { phase: 'GAME_OVER_WIN', finalScore: gameState.score, totalScore: gameState.totalScore },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
      }
      
      renderGame(p);
    } else if (gameState.gamePhase === 'GAME_OVER_WIN' || gameState.gamePhase === 'GAME_OVER_LOSE') {
      renderGameOver(p);
      // Auto-restart logic after 1 second
      if (!gameState.autoRestartScheduled) {
        gameState.autoRestartScheduled = true;
        gameState.autoRestartTimeoutId = setTimeout(() => {
          // Only auto-restart if still in game over phase (user hasn't pressed ENTER for next level or R to restart)
          if (gameState.gamePhase === 'GAME_OVER_WIN' || gameState.gamePhase === 'GAME_OVER_LOSE') {
            p.restartGame("PLAYING"); // Changed: Auto-restart directly to PLAYING phase
          }
          gameState.autoRestartScheduled = false;
          gameState.autoRestartTimeoutId = null;
        }, 1000); // 1 second delay
      }
    }
    
    // Log player info periodically
    if (p.frameCount % 60 === 0 && gameState.gamePhase === 'PLAYING') {
      p.logs.player_info.push({
        screen_x: gameState.cursorX,
        screen_y: gameState.cursorY,
        game_x: gameState.cursorX,
        game_y: gameState.cursorY,
        framecount: p.frameCount
      });
    }
  };

  function handleAnimations(p) {
    // Remove marked tiles that are fully faded
    removeMarkedTiles();
    
    // Check if all animations are done
    if (isStable()) {
      // Apply gravity
      const moved = applyGravity();
      if (moved) {
        return; // Wait for gravity to settle
      }
      
      // Refill board
      const refilled = refillBoard(p);
      if (refilled) {
        return; // Wait for new tiles to settle
      }
      
      // Check for new matches (cascades)
      const matches = findMatches();
      if (matches.length > 0) {
        gameState.comboMultiplier += 0.25;
        clearMatches(matches, p);
        return;
      }
      
      // No more matches, animation complete
      gameState.isAnimating = false;
      gameState.comboMultiplier = 1.0;
    }
  }

  p.keyPressed = function() {
    handleKeyPressed(p);
    return false; // Prevent default
  };

  // Unified restart function for both manual and automatic restarts
  // Added optional targetPhase parameter, defaults to "START" for manual 'R' key behavior
  p.restartGame = function(targetPhase = "START") {
    // Clear any pending auto-restart timeout if this is a manual restart
    if (gameState.autoRestartTimeoutId) {
      clearTimeout(gameState.autoRestartTimeoutId);
      gameState.autoRestartTimeoutId = null;
    }
    gameState.autoRestartScheduled = false;

    // Accumulate score before resetting current level score (matches existing manual R key behavior)
    gameState.totalScore += gameState.score; 

    gameState.gamePhase = targetPhase; // Changed: Use targetPhase
    gameState.score = 0;
    gameState.currentLevel = 1;
    gameState.movesRemaining = 0; // Will be set by initializeLevel
    gameState.cursorX = 0;
    gameState.cursorY = 0;
    gameState.selectedTile = null;
    gameState.isAnimating = false;
    gameState.animationQueue = [];
    gameState.comboCounting = 0;
    gameState.comboMultiplier = 1.0;
    gameState.entities = []; // Clear current entities
    gameState.board = []; // Clear current board

    initializeLevel(1, p); // Re-initialize level 1
    p.logs.game_info.push({
      data: { phase: targetPhase, level: 1, resetReason: 'auto/manual restart' }, // Changed: Log targetPhase
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

}, document.body);

// Expose game instance and state getter
window.gameInstance = gameInstance;
// Expose level loading for dev mode
window.loadLevel = function(levelNum) {
  const state = window.getGameState ? window.getGameState() : (window.gameState || (window.gameInstance && window.gameInstance.gameState));
  if (state) {
    state.currentLevel = levelNum;
    // Use the unified restart function if available, otherwise fallback
    if (gameInstance && typeof gameInstance.restartGame === 'function') {
      gameInstance.restartGame(); // This will reset to level 1, then we can set currentLevel
      state.currentLevel = levelNum; // Set back to desired level
      initializeLevel(levelNum, gameInstance); // Re-initialize with correct level
      state.gamePhase = "PLAYING";
    } else if (typeof resetGame === 'function') { // Old fallback, less ideal
      resetGame();
    }
    if (typeof startGame === 'function') { // Old fallback, less ideal
      startGame();
    } else if (state.gamePhase !== undefined) {
      state.gamePhase = "PLAYING";
    }
  }
};
window.getGameState = function() {
  return gameState;
};

// Handle game over for level progression (ENTER key)
document.addEventListener('keydown', (e) => {
  if (gameState.gamePhase === 'GAME_OVER_WIN' && e.keyCode === 13 && gameState.currentLevel < 5) {
    // If user presses ENTER to go to next level, cancel any pending auto-restart
    if (gameState.autoRestartTimeoutId) {
      clearTimeout(gameState.autoRestartTimeoutId);
      gameState.autoRestartTimeoutId = null;
    }
    gameState.autoRestartScheduled = false;

    // ENTER to next level
    gameState.currentLevel++;
    initializeLevel(gameState.currentLevel, gameInstance);
    gameState.gamePhase = 'PLAYING';
    gameInstance.logs.game_info.push({
      data: { phase: 'PLAYING', level: gameState.currentLevel },
      framecount: gameInstance.frameCount,
      timestamp: Date.now()
    });
  }
});