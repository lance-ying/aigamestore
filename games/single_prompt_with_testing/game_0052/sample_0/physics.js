// physics.js - Collision detection and physics utilities

import { gameState } from './globals.js';

// Simple rectangle collision detection
function collideRectRect(x1, y1, w1, h1, x2, y2, w2, h2) {
  return !(
    x1 + w1 < x2 ||
    x1 > x2 + w2 ||
    y1 + h1 < y2 ||
    y1 > y2 + h2
  );
}

// Check if player collides with any furniture
export function checkFurnitureCollision(player) {
  for (const furniture of gameState.furniture) {
    const collision = collideRectRect(
      player.x - player.width / 2,
      player.y - player.height / 2,
      player.width,
      player.height,
      furniture.x - furniture.width / 2,
      furniture.y - furniture.height / 2,
      furniture.width,
      furniture.height
    );
    
    if (collision) {
      // Push player out of furniture
      const dx = player.x - furniture.x;
      const dy = player.y - furniture.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      
      if (absDx > absDy) {
        // Horizontal separation
        if (dx > 0) {
          player.x = furniture.x + furniture.width / 2 + player.width / 2;
        } else {
          player.x = furniture.x - furniture.width / 2 - player.width / 2;
        }
        player.vx = 0;
      } else {
        // Vertical separation
        if (dy > 0) {
          player.y = furniture.y + furniture.height / 2 + player.height / 2;
        } else {
          player.y = furniture.y - furniture.height / 2 - player.height / 2;
        }
        player.vy = 0;
      }
    }
  }
}

// Check line of sight between two points (for AI)
export function hasLineOfSight(x1, y1, x2, y2) {
  // Simple implementation - can be enhanced with raycasting
  for (const furniture of gameState.furniture) {
    if (lineIntersectsRect(
      x1, y1, x2, y2,
      furniture.x - furniture.width / 2,
      furniture.y - furniture.height / 2,
      furniture.width,
      furniture.height
    )) {
      return false;
    }
  }
  return true;
}

// Line-rectangle intersection test
function lineIntersectsRect(x1, y1, x2, y2, rx, ry, rw, rh) {
  // Check if line intersects any of the rectangle's edges
  return (
    lineIntersectsLine(x1, y1, x2, y2, rx, ry, rx + rw, ry) ||
    lineIntersectsLine(x1, y1, x2, y2, rx + rw, ry, rx + rw, ry + rh) ||
    lineIntersectsLine(x1, y1, x2, y2, rx + rw, ry + rh, rx, ry + rh) ||
    lineIntersectsLine(x1, y1, x2, y2, rx, ry + rh, rx, ry)
  );
}

// Line-line intersection test
function lineIntersectsLine(x1, y1, x2, y2, x3, y3, x4, y4) {
  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (denom === 0) return false;
  
  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
  
  return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
}

// Distance between two points
export function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}

// Normalize vector
export function normalize(x, y) {
  const magnitude = Math.sqrt(x * x + y * y);
  if (magnitude === 0) return { x: 0, y: 0 };
  return { x: x / magnitude, y: y / magnitude };
}