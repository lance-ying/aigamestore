// input.js - Input handling
import { gameState, TILE_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y } from './globals.js';
import { canSwapTiles, swapTiles, findMatches, clearMatches, activateSpecialPiece } from './boardLogic.js';

export function handleKeyPressed(p) {
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
      gameState.gamePhase = 'START';
      gameState.totalScore += gameState.score;
      p.logs.game_info.push({
        data: { phase: 'START' },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
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
  }
}

function handleSpacePress(p) {
  const currentTile = gameState.board[gameState.cursorY][gameState.cursorX];
  
  if (!currentTile) return;

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
  window.setControlMode = (mode) => {
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
                                             mode === 'TEST_1' ? 'test_1_ModeBtn' : 'test_2_ModeBtn');
    if (activeBtn) {
      activeBtn.classList.add('active');
    }
  };
}

export function updateTestMode(p) {
  if (gameState.controlMode === 'TEST_1') {
    // Basic testing - random moves
    if (p.frameCount % 30 === 0 && gameState.gamePhase === 'START') {
      gameState.gamePhase = 'PLAYING';
    }
    if (p.frameCount % 60 === 0 && gameState.gamePhase === 'PLAYING' && !gameState.isAnimating) {
      gameState.cursorX = Math.floor(p.random() * gameState.board.length);
      gameState.cursorY = Math.floor(p.random() * gameState.board.length);
      handleSpacePress(p);
    }
  } else if (gameState.controlMode === 'TEST_2') {
    // Win test - try to make matches
    if (p.frameCount % 30 === 0 && gameState.gamePhase === 'START') {
      gameState.gamePhase = 'PLAYING';
    }
    if (p.frameCount % 40 === 0 && gameState.gamePhase === 'PLAYING' && !gameState.isAnimating) {
      findAndMakeMatch(p);
    }
  }
}

function findAndMakeMatch(p) {
  const size = gameState.board.length;
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size - 1; x++) {
      const tile1 = gameState.board[y][x];
      const tile2 = gameState.board[y][x + 1];
      
      if (canSwapTiles(tile1, tile2)) {
        swapTiles(tile1, tile2);
        const matches = findMatches();
        if (matches.length > 0) {
          gameState.movesRemaining--;
          gameState.comboMultiplier = 1.0;
          clearMatches(matches, p);
          gameState.isAnimating = true;
          swapTiles(tile1, tile2); // Swap back in board
          return;
        }
        swapTiles(tile1, tile2);
      }
    }
  }
  
  // If no match found, just make a random move
  gameState.cursorX = Math.floor(p.random() * size);
  gameState.cursorY = Math.floor(p.random() * size);
  handleSpacePress(p);
}