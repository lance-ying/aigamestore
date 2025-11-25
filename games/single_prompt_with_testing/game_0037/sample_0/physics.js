// physics.js - Physics and collision detection

import { gameState } from './globals.js';

export function checkWallCollision(x, y, size) {
  const halfSize = size / 2;
  
  for (const wall of gameState.walls) {
    // Check if circle intersects rectangle
    const closestX = Math.max(wall.x, Math.min(x, wall.x + wall.width));
    const closestY = Math.max(wall.y, Math.min(y, wall.y + wall.height));
    
    const distX = x - closestX;
    const distY = y - closestY;
    const distSquared = distX * distX + distY * distY;
    
    if (distSquared < halfSize * halfSize) {
      return true;
    }
  }
  
  return false;
}

export function checkCircleCollision(x1, y1, r1, x2, y2, r2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return dist < r1 + r2;
}