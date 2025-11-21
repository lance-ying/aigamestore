// utils.js - Utility functions
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, ROOM_WIDTH, ROOM_HEIGHT } from './globals.js';

export function worldToScreen(worldX, worldY) {
  return {
    x: worldX - gameState.cameraX + CANVAS_WIDTH / 2,
    y: worldY - gameState.cameraY + CANVAS_HEIGHT / 2
  };
}

export function screenToWorld(screenX, screenY) {
  return {
    x: screenX + gameState.cameraX - CANVAS_WIDTH / 2,
    y: screenY + gameState.cameraY - CANVAS_HEIGHT / 2
  };
}

export function updateCamera(targetX, targetY) {
  // Camera bounds
  const minX = CANVAS_WIDTH / 2;
  const maxX = ROOM_WIDTH - CANVAS_WIDTH / 2;
  const minY = CANVAS_HEIGHT / 2;
  const maxY = ROOM_HEIGHT - CANVAS_HEIGHT / 2;
  
  gameState.cameraX = Math.max(minX, Math.min(maxX, targetX));
  gameState.cameraY = Math.max(minY, Math.min(maxY, targetY));
}

export function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function angleBetween(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function lerp(start, end, t) {
  return start + (end - start) * t;
}

export function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

export function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

export function circleRectCollision(cx, cy, radius, rx, ry, rw, rh) {
  // Find closest point on rectangle to circle center
  const closestX = clamp(cx, rx, rx + rw);
  const closestY = clamp(cy, ry, ry + rh);
  
  // Calculate distance
  const distX = cx - closestX;
  const distY = cy - closestY;
  const distSquared = distX * distX + distY * distY;
  
  return distSquared < radius * radius;
}