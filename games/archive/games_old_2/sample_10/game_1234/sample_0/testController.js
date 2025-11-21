// testController.js - Automated testing controllers

import { gameState } from './globals.js';
import { handleKeyPressed } from './input.js';

export function updateTestController(p) {
  if (gameState.controlMode === "HUMAN") return;
  
  if (gameState.controlMode === "TEST_1") {
    runBasicTest(p);
  } else if (gameState.controlMode === "TEST_2") {
    runWinTest(p);
  }
}

let testStep = 0;
let testTimer = 0;

function runBasicTest(p) {
  testTimer++;
  
  if (testTimer < 30) return;
  testTimer = 0;
  
  if (gameState.gamePhase === "START") {
    handleKeyPressed(p, 'Enter', 13);
    testStep = 0;
  } else if (gameState.gamePhase === "PLAYING") {
    switch (testStep % 10) {
      case 0:
        handleKeyPressed(p, 'w', 87); // Draw
        break;
      case 1:
        handleKeyPressed(p, 'ArrowRight', 39);
        break;
      case 2:
        handleKeyPressed(p, 'ArrowLeft', 37);
        break;
      case 3:
        handleKeyPressed(p, ' ', 32); // Pick up
        break;
      case 4:
        handleKeyPressed(p, 'ArrowRight', 39);
        break;
      case 5:
        handleKeyPressed(p, ' ', 32); // Drop
        break;
      case 6:
        handleKeyPressed(p, 'z', 90); // Undo
        break;
      case 7:
        handleKeyPressed(p, 'Escape', 27); // Pause
        break;
      case 8:
        handleKeyPressed(p, 'Escape', 27); // Unpause
        break;
      case 9:
        handleKeyPressed(p, 'w', 87); // Draw
        break;
    }
    testStep++;
    
    if (testStep > 100) {
      handleKeyPressed(p, 'r', 82);
      testStep = 0;
    }
  } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
    handleKeyPressed(p, 'r', 82);
    testStep = 0;
  }
}

function runWinTest(p) {
  testTimer++;
  
  if (testTimer < 5) return;
  testTimer = 0;
  
  if (gameState.gamePhase === "START") {
    handleKeyPressed(p, 'Enter', 13);
    testStep = 0;
  } else if (gameState.gamePhase === "PLAYING") {
    // Try to auto-complete or make smart moves
    if (testStep % 5 === 0) {
      handleKeyPressed(p, 'a', 65); // Try auto-complete
    } else if (testStep % 5 === 1) {
      handleKeyPressed(p, 's', 83); // Try auto-move
    } else if (testStep % 5 === 2) {
      handleKeyPressed(p, 'w', 87); // Draw
    } else {
      handleKeyPressed(p, 'ArrowRight', 39); // Navigate
    }
    
    testStep++;
    
    if (testStep > 500) {
      handleKeyPressed(p, 'r', 82);
      testStep = 0;
    }
  } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
    testTimer = 0;
    if (testStep < 60) {
      testStep++;
    } else {
      handleKeyPressed(p, 'r', 82);
      testStep = 0;
    }
  }
}