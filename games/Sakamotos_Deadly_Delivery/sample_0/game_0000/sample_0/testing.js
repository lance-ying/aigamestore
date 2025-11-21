// testing.js - Automated testing modes
import { gameState } from './globals.js';

export function getTestAction(p) {
  if (gameState.controlMode === 'HUMAN') return null;
  
  if (gameState.controlMode === 'TEST_1') {
    return getBasicTestAction(p);
  } else if (gameState.controlMode === 'TEST_2') {
    return getWinTestAction(p);
  }
  
  return null;
}

function getBasicTestAction(p) {
  // Basic test: just start the game and place a few objects
  if (gameState.gamePhase === 'START' && p.frameCount === 60) {
    return { type: 'key', keyCode: 13 }; // ENTER
  }
  
  if (gameState.gamePhase === 'PLAYING' && gameState.designPhase) {
    if (p.frameCount === 120) {
      return { type: 'mouse', x: 250, y: 350 };
    }
    if (p.frameCount === 150) {
      return { type: 'key', keyCode: 32 }; // SPACE
    }
  }
  
  return null;
}

function getWinTestAction(p) {
  // Win test: complete level 1
  if (gameState.gamePhase === 'START' && p.frameCount === 60) {
    return { type: 'key', keyCode: 13 };
  }
  
  if (gameState.gamePhase === 'PLAYING' && gameState.designPhase) {
    // Place objects to bridge the gap in level 1
    if (p.frameCount === 120) {
      return { type: 'key', keyCode: 90 }; // Select block
    }
    if (p.frameCount === 130) {
      return { type: 'mouse', x: 250, y: 330 };
    }
    if (p.frameCount === 150) {
      return { type: 'mouse', x: 350, y: 330 };
    }
    if (p.frameCount === 180) {
      return { type: 'key', keyCode: 32 }; // Start simulation
    }
  }
  
  if (gameState.gamePhase === 'GAME_OVER' && p.frameCount > 500) {
    return { type: 'key', keyCode: 82 }; // R to restart
  }
  
  return null;
}

export function executeTestAction(p, action) {
  if (!action) return;
  
  if (action.type === 'key') {
    const { handleKeyPressed } = require('./input.js');
    handleKeyPressed(p, String.fromCharCode(action.keyCode), action.keyCode);
  } else if (action.type === 'mouse') {
    const { placeObject } = require('./input.js');
    placeObject(p, action.x, action.y);
  }
}