// controls.js - Input handling and control modes

import { gameState, GAME_PHASES, CONTROL_MODES } from './globals.js';

export function handleInput(p, keyCode) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return;
  }
  
  if (gameState.controlMode === CONTROL_MODES.HUMAN) {
    if (keyCode === 32) { // SPACE
      return { action: 'dropBall' };
    }
  }
  
  return null;
}

export function updateTestMode(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return;
  }
  
  gameState.testFrameCounter++;
  
  switch (gameState.controlMode) {
    case CONTROL_MODES.TEST_1:
      // Drop 3 balls in quick succession
      if (gameState.testFrameCounter === 30 || 
          gameState.testFrameCounter === 42 || 
          gameState.testFrameCounter === 54) {
        return { action: 'dropBall' };
      }
      break;
      
    case CONTROL_MODES.TEST_2:
      // Drop balls strategically to win
      if (gameState.testFrameCounter % 20 === 0 && gameState.ballsRemaining > 0) {
        return { action: 'dropBall' };
      }
      break;
      
    case CONTROL_MODES.TEST_3:
      // Drop all balls quickly to test lose condition
      if (gameState.testFrameCounter % 10 === 0 && gameState.ballsRemaining > 0) {
        return { action: 'dropBall' };
      }
      break;
      
    case CONTROL_MODES.TEST_4:
      // Win level to test progression
      if (gameState.testFrameCounter % 25 === 0 && gameState.ballsRemaining > 0) {
        return { action: 'dropBall' };
      }
      break;
      
    case CONTROL_MODES.TEST_5:
      // Drop ball then pause
      if (gameState.testFrameCounter === 30) {
        return { action: 'dropBall' };
      }
      if (gameState.testFrameCounter === 60) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
      }
      if (gameState.testFrameCounter === 120) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
      }
      break;
      
    case CONTROL_MODES.TEST_6:
      // Rapid fire testing (should be limited by cooldown)
      if (gameState.testFrameCounter % 3 === 0 && gameState.ballsRemaining > 0) {
        return { action: 'dropBall' };
      }
      break;
      
    case CONTROL_MODES.TEST_7:
      // Drop balls at different times to test various impacts
      if ([20, 50, 80, 110, 140].includes(gameState.testFrameCounter)) {
        return { action: 'dropBall' };
      }
      break;
  }
  
  return null;
}