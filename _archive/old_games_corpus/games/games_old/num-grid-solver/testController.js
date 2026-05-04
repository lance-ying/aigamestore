// testController.js - Automated testing controller

import { gameState, GAME_PHASES } from './globals.js';

export class TestController {
  constructor(p, inputHandler, gridValidator) {
    this.p = p;
    this.inputHandler = inputHandler;
    this.gridValidator = gridValidator;
    this.testState = {
      currentAction: 0,
      waitFrames: 0,
      actionsCompleted: 0
    };
  }

  update() {
    if (gameState.controlMode === "HUMAN") return;

    if (this.testState.waitFrames > 0) {
      this.testState.waitFrames--;
      return;
    }

    if (gameState.controlMode === "TEST_1") {
      this.runBasicTest();
    } else if (gameState.controlMode === "TEST_2") {
      this.runWinTest();
    }
  }

  runBasicTest() {
    // Basic test: Start game, navigate cells, input some numbers
    if (gameState.gamePhase === GAME_PHASES.START) {
      this.inputHandler.handleKeyPressed("Enter", 13);
      this.testState.waitFrames = 60;
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (this.testState.actionsCompleted < 10) {
        const actions = [
          { key: "ArrowRight", keyCode: 39 },
          { key: "1", keyCode: 49 },
          { key: " ", keyCode: 32 },
          { key: "ArrowDown", keyCode: 40 },
          { key: "5", keyCode: 53 },
          { key: " ", keyCode: 32 },
          { key: "z", keyCode: 90 },
          { key: "ArrowLeft", keyCode: 37 },
          { key: "3", keyCode: 51 },
          { key: " ", keyCode: 32 }
        ];
        
        if (this.testState.actionsCompleted < actions.length) {
          const action = actions[this.testState.actionsCompleted];
          this.inputHandler.handleKeyPressed(action.key, action.keyCode);
          this.testState.actionsCompleted++;
          this.testState.waitFrames = 15;
        }
      }
    }
  }

  runWinTest() {
    // Win test: Start game and solve the grid correctly
    if (gameState.gamePhase === GAME_PHASES.START) {
      this.inputHandler.handleKeyPressed("Enter", 13);
      this.testState.waitFrames = 60;
      this.testState.actionsCompleted = 0;
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      // Find all empty cells and fill them with correct answers
      const grid = gameState.grid;
      const emptyCells = [];
      
      for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[0].length; c++) {
          if (grid[r][c].type === "EMPTY" && grid[r][c].userInput === null) {
            emptyCells.push({ r, c, solution: grid[r][c].solution });
          }
        }
      }
      
      if (emptyCells.length > 0 && this.testState.actionsCompleted < emptyCells.length) {
        const cell = emptyCells[this.testState.actionsCompleted];
        
        // Navigate to cell
        gameState.selectedCell = { row: cell.r, col: cell.c };
        
        // Input solution
        const solution = cell.solution.toString();
        for (let digit of solution) {
          this.inputHandler.handleKeyPressed(digit, 48 + parseInt(digit));
        }
        this.inputHandler.handleKeyPressed(" ", 32);
        
        this.testState.actionsCompleted++;
        this.testState.waitFrames = 10;
      } else if (emptyCells.length === 0 && this.gridValidator.isGridComplete(grid)) {
        // Submit
        this.inputHandler.handleKeyPressed(" ", 32);
        this.testState.waitFrames = 120;
      }
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
      if (gameState.currentLevel < gameState.totalLevels) {
        this.inputHandler.handleKeyPressed("Enter", 13);
        this.testState.waitFrames = 60;
        this.testState.actionsCompleted = 0;
      }
    }
  }
}