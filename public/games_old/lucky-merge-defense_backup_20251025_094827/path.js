// path.js - Path generation and management
import { gameState, GRID_OFFSET_X, GRID_OFFSET_Y, GRID_CELL_SIZE } from './globals.js';

export function generatePath(level) {
  const path = [];
  
  if (level === 1) {
    // Simple straight path
    for (let i = 0; i <= 10; i++) {
      path.push({
        x: GRID_OFFSET_X - 50 + i * 50,
        y: GRID_OFFSET_Y + 3 * GRID_CELL_SIZE
      });
    }
  } else if (level === 2) {
    // Winding path
    path.push({ x: GRID_OFFSET_X - 50, y: GRID_OFFSET_Y + 4 * GRID_CELL_SIZE });
    path.push({ x: GRID_OFFSET_X + 2 * GRID_CELL_SIZE, y: GRID_OFFSET_Y + 4 * GRID_CELL_SIZE });
    path.push({ x: GRID_OFFSET_X + 2 * GRID_CELL_SIZE, y: GRID_OFFSET_Y + 2 * GRID_CELL_SIZE });
    path.push({ x: GRID_OFFSET_X + 5 * GRID_CELL_SIZE, y: GRID_OFFSET_Y + 2 * GRID_CELL_SIZE });
    path.push({ x: GRID_OFFSET_X + 5 * GRID_CELL_SIZE, y: GRID_OFFSET_Y + 4 * GRID_CELL_SIZE });
    path.push({ x: GRID_OFFSET_X + 10 * GRID_CELL_SIZE + 50, y: GRID_OFFSET_Y + 4 * GRID_CELL_SIZE });
  } else {
    // Complex path for level 3
    path.push({ x: GRID_OFFSET_X - 50, y: GRID_OFFSET_Y + 1 * GRID_CELL_SIZE });
    path.push({ x: GRID_OFFSET_X + 3 * GRID_CELL_SIZE, y: GRID_OFFSET_Y + 1 * GRID_CELL_SIZE });
    path.push({ x: GRID_OFFSET_X + 3 * GRID_CELL_SIZE, y: GRID_OFFSET_Y + 4 * GRID_CELL_SIZE });
    path.push({ x: GRID_OFFSET_X + 6 * GRID_CELL_SIZE, y: GRID_OFFSET_Y + 4 * GRID_CELL_SIZE });
    path.push({ x: GRID_OFFSET_X + 6 * GRID_CELL_SIZE, y: GRID_OFFSET_Y + 1 * GRID_CELL_SIZE });
    path.push({ x: GRID_OFFSET_X + 10 * GRID_CELL_SIZE + 50, y: GRID_OFFSET_Y + 1 * GRID_CELL_SIZE });
  }
  
  return path;
}

export function isGridSpotNearPath(gridX, gridY, path) {
  const cellCenterX = GRID_OFFSET_X + gridX * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
  const cellCenterY = GRID_OFFSET_Y + gridY * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
  
  for (let i = 0; i < path.length - 1; i++) {
    const p1 = path[i];
    const p2 = path[i + 1];
    
    const dist = distanceToLineSegment(cellCenterX, cellCenterY, p1.x, p1.y, p2.x, p2.y);
    if (dist < GRID_CELL_SIZE * 1.5) {
      return true;
    }
  }
  
  return false;
}

function distanceToLineSegment(px, py, x1, y1, x2, y2) {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  
  if (lenSq !== 0) {
    param = dot / lenSq;
  }
  
  let xx, yy;
  
  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }
  
  const dx = px - xx;
  const dy = py - yy;
  
  return Math.sqrt(dx * dx + dy * dy);
}