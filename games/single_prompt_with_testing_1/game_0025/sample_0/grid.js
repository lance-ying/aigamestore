import { gameState, GAME_CONFIG } from './globals.js';

export class Cell {
  constructor(row, col) {
    this.row = row;
    this.col = col;
    this.isMine = false;
    this.adjacentMines = 0;
    this.revealed = false;
    this.flagged = false;
  }
}

export function initializeGrid() {
  const { rows, cols } = GAME_CONFIG;
  const grid = [];
  
  for (let row = 0; row < rows; row++) {
    grid[row] = [];
    for (let col = 0; col < cols; col++) {
      grid[row][col] = new Cell(row, col);
    }
  }
  
  return grid;
}

export function placeMines(grid, excludeRow, excludeCol, mineCount) {
  const { rows, cols } = GAME_CONFIG;
  let minesPlaced = 0;
  
  // Get list of valid positions (excluding first click and adjacent)
  const validPositions = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Exclude the clicked cell and its neighbors
      const rowDiff = Math.abs(row - excludeRow);
      const colDiff = Math.abs(col - excludeCol);
      if (rowDiff <= 1 && colDiff <= 1) continue;
      validPositions.push({ row, col });
    }
  }
  
  // Shuffle and place mines
  while (minesPlaced < mineCount && validPositions.length > 0) {
    const index = Math.floor(Math.random() * validPositions.length);
    const pos = validPositions.splice(index, 1)[0];
    grid[pos.row][pos.col].isMine = true;
    minesPlaced++;
  }
  
  // Calculate adjacent mine counts
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (!grid[row][col].isMine) {
        grid[row][col].adjacentMines = countAdjacentMines(grid, row, col);
      }
    }
  }
}

export function countAdjacentMines(grid, row, col) {
  const { rows, cols } = GAME_CONFIG;
  let count = 0;
  
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const newRow = row + dr;
      const newCol = col + dc;
      if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
        if (grid[newRow][newCol].isMine) count++;
      }
    }
  }
  
  return count;
}

export function revealCell(grid, row, col, p) {
  const { rows, cols } = GAME_CONFIG;
  
  if (row < 0 || row >= rows || col < 0 || col >= cols) return 0;
  if (grid[row][col].revealed || grid[row][col].flagged) return 0;
  
  grid[row][col].revealed = true;
  let revealedCount = 1;
  
  // If it's a mine, game over
  if (grid[row][col].isMine) {
    return -1;
  }
  
  // If no adjacent mines, reveal neighbors recursively
  if (grid[row][col].adjacentMines === 0) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const result = revealCell(grid, row + dr, col + dc, p);
        if (result > 0) revealedCount += result;
      }
    }
  }
  
  return revealedCount;
}

export function quickOpen(grid, row, col, p) {
  const { rows, cols } = GAME_CONFIG;
  const cell = grid[row][col];
  
  if (!cell.revealed || cell.adjacentMines === 0) return 0;
  
  // Count adjacent flags
  let flagCount = 0;
  const neighbors = [];
  
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const newRow = row + dr;
      const newCol = col + dc;
      if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
        neighbors.push({ row: newRow, col: newCol });
        if (grid[newRow][newCol].flagged) flagCount++;
      }
    }
  }
  
  // If flag count matches the number, reveal all unflagged neighbors
  if (flagCount === cell.adjacentMines) {
    let totalRevealed = 0;
    for (const neighbor of neighbors) {
      if (!grid[neighbor.row][neighbor.col].flagged) {
        const result = revealCell(grid, neighbor.row, neighbor.col, p);
        if (result === -1) return -1; // Hit a mine
        if (result > 0) totalRevealed += result;
      }
    }
    return totalRevealed;
  }
  
  return 0;
}

export function toggleFlag(grid, row, col) {
  const { rows, cols } = GAME_CONFIG;
  
  if (row < 0 || row >= rows || col < 0 || col >= cols) return 0;
  if (grid[row][col].revealed) return 0;
  
  grid[row][col].flagged = !grid[row][col].flagged;
  return grid[row][col].flagged ? 1 : -1;
}

export function checkWinCondition(grid) {
  const { rows, cols, mines } = GAME_CONFIG;
  let revealedCount = 0;
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (grid[row][col].revealed && !grid[row][col].isMine) {
        revealedCount++;
      }
    }
  }
  
  const totalCells = rows * cols;
  return revealedCount === totalCells - mines;
}