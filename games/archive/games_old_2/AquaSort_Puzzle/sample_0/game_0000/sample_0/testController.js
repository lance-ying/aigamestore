// testController.js - Automated testing controllers

import { gameState, GAME_PHASES } from './globals.js';

export function getTestAction(p) {
  if (gameState.controlMode === 'HUMAN') {
    return null;
  }
  
  if (gameState.controlMode === 'TEST_1') {
    return getTest1Action(p);
  }
  
  if (gameState.controlMode === 'TEST_2') {
    return getTest2Action(p);
  }
  
  return null;
}

function getTest1Action(p) {
  // Basic testing: Navigate and attempt random pours
  if (gameState.gamePhase === GAME_PHASES.START) {
    return { keyCode: 13 }; // ENTER to start
  }
  
  if (gameState.gamePhase === GAME_PHASES.PLAYING && !gameState.isAnimating) {
    const action = p.frameCount % 60;
    
    if (action < 20) {
      return { keyCode: 39 }; // Arrow right
    } else if (action < 30) {
      return { keyCode: 32 }; // Space
    }
  }
  
  if (gameState.gamePhase === GAME_PHASES.LEVEL_COMPLETE) {
    return { keyCode: 32 }; // Space to continue
  }
  
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE || 
      gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    return { keyCode: 82 }; // R to restart
  }
  
  return null;
}

function getTest2Action(p) {
  // Winning strategy for Level 1
  if (gameState.gamePhase === GAME_PHASES.START) {
    return { keyCode: 13 }; // ENTER to start
  }
  
  if (gameState.gamePhase === GAME_PHASES.PLAYING && !gameState.isAnimating) {
    // Predefined winning sequence for Level 1
    const moves = gameState.levelMovesMade;
    
    // Simple strategy: try to sort one color at a time
    if (moves === 0) {
      gameState.highlightedTubeIndex = 0;
      return { keyCode: 32 }; // Select tube 0
    } else if (moves === 1) {
      gameState.highlightedTubeIndex = 3;
      return { keyCode: 32 }; // Pour to empty tube
    } else if (moves < 15 && p.frameCount % 30 === 0) {
      // Make random valid moves
      for (let i = 0; i < gameState.tubes.length; i++) {
        for (let j = 0; j < gameState.tubes.length; j++) {
          if (i !== j && gameState.tubes[i].canPourInto(gameState.tubes[j])) {
            gameState.highlightedTubeIndex = i;
            gameState.selectedTubeIndex = -1;
            if (p.frameCount % 60 === 0) {
              return { keyCode: 32 };
            }
          }
        }
      }
    }
  }
  
  if (gameState.gamePhase === GAME_PHASES.LEVEL_COMPLETE) {
    return { keyCode: 32 }; // Space to continue
  }
  
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    return { keyCode: 82 }; // R to restart
  }
  
  return null;
}

export function applyTestAction(action, p) {
  if (!action) return;
  
  // Simulate key press
  p.keyCode = action.keyCode;
  p.key = String.fromCharCode(action.keyCode);
  
  // Call the key handler directly
  const { handleKeyPressed } = require('./input.js');
  handleKeyPressed(p);
}