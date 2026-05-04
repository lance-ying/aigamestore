// testing.js - Automated testing controllers
import { gameState, GAME_PHASE } from './globals.js';

export function getTestingAction(p, buddy) {
  if (gameState.controlMode === "TEST_1") {
    return getBasicTestAction(p, buddy);
  } else if (gameState.controlMode === "TEST_2") {
    return getWinTestAction(p, buddy);
  }
  return null;
}

function getBasicTestAction(p, buddy) {
  const action = {};
  
  // Auto-start
  if (gameState.gamePhase === GAME_PHASE.START) {
    action.pressEnter = true;
    return action;
  }
  
  // Auto-restart on game over
  if (gameState.gamePhase === GAME_PHASE.GAME_OVER_WIN || 
      gameState.gamePhase === GAME_PHASE.GAME_OVER_LOSE) {
    if (p.frameCount % 120 === 0) {
      action.pressR = true;
    }
    return action;
  }
  
  if (gameState.gamePhase === GAME_PHASE.PLAYING) {
    // Random weapon cycling
    if (p.frameCount % 180 === 0) {
      action.cycleWeapon = p.random() > 0.5 ? "right" : "left";
    }
    
    // Use weapon periodically
    if (p.frameCount % 30 === 0) {
      action.useWeapon = true;
      action.targetX = buddy.getCenter().x + p.random(-50, 50);
      action.targetY = buddy.getCenter().y + p.random(-50, 50);
    }
    
    // Kick periodically
    if (p.frameCount % 45 === 0) {
      action.kick = true;
      action.targetX = buddy.getCenter().x;
      action.targetY = buddy.getCenter().y;
    }
  }
  
  return action;
}

function getWinTestAction(p, buddy) {
  const action = {};
  
  // Auto-start
  if (gameState.gamePhase === GAME_PHASE.START) {
    action.pressEnter = true;
    return action;
  }
  
  // Auto-restart on game over
  if (gameState.gamePhase === GAME_PHASE.GAME_OVER_WIN || 
      gameState.gamePhase === GAME_PHASE.GAME_OVER_LOSE) {
    if (p.frameCount % 120 === 0) {
      action.pressR = true;
    }
    return action;
  }
  
  if (gameState.gamePhase === GAME_PHASE.PLAYING) {
    // Aggressive weapon use to win quickly
    if (p.frameCount % 10 === 0) {
      action.useWeapon = true;
      const center = buddy.getCenter();
      action.targetX = center.x + p.random(-30, 30);
      action.targetY = center.y + p.random(-30, 30);
    }
    
    if (p.frameCount % 8 === 0) {
      action.kick = true;
      action.targetX = buddy.getCenter().x;
      action.targetY = buddy.getCenter().y;
    }
    
    // Cycle to better weapons
    if (p.frameCount % 90 === 0 && gameState.selectedWeaponIndex < 4) {
      action.cycleWeapon = "right";
    }
  }
  
  return action;
}

export function executeTestAction(p, Matter, buddy, action) {
  if (!action) return;
  
  if (action.pressEnter) {
    p.keyCode = 13;
    p.key = 'Enter';
    const handleKeyPressed = require('./input.js').handleKeyPressed;
    handleKeyPressed(p, Matter, buddy, p.key, p.keyCode);
  }
  
  if (action.pressR) {
    p.keyCode = 82;
    p.key = 'r';
    const handleKeyPressed = require('./input.js').handleKeyPressed;
    handleKeyPressed(p, Matter, buddy, p.key, p.keyCode);
  }
  
  if (action.cycleWeapon === "right") {
    gameState.selectedWeaponIndex = (gameState.selectedWeaponIndex + 1) % 5;
  } else if (action.cycleWeapon === "left") {
    gameState.selectedWeaponIndex = (gameState.selectedWeaponIndex - 1 + 5) % 5;
  }
  
  if (action.useWeapon) {
    const useWeapon = require('./weapons.js').useWeapon;
    useWeapon(p, Matter, buddy, action.targetX, action.targetY);
  }
  
  if (action.kick) {
    const useWeapon = require('./weapons.js').useWeapon;
    const prevIndex = gameState.selectedWeaponIndex;
    gameState.selectedWeaponIndex = 0; // Kick is index 0
    useWeapon(p, Matter, buddy, action.targetX, action.targetY);
    gameState.selectedWeaponIndex = prevIndex;
  }
}