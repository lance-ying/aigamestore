// physics.js - Physics and collision detection

import { gameState } from './globals.js';

// Check collision between two rectangles
export function checkRectCollision(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}

// Check collision between two circles
export function checkCircleCollision(circle1, circle2) {
  const dx = circle2.x - circle1.x;
  const dy = circle2.y - circle1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < (circle1.radius + circle2.radius);
}

// Check if point is inside rectangle
export function pointInRect(px, py, rect) {
  return (
    px >= rect.x &&
    px <= rect.x + rect.width &&
    py >= rect.y &&
    py <= rect.y + rect.height
  );
}

// Get distance between two points
export function getDistance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

// Clamp value between min and max
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// Linear interpolation
export function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

// Check if door blocks character movement
export function isDoorBlocking(character, door) {
  if (!door.blocksMovement()) return false;
  
  const charBounds = character.getBounds();
  return (
    charBounds.right > door.x &&
    charBounds.left < door.x + door.width &&
    charBounds.bottom > door.y &&
    charBounds.top < door.y + door.height
  );
}