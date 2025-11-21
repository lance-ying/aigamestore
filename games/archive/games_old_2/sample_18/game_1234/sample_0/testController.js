// testController.js - Automated testing controller

import { gameState, GAME_PHASES, PLAY_STATES } from './globals.js';

export function getTestAction(p) {
  if (gameState.controlMode === "HUMAN") {
    return null;
  }
  
  // TEST_1: Basic gameplay test
  if (gameState.controlMode === "TEST_1") {
    if (gameState.gamePhase === GAME_PHASES.START) {
      return { keyCode: 13 }; // ENTER to start
    }
    
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (gameState.playState === PLAY_STATES.SPINNING && gameState.wheelSpeed === 0) {
        return { keyCode: 32 }; // SPACE to spin
      }
      
      if (gameState.playState === PLAY_STATES.QUESTION) {
        // Select first answer and confirm
        if (gameState.selectedAnswerIndex < 0) {
          return { keyCode: 38 }; // Arrow up to select answer 1
        } else {
          return { keyCode: 32 }; // SPACE to confirm
        }
      }
      
      if (gameState.playState === PLAY_STATES.LEVEL_COMPLETE) {
        return { keyCode: 32 }; // SPACE to continue
      }
    }
  }
  
  // TEST_2: Try to win by always selecting correct answer
  if (gameState.controlMode === "TEST_2") {
    if (gameState.gamePhase === GAME_PHASES.START) {
      return { keyCode: 13 }; // ENTER to start
    }
    
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (gameState.playState === PLAY_STATES.SPINNING && gameState.wheelSpeed === 0) {
        return { keyCode: 32 }; // SPACE to spin
      }
      
      if (gameState.playState === PLAY_STATES.QUESTION && gameState.currentQuestion) {
        // Select correct answer
        const correctIndex = gameState.currentQuestion.correctIndex;
        if (gameState.selectedAnswerIndex !== correctIndex) {
          // Map correct index to arrow key
          const keyMap = [38, 39, 40, 37]; // Up, Right, Down, Left
          return { keyCode: keyMap[correctIndex] };
        } else {
          return { keyCode: 32 }; // SPACE to confirm
        }
      }
      
      if (gameState.playState === PLAY_STATES.LEVEL_COMPLETE) {
        return { keyCode: 32 }; // SPACE to continue
      }
    }
  }
  
  return null;
}

export function executeTestAction(p, action) {
  if (!action) return;
  
  // Simulate key press
  p.keyCode = action.keyCode;
  p.key = String.fromCharCode(action.keyCode);
  
  // Call the key handler
  const { handleKeyPressed } = require('./input.js');
  handleKeyPressed(p);
}