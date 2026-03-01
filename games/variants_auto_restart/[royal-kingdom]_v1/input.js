// input.js - Input handling
import { gameState, TILE_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y } from './globals.js';
import { canSwapTiles, swapTiles, findMatches, clearMatches, activateSpecialPiece, findBestMove } from './boardLogic.js';

export function handleKeyPressed(p) { // 'p' (the p5 instance) is now passed to access p.resetGameToStart
  const key = p.key;
  const keyCode = p.keyCode;

  // Log input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  if (gameState.gamePhase === 'START') {
    if (keyCode === 13) { // ENTER
      gameState.gamePhase = 'PLAYING';
      p.logs.game_info.push({
        data: { phase: 'PLAYING' },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else if (gameState.gamePhase === 'PLAYING') {
    if (keyCode === 27) { // ESC
      gameState.gamePhase = 'PAUSED';
      p.logs.game_info.push({
        data: { phase: 'PAUSED' },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (!gameState.isAnimating) {
      handleGameplayInput(keyCode, p);
    }
  } else if (gameState.gamePhase === 'PAUSED') {
    if (keyCode === 27) { // ESC
      gameState.gamePhase = 'PLAYING';
      p.logs.game_info.push({
        data: { phase: 'PLAYING' },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else if (gameState.gamePhase === 'GAME_OVER_WIN' || gameState.gamePhase === 'GAME_OVER_LOSE') {
    if (keyCode === 82) { // R
      // New: Call the comprehensive reset function, which also cancels auto-restart
      if (p && typeof p.resetGameToStart === 'function') {
        p.resetGameToStart();
      } else {
        // Fallback for manual restart if resetGameToStart isn't available (should not happen)
        // Note: This fallback doesn't fully reset all game state variables as per the new requirement,
        // but it maintains existing 'R' key behavior if the new function is somehow missing.
        clearTimeout(gameState.autoRestartTimeoutId); // Still try to clear auto-restart
        gameState.autoRestartScheduled = false;
        gameState.autoRestartTimeoutId = null;

        gameState.gamePhase = 'START';
        gameState.totalScore += gameState.score; // This specific line of old logic is kept for fallback consistency
        p.logs.game_info.push({
          data: { phase: 'START', action: 'manual_restart_fallback' },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }
}

function handleGameplayInput(keyCode, p) {
  const size = gameState.board.length;

  // Arrow keys and WASD
  if (keyCode === 37 || keyCode === 65) { // LEFT or A
    gameState.cursorX = Math.max(0, gameState.cursorX - 1);
  } else if (keyCode === 39 || keyCode === 68) { // RIGHT or D
    gameState.cursorX = Math.min(size - 1, gameState.cursorX + 1);
  } else if (keyCode === 38 || keyCode === 87) { // UP or W
    gameState.cursorY = Math.max(0, gameState.cursorY - 1);
  } else if (keyCode === 40 || keyCode === 83) { // DOWN or S
    gameState.cursorY = Math.min(size - 1, gameState.cursorY + 1);
  } else if (keyCode === 32) { // SPACE
    handleSpacePress(p);
  } else if (keyCode === 72) { // H for hint
    handleHintPress(p);
  }
}

function handleHintPress(p) {
  if (gameState.hintsRemaining > 0) {
    const bestMove = findBestMove();
    if (bestMove) {
      gameState.hintedTiles = [bestMove.tile1, bestMove.tile2];
      gameState.hintsRemaining--;
      
      // Log hint usage
      p.logs.game_info.push({
        data: { 
          action: 'hint_used', 
          expectedScore: bestMove.score,
          tile1: { x: bestMove.tile1.gridX, y: bestMove.tile1.gridY },
          tile2: { x: bestMove.tile2.gridX, y: bestMove.tile2.gridY }
        },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      
      // Clear hint after 3 seconds
      setTimeout(() => {
        gameState.hintedTiles = [];
      }, 3000);
    }
  }
}

function handleSpacePress(p) {
  const currentTile = gameState.board[gameState.cursorY][gameState.cursorX];
  
  if (!currentTile) return;

  // Clear hint visualization when player makes a move
  gameState.hintedTiles = [];

  // If no tile selected, select current
  if (!gameState.selectedTile) {
    gameState.selectedTile = currentTile;
  } else {
    // Try to swap or activate
    if (gameState.selectedTile === currentTile) {
      // Same tile - activate if special
      if (currentTile.specialType) {
        executeMove(() => {
          activateSpecialPiece(currentTile, p);
          currentTile.markedForClear = true;
          gameState.isAnimating = true;
          gameState.comboMultiplier = 1.0;
        }, p);
        gameState.selectedTile = null;
      } else {
        // Deselect
        gameState.selectedTile = null;
      }
    } else if (canSwapTiles(gameState.selectedTile, currentTile)) {
      // Valid swap
      const tile1 = gameState.selectedTile;
      const tile2 = currentTile;
      
      executeMove(() => {
        swapTiles(tile1, tile2);
        
        // Check for matches after a brief delay
        setTimeout(() => {
          const matches = findMatches();
          if (matches.length === 0) {
            // No matches, swap back
            swapTiles(tile1, tile2);
          } else {
            // Valid move
            gameState.comboMultiplier = 1.0;
            clearMatches(matches, p);
            gameState.isAnimating = true;
          }
        }, 200);
      }, p);
      
      gameState.selectedTile = null;
    } else {
      // Invalid swap, just select new tile
      gameState.selectedTile = currentTile;
    }
  }
}

function executeMove(action, p) {
  if (gameState.movesRemaining > 0) {
    gameState.movesRemaining--;
    action();
  }
}

export function setupControlMode() {
  // Expose setControlMode globally for HTML buttons
  // This function will only be called for 'HUMAN' mode now.
  window.setControlMode = (mode) => {
    if (mode === 'HUMAN') {
      gameState.controlMode = 'HUMAN'; // Ensure it's always human
      
      // Update button states: only 'humanModeBtn' exists and should be active
      const humanBtn = document.getElementById('humanModeBtn');
      if (humanBtn) {
        humanBtn.classList.add('active');
      }
    }
  };

  // Ensure the 'Human Mode' button is active on initial load
  const humanBtn = document.getElementById('humanModeBtn');
  if (humanBtn) {
    humanBtn.classList.add('active');
  }
}