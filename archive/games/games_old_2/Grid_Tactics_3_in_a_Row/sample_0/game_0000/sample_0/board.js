// board.js - Game board management

import { gameState, CELL_EMPTY, CELL_X, CELL_O } from './globals.js';

export function initializeBoard(size) {
  gameState.gameBoard = [];
  for (let i = 0; i < size; i++) {
    gameState.gameBoard[i] = [];
    for (let j = 0; j < size; j++) {
      gameState.gameBoard[i][j] = CELL_EMPTY;
    }
  }
  gameState.currentGridSize = size;
  gameState.selectedCell = { row: 0, col: 0 };
  gameState.turnCount = 0;
  gameState.lastWinningLine = null;
  gameState.winner = null;
  gameState.cellAnimations = [];
  gameState.winningLineFlash = 0;
}

export function isCellEmpty(row, col) {
  if (row < 0 || row >= gameState.currentGridSize || col < 0 || col >= gameState.currentGridSize) {
    return false;
  }
  return gameState.gameBoard[row][col] === CELL_EMPTY;
}

export function placeMark(row, col, player) {
  if (isCellEmpty(row, col)) {
    gameState.gameBoard[row][col] = player;
    gameState.turnCount++;
    
    // Add animation
    gameState.cellAnimations.push({
      row,
      col,
      scale: 0,
      targetScale: 1,
      player
    });
    
    return true;
  }
  return false;
}

export function checkWinner() {
  const size = gameState.currentGridSize;
  const board = gameState.gameBoard;
  
  // Check all possible 3-in-a-row combinations
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const cell = board[row][col];
      if (cell === CELL_EMPTY) continue;
      
      // Check horizontal
      if (col <= size - 3) {
        if (board[row][col + 1] === cell && board[row][col + 2] === cell) {
          return {
            winner: cell,
            line: [
              { row, col },
              { row, col: col + 1 },
              { row, col: col + 2 }
            ]
          };
        }
      }
      
      // Check vertical
      if (row <= size - 3) {
        if (board[row + 1][col] === cell && board[row + 2][col] === cell) {
          return {
            winner: cell,
            line: [
              { row, col },
              { row: row + 1, col },
              { row: row + 2, col }
            ]
          };
        }
      }
      
      // Check diagonal (down-right)
      if (row <= size - 3 && col <= size - 3) {
        if (board[row + 1][col + 1] === cell && board[row + 2][col + 2] === cell) {
          return {
            winner: cell,
            line: [
              { row, col },
              { row: row + 1, col: col + 1 },
              { row: row + 2, col: col + 2 }
            ]
          };
        }
      }
      
      // Check diagonal (down-left)
      if (row <= size - 3 && col >= 2) {
        if (board[row + 1][col - 1] === cell && board[row + 2][col - 2] === cell) {
          return {
            winner: cell,
            line: [
              { row, col },
              { row: row + 1, col: col - 1 },
              { row: row + 2, col: col - 2 }
            ]
          };
        }
      }
    }
  }
  
  return null;
}

export function isBoardFull() {
  for (let i = 0; i < gameState.currentGridSize; i++) {
    for (let j = 0; j < gameState.currentGridSize; j++) {
      if (gameState.gameBoard[i][j] === CELL_EMPTY) {
        return false;
      }
    }
  }
  return true;
}

export function getEmptyCells() {
  const empty = [];
  for (let i = 0; i < gameState.currentGridSize; i++) {
    for (let j = 0; j < gameState.currentGridSize; j++) {
      if (gameState.gameBoard[i][j] === CELL_EMPTY) {
        empty.push({ row: i, col: j });
      }
    }
  }
  return empty;
}