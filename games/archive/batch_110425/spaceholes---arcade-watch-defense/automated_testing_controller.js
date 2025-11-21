import { gameState } from './globals.js';

function getTestWinAction(gameState) {
  if (!gameState.player || !gameState.player.isAlive) {
    return null;
  }

  // Find nearest enemy
  let nearestEnemy = null;
  let minDist = Infinity;

  for (const enemy of gameState.enemies) {
    if (!enemy.isActive) continue;
    
    const dist = enemy.distanceFromCenter;
    if (dist < minDist) {
      minDist = dist;
      nearestEnemy = enemy;
    }
  }

  if (!nearestEnemy) {
    return null; // No enemies, no action needed
  }

  // Calculate angle to nearest enemy
  const playerAngle = gameState.player.angle;
  const enemyAngle = nearestEnemy.angle;

  // Normalize angle difference to [-PI, PI]
  let angleDiff = enemyAngle - playerAngle;
  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

  // Determine which direction to rotate
  const threshold = 0.05; // Dead zone to prevent jittering

  if (Math.abs(angleDiff) < threshold) {
    return null; // Already aimed
  }

  if (angleDiff > 0) {
    return { keyCode: 39 }; // RIGHT
  } else {
    return { keyCode: 37 }; // LEFT
  }
}

function getRandomAction(gameState) {
  const actions = [
    null,
    { keyCode: 37 }, // LEFT
    { keyCode: 39 }  // RIGHT
  ];
  return actions[Math.floor(Math.random() * actions.length)];
}

function getBasicTestAction(gameState) {
  // Test basic movement - alternate between left and right
  const cycle = Math.floor(gameState.survivalTime / 1000) % 4;
  if (cycle < 2) {
    return { keyCode: 37 }; // LEFT
  } else {
    return { keyCode: 39 }; // RIGHT
  }
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;