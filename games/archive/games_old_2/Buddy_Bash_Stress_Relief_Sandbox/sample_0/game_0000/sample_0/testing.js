// testing.js - Automated testing controllers

import { gameState, GAME_PHASES } from './globals.js';
import { fireWeapon } from './weapons.js';

export function getTestAction(p) {
  if (gameState.controlMode === "TEST_1") {
    return getBasicTestAction(p);
  } else if (gameState.controlMode === "TEST_2") {
    return getWinTestAction(p);
  }
  return null;
}

function getBasicTestAction(p) {
  const frameCount = p.frameCount;
  
  // Start game
  if (gameState.gamePhase === GAME_PHASES.START && frameCount === 10) {
    return { type: 'keyPress', keyCode: 13 };
  }
  
  // Fire weapon periodically
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    if (frameCount % 30 === 0) {
      fireWeapon(300, 200);
    }
    
    // Cycle weapons
    if (frameCount % 120 === 0) {
      return { type: 'keyPress', keyCode: 39 }; // RIGHT arrow
    }
    
    // Reset Buddy occasionally
    if (frameCount % 180 === 0) {
      return { type: 'keyPress', keyCode: 16 }; // SHIFT
    }
  }
  
  return null;
}

function getWinTestAction(p) {
  const frameCount = p.frameCount;
  
  // Start game
  if (gameState.gamePhase === GAME_PHASES.START && frameCount === 10) {
    return { type: 'keyPress', keyCode: 13 };
  }
  
  // Aggressively fire weapons to win quickly
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    // Fire rapidly
    if (frameCount % 5 === 0) {
      fireWeapon(300, 200);
    }
    
    // Cycle through weapons for variety bonus
    if (frameCount % 60 === 0) {
      return { type: 'keyPress', keyCode: 39 };
    }
    
    // Reset Buddy to keep scoring
    if (frameCount % 90 === 0) {
      return { type: 'keyPress', keyCode: 16 };
    }
  }
  
  return null;
}

export function executeTestAction(p, action) {
  if (!action) return;
  
  if (action.type === 'keyPress') {
    // Simulate key press
    const event = { keyCode: action.keyCode };
    p.keyCode = action.keyCode;
    p.key = String.fromCharCode(action.keyCode);
  }
}