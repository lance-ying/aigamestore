// testing.js - Automated testing controllers
import { gameState, GAME_PHASES } from './globals.js';
import { keys } from './input.js';

export function getTestingAction(p) {
  if (gameState.controlMode === 'HUMAN') {
    return null;
  }
  
  const action = { keys: {} };
  
  switch (gameState.controlMode) {
    case 'TEST_1':
      return getBasicTestAction(p);
    case 'TEST_2':
      return getWinTestAction(p);
    default:
      return null;
  }
}

function getBasicTestAction(p) {
  const action = { keys: {} };
  
  if (gameState.gamePhase === GAME_PHASES.START) {
    action.keys.enter = p.frameCount % 120 === 60;
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    const player = gameState.player;
    if (!player) return action;
    
    // Simple movement pattern - avoid edges
    if (player.x < 100) action.keys.d = true;
    if (player.x > 500) action.keys.a = true;
    if (player.y < 100) action.keys.s = true;
    if (player.y > 300) action.keys.w = true;
    
    // Random movement if in safe zone
    if (p.frameCount % 120 < 30) action.keys.w = true;
    else if (p.frameCount % 120 < 60) action.keys.s = true;
    else if (p.frameCount % 120 < 90) action.keys.a = true;
    else action.keys.d = true;
    
    // Use dash occasionally
    if (p.frameCount % 180 === 0) {
      action.keys.shift = true;
    }
  } else if (gameState.gamePhase === GAME_PHASES.LEVEL_UP_MENU) {
    if (p.frameCount % 60 === 30) {
      action.keys.space = true;
    }
  } else if (gameState.gamePhase === GAME_PHASES.WAVE_COMPLETE) {
    if (p.frameCount % 120 === 60) {
      action.keys.space = true;
    }
  }
  
  return action;
}

function getWinTestAction(p) {
  const action = { keys: {} };
  
  if (gameState.gamePhase === GAME_PHASES.START) {
    action.keys.enter = p.frameCount % 120 === 60;
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    const player = gameState.player;
    if (!player) return action;
    
    // Boost player stats for quick win
    if (p.frameCount % 300 === 0) {
      player.damageStat *= 1.5;
      player.maxHP += 50;
      player.currentHP = player.maxHP;
      player.attackSpeedStat *= 1.2;
      player.movementSpeedStat += 1;
    }
    
    // Aggressive circular movement
    const angle = (p.frameCount * 0.05) % (Math.PI * 2);
    const centerX = 300;
    const centerY = 200;
    const radius = 120;
    const targetX = centerX + Math.cos(angle) * radius;
    const targetY = centerY + Math.sin(angle) * radius;
    
    if (player.x < targetX - 10) action.keys.d = true;
    if (player.x > targetX + 10) action.keys.a = true;
    if (player.y < targetY - 10) action.keys.s = true;
    if (player.y > targetY + 10) action.keys.w = true;
    
    // Spam dash
    if (p.frameCount % 90 === 0) {
      action.keys.shift = true;
    }
  } else if (gameState.gamePhase === GAME_PHASES.LEVEL_UP_MENU) {
    // Always pick first option (usually damage)
    if (p.frameCount % 30 === 15) {
      action.keys.space = true;
    }
  } else if (gameState.gamePhase === GAME_PHASES.WAVE_COMPLETE) {
    if (p.frameCount % 60 === 30) {
      action.keys.space = true;
    }
  }
  
  return action;
}

export function applyTestingAction(action) {
  if (!action) return;
  
  // Clear all keys first
  for (const key in keys) {
    keys[key] = false;
  }
  
  // Apply testing action
  if (action.keys) {
    for (const key in action.keys) {
      if (keys.hasOwnProperty(key)) {
        keys[key] = action.keys[key];
      }
    }
  }
}