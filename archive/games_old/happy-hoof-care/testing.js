// testing.js - Automated testing controllers
import { gameState, GAME_PHASES, GAME_STATES } from './globals.js';
import { handleKeyPressed } from './input.js';

export function getTestAction(p) {
  if (gameState.controlMode === 'HUMAN') {
    return null;
  }
  
  const testMode = gameState.controlMode;
  
  if (testMode === 'TEST_1') {
    return getBasicTestAction(p);
  } else if (testMode === 'TEST_2') {
    return getWinTestAction(p);
  }
  
  return null;
}

function getBasicTestAction(p) {
  // Basic testing: Start game, select first animal, play one minigame
  const ENTER = 13, SPACE = 32;
  
  if (gameState.gamePhase === GAME_PHASES.START) {
    if (p.frameCount % 60 === 30) {
      return { keyCode: ENTER, type: 'press' };
    }
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    if (gameState.currentState === GAME_STATES.ANIMAL_SELECT) {
      if (p.frameCount % 60 === 30) {
        return { keyCode: SPACE, type: 'press' };
      }
    } else if (gameState.currentState === GAME_STATES.MINIGAME_INTRO) {
      if (p.frameCount % 60 === 30) {
        return { keyCode: SPACE, type: 'press' };
      }
    } else if (gameState.currentState === GAME_STATES.MINIGAME_PLAYING) {
      // Random movements
      const keys = [37, 38, 39, 40, 32];
      if (p.frameCount % 10 === 0) {
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        return { keyCode: randomKey, type: 'press' };
      }
    } else if (gameState.currentState === GAME_STATES.MINIGAME_COMPLETE) {
      if (p.frameCount % 60 === 30) {
        return { keyCode: SPACE, type: 'press' };
      }
    }
  }
  
  return null;
}

function getWinTestAction(p) {
  // Optimized play to win
  const ENTER = 13, SPACE = 32;
  const LEFT = 37, UP = 38, RIGHT = 39, DOWN = 40;
  
  if (gameState.gamePhase === GAME_PHASES.START) {
    if (p.frameCount % 60 === 30) {
      return { keyCode: ENTER, type: 'press' };
    }
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    if (gameState.currentState === GAME_STATES.ANIMAL_SELECT) {
      if (p.frameCount % 60 === 30) {
        return { keyCode: SPACE, type: 'press' };
      }
    } else if (gameState.currentState === GAME_STATES.MINIGAME_INTRO) {
      if (p.frameCount % 60 === 30) {
        return { keyCode: SPACE, type: 'press' };
      }
    } else if (gameState.currentState === GAME_STATES.MINIGAME_PLAYING) {
      // Aggressive optimal play
      if (gameState.miniGameData) {
        const data = gameState.miniGameData;
        
        if (data.type === 'SHAVING' || data.type === 'SHOWERING') {
          // Move cursor in sweep pattern and activate
          const cycle = (p.frameCount % 200);
          if (cycle < 100) {
            if (p.frameCount % 5 === 0) return { keyCode: RIGHT, type: 'press' };
          } else {
            if (p.frameCount % 5 === 0) return { keyCode: LEFT, type: 'press' };
          }
          if (p.frameCount % 3 === 0) {
            return { keyCode: SPACE, type: 'press' };
          }
        } else if (data.type === 'MAZE') {
          // Navigate toward goal
          const dx = data.goalX - data.animalX;
          const dy = data.goalY - data.animalY;
          
          if (Math.abs(dx) > Math.abs(dy)) {
            return { keyCode: dx > 0 ? RIGHT : LEFT, type: 'press' };
          } else {
            return { keyCode: dy > 0 ? DOWN : UP, type: 'press' };
          }
        } else if (data.type === 'FEEDING') {
          // Grab and feed
          if (p.frameCount % 40 < 20) {
            return { keyCode: LEFT, type: 'press' };
          } else if (p.frameCount % 40 < 30) {
            return { keyCode: SPACE, type: 'press' };
          } else {
            return { keyCode: RIGHT, type: 'press' };
          }
        }
      }
    } else if (gameState.currentState === GAME_STATES.MINIGAME_COMPLETE) {
      if (p.frameCount % 60 === 30) {
        return { keyCode: SPACE, type: 'press' };
      }
    } else if (gameState.currentState === GAME_STATES.LEVEL_COMPLETE) {
      if (p.frameCount % 60 === 30) {
        return { keyCode: SPACE, type: 'press' };
      }
    }
  }
  
  return null;
}

export function executeTestAction(p, action) {
  if (!action) return;
  
  if (action.type === 'press') {
    // Simulate key press
    handleKeyPressed(p, action.keyCode, String.fromCharCode(action.keyCode));
  }
}