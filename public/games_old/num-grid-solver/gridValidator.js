// gridValidator.js - Grid validation logic

import { CELL_TYPES, gameState } from './globals.js';

export class GridValidator {
  constructor(p) {
    this.p = p;
  }

  validateGrid(grid) {
    const rows = grid.length;
    const cols = grid[0].length;
    let mistakes = 0;
    
    // Check each empty cell
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = grid[r][c];
        if (cell.type === CELL_TYPES.EMPTY) {
          if (cell.userInput !== cell.solution) {
            mistakes++;
            cell.hasError = true;
          } else {
            cell.hasError = false;
          }
        }
      }
    }
    
    return mistakes;
  }

  isGridComplete(grid) {
    const rows = grid.length;
    const cols = grid[0].length;
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = grid[r][c];
        if (cell.type === CELL_TYPES.EMPTY && cell.userInput === null) {
          return false;
        }
      }
    }
    
    return true;
  }

  getNextEmptyCell(grid, currentRow, currentCol, direction) {
    const rows = grid.length;
    const cols = grid[0].length;
    
    let nextRow = currentRow;
    let nextCol = currentCol;
    
    // Find next empty cell in given direction
    let found = false;
    let attempts = 0;
    const maxAttempts = rows * cols;
    
    while (!found && attempts < maxAttempts) {
      switch (direction) {
        case "UP":
          nextRow--;
          if (nextRow < 0) nextRow = rows - 1;
          break;
        case "DOWN":
          nextRow++;
          if (nextRow >= rows) nextRow = 0;
          break;
        case "LEFT":
          nextCol--;
          if (nextCol < 0) nextCol = cols - 1;
          break;
        case "RIGHT":
          nextCol++;
          if (nextCol >= cols) nextCol = 0;
          break;
      }
      
      if (grid[nextRow][nextCol].type === CELL_TYPES.EMPTY) {
        found = true;
      }
      
      attempts++;
    }
    
    if (found) {
      return { row: nextRow, col: nextCol };
    }
    
    return { row: currentRow, col: currentCol };
  }

  getFirstEmptyCell(grid) {
    const rows = grid.length;
    const cols = grid[0].length;
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c].type === CELL_TYPES.EMPTY) {
          return { row: r, col: c };
        }
      }
    }
    
    return { row: -1, col: -1 };
  }

  applyHint(grid) {
    const rows = grid.length;
    const cols = grid[0].length;
    
    const emptyCells = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c].type === CELL_TYPES.EMPTY && grid[r][c].userInput === null) {
          emptyCells.push({ r, c });
        }
      }
    }
    
    if (emptyCells.length === 0) return null;
    
    const idx = Math.floor(this.p.random(emptyCells.length));
    const { r, c } = emptyCells[idx];
    
    grid[r][c].userInput = grid[r][c].solution;
    grid[r][c].isHinted = true;
    
    return { row: r, col: c };
  }
}