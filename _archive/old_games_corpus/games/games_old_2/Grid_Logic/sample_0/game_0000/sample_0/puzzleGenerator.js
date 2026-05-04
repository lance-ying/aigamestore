// puzzleGenerator.js - Generate and validate Sudoku puzzles
import { Cell } from './cellClass.js';
import { GRID_SIZE, BOX_SIZE, DIFFICULTY_SETTINGS } from './globals.js';

export class PuzzleGenerator {
  constructor(p) {
    this.p = p;
  }

  generatePuzzle(difficulty) {
    // Create empty grid
    const grid = [];
    for (let row = 0; row < GRID_SIZE; row++) {
      grid[row] = [];
      for (let col = 0; col < GRID_SIZE; col++) {
        grid[row][col] = new Cell(row, col);
      }
    }

    // Fill the grid with a valid solution
    this.fillGrid(grid);

    // Remove numbers based on difficulty
    const setting = DIFFICULTY_SETTINGS[difficulty];
    const cellsToRemove = 81 - setting.filledCells;
    this.removeNumbers(grid, cellsToRemove);

    return grid;
  }

  fillGrid(grid) {
    // Simple backtracking algorithm to fill the grid
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (grid[row][col].value === 0) {
          // Shuffle numbers
          this.shuffleArray(numbers);
          
          for (let num of numbers) {
            if (this.isValidPlacement(grid, row, col, num)) {
              grid[row][col].value = num;
              
              if (this.fillGrid(grid)) {
                return true;
              }
              
              grid[row][col].value = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  removeNumbers(grid, count) {
    const cells = [];
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        cells.push({ row, col });
      }
    }

    this.shuffleArray(cells);

    let removed = 0;
    for (let i = 0; i < cells.length && removed < count; i++) {
      const { row, col } = cells[i];
      grid[row][col].value = 0;
      removed++;
    }

    // Mark remaining cells as fixed
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (grid[row][col].value !== 0) {
          grid[row][col].isFixed = true;
        }
      }
    }
  }

  isValidPlacement(grid, row, col, num) {
    // Check row
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[row][c].value === num) return false;
    }

    // Check column
    for (let r = 0; r < GRID_SIZE; r++) {
      if (grid[r][col].value === num) return false;
    }

    // Check 3x3 box
    const boxRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
    const boxCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;
    for (let r = boxRow; r < boxRow + BOX_SIZE; r++) {
      for (let c = boxCol; c < boxCol + BOX_SIZE; c++) {
        if (grid[r][c].value === num) return false;
      }
    }

    return true;
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(this.p.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  checkConflicts(grid) {
    // Reset all conflicts
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        grid[row][col].isConflict = false;
      }
    }

    // Check for conflicts
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const cell = grid[row][col];
        if (cell.value !== 0 && !cell.isFixed) {
          if (!this.isValidPlacement(grid, row, col, cell.value)) {
            cell.isConflict = true;
          }
        }
      }
    }
  }

  isGridComplete(grid) {
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (grid[row][col].value === 0) return false;
      }
    }

    // Validate all rows, columns, and boxes
    for (let i = 0; i < GRID_SIZE; i++) {
      if (!this.isRowValid(grid, i)) return false;
      if (!this.isColValid(grid, i)) return false;
    }

    for (let boxRow = 0; boxRow < GRID_SIZE; boxRow += BOX_SIZE) {
      for (let boxCol = 0; boxCol < GRID_SIZE; boxCol += BOX_SIZE) {
        if (!this.isBoxValid(grid, boxRow, boxCol)) return false;
      }
    }

    return true;
  }

  isRowValid(grid, row) {
    const seen = new Set();
    for (let col = 0; col < GRID_SIZE; col++) {
      const val = grid[row][col].value;
      if (val !== 0) {
        if (seen.has(val)) return false;
        seen.add(val);
      }
    }
    return seen.size === GRID_SIZE;
  }

  isColValid(grid, col) {
    const seen = new Set();
    for (let row = 0; row < GRID_SIZE; row++) {
      const val = grid[row][col].value;
      if (val !== 0) {
        if (seen.has(val)) return false;
        seen.add(val);
      }
    }
    return seen.size === GRID_SIZE;
  }

  isBoxValid(grid, startRow, startCol) {
    const seen = new Set();
    for (let r = startRow; r < startRow + BOX_SIZE; r++) {
      for (let c = startCol; c < startCol + BOX_SIZE; c++) {
        const val = grid[r][c].value;
        if (val !== 0) {
          if (seen.has(val)) return false;
          seen.add(val);
        }
      }
    }
    return seen.size === GRID_SIZE;
  }

  getHint(grid) {
    // Find an empty cell and return the correct value
    const emptyCells = [];
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (grid[row][col].value === 0 && !grid[row][col].isFixed) {
          emptyCells.push({ row, col });
        }
      }
    }

    if (emptyCells.length === 0) return null;

    // Pick a random empty cell
    const cell = emptyCells[Math.floor(this.p.random() * emptyCells.length)];
    
    // Find the correct number for this cell
    for (let num = 1; num <= GRID_SIZE; num++) {
      if (this.isValidPlacement(grid, cell.row, cell.col, num)) {
        return { row: cell.row, col: cell.col, value: num };
      }
    }

    return null;
  }
}