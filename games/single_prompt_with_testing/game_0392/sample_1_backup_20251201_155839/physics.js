// physics.js - Physics and collision detection

import { gameState } from './globals.js';

export function updatePhysics() {
  // Update all entities with physics
  gameState.entities.forEach(entity => {
    if (entity.vx !== undefined && entity.vy !== undefined) {
      entity.x += entity.vx;
      entity.y += entity.vy;
      
      // Apply friction
      entity.vx *= gameState.friction;
      entity.vy *= gameState.friction;
    }
  });
}

export function checkCollisions() {
  // Collisions are handled within entity update methods
  // This function can be extended for more complex collision detection
}

export function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function circleCollision(x1, y1, r1, x2, y2, r2) {
  return distance(x1, y1, x2, y2) < r1 + r2;
}

export function rectCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
  return (
    x1 < x2 + w2 &&
    x1 + w1 > x2 &&
    y1 < y2 + h2 &&
    y1 + h1 > y2
  );
}