// testing.js - Automated testing controllers

import { gameState, GAME_PHASES } from './globals.js';

export function getTestAction(p) {
  if (gameState.controlMode === 'HUMAN') {
    return null;
  }
  
  if (gameState.controlMode === 'TEST_1') {
    return getBasicTestAction(p);
  } else if (gameState.controlMode === 'TEST_2') {
    return getWinTestAction(p);
  }
  
  return null;
}

function getBasicTestAction(p) {
  // Simple test: start game, plant some crops, harvest them
  if (gameState.gamePhase === GAME_PHASES.START && p.frameCount > 60) {
    return { type: 'key', keyCode: 13 }; // ENTER
  }
  
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    const frame = p.frameCount;
    
    // Open seed menu
    if (frame % 300 === 100) {
      return { type: 'key', keyCode: 32 }; // SPACE
    }
    
    // Plant seed
    if (frame % 300 === 120 && gameState.showingMenu === 'seed') {
      return { type: 'key', keyCode: 49 }; // '1'
    }
    
    // Move around
    if (frame % 100 === 0) {
      return { type: 'key', keyCode: 39 }; // RIGHT
    }
    
    // Try to harvest
    if (frame % 200 === 0) {
      return { type: 'key', keyCode: 32 }; // SPACE
    }
  }
  
  return null;
}

function getWinTestAction(p) {
  // Fast test: quickly complete objectives
  if (gameState.gamePhase === GAME_PHASES.START && p.frameCount > 30) {
    return { type: 'key', keyCode: 13 }; // ENTER
  }
  
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    // Cheat: add resources directly for testing
    if (p.frameCount % 60 === 0) {
      gameState.playerGold += 100;
      gameState.resources.wheat += 10;
      gameState.resources.egg += 5;
      gameState.resources.bread += 2;
      gameState.score += 100;
    }
    
    // Try various actions
    const action = p.frameCount % 180;
    if (action === 10) {
      return { type: 'key', keyCode: 32 }; // Interact
    } else if (action === 50) {
      return { type: 'key', keyCode: 90 }; // Menu
    } else if (action === 70 && gameState.showingMenu) {
      return { type: 'key', keyCode: 49 }; // Select option
    }
  }
  
  return null;
}

export function executeTestAction(action, p) {
  if (!action) return;
  
  if (action.type === 'key') {
    // Simulate key press
    const key = String.fromCharCode(action.keyCode);
    p.keyCode = action.keyCode;
    p.key = key;
    
    const keyPressedFunc = p._events.keyPressed;
    if (keyPressedFunc) {
      keyPressedFunc();
    }
  }
}