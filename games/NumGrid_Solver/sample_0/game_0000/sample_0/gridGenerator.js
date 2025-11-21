// gridGenerator.js - Grid generation logic

import { CELL_TYPES, OPERATORS, gameState } from './globals.js';

export class GridGenerator {
  constructor(p) {
    this.p = p;
  }

  generateGrid(level, difficulty) {
    const gridConfigs = this.getGridConfig(level, difficulty);
    const { rows, cols, emptyCount } = gridConfigs;
    
    // Create base grid structure
    const grid = this.createEmptyGrid(rows, cols);
    
    // Generate valid puzzle
    this.populateGrid(grid, emptyCount, level);
    
    return grid;
  }

  getGridConfig(level, difficulty) {
    const configs = {
      1: { rows: 3, cols: 3, emptyCount: 4 },
      2: { rows: 4, cols: 4, emptyCount: 6 },
      3: { rows: 4, cols: 4, emptyCount: 8 },
      4: { rows: 5, cols: 5, emptyCount: 12 },
      5: { rows: 5, cols: 5, emptyCount: 15 }
    };
    
    const baseConfig = configs[level] || configs[1];
    
    // Adjust empty count based on difficulty
    if (difficulty === "EASY") {
      baseConfig.emptyCount = Math.max(3, baseConfig.emptyCount - 2);
    } else if (difficulty === "HARD") {
      baseConfig.emptyCount = Math.min(baseConfig.rows * baseConfig.cols - 5, baseConfig.emptyCount + 2);
    }
    
    return baseConfig;
  }

  createEmptyGrid(rows, cols) {
    const grid = [];
    for (let r = 0; r < rows; r++) {
      grid[r] = [];
      for (let c = 0; c < cols; c++) {
        grid[r][c] = {
          type: CELL_TYPES.EMPTY,
          value: null,
          solution: null,
          isFixed: false,
          userInput: null
        };
      }
    }
    return grid;
  }

  populateGrid(grid, emptyCount, level) {
    const rows = grid.length;
    const cols = grid[0].length;
    
    // Simplified grid generation: create equations row by row and column by column
    // Pattern: number operator number = result
    
    // Determine which rows and columns have equations
    const equationRows = [];
    const equationCols = [];
    
    // For simplicity, alternate rows and columns for equations
    for (let r = 0; r < rows; r += 2) {
      equationRows.push(r);
    }
    for (let c = 0; c < cols; c += 2) {
      equationCols.push(c);
    }
    
    // Generate horizontal equations
    for (const row of equationRows) {
      if (cols >= 5) {
        this.generateHorizontalEquation(grid, row, level);
      }
    }
    
    // Generate vertical equations
    for (const col of equationCols) {
      if (rows >= 5) {
        this.generateVerticalEquation(grid, col, level);
      }
    }
    
    // Fill remaining cells strategically
    this.fillRemainingCells(grid, level);
    
    // Mark empty cells for user to fill
    this.markEmptyCells(grid, emptyCount);
  }

  generateHorizontalEquation(grid, row, level) {
    const cols = grid[0].length;
    if (cols < 5) return;
    
    const operator = this.selectOperator(level);
    const { num1, num2, result } = this.generateEquation(operator, level);
    
    // Place: num1 operator num2 = result
    grid[row][0] = { type: CELL_TYPES.FIXED, value: num1, solution: num1, isFixed: true, userInput: null };
    grid[row][1] = { type: CELL_TYPES.OPERATOR, value: operator, solution: operator, isFixed: true, userInput: null };
    grid[row][2] = { type: CELL_TYPES.FIXED, value: num2, solution: num2, isFixed: true, userInput: null };
    grid[row][3] = { type: CELL_TYPES.OPERATOR, value: "=", solution: "=", isFixed: true, userInput: null };
    grid[row][4] = { type: CELL_TYPES.RESULT, value: result, solution: result, isFixed: true, userInput: null };
  }

  generateVerticalEquation(grid, col, level) {
    const rows = grid.length;
    if (rows < 5) return;
    
    const operator = this.selectOperator(level);
    const { num1, num2, result } = this.generateEquation(operator, level);
    
    // Place: num1 operator num2 = result (vertically)
    grid[0][col] = { type: CELL_TYPES.FIXED, value: num1, solution: num1, isFixed: true, userInput: null };
    grid[1][col] = { type: CELL_TYPES.OPERATOR, value: operator, solution: operator, isFixed: true, userInput: null };
    grid[2][col] = { type: CELL_TYPES.FIXED, value: num2, solution: num2, isFixed: true, userInput: null };
    grid[3][col] = { type: CELL_TYPES.OPERATOR, value: "=", solution: "=", isFixed: true, userInput: null };
    grid[4][col] = { type: CELL_TYPES.RESULT, value: result, solution: result, isFixed: true, userInput: null };
  }

  selectOperator(level) {
    const operators = ["+", "-"];
    if (level >= 2) operators.push("*");
    if (level >= 3) operators.push("/");
    
    const idx = Math.floor(this.p.random(operators.length));
    return operators[idx];
  }

  generateEquation(operator, level) {
    let num1, num2, result;
    
    const maxNum = level <= 2 ? 9 : (level <= 3 ? 20 : 50);
    
    switch (operator) {
      case "+":
        num1 = Math.floor(this.p.random(1, maxNum));
        num2 = Math.floor(this.p.random(1, maxNum));
        result = num1 + num2;
        break;
      case "-":
        num1 = Math.floor(this.p.random(5, maxNum));
        num2 = Math.floor(this.p.random(1, num1));
        result = num1 - num2;
        break;
      case "*":
        num1 = Math.floor(this.p.random(2, Math.min(10, maxNum / 2)));
        num2 = Math.floor(this.p.random(2, Math.min(10, maxNum / 2)));
        result = num1 * num2;
        break;
      case "/":
        num2 = Math.floor(this.p.random(2, 10));
        result = Math.floor(this.p.random(1, maxNum / num2));
        num1 = result * num2;
        result = num1 / num2;
        break;
      default:
        num1 = 5;
        num2 = 3;
        result = 8;
    }
    
    return { num1, num2, result };
  }

  fillRemainingCells(grid, level) {
    const rows = grid.length;
    const cols = grid[0].length;
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c].type === CELL_TYPES.EMPTY) {
          const value = Math.floor(this.p.random(1, level <= 2 ? 10 : 20));
          grid[r][c] = {
            type: CELL_TYPES.FIXED,
            value: value,
            solution: value,
            isFixed: true,
            userInput: null
          };
        }
      }
    }
  }

  markEmptyCells(grid, emptyCount) {
    const rows = grid.length;
    const cols = grid[0].length;
    
    const candidates = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c].type === CELL_TYPES.FIXED && grid[r][c].value !== null) {
          candidates.push({ r, c });
        }
      }
    }
    
    // Shuffle candidates
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(this.p.random(i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    
    // Mark first emptyCount cells as empty
    const toMark = Math.min(emptyCount, candidates.length);
    for (let i = 0; i < toMark; i++) {
      const { r, c } = candidates[i];
      grid[r][c].isFixed = false;
      grid[r][c].type = CELL_TYPES.EMPTY;
      grid[r][c].userInput = null;
    }
  }
}