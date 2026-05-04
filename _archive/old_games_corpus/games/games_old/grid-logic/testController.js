// testController.js - Automated testing controller
import { gameState, GRID_SIZE } from './globals.js';

export class TestController {
  constructor(inputHandler) {
    this.inputHandler = inputHandler;
  }

  getTestAction() {
    if (gameState.controlMode === "HUMAN") {
      return null;
    }

    if (gameState.controlMode === "TEST_1") {
      return this.getBasicTestAction();
    }

    if (gameState.controlMode === "TEST_2") {
      return this.getWinTestAction();
    }

    return null;
  }

  getBasicTestAction() {
    // Basic testing: Navigate around and place some numbers
    const actions = [
      { type: "wait", frames: 10 },
      { type: "key", keyCode: 13 }, // Start game
      { type: "wait", frames: 30 },
      { type: "key", keyCode: 39 }, // Right
      { type: "wait", frames: 5 },
      { type: "key", keyCode: 40 }, // Down
      { type: "wait", frames: 5 },
      { type: "key", keyCode: 37 }, // Left
      { type: "wait", frames: 5 },
      { type: "key", keyCode: 38 }, // Up
      { type: "wait", frames: 10 },
      { type: "key", keyCode: 49 }, // Place 1
      { type: "wait", frames: 15 },
      { type: "key", keyCode: 39 }, // Right
      { type: "wait", frames: 5 },
      { type: "key", keyCode: 50 }, // Place 2
      { type: "wait", frames: 15 },
      { type: "key", keyCode: 32 }, // Toggle pencil mode
      { type: "wait", frames: 5 },
      { type: "key", keyCode: 51 }, // Pencil mark 3
      { type: "wait", frames: 10 },
      { type: "key", keyCode: 90 }, // Undo
      { type: "wait", frames: 30 },
      { type: "key", keyCode: 27 }, // Pause
      { type: "wait", frames: 20 },
      { type: "key", keyCode: 27 }, // Unpause
      { type: "wait", frames: 300 }
    ];

    if (gameState.testingIndex >= actions.length) {
      return null;
    }

    const action = actions[gameState.testingIndex];
    gameState.testingIndex++;

    return action;
  }

  getWinTestAction() {
    // Win test: Solve the puzzle automatically
    if (gameState.gamePhase === "START") {
      if (gameState.testingIndex === 0) {
        gameState.testingIndex++;
        return { type: "wait", frames: 10 };
      } else if (gameState.testingIndex === 1) {
        gameState.testingIndex++;
        return { type: "key", keyCode: 13 }; // Start
      } else if (gameState.testingIndex === 2) {
        gameState.testingIndex++;
        return { type: "wait", frames: 30 };
      }
    }

    if (gameState.gamePhase === "PLAYING") {
      // Find next empty cell and fill with correct value
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          const cell = gameState.grid[row][col];
          if (cell.value === 0 && !cell.isFixed) {
            // Navigate to this cell
            if (gameState.selectedRow !== row || gameState.selectedCol !== col) {
              if (gameState.selectedRow < row) {
                return { type: "key", keyCode: 40 }; // Down
              } else if (gameState.selectedRow > row) {
                return { type: "key", keyCode: 38 }; // Up
              } else if (gameState.selectedCol < col) {
                return { type: "key", keyCode: 39 }; // Right
              } else if (gameState.selectedCol > col) {
                return { type: "key", keyCode: 37 }; // Left
              }
            }

            // Find correct value
            for (let num = 1; num <= 9; num++) {
              if (this.isValidPlacement(row, col, num)) {
                return { type: "key", keyCode: 48 + num };
              }
            }
          }
        }
      }
    }

    if (gameState.gamePhase === "GAME_OVER_WIN") {
      return { type: "wait", frames: 60 };
    }

    return { type: "wait", frames: 5 };
  }

  isValidPlacement(row, col, num) {
    // Check row
    for (let c = 0; c < GRID_SIZE; c++) {
      if (gameState.grid[row][c].value === num) return false;
    }

    // Check column
    for (let r = 0; r < GRID_SIZE; r++) {
      if (gameState.grid[r][col].value === num) return false;
    }

    // Check 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let r = boxRow; r < boxRow + 3; r++) {
      for (let c = boxCol; c < boxCol + 3; c++) {
        if (gameState.grid[r][c].value === num) return false;
      }
    }

    return true;
  }

  executeAction(action) {
    if (!action) return;

    if (action.type === "wait") {
      // Just wait, no action
      return;
    }

    if (action.type === "key") {
      this.inputHandler.handleKeyPressed(action.keyCode, String.fromCharCode(action.keyCode));
    }
  }
}