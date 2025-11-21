// sudoku.js - Sudoku logic and validation

import { gameState, GRID_SIZE, BOX_SIZE, PUZZLES } from './globals.js';

export function initializeGrid(puzzleData) {
  const grid = [];
  let emptyCells = 0;
  
  for (let row = 0; row < GRID_SIZE; row++) {
    grid[row] = [];
    for (let col = 0; col < GRID_SIZE; col++) {
      const value = puzzleData[row][col];
      grid[row][col] = {
        value: value,
        given: value !== 0,
        pencilMarks: new Set(),
        isError: false
      };
      if (value === 0) emptyCells++;
    }
  }
  
  gameState.totalEmptyCells = emptyCells;
  gameState.completedCells = 0;
  return grid;
}

export function isValidPlacement(grid, row, col, num) {
  // Check row
  for (let c = 0; c < GRID_SIZE; c++) {
    if (c !== col && grid[row][c].value === num) {
      return false;
    }
  }
  
  // Check column
  for (let r = 0; r < GRID_SIZE; r++) {
    if (r !== row && grid[r][col].value === num) {
      return false;
    }
  }
  
  // Check 3x3 box
  const boxRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
  const boxCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;
  for (let r = boxRow; r < boxRow + BOX_SIZE; r++) {
    for (let c = boxCol; c < boxCol + BOX_SIZE; c++) {
      if ((r !== row || c !== col) && grid[r][c].value === num) {
        return false;
      }
    }
  }
  
  return true;
}

export function checkPuzzleComplete(grid) {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col].value === 0) {
        return false;
      }
      if (!isValidPlacement(grid, row, col, grid[row][col].value)) {
        return false;
      }
    }
  }
  return true;
}

export function updateCellErrorStatus(grid) {
  // Clear all error flags first
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      grid[row][col].isError = false;
    }
  }
  
  // Check for conflicts
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const cell = grid[row][col];
      if (cell.value !== 0 && !cell.given) {
        if (!isValidPlacement(grid, row, col, cell.value)) {
          cell.isError = true;
        }
      }
    }
  }
}

export function setCellValue(row, col, value) {
  const cell = gameState.grid[row][col];
  
  if (cell.given) return false;
  
  // Save move for undo
  const prevValue = cell.value;
  const prevPencilMarks = new Set(cell.pencilMarks);
  
  gameState.moveHistory.push({
    row, col, prevValue, prevPencilMarks,
    prevInputMode: gameState.inputMode
  });
  
  if (gameState.inputMode === "SOLUTION") {
    const wasEmpty = cell.value === 0;
    const willBeEmpty = value === 0;
    
    cell.value = value;
    cell.pencilMarks.clear();
    
    // Update completed cells count
    if (wasEmpty && !willBeEmpty) {
      gameState.completedCells++;
    } else if (!wasEmpty && willBeEmpty) {
      gameState.completedCells--;
    }
  } else { // PENCIL mode
    if (value === 0) {
      cell.pencilMarks.clear();
    } else {
      if (cell.pencilMarks.has(value)) {
        cell.pencilMarks.delete(value);
      } else {
        cell.pencilMarks.add(value);
      }
    }
  }
  
  updateCellErrorStatus(gameState.grid);
  return true;
}

export function clearCell(row, col) {
  const cell = gameState.grid[row][col];
  if (cell.given) return false;
  
  return setCellValue(row, col, 0);
}

export function undoLastMove() {
  if (gameState.moveHistory.length === 0) return false;
  
  const move = gameState.moveHistory.pop();
  const cell = gameState.grid[move.row][move.col];
  
  if (cell.given) return false;
  
  const wasEmpty = cell.value === 0;
  const willBeEmpty = move.prevValue === 0;
  
  cell.value = move.prevValue;
  cell.pencilMarks = move.prevPencilMarks;
  
  // Update completed cells count
  if (wasEmpty && !willBeEmpty) {
    gameState.completedCells++;
  } else if (!wasEmpty && willBeEmpty) {
    gameState.completedCells--;
  }
  
  updateCellErrorStatus(gameState.grid);
  return true;
}

export function getCorrectValue(row, col) {
  const puzzle = PUZZLES[gameState.currentPuzzleIndex];
  return puzzle.solution[row][col];
}

// Solving algorithm for automated testing
export function findEmptyCell(grid) {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col].value === 0) {
        return { row, col };
      }
    }
  }
  return null;
}

export function getPossibleValues(grid, row, col) {
  const possible = [];
  for (let num = 1; num <= 9; num++) {
    if (isValidPlacement(grid, row, col, num)) {
      possible.push(num);
    }
  }
  return possible;
}