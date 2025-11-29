// utils.js - Utility functions

import { WALLS, PLAYER_RADIUS } from './globals.js';

// Calculate 3D distance between two points
export function distance3D(x1, y1, z1, x2, y2, z2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dz = z2 - z1;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// Calculate 2D distance (ignore Y)
export function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

// Calculate angle between two points
export function angleBetween(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

// Clamp value between min and max
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// Lerp between two values
export function lerp(start, end, t) {
  return start + (end - start) * t;
}

// Check line-circle collision for wall detection (2D)
function lineCircleCollision(x1, y1, x2, y2, cx, cy, radius) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  
  if (len === 0) return false;
  
  const nx = dx / len;
  const ny = dy / len;
  
  const fx = cx - x1;
  const fy = cy - y1;
  
  const projection = fx * nx + fy * ny;
  const clampedProj = Math.max(0, Math.min(len, projection));
  
  const closestX = x1 + nx * clampedProj;
  const closestY = y1 + ny * clampedProj;
  
  const dist = distance(cx, cy, closestX, closestY);
  
  return dist < radius;
}

// Check if position collides with any walls (3D)
export function checkWallCollision3D(x, z, radius = PLAYER_RADIUS) {
  for (const wall of WALLS) {
    if (lineCircleCollision(wall.x1, wall.y1, wall.x2, wall.y2, x, z, radius)) {
      return true;
    }
  }
  return false;
}

// Normalize angle to -PI to PI
export function normalizeAngle(angle) {
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

// Calculate angle difference (shortest path)
export function angleDifference(angle1, angle2) {
  let diff = angle2 - angle1;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}