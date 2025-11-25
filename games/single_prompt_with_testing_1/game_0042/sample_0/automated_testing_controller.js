// automated_testing_controller.js - Automated testing

import { gameState, GRID_SIZE } from './globals.js';
import { findEmptyCell, getPossibleValues, getCorrectValue } from './sudoku.js';

let testState = {
  currentAction: null,
  actionFrameCounter: 0,
  targetRow: -1,
  targetCol: -1,
  targetValue: -1,
  solutionPath: [],
  pathIndex: 0,
  initialized: false
};

function getTestBasicAction(gs) {
  // Basic testing: navigate and try entering some numbers
  
  if (!testState.initialized) {
    testState.initialized = true;
    testState.currentAction = 'navigate';
    testState.targetRow = 0;
    testState.targetCol = 0;
  }
  
  testState.actionFrameCounter++;
  
  // Move to target
  if (testState.currentAction === 'navigate') {
    if (gs.selectedRow < testState.targetRow) return { keyCode: 40 }; // DOWN
    if (gs.selectedRow > testState.targetRow) return { keyCode: 38 }; // UP
    if (gs.selectedCol < testState.targetCol) return { keyCode: 39 }; // RIGHT
    if (gs.selectedCol > testState.targetCol) return { keyCode: 37 }; // LEFT
    
    // Reached target
    testState.currentAction = 'test_input';
    testState.actionFrameCounter = 0;
  }
  
  if (testState.currentAction === 'test_input') {
    if (testState.actionFrameCounter === 10) {
      // Try entering a number
      const cell = gs.grid[gs.selectedRow][gs.selectedCol];
      if (!cell.given && cell.value === 0) {
        return { keyCode: 49 }; // Press 1
      }
    } else if (testState.actionFrameCounter === 20) {
      // Toggle mode
      return { keyCode: 32 }; // SPACE
    } else if (testState.actionFrameCounter === 30) {
      // Enter pencil mark
      return { keyCode: 50 }; // Press 2
    } else if (testState.actionFrameCounter === 40) {
      // Move to next cell
      testState.targetRow = Math.min(GRID_SIZE - 1, testState.targetRow + 1);
      if (testState.targetRow >= GRID_SIZE) {
        testState.targetRow = 0;
        testState.targetCol = Math.min(GRID_SIZE - 1, testState.targetCol + 1);
      }
      testState.currentAction = 'navigate';
      testState.actionFrameCounter = 0;
    }
  }
  
  return null;
}

function getTestWinAction(gs) {
  // Solving strategy: Find empty cells and fill with correct values
  
  if (!testState.initialized) {
    testState.initialized = true;
    testState.currentAction = 'solve';
    
    // Make sure we're in solution mode
    if (gs.inputMode !== "SOLUTION") {
      return { keyCode: 32 }; // Toggle to solution mode
    }
  }
  
  testState.actionFrameCounter++;
  
  // Find the next empty cell
  const emptyCell = findEmptyCell(gs.grid);
  
  if (!emptyCell) {
    // Puzzle complete
    return null;
  }
  
  // Navigate to empty cell
  if (gs.selectedRow !== emptyCell.row || gs.selectedCol !== emptyCell.col) {
    if (gs.selectedRow < emptyCell.row) return { keyCode: 40 }; // DOWN
    if (gs.selectedRow > emptyCell.row) return { keyCode: 38 }; // UP
    if (gs.selectedCol < emptyCell.col) return { keyCode: 39 }; // RIGHT
    if (gs.selectedCol > emptyCell.col) return { keyCode: 37 }; // LEFT
  }
  
  // At the target cell, enter the correct value
  if (testState.actionFrameCounter % 5 === 0) { // Add delay for visibility
    const correctValue = getCorrectValue(emptyCell.row, emptyCell.col);
    const keyCode = 48 + correctValue; // Convert to keycode
    return { keyCode };
  }
  
  return null;
}

function getRandomAction(gs) {
  const actions = [37, 38, 39, 40, 49, 50, 51, 52, 53];
  const randomIndex = Math.floor(Math.random() * actions.length);
  return { keyCode: actions[randomIndex] };
}

export function get_automated_testing_action(gs) {
  if (gs.gamePhase !== "PLAYING") {
    return null;
  }
  
  switch (gs.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gs);
    case "TEST_2":
      return getTestWinAction(gs);
    default:
      return getRandomAction(gs);
  }
}

// Reset test state when control mode changes
export function resetTestState() {
  testState = {
    currentAction: null,
    actionFrameCounter: 0,
    targetRow: -1,
    targetCol: -1,
    targetValue: -1,
    solutionPath: [],
    pathIndex: 0,
    initialized: false
  };
}

if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;