// input.js - Input handling

import { gameState, GAME_PHASES, PLAY_STATES } from './globals.js';
import { spinWheel } from './wheel.js';
import { processAnswer, useSkipPowerup, useRemoveTwoPowerup } from './question.js';
import { startLevel, nextLevel } from './gameLoop.js';

export function handleKeyPressed(p) {
  // Log input
  if (p.logs) {
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // ENTER - Start game
  if (p.keyCode === 13 && gameState.gamePhase === GAME_PHASES.START) {
    gameState.gamePhase = GAME_PHASES.PLAYING;
    startLevel(p, 1);
    return;
  }
  
  // ESC - Pause/Unpause
  if (p.keyCode === 27) {
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.noLoop();
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.loop();
    }
    return;
  }
  
  // R - Restart
  if (p.keyCode === 82) {
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE ||
        gameState.gamePhase === GAME_PHASES.PAUSED) {
      restartGame(p);
    }
    return;
  }
  
  // Game-specific controls during PLAYING phase
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    // SPACE - Spin wheel or confirm answer
    if (p.keyCode === 32) {
      if (gameState.playState === PLAY_STATES.SPINNING && gameState.wheelSpeed === 0) {
        spinWheel(p);
      } else if (gameState.playState === PLAY_STATES.QUESTION && gameState.selectedAnswerIndex >= 0) {
        const isCorrect = gameState.selectedAnswerIndex === gameState.currentQuestion.correctIndex;
        processAnswer(p, isCorrect, false);
      } else if (gameState.playState === PLAY_STATES.LEVEL_COMPLETE) {
        nextLevel(p);
      }
      return;
    }
    
    // Arrow keys - Select answer
    if (gameState.playState === PLAY_STATES.QUESTION) {
      if (p.keyCode === 38) { // Up arrow - Answer 1
        gameState.selectedAnswerIndex = 0;
      } else if (p.keyCode === 39) { // Right arrow - Answer 2
        gameState.selectedAnswerIndex = 1;
      } else if (p.keyCode === 40) { // Down arrow - Answer 3
        gameState.selectedAnswerIndex = 2;
      } else if (p.keyCode === 37) { // Left arrow - Answer 4
        gameState.selectedAnswerIndex = 3;
      }
      
      // Z - Skip question
      if (p.keyCode === 90) {
        useSkipPowerup(p);
      }
      
      // Shift - Remove two wrong answers
      if (p.keyCode === 16) {
        useRemoveTwoPowerup(p);
      }
    }
  }
}

function restartGame(p) {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.playState = PLAY_STATES.SPINNING;
  gameState.currentScore = 0;
  gameState.currentLevel = 1;
  
  // Update high score
  if (gameState.currentScore > gameState.highScore) {
    gameState.highScore = gameState.currentScore;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('triviaHighScore', gameState.highScore.toString());
    }
  }
  
  p.loop();
  
  if (p.logs) {
    p.logs.game_info.push({
      data: "Game restarted",
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}