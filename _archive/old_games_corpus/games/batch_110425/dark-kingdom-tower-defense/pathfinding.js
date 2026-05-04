// pathfinding.js - Path generation and tower placement validation

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function generatePath() {
  const path = [];
  const segments = 5 + Math.floor(Math.random() * 3);
  
  // Start from left side
  let x = 0;
  let y = CANVAS_HEIGHT / 2 + (Math.random() - 0.5) * 100;
  path.push({ x, y });
  
  for (let i = 0; i < segments; i++) {
    x += CANVAS_WIDTH / segments;
    y += (Math.random() - 0.5) * 80;
    y = Math.max(40, Math.min(CANVAS_HEIGHT - 40, y));
    path.push({ x, y });
  }
  
  // End at right side
  path.push({ x: CANVAS_WIDTH, y: path[path.length - 1].y });
  
  return path;
}

export function generateValidPlacementLocations(path) {
  const locations = [];
  const gridSize = 50;
  const pathBuffer = 35;
  
  for (let x = gridSize; x < CANVAS_WIDTH - gridSize; x += gridSize) {
    for (let y = gridSize; y < CANVAS_HEIGHT - gridSize; y += gridSize) {
      let tooCloseToPath = false;
      
      for (let i = 0; i < path.length - 1; i++) {
        const p1 = path[i];
        const p2 = path[i + 1];
        
        const dist = distanceToLineSegment(x, y, p1.x, p1.y, p2.x, p2.y);
        if (dist < pathBuffer) {
          tooCloseToPath = true;
          break;
        }
      }
      
      if (!tooCloseToPath) {
        locations.push({ x, y });
      }
    }
  }
  
  return locations;
}

export function distanceToLineSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;
  
  if (lengthSquared === 0) {
    return Math.hypot(px - x1, py - y1);
  }
  
  let t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;
  t = Math.max(0, Math.min(1, t));
  
  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;
  
  return Math.hypot(px - closestX, py - closestY);
}

export function isValidPlacement(x, y, validLocations, existingTowers) {
  const snapDistance = 25;
  
  // Find nearest valid location
  let nearest = null;
  let nearestDist = snapDistance;
  
  for (const loc of validLocations) {
    const dist = Math.hypot(loc.x - x, loc.y - y);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = loc;
    }
  }
  
  if (!nearest) return null;
  
  // Check if location is already occupied
  for (const tower of existingTowers) {
    if (Math.hypot(tower.x - nearest.x, tower.y - nearest.y) < 10) {
      return null;
    }
  }
  
  return nearest;
}