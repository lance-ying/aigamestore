// testing.js - Automated testing controllers

import { gameState } from './globals.js';
import { placeMark, isCellEmpty, getEmptyCells } from './board.js';

export function getTestingAction(p) {
  if (gameState.controlMode === "TEST_1") {
    return getBasicTestAction(p);
  } else if (gameState.controlMode === "TEST_2") {
    return getWinTestAction(p);
  }
  return null;
}

function getBasicTestAction(p) {
  // Basic test: navigate around and place marks randomly
  if (gameState.gamePhase !== "PLAYING") {
    if (gameState.gamePhase === "START") {
      return { keyCode: 13 }; // ENTER
    } else if (gameState.gamePhase === "LEVEL_SELECT") {
      return { keyCode: 13 }; // Start level 1
    } else if (gameState.gamePhase.startsWith("GAME_OVER")) {
      if (p.frameCount % 120 === 0) {
        return { keyCode: 82 }; // R to restart
      }
    }
    return null;
  }
  
  if (gameState.currentPlayer !== 1) return null;
  
  // Try to place in current selected cell
  if (p.frameCount % 30 === 0) {
    if (isCellEmpty(gameState.selectedCell.row, gameState.selectedCell.col)) {
      return { keyCode: 32 }; // SPACE
    } else {
      // Move to a random direction
      const dirs = [37, 38, 39, 40]; // Arrow keys
      return { keyCode: dirs[Math.floor(p.random() * dirs.length)] };
    }
  }
  
  return null;
}

function getWinTestAction(p) {
  // Win test: try to win the game
  if (gameState.gamePhase !== "PLAYING") {
    if (gameState.gamePhase === "START") {
      return { keyCode: 13 }; // ENTER
    } else if (gameState.gamePhase === "LEVEL_SELECT") {
      return { keyCode: 13 }; // Start level 1
    } else if (gameState.gamePhase.startsWith("GAME_OVER")) {
      if (p.frameCount % 120 === 0) {
        return { keyCode: 82 }; // R to restart
      }
    }
    return null;
  }
  
  if (gameState.currentPlayer !== 1) return null;
  
  // Find best move
  const bestMove = findBestPlayerMove();
  
  if (bestMove) {
    // Navigate to best move
    if (gameState.selectedCell.row !== bestMove.row || gameState.selectedCell.col !== bestMove.col) {
      if (gameState.selectedCell.row < bestMove.row) {
        return { keyCode: 40 }; // DOWN
      } else if (gameState.selectedCell.row > bestMove.row) {
        return { keyCode: 38 }; // UP
      } else if (gameState.selectedCell.col < bestMove.col) {
        return { keyCode: 39 }; // RIGHT
      } else if (gameState.selectedCell.col > bestMove.col) {
        return { keyCode: 37 }; // LEFT
      }
    } else {
      return { keyCode: 32 }; // SPACE to place
    }
  }
  
  // Fallback: place in any empty cell
  if (p.frameCount % 20 === 0) {
    const empty = getEmptyCells();
    if (empty.length > 0 && isCellEmpty(gameState.selectedCell.row, gameState.selectedCell.col)) {
      return { keyCode: 32 };
    }
  }
  
  return null;
}

function findBestPlayerMove() {
  const empty = getEmptyCells();
  
  // Try to find winning move
  for (const cell of empty) {
    if (wouldWin(cell.row, cell.col, 1)) {
      return cell;
    }
  }
  
  // Try to block AI
  for (const cell of empty) {
    if (wouldWin(cell.row, cell.col, 2)) {
      return cell;
    }
  }
  
  // Return center or first empty
  const center = Math.floor(gameState.currentGridSize / 2);
  if (isCellEmpty(center, center)) {
    return { row: center, col: center };
  }
  
  return empty[0] || null;
}

function wouldWin(row, col, player) {
  gameState.gameBoard[row][col] = player;
  const result = checkForWinAt(row, col, player);
  gameState.gameBoard[row][col] = 0;
  return result;
}

function checkForWinAt(row, col, player) {
  const size = gameState.currentGridSize;
  
  // Check all directions from this cell
  const directions = [
    [0, 1],   // horizontal
    [1, 0],   // vertical
    [1, 1],   // diagonal down-right
    [1, -1]   // diagonal down-left
  ];
  
  for (const [dr, dc] of directions) {
    let count = 1;
    
    // Check forward
    for (let i = 1; i < 3; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
      if (r >= 0 && r < size && c >= 0 && c < size && gameState.gameBoard[r][c] === player) {
        count++;
      } else {
        break;
      }
    }
    
    // Check backward
    for (let i = 1; i < 3; i++) {
      const r = row - dr * i;
      const c = col - dc * i;
      if (r >= 0 && r < size && c >= 0 && c < size && gameState.gameBoard[r][c] === player) {
        count++;
      } else {
        break;
      }
    }
    
    if (count >= 3) return true;
  }
  
  return false;
}