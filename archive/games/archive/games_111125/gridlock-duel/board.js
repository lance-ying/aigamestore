// board.js - Board management and game logic

import { gameState, CELL_STATE, TURN } from './globals.js';

export function initializeBoard(size) {
  const board = [];
  for (let i = 0; i < size; i++) {
    board[i] = [];
    for (let j = 0; j < size; j++) {
      board[i][j] = CELL_STATE.EMPTY;
    }
  }
  return board;
}

export function isCellEmpty(row, col) {
  if (row < 0 || row >= gameState.boardSize || col < 0 || col >= gameState.boardSize) {
    return false;
  }
  return gameState.board[row][col] === CELL_STATE.EMPTY;
}

export function placeMarkOnBoard(row, col, mark) {
  if (isCellEmpty(row, col)) {
    gameState.board[row][col] = mark;
    return true;
  }
  return false;
}

export function checkWinner() {
  const size = gameState.boardSize;
  const winLen = gameState.winLength;
  const board = gameState.board;
  
  // Check horizontal lines
  for (let row = 0; row < size; row++) {
    for (let col = 0; col <= size - winLen; col++) {
      const mark = board[row][col];
      if (mark !== CELL_STATE.EMPTY) {
        let win = true;
        for (let i = 1; i < winLen; i++) {
          if (board[row][col + i] !== mark) {
            win = false;
            break;
          }
        }
        if (win) {
          return {
            winner: mark,
            line: { type: 'horizontal', row, startCol: col, endCol: col + winLen - 1 }
          };
        }
      }
    }
  }
  
  // Check vertical lines
  for (let col = 0; col < size; col++) {
    for (let row = 0; row <= size - winLen; row++) {
      const mark = board[row][col];
      if (mark !== CELL_STATE.EMPTY) {
        let win = true;
        for (let i = 1; i < winLen; i++) {
          if (board[row + i][col] !== mark) {
            win = false;
            break;
          }
        }
        if (win) {
          return {
            winner: mark,
            line: { type: 'vertical', col, startRow: row, endRow: row + winLen - 1 }
          };
        }
      }
    }
  }
  
  // Check diagonal (top-left to bottom-right)
  for (let row = 0; row <= size - winLen; row++) {
    for (let col = 0; col <= size - winLen; col++) {
      const mark = board[row][col];
      if (mark !== CELL_STATE.EMPTY) {
        let win = true;
        for (let i = 1; i < winLen; i++) {
          if (board[row + i][col + i] !== mark) {
            win = false;
            break;
          }
        }
        if (win) {
          return {
            winner: mark,
            line: { type: 'diagonal-down', startRow: row, startCol: col, endRow: row + winLen - 1, endCol: col + winLen - 1 }
          };
        }
      }
    }
  }
  
  // Check diagonal (top-right to bottom-left)
  for (let row = 0; row <= size - winLen; row++) {
    for (let col = winLen - 1; col < size; col++) {
      const mark = board[row][col];
      if (mark !== CELL_STATE.EMPTY) {
        let win = true;
        for (let i = 1; i < winLen; i++) {
          if (board[row + i][col - i] !== mark) {
            win = false;
            break;
          }
        }
        if (win) {
          return {
            winner: mark,
            line: { type: 'diagonal-up', startRow: row, startCol: col, endRow: row + winLen - 1, endCol: col - winLen + 1 }
          };
        }
      }
    }
  }
  
  return null;
}

export function isBoardFull() {
  for (let i = 0; i < gameState.boardSize; i++) {
    for (let j = 0; j < gameState.boardSize; j++) {
      if (gameState.board[i][j] === CELL_STATE.EMPTY) {
        return false;
      }
    }
  }
  return true;
}

export function getEmptyCells() {
  const emptyCells = [];
  for (let i = 0; i < gameState.boardSize; i++) {
    for (let j = 0; j < gameState.boardSize; j++) {
      if (gameState.board[i][j] === CELL_STATE.EMPTY) {
        emptyCells.push([i, j]);
      }
    }
  }
  return emptyCells;
}