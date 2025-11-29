// physics.js - Physics and collision detection

import { gameState } from './globals.js';

// Check collision between two circular entities
export function checkCircleCollision(entity1, entity2) {
  const dx = entity2.x - entity1.x;
  const dy = entity2.y - entity1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const minDistance = (entity1.width || entity1.radius || 10) / 2 + 
                      (entity2.width || entity2.radius || 10) / 2;
  return distance < minDistance;
}

// Check if point is inside circle
export function pointInCircle(px, py, cx, cy, radius) {
  const dx = px - cx;
  const dy = py - cy;
  return Math.sqrt(dx * dx + dy * dy) < radius;
}

// Check if point is inside rectangle
export function pointInRect(px, py, rx, ry, width, height) {
  return px >= rx - width / 2 && px <= rx + width / 2 &&
         py >= ry - height / 2 && py <= ry + height / 2;
}

// Get distance between two points
export function getDistance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

// Get angle between two points
export function getAngle(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

// Normalize a vector
export function normalize(x, y) {
  const length = Math.sqrt(x * x + y * y);
  if (length === 0) return { x: 0, y: 0 };
  return { x: x / length, y: y / length };
}

// Linear interpolation
export function lerp(start, end, t) {
  return start + (end - start) * t;
}

// Clamp value between min and max
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// Update target lock system
export function updateTargetLock(p) {
  if (!gameState.player) return;
  
  // Find nearest enemy
  let nearestEnemy = null;
  let nearestDistance = Infinity;
  
  for (const enemy of gameState.enemies) {
    const distance = getDistance(
      gameState.player.x,
      gameState.player.y,
      enemy.x,
      enemy.y
    );
    
    // Only lock on enemies in front
    const angle = getAngle(
      gameState.player.x,
      gameState.player.y,
      enemy.x,
      enemy.y
    );
    const angleDiff = Math.abs(angle - gameState.player.angle);
    
    if (distance < nearestDistance && distance < 250 && angleDiff < Math.PI / 3) {
      nearestDistance = distance;
      nearestEnemy = enemy;
    }
  }
  
  // Update lock progress
  if (nearestEnemy && nearestEnemy === gameState.lockedTarget) {
    gameState.lockProgress = Math.min(1, gameState.lockProgress + 0.02);
  } else if (nearestEnemy) {
    gameState.lockedTarget = nearestEnemy;
    gameState.lockProgress = 0;
  } else {
    gameState.lockedTarget = null;
    gameState.lockProgress = 0;
  }
}