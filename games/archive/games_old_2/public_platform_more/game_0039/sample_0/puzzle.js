// Puzzle generation and validation
import { BOARD_ROWS, BOARD_COLS, gameState } from './globals.js';
import { createRandomPieces } from './pieces.js';

export function generatePuzzle(level) {
  const pieceCount = Math.min(3 + Math.floor(level / 3), 5);
  const targetSize = Math.min(8 + level * 2, 24);
  
  // Create pieces
  const pieces = createRandomPieces(pieceCount, level);
  
  // Generate target area (rectangular for simplicity)
  const targetCells = generateTargetArea(targetSize, level);
  
  // Initialize board
  const board = [];
  for (let i = 0; i < BOARD_ROWS; i++) {
    board[i] = [];
    for (let j = 0; j < BOARD_COLS; j++) {
      board[i][j] = null;
    }
  }
  
  return {
    pieces,
    targetCells,
    board
  };
}

function generateTargetArea(size, level) {
  const cells = [];
  
  // Create a connected region
  const startRow = Math.floor(BOARD_ROWS / 2);
  const startCol = Math.floor(BOARD_COLS / 2) - 2;
  
  // Generate rectangular or L-shaped areas
  const width = Math.min(Math.ceil(Math.sqrt(size * 1.5)), BOARD_COLS - 2);
  const height = Math.ceil(size / width);
  
  for (let row = 0; row < height && cells.length < size; row++) {
    for (let col = 0; col < width && cells.length < size; col++) {
      const y = startRow - Math.floor(height / 2) + row;
      const x = startCol + col;
      if (y >= 0 && y < BOARD_ROWS && x >= 0 && x < BOARD_COLS) {
        cells.push({ x, y });
      }
    }
  }
  
  return cells;
}

export function isValidPlacement(piece, board, targetCells) {
  const cells = piece.getAbsoluteCells();
  
  // Check if all cells are within bounds
  for (const cell of cells) {
    if (cell.x < 0 || cell.x >= BOARD_COLS || cell.y < 0 || cell.y >= BOARD_ROWS) {
      return false;
    }
  }
  
  // Check if all cells are on target area
  for (const cell of cells) {
    const isTarget = targetCells.some(tc => tc.x === cell.x && tc.y === cell.y);
    if (!isTarget) {
      return false;
    }
  }
  
  // Check for overlaps with placed pieces
  for (const cell of cells) {
    if (board[cell.y][cell.x] !== null && board[cell.y][cell.x] !== piece.id) {
      return false;
    }
  }
  
  return true;
}

export function placePiece(piece, board) {
  const cells = piece.getAbsoluteCells();
  for (const cell of cells) {
    board[cell.y][cell.x] = piece.id;
  }
  piece.placed = true;
}

export function removePiece(piece, board) {
  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let col = 0; col < BOARD_COLS; col++) {
      if (board[row][col] === piece.id) {
        board[row][col] = null;
      }
    }
  }
  piece.placed = false;
}

export function isPuzzleComplete(board, targetCells) {
  for (const cell of targetCells) {
    if (board[cell.y][cell.x] === null) {
      return false;
    }
  }
  return true;
}

export function calculateGems(elapsedTime, level) {
  const baseGems = 10 + level * 2;
  const timeBonus = Math.max(0, Math.floor((60000 - elapsedTime) / 1000));
  return baseGems + timeBonus;
}