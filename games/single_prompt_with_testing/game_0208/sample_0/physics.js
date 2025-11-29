// physics.js - Physics and collision detection

import { gameState } from './globals.js';

export function updatePhysics() {
  // Update all entities with physics
  for (const entity of gameState.entities) {
    if (entity.active && entity.update) {
      // Physics is handled in entity update methods
    }
  }
}

export function checkCollisions() {
  // Collision detection is handled in entity update methods
  // This function is here for potential future optimizations
}

// Helper function for AABB collision
export function checkAABBCollision(box1, box2) {
  return (
    box1.x - box1.width / 2 < box2.x + box2.width / 2 &&
    box1.x + box1.width / 2 > box2.x - box2.width / 2 &&
    box1.y - box1.height / 2 < box2.y + box2.height / 2 &&
    box1.y + box1.height / 2 > box2.y - box2.height / 2
  );
}

// Helper function for circle collision
export function checkCircleCollision(circle1, circle2) {
  const dx = circle2.x - circle1.x;
  const dy = circle2.y - circle1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < (circle1.radius + circle2.radius);
}

// Helper function for distance calculation
export function getDistance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}