// physics.js - Physics and collision detection

import { gameState } from './globals.js';

// Update all physics entities
export function updatePhysics(p) {
  // Update all entities
  gameState.entities.forEach(entity => {
    if (entity.update) {
      entity.update(p);
    }
  });
  
  // Update platforms
  gameState.platforms.forEach(platform => {
    if (platform.update) {
      platform.update(p);
    }
  });
  
  // Update and remove dead particles
  for (let i = gameState.particles.length - 1; i >= 0; i--) {
    const particle = gameState.particles[i];
    particle.update(p);
    if (particle.isDead()) {
      gameState.particles.splice(i, 1);
    }
  }
}

// Check collision between two circles
export function checkCircleCollision(circle1, circle2) {
  const dx = circle2.x - circle1.x;
  const dy = circle2.y - circle1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < (circle1.radius + circle2.radius);
}

// Check if point is in rectangle
export function checkPointRectCollision(px, py, rect) {
  return (
    px >= rect.x &&
    px <= rect.x + rect.width &&
    py >= rect.y &&
    py <= rect.y + rect.height
  );
}

// Check AABB collision
export function checkAABBCollision(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

// Apply impulse to separate two colliding circles
export function separateCircles(circle1, circle2) {
  const dx = circle2.x - circle1.x;
  const dy = circle2.y - circle1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance === 0) return;
  
  const overlap = (circle1.radius + circle2.radius) - distance;
  const nx = dx / distance;
  const ny = dy / distance;
  
  const separation = overlap * 0.5;
  circle1.x -= nx * separation;
  circle1.y -= ny * separation;
  circle2.x += nx * separation;
  circle2.y += ny * separation;
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