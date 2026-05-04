// testController.js - Automated testing controller

import { gameState } from './globals.js';
import { drawFromStockpile, autoMoveToFoundation } from './gameLogic.js';
import { startGame } from './input.js';

let testFrameCounter = 0;

export function runTestController(p) {
  testFrameCounter++;
  
  if (gameState.controlMode === "TEST_1") {
    runBasicTest(p);
  } else if (gameState.controlMode === "TEST_2") {
    runWinTest(p);
  }
}

function runBasicTest(p) {
  // Auto-start game
  if (gameState.gamePhase === "START" && testFrameCounter > 60) {
    startGame(p);
    testFrameCounter = 0;
  }
  
  // Make some moves
  if (gameState.gamePhase === "PLAYING") {
    if (testFrameCounter % 30 === 0) {
      drawFromStockpile();
    }
    if (testFrameCounter % 60 === 0) {
      autoMoveToFoundation();
    }
  }
}

function runWinTest(p) {
  // Auto-start game
  if (gameState.gamePhase === "START" && testFrameCounter > 60) {
    startGame(p);
    testFrameCounter = 0;
  }
  
  // Aggressively auto-move
  if (gameState.gamePhase === "PLAYING") {
    if (testFrameCounter % 10 === 0) {
      let moved = true;
      let attempts = 0;
      while (moved && attempts < 10) {
        moved = autoMoveToFoundation();
        attempts++;
      }
      
      if (!moved && testFrameCounter % 20 === 0) {
        drawFromStockpile();
      }
    }
  }
}