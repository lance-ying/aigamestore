// utils.js - Utility functions

import { gameState, WALLS, PLAYER_RADIUS } from './globals.js';

// Calculate distance between two points
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

// Check line-circle collision for wall detection
export function lineCircleCollision(x1, y1, x2, y2, cx, cy, radius) {
  // Calculate line vector
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  
  if (len === 0) return false;
  
  // Normalize
  const nx = dx / len;
  const ny = dy / len;
  
  // Vector from line start to circle center
  const fx = cx - x1;
  const fy = cy - y1;
  
  // Project onto line
  const projection = fx * nx + fy * ny;
  const clampedProj = Math.max(0, Math.min(len, projection));
  
  // Closest point on line
  const closestX = x1 + nx * clampedProj;
  const closestY = y1 + ny * clampedProj;
  
  // Distance from circle to closest point
  const dist = distance(cx, cy, closestX, closestY);
  
  return dist < radius;
}

// Check if position collides with any walls
export function checkWallCollision(x, y, radius = PLAYER_RADIUS) {
  for (const wall of WALLS) {
    if (lineCircleCollision(wall.x1, wall.y1, wall.x2, wall.y2, x, y, radius)) {
      return true;
    }
  }
  return false;
}

// Get room at position
export function getRoomAtPosition(x, y) {
  const ROOMS = [
    { name: "Living Room", x: 0, y: 300, width: 300, height: 300 },
    { name: "Hallway", x: 300, y: 200, width: 200, height: 80 },
    { name: "Kitchen", x: 500, y: 0, width: 300, height: 400 },
    { name: "Bedroom", x: 0, y: 0, width: 300, height: 300 },
  ];
  
  for (const room of ROOMS) {
    if (x >= room.x && x <= room.x + room.width &&
        y >= room.y && y <= room.y + room.height) {
      return room.name;
    }
  }
  return "Unknown";
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