// testing.js - Automated testing controllers

import { gameState, CONTROL_TEST_1, CONTROL_TEST_2 } from './globals.js';

export function getTestAction(p) {
  if (gameState.controlMode === CONTROL_TEST_1) {
    return getTest1Action(p);
  } else if (gameState.controlMode === CONTROL_TEST_2) {
    return getTest2Action(p);
  }
  return null;
}

function getTest1Action(p) {
  // Basic testing - move around and collect pellets
  gameState.testModeTimer++;
  
  if (gameState.testModeTimer % 120 < 60) {
    return { left: true, right: false, boost: false };
  } else {
    return { left: false, right: true, boost: false };
  }
}

function getTest2Action(p) {
  // Win mode - aggressively collect and boost
  if (!gameState.player || !gameState.player.isAlive) {
    return { left: false, right: false, boost: false };
  }
  
  const head = gameState.player.getHead();
  
  // Find nearest food
  const allFood = [...gameState.pellets, ...gameState.massDrops];
  let nearestFood = null;
  let nearestDist = Infinity;
  
  for (let food of allFood) {
    const dist = p.dist(head.x, head.y, food.pos.x, food.pos.y);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestFood = food;
    }
  }
  
  if (!nearestFood) {
    return { left: false, right: false, boost: false };
  }
  
  // Calculate angle to food
  const desired = p.createVector(nearestFood.pos.x - head.x, nearestFood.pos.y - head.y);
  desired.normalize();
  
  const angleDiff = gameState.player.direction.angleBetween(desired);
  
  const shouldBoost = nearestDist > 100 && gameState.player.segments.length > 20;
  
  if (Math.abs(angleDiff) > 0.3) {
    return {
      left: angleDiff < 0,
      right: angleDiff > 0,
      boost: false
    };
  }
  
  return { left: false, right: false, boost: shouldBoost };
}