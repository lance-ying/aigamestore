// testing.js - Automated testing controllers

import { gameState, GAME_PHASES } from './globals.js';

export function getTestingAction(p) {
  const mode = gameState.controlMode;
  
  if (mode === 'TEST_1') {
    return getBasicTestAction(p);
  } else if (mode === 'TEST_2') {
    return getWinTestAction(p);
  }
  
  return null;
}

function getBasicTestAction(p) {
  // Basic test: Start game, answer some questions randomly
  if (gameState.gamePhase === GAME_PHASES.START) {
    if (p.frameCount > 60) {
      return { keyCode: 13 }; // ENTER
    }
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    if (!gameState.showingFeedback && p.frameCount % 90 === 0) {
      const miniGameType = gameState.currentLevelData.miniGameType;
      
      if (miniGameType === 'TYPING') {
        // Type random letters
        if (gameState.typedAnswer.length < 5) {
          const letters = 'abcdefghijklmnopqrstuvwxyz';
          const randomLetter = letters[Math.floor(Math.random() * letters.length)];
          return { key: randomLetter, keyCode: randomLetter.charCodeAt(0) };
        } else {
          return { keyCode: 13 }; // Submit
        }
      } else {
        // Select random answer
        const randomIndex = Math.floor(Math.random() * gameState.currentQuestion.options.length);
        return { keyCode: 49 + randomIndex }; // Keys 1-4
      }
    }
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    if (p.frameCount % 120 === 0) {
      return { keyCode: 82 }; // R to restart
    }
  }
  
  return null;
}

function getWinTestAction(p) {
  // Win test: Always select correct answers
  if (gameState.gamePhase === GAME_PHASES.START) {
    if (p.frameCount > 60) {
      return { keyCode: 13 }; // ENTER
    }
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    if (!gameState.showingFeedback && p.frameCount % 60 === 0) {
      const miniGameType = gameState.currentLevelData.miniGameType;
      const question = gameState.currentQuestion;
      
      if (miniGameType === 'TYPING') {
        // Type correct answer letter by letter
        const correctAnswer = question.correctAnswer.toLowerCase();
        
        if (gameState.typedAnswer.length < correctAnswer.length) {
          const nextChar = correctAnswer[gameState.typedAnswer.length];
          return { key: nextChar, keyCode: nextChar.charCodeAt(0) };
        } else {
          return { keyCode: 13 }; // Submit
        }
      } else {
        // Find correct answer index
        const correctIndex = question.options.indexOf(question.correctAnswer);
        if (correctIndex !== -1) {
          return { keyCode: 49 + correctIndex }; // Keys 1-4
        }
      }
    }
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    if (p.frameCount % 120 === 0) {
      return { keyCode: 82 }; // R to restart
    }
  }
  
  return null;
}

export function executeTestAction(p, action) {
  if (!action) return;
  
  // Simulate key press
  if (action.key || action.keyCode) {
    p.keyCode = action.keyCode || action.key.charCodeAt(0);
    p.key = action.key || String.fromCharCode(action.keyCode);
    
    // Trigger the keyPressed handler
    if (typeof p._handleKeyPressed === 'function') {
      p._handleKeyPressed();
    }
  }
}