// testController.js - Automated testing controllers

import { gameState, GAME_PHASE } from './globals.js';
import { LEVELS } from './levels.js';

export function getTestAction(p) {
  if (gameState.controlMode === "HUMAN") {
    return null;
  }

  if (gameState.controlMode === "TEST_1") {
    return getTest1Action(p);
  }

  if (gameState.controlMode === "TEST_2") {
    return getTest2Action(p);
  }

  return null;
}

function getTest1Action(p) {
  // Basic testing - press ENTER to start, tap randomly
  if (gameState.gamePhase === GAME_PHASE.START) {
    if (p.frameCount % 60 === 30) {
      return { keyCode: 13, key: "Enter" };
    }
  }

  if (gameState.gamePhase === GAME_PHASE.PLAYING) {
    // Random taps occasionally
    if (p.frameCount % 90 === 0) {
      return { keyCode: 32, key: " " };
    }
  }

  if (gameState.gamePhase === GAME_PHASE.GAME_OVER_LOSE) {
    if (p.frameCount % 120 === 60) {
      return { keyCode: 82, key: "r" };
    }
  }

  return null;
}

function getTest2Action(p) {
  // Win test - press ENTER and tap at perfect timing
  if (gameState.gamePhase === GAME_PHASE.START) {
    if (p.frameCount % 60 === 30) {
      return { keyCode: 13, key: "Enter" };
    }
  }

  if (gameState.gamePhase === GAME_PHASE.PLAYING) {
    const level = LEVELS[gameState.currentLevel];
    
    if (gameState.nextTurnIndex < gameState.turnPoints.length) {
      const nextTurn = gameState.turnPoints[gameState.nextTurnIndex];
      const timeDiff = Math.abs(gameState.gameTime - nextTurn.timing);
      
      // Tap when within perfect window
      if (timeDiff < 10) {
        return { keyCode: 32, key: " " };
      }
    }
  }

  if (gameState.gamePhase === GAME_PHASE.LEVEL_COMPLETE) {
    if (p.frameCount % 120 === 60) {
      return { keyCode: 32, key: " " };
    }
  }

  if (gameState.gamePhase === GAME_PHASE.GAME_OVER_WIN) {
    if (p.frameCount % 180 === 90) {
      return { keyCode: 82, key: "r" };
    }
  }

  return null;
}