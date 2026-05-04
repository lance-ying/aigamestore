// testing.js - Automated testing controllers

import { gameState, PHASE_PLAYING, SUBSTATE_WORDLE, SUBSTATE_CROSSWORD } from './globals.js';

export function getTestAction(p, testMode) {
  if (testMode === "TEST_1") {
    return getBasicTestAction(p);
  } else if (testMode === "TEST_2") {
    return getWinTestAction(p);
  }
  return null;
}

function getBasicTestAction(p) {
  // Simple testing: random valid inputs
  if (gameState.gamePhase !== PHASE_PLAYING) {
    if (gameState.gamePhase === "START") {
      return { keyCode: 13 }; // ENTER to start
    }
    if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
      if (p.frameCount % 120 === 0) {
        return { keyCode: 82 }; // R to restart
      }
    }
    return null;
  }
  
  if (gameState.playingSubstate === SUBSTATE_WORDLE) {
    // Type random letters
    if (gameState.wordle.currentCol < 5) {
      const letter = String.fromCharCode(65 + Math.floor(p.random(26)));
      return { keyCode: letter.charCodeAt(0), key: letter };
    } else {
      // Submit
      return { keyCode: 13 }; // ENTER
    }
  } else if (gameState.playingSubstate === SUBSTATE_CROSSWORD) {
    // Type random letters
    const r = gameState.crossword.activeRow;
    const c = gameState.crossword.activeCol;
    if (!gameState.crossword.grid[r][c]) {
      const letter = String.fromCharCode(65 + Math.floor(p.random(26)));
      return { keyCode: letter.charCodeAt(0), key: letter };
    } else {
      // Move to next cell
      return { keyCode: 39 }; // Right arrow
    }
  }
  
  return null;
}

function getWinTestAction(p) {
  // Smart testing: play to win
  if (gameState.gamePhase !== PHASE_PLAYING) {
    if (gameState.gamePhase === "START") {
      return { keyCode: 13 }; // ENTER to start
    }
    if (gameState.gamePhase === "GAME_OVER_WIN") {
      if (p.frameCount % 120 === 0) {
        return { keyCode: 82 }; // R to restart
      }
    }
    return null;
  }
  
  if (gameState.playingSubstate === SUBSTATE_WORDLE) {
    // Type the target word
    if (gameState.wordle.currentCol < 5) {
      const targetLetter = gameState.wordle.targetWord[gameState.wordle.currentCol];
      return { keyCode: targetLetter.charCodeAt(0), key: targetLetter };
    } else {
      // Submit
      return { keyCode: 13 }; // ENTER
    }
  } else if (gameState.playingSubstate === SUBSTATE_CROSSWORD) {
    // Type the solution
    const r = gameState.crossword.activeRow;
    const c = gameState.crossword.activeCol;
    const solution = gameState.crossword.solution[r][c];
    
    if (solution && !gameState.crossword.grid[r][c]) {
      return { keyCode: solution.charCodeAt(0), key: solution };
    } else {
      // Check if all filled
      let allFilled = true;
      for (let i = 0; i < gameState.crossword.gridSize; i++) {
        for (let j = 0; j < gameState.crossword.gridSize; j++) {
          if (!gameState.crossword.blocked[i][j] && !gameState.crossword.grid[i][j]) {
            allFilled = false;
            break;
          }
        }
        if (!allFilled) break;
      }
      
      if (allFilled) {
        return { keyCode: 13 }; // ENTER to submit
      } else {
        return { keyCode: 39 }; // Right arrow to move
      }
    }
  }
  
  return null;
}