// automated_testing_controller.js - Automated testing

import { 
  gameState, 
  PHASE_PLAYING,
  WEAPONS,
  CANVAS_WIDTH 
} from './globals.js';
import { clamp } from './utils.js';

let testState = {
  targetAngle: 45,
  targetPower: 50,
  shotsFired: 0,
  lastPlayerX: 0,
  lastPlayerY: 0,
  stuckFrames: 0,
  currentTargetIndex: 0
};

function getTestWinAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return { keyCode: null };
  }
  
  if (gameState.currentTurn !== 'player') {
    return { keyCode: null };
  }

  // Find closest alive enemy
  const aliveEnemies = gameState.enemies.filter(e => e.alive);
  if (aliveEnemies.length === 0) {
    return { keyCode: null };
  }

  // Select target (cycle through enemies)
  const target = aliveEnemies[testState.currentTargetIndex % aliveEnemies.length];
  
  // Calculate optimal shot
  const player = gameState.player;
  const dx = target.x - player.x;
  const dy = target.y - player.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Calculate angle to target
  let targetAngle = Math.atan2(dy, dx) * 180 / Math.PI;
  targetAngle = clamp(targetAngle, 0, 180);
  
  // Adjust for wind
  const windAdjustment = gameState.windSpeed * gameState.windDirection * 5;
  targetAngle = clamp(targetAngle - windAdjustment, 0, 180);
  
  // Calculate power based on distance
  let targetPower = Math.min(100, (distance / 4) + 30);
  targetPower = clamp(targetPower, 30, 100);
  
  // Adjust angle
  const angleDiff = targetAngle - gameState.playerAngle;
  if (Math.abs(angleDiff) > 2) {
    return { keyCode: angleDiff > 0 ? 37 : 39 }; // Left/Right arrow
  }
  
  // Adjust power
  const powerDiff = targetPower - gameState.playerPower;
  if (Math.abs(powerDiff) > 2) {
    return { keyCode: powerDiff > 0 ? 38 : 40 }; // Up/Down arrow
  }
  
  // Fire when ready
  if (gameState.shotsThisTurn === 0) {
    testState.shotsFired++;
    if (testState.shotsFired % 3 === 0) {
      testState.currentTargetIndex++;
    }
    return { keyCode: 32 }; // Space
  }
  
  return { keyCode: null };
}

function getTestBasicAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return { keyCode: null };
  }
  
  if (gameState.currentTurn !== 'player') {
    return { keyCode: null };
  }

  const frame = gameState.entities[0] ? gameState.entities[0].p.frameCount : 0;
  
  // Cycle through different angles and powers
  if (frame % 120 < 30) {
    return { keyCode: 37 }; // Adjust angle left
  } else if (frame % 120 < 60) {
    return { keyCode: 38 }; // Increase power
  } else if (frame % 120 < 90) {
    return { keyCode: 39 }; // Adjust angle right
  } else if (frame % 120 < 110) {
    return { keyCode: 40 }; // Decrease power
  } else if (frame % 120 === 110 && gameState.shotsThisTurn === 0) {
    return { keyCode: 32 }; // Fire
  }
  
  return { keyCode: null };
}

function getTestWeaponAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return { keyCode: null };
  }
  
  if (gameState.currentTurn !== 'player') {
    return { keyCode: null };
  }

  const frame = gameState.entities[0] ? gameState.entities[0].p.frameCount : 0;
  
  // Switch weapons periodically
  if (frame % 180 === 0 && gameState.unlockedWeapons.length > 1) {
    return { keyCode: 90 }; // Z to switch weapon
  }
  
  // Use basic firing pattern
  return getTestBasicAction(gameState);
}

function getRandomAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return { keyCode: null };
  }
  
  if (gameState.currentTurn !== 'player') {
    return { keyCode: null };
  }

  const actions = [37, 39, 38, 40, null, null]; // Arrow keys and nulls
  
  if (gameState.shotsThisTurn === 0 && Math.random() < 0.05) {
    return { keyCode: 32 }; // Occasionally fire
  }
  
  const randomAction = actions[Math.floor(Math.random() * actions.length)];
  return { keyCode: randomAction };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestWeaponAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;