import { CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE } from './globals.js';

export function generatePath() {
  const path = [];
  const startX = 0;
  const startY = CANVAS_HEIGHT / 2;
  
  path.push({ x: startX, y: startY });
  
  let currentX = 80;
  let currentY = startY;
  path.push({ x: currentX, y: currentY });
  
  currentY = 120;
  path.push({ x: currentX, y: currentY });
  
  currentX = 240;
  path.push({ x: currentX, y: currentY });
  
  currentY = 280;
  path.push({ x: currentX, y: currentY });
  
  currentX = 400;
  path.push({ x: currentX, y: currentY });
  
  currentY = 200;
  path.push({ x: currentX, y: currentY });
  
  currentX = 520;
  path.push({ x: currentX, y: currentY });
  
  currentY = 120;
  path.push({ x: currentX, y: currentY });
  
  currentX = CANVAS_WIDTH;
  path.push({ x: currentX, y: currentY });
  
  return path;
}

export function generateValidTowerPositions(path) {
  const positions = [];
  const pathBuffer = 35;
  
  for (let x = GRID_SIZE; x < CANVAS_WIDTH - GRID_SIZE; x += GRID_SIZE) {
    for (let y = GRID_SIZE; y < CANVAS_HEIGHT - GRID_SIZE; y += GRID_SIZE) {
      let validPos = true;
      
      for (let i = 0; i < path.length - 1; i++) {
        const p1 = path[i];
        const p2 = path[i + 1];
        
        const dist = pointToLineDistance(x, y, p1.x, p1.y, p2.x, p2.y);
        if (dist < pathBuffer) {
          validPos = false;
          break;
        }
      }
      
      if (validPos) {
        positions.push({ x, y });
      }
    }
  }
  
  return positions;
}

function pointToLineDistance(px, py, x1, y1, x2, y2) {
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