// automated_testing_controller.js - Automated testing logic
import { distance, normalizeAngle } from './utils.js';
import { ARENA_CENTER_X, ARENA_CENTER_Y, ARENA_RADIUS } from './globals.js';

function getTestWinAction(gameState) {
  if (!gameState.player || !gameState.player.isAlive) {
    return { turn: null, boost: false };
  }

  const head = gameState.player.getHead();
  
  // Priority 1: Avoid arena boundaries
  const distFromCenter = distance(head.x, head.y, ARENA_CENTER_X, ARENA_CENTER_Y);
  if (distFromCenter > ARENA_RADIUS - 40) {
    const angleToCenter = Math.atan2(ARENA_CENTER_Y - head.y, ARENA_CENTER_X - head.x);
    return { turn: 'angle', angle: angleToCenter, boost: false };
  }

  // Priority 2: Avoid AI worms
  let nearestThreat = null;
  let minThreatDist = Infinity;
  
  for (const aiData of gameState.aiWorms) {
    if (!aiData.worm.isAlive) continue;
    
    for (let i = 2; i < aiData.worm.segments.length; i++) {
      const seg = aiData.worm.segments[i];
      const dist = distance(head.x, head.y, seg.x, seg.y);
      if (dist < 50 && dist < minThreatDist) {
        minThreatDist = dist;
        nearestThreat = { x: seg.x, y: seg.y };
      }
    }
  }

  if (nearestThreat && minThreatDist < 30) {
    const avoidAngle = Math.atan2(head.y - nearestThreat.y, head.x - nearestThreat.x);
    return { turn: 'angle', angle: avoidAngle, boost: true };
  }

  // Priority 3: Target powerups
  let nearestPowerup = null;
  let minPowerupDist = Infinity;
  
  for (const powerup of gameState.powerups) {
    if (!powerup.active) continue;
    const dist = distance(head.x, head.y, powerup.x, powerup.y);
    if (dist < 150 && dist < minPowerupDist) {
      minPowerupDist = dist;
      nearestPowerup = powerup;
    }
  }

  if (nearestPowerup) {
    const powerupAngle = Math.atan2(nearestPowerup.y - head.y, nearestPowerup.x - head.x);
    const shouldBoost = minPowerupDist > 60 && gameState.player.mass > 100;
    return { turn: 'angle', angle: powerupAngle, boost: shouldBoost };
  }

  // Priority 4: Collect food efficiently
  let nearestFood = null;
  let minFoodDist = Infinity;
  
  for (const food of gameState.foods) {
    if (!food.active) continue;
    const dist = distance(head.x, head.y, food.x, food.y);
    if (dist < 120 && dist < minFoodDist) {
      minFoodDist = dist;
      nearestFood = food;
    }
  }

  if (nearestFood) {
    const foodAngle = Math.atan2(nearestFood.y - head.y, nearestFood.x - head.x);
    return { turn: 'angle', angle: foodAngle, boost: false };
  }

  // Priority 5: Hunt weak AI worms
  for (const aiData of gameState.aiWorms) {
    if (!aiData.worm.isAlive || aiData.worm.mass > gameState.player.mass * 0.8) continue;
    
    const aiHead = aiData.worm.getHead();
    const distToAi = distance(head.x, head.y, aiHead.x, aiHead.y);
    
    if (distToAi < 100 && gameState.player.mass > aiData.worm.mass) {
      const interceptAngle = Math.atan2(aiHead.y - head.y, aiHead.x - head.x);
      return { turn: 'angle', angle: interceptAngle, boost: true };
    }
  }

  // Default: Move towards center with slight spiral
  const currentAngle = gameState.player.angle;
  const spiralAngle = currentAngle + 0.1;
  return { turn: 'angle', angle: spiralAngle, boost: false };
}

function getBasicTestAction(gameState) {
  if (!gameState.player || !gameState.player.isAlive) {
    return { turn: null, boost: false };
  }

  const head = gameState.player.getHead();
  
  // Avoid boundaries
  const distFromCenter = distance(head.x, head.y, ARENA_CENTER_X, ARENA_CENTER_Y);
  if (distFromCenter > ARENA_RADIUS - 50) {
    const angleToCenter = Math.atan2(ARENA_CENTER_Y - head.y, ARENA_CENTER_X - head.x);
    return { turn: 'angle', angle: angleToCenter, boost: false };
  }

  // Find nearest food
  let nearestFood = null;
  let minDist = Infinity;
  
  for (const food of gameState.foods) {
    if (!food.active) continue;
    const dist = distance(head.x, head.y, food.x, food.y);
    if (dist < minDist) {
      minDist = dist;
      nearestFood = food;
    }
  }

  if (nearestFood) {
    const foodAngle = Math.atan2(nearestFood.y - head.y, nearestFood.x - head.x);
    return { turn: 'angle', angle: foodAngle, boost: false };
  }

  return { turn: null, boost: false };
}

function getCollisionTestAction(gameState) {
  if (!gameState.player || !gameState.player.isAlive) {
    return { turn: null, boost: false };
  }

  const head = gameState.player.getHead();
  
  // Move towards boundary to test collision
  const angleToBoundary = Math.atan2(head.y - ARENA_CENTER_Y, head.x - ARENA_CENTER_X);
  return { turn: 'angle', angle: angleToBoundary, boost: true };
}

function getPowerupTestAction(gameState) {
  if (!gameState.player || !gameState.player.isAlive) {
    return { turn: null, boost: false };
  }

  const head = gameState.player.getHead();
  
  // Avoid boundaries first
  const distFromCenter = distance(head.x, head.y, ARENA_CENTER_X, ARENA_CENTER_Y);
  if (distFromCenter > ARENA_RADIUS - 40) {
    const angleToCenter = Math.atan2(ARENA_CENTER_Y - head.y, ARENA_CENTER_X - head.x);
    return { turn: 'angle', angle: angleToCenter, boost: false };
  }

  // Aggressively seek powerups
  let nearestPowerup = null;
  let minDist = Infinity;
  
  for (const powerup of gameState.powerups) {
    if (!powerup.active) continue;
    const dist = distance(head.x, head.y, powerup.x, powerup.y);
    if (dist < minDist) {
      minDist = dist;
      nearestPowerup = powerup;
    }
  }

  if (nearestPowerup) {
    const powerupAngle = Math.atan2(nearestPowerup.y - head.y, nearestPowerup.x - head.x);
    return { turn: 'angle', angle: powerupAngle, boost: true };
  }

  // Otherwise collect food
  return getBasicTestAction(gameState);
}

function getRandomAction(gameState) {
  const actions = ['up', 'down', 'left', 'right', null];
  const turn = actions[Math.floor(Math.random() * actions.length)];
  const boost = Math.random() < 0.1;
  return { turn, boost };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getCollisionTestAction(gameState);
    case "TEST_4":
      return getPowerupTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;