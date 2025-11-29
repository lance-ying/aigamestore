// physics.js - Physics and collision detection

import { gameState } from './globals.js';

export function checkCircleCollision(obj1, obj2, r1, r2) {
  const dx = obj2.x - obj1.x;
  const dy = obj2.y - obj1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < (r1 + r2);
}

export function checkRectCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
  return (
    x1 < x2 + w2 &&
    x1 + w1 > x2 &&
    y1 < y2 + h2 &&
    y1 + h1 > y2
  );
}

export function applyPhysics(entity) {
  // Apply velocity
  entity.x += entity.vx;
  entity.y += entity.vy;
  
  // Apply friction
  entity.vx *= gameState.friction;
  entity.vy *= gameState.friction;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function angle(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}