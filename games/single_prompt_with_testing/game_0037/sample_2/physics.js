// physics.js - Physics and collision detection systems

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

// Update camera to follow player
export function updateCamera() {
  if (!gameState.player) return;
  
  // Smooth camera following
  const targetX = gameState.player.x - CANVAS_WIDTH / 2;
  const targetY = gameState.player.y - CANVAS_HEIGHT / 2;
  
  gameState.cameraX += (targetX - gameState.cameraX) * 0.1;
  gameState.cameraY += (targetY - gameState.cameraY) * 0.05;
  
  // Clamp camera to level bounds
  gameState.cameraX = Math.max(0, Math.min(gameState.cameraX, gameState.platforms[gameState.platforms.length - 1].x + 200 - CANVAS_WIDTH));
  gameState.cameraY = Math.max(-100, Math.min(gameState.cameraY, CANVAS_HEIGHT - 200));
}

// Check if entity is on screen (for culling)
export function isOnScreen(entity, margin = 50) {
  const screenX = entity.x - gameState.cameraX;
  const screenY = entity.y - gameState.cameraY;
  
  return (
    screenX > -margin &&
    screenX < CANVAS_WIDTH + margin &&
    screenY > -margin &&
    screenY < CANVAS_HEIGHT + margin
  );
}

// AABB collision check
export function checkAABBCollision(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

// Circle collision check
export function checkCircleCollision(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < (a.radius + b.radius);
}

// Point in rect check
export function pointInRect(px, py, rect) {
  return (
    px >= rect.x &&
    px <= rect.x + rect.width &&
    py >= rect.y &&
    py <= rect.y + rect.height
  );
}

// Clamp value between min and max
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// Linear interpolation
export function lerp(start, end, t) {
  return start + (end - start) * t;
}

// Distance between two points
export function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

// Angle between two points
export function angleBetween(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}