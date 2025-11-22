// ai.js - AI control modes for testing

import { gameState } from './globals.js';
import { getDotAtPosition, clearSelectedDots, clearAllSelections } from './grid.js';

let aiState = {
  actionTimer: 0,
  actionDelay: 30,
  currentAction: null,
  testPhase: 0
};

export function updateAI(p) {
  if (gameState.gamePhase !== "PLAYING") return;
  
  aiState.actionTimer++;
  
  if (gameState.controlMode === "TEST_1") {
    runBasicTest(p);
  } else if (gameState.controlMode === "TEST_2") {
    runWinTest(p);
  }
}

function runBasicTest(p) {
  if (aiState.actionTimer < aiState.actionDelay) return;
  aiState.actionTimer = 0;
  
  // Find any two adjacent dots of the same color
  for (let y = 0; y < gameState.grid.length; y++) {
    for (let x = 0; x < gameState.grid[y].length; x++) {
      const dot = gameState.grid[y][x];
      if (!dot) continue;
      
      // Check right neighbor
      if (x < gameState.grid[y].length - 1) {
        const rightDot = gameState.grid[y][x + 1];
        if (rightDot && rightDot.colorIndex === dot.colorIndex) {
          gameState.currentPath = [dot, rightDot];
          dot.selected = true;
          rightDot.selected = true;
          clearSelectedDots(p);
          clearAllSelections();
          return;
        }
      }
      
      // Check down neighbor
      if (y < gameState.grid.length - 1) {
        const downDot = gameState.grid[y + 1][x];
        if (downDot && downDot.colorIndex === dot.colorIndex) {
          gameState.currentPath = [dot, downDot];
          dot.selected = true;
          downDot.selected = true;
          clearSelectedDots(p);
          clearAllSelections();
          return;
        }
      }
    }
  }
}

function runWinTest(p) {
  if (aiState.actionTimer < 10) return;
  aiState.actionTimer = 0;
  
  // Find longest possible match
  let bestPath = [];
  
  for (let y = 0; y < gameState.grid.length; y++) {
    for (let x = 0; x < gameState.grid[y].length; x++) {
      const dot = gameState.grid[y][x];
      if (!dot) continue;
      
      // Try horizontal line
      let hPath = [dot];
      for (let nx = x + 1; nx < gameState.grid[y].length; nx++) {
        const nextDot = gameState.grid[y][nx];
        if (nextDot && nextDot.colorIndex === dot.colorIndex) {
          hPath.push(nextDot);
        } else {
          break;
        }
      }
      
      if (hPath.length > bestPath.length) {
        bestPath = hPath;
      }
      
      // Try vertical line
      let vPath = [dot];
      for (let ny = y + 1; ny < gameState.grid.length; ny++) {
        const nextDot = gameState.grid[ny][x];
        if (nextDot && nextDot.colorIndex === dot.colorIndex) {
          vPath.push(nextDot);
        } else {
          break;
        }
      }
      
      if (vPath.length > bestPath.length) {
        bestPath = vPath;
      }
    }
  }
  
  if (bestPath.length >= 2) {
    gameState.currentPath = bestPath;
    bestPath.forEach(dot => dot.selected = true);
    clearSelectedDots(p);
    clearAllSelections();
  }
}

export function resetAI() {
  aiState = {
    actionTimer: 0,
    actionDelay: 30,
    currentAction: null,
    testPhase: 0
  };
}