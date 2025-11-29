// input.js - Input handling

import { gameState, GAME_PHASES } from './globals.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase-specific handling
  if (gameState.gamePhase === GAME_PHASES.START) {
    if (keyCode === 13) { // ENTER
      return { action: 'START_GAME' };
    }
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    if (keyCode === 27) { // ESC
      return { action: 'PAUSE' };
    } else if (keyCode === 72) { // H - Hint
      return { action: 'USE_HINT' };
    } else if (!gameState.showingFeedback) {
      return handlePlayingInput(p, key, keyCode);
    }
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    if (keyCode === 27) { // ESC
      return { action: 'RESUME' };
    } else if (keyCode === 82) { // R
      return { action: 'RESTART' };
    }
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    if (keyCode === 82) { // R
      return { action: 'RESTART' };
    }
  }
  
  return null;
}

function handlePlayingInput(p, key, keyCode) {
  const miniGameType = gameState.currentLevelData.miniGameType;
  
  // Handle typing game
  if (miniGameType === 'TYPING') {
    if (keyCode === 8) { // Backspace
      if (gameState.typedAnswer.length > 0) {
        gameState.typedAnswer = gameState.typedAnswer.slice(0, -1);
      }
    } else if (keyCode === 13 || keyCode === 32) { // Enter or Space to submit
      return { action: 'SUBMIT_ANSWER' };
    } else if (key.length === 1 && key.match(/[a-zA-Z]/)) {
      if (gameState.typedAnswer.length < 20) {
        gameState.typedAnswer += key.toLowerCase();
      }
    }
  } else {
    // Multiple choice navigation
    if (keyCode === 38) { // Arrow Up
      gameState.selectedAnswerIndex = Math.max(0, gameState.selectedAnswerIndex - 1);
    } else if (keyCode === 40) { // Arrow Down
      const maxIndex = gameState.currentQuestion.options.length - 1;
      if (gameState.selectedAnswerIndex === -1) {
        gameState.selectedAnswerIndex = 0;
      } else {
        gameState.selectedAnswerIndex = Math.min(maxIndex, gameState.selectedAnswerIndex + 1);
      }
    } else if (keyCode === 13 || keyCode === 32) { // Enter or Space
      if (gameState.selectedAnswerIndex >= 0) {
        return { action: 'SUBMIT_ANSWER' };
      }
    } else if (keyCode >= 49 && keyCode <= 52) { // Keys 1-4
      const index = keyCode - 49;
      if (index < gameState.currentQuestion.options.length) {
        gameState.selectedAnswerIndex = index;
        return { action: 'SUBMIT_ANSWER' };
      }
    }
  }
  
  return null;
}