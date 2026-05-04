// collision.js - Collision detection and bubble attachment

import { BUBBLE_RADIUS, GRID_OFFSET_X, GRID_OFFSET_Y, GRID_COLS, gameState } from './globals.js';
import { Bubble } from './bubble.js';

export function checkProjectileCollision(projectile, bubbles, gridOffsetY) {
  // Check collision with existing bubbles
  for (const bubble of bubbles) {
    if (!bubble.active || bubble.markedForPop) continue;
    
    const dx = bubble.x - projectile.x;
    const dy = bubble.y - projectile.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < BUBBLE_RADIUS * 2) {
      return { type: 'bubble', bubble };
    }
  }
  
  // Check collision with ceiling
  if (projectile.y - BUBBLE_RADIUS <= gridOffsetY) {
    return { type: 'ceiling' };
  }
  
  return null;
}

export function attachBubbleToGrid(projectile, collision, grid, activeBubbles, gridOffsetY) {
  let attachRow = 0;
  let attachCol = 0;
  
  if (collision.type === 'ceiling') {
    // Attach to top row
    attachRow = 0;
    attachCol = Math.round((projectile.x - GRID_OFFSET_X) / (BUBBLE_RADIUS * 2));
    attachCol = Math.max(0, Math.min(GRID_COLS - 1, attachCol));
  } else if (collision.type === 'bubble') {
    // Find nearest empty grid position near the collision bubble
    const hitBubble = collision.bubble;
    const gridRow = hitBubble.gridRow;
    const gridCol = hitBubble.gridCol;
    
    // Calculate which side the projectile hit
    const dx = projectile.x - hitBubble.x;
    const dy = projectile.y - hitBubble.y;
    const angle = Math.atan2(dy, dx);
    
    // Try different positions around the hit bubble
    const positions = [
      { row: gridRow - 1, col: gridCol },
      { row: gridRow + 1, col: gridCol },
      { row: gridRow, col: gridCol - 1 },
      { row: gridRow, col: gridCol + 1 },
      { row: gridRow - 1, col: gridCol - 1 },
      { row: gridRow - 1, col: gridCol + 1 },
      { row: gridRow + 1, col: gridCol - 1 },
      { row: gridRow + 1, col: gridCol + 1 }
    ];
    
    // Find closest valid position
    let bestPos = null;
    let bestDist = Infinity;
    
    for (const pos of positions) {
      if (pos.row >= 0 && pos.row < grid.length && 
          pos.col >= 0 && pos.col < GRID_COLS && 
          !grid[pos.row][pos.col]) {
        const posX = GRID_OFFSET_X + pos.col * BUBBLE_RADIUS * 2;
        const posY = gridOffsetY + pos.row * BUBBLE_RADIUS * 2;
        const dist = Math.sqrt(
          Math.pow(posX - projectile.x, 2) + 
          Math.pow(posY - projectile.y, 2)
        );
        
        if (dist < bestDist) {
          bestDist = dist;
          bestPos = pos;
        }
      }
    }
    
    if (bestPos) {
      attachRow = bestPos.row;
      attachCol = bestPos.col;
    } else {
      // Fallback to nearest position
      attachRow = Math.round((projectile.y - gridOffsetY) / (BUBBLE_RADIUS * 2));
      attachCol = Math.round((projectile.x - GRID_OFFSET_X) / (BUBBLE_RADIUS * 2));
      attachRow = Math.max(0, Math.min(grid.length - 1, attachRow));
      attachCol = Math.max(0, Math.min(GRID_COLS - 1, attachCol));
    }
  }
  
  // Ensure position is valid and empty
  while (attachRow < grid.length && grid[attachRow] && grid[attachRow][attachCol]) {
    attachRow--;
  }
  
  if (attachRow < 0 || attachRow >= grid.length) return null;
  
  // Create new bubble at grid position
  const newBubble = new Bubble(
    GRID_OFFSET_X + attachCol * BUBBLE_RADIUS * 2,
    gridOffsetY + attachRow * BUBBLE_RADIUS * 2,
    projectile.color,
    "normal"
  );
  
  newBubble.gridRow = attachRow;
  newBubble.gridCol = attachCol;
  newBubble.attached = true;
  
  // Ensure grid row exists
  if (!grid[attachRow]) {
    grid[attachRow] = [];
  }
  
  grid[attachRow][attachCol] = newBubble;
  activeBubbles.push(newBubble);
  
  return newBubble;
}

export function findMatches(startBubble, grid, activeBubbles) {
  if (!startBubble || startBubble.isRock()) return [];
  
  const visited = new Set();
  const matches = [];
  const queue = [startBubble];
  
  while (queue.length > 0) {
    const current = queue.shift();
    const key = `${current.gridRow},${current.gridCol}`;
    
    if (visited.has(key)) continue;
    visited.add(key);
    
    if (current.colorsMatch(startBubble)) {
      matches.push(current);
      
      // Check neighbors
      const neighbors = getNeighbors(current.gridRow, current.gridCol, grid);
      for (const neighbor of neighbors) {
        const nKey = `${neighbor.gridRow},${neighbor.gridCol}`;
        if (!visited.has(nKey)) {
          queue.push(neighbor);
        }
      }
    }
  }
  
  return matches.length >= 3 ? matches : [];
}

export function findDetachedBubbles(grid, activeBubbles) {
  const connected = new Set();
  const queue = [];
  
  // Start from top row (attached to ceiling)
  if (grid[0]) {
    for (let col = 0; col < grid[0].length; col++) {
      if (grid[0][col] && grid[0][col].active && !grid[0][col].markedForPop) {
        queue.push(grid[0][col]);
        connected.add(`${0},${col}`);
      }
    }
  }
  
  // BFS to find all connected bubbles
  while (queue.length > 0) {
    const current = queue.shift();
    const neighbors = getNeighbors(current.gridRow, current.gridCol, grid);
    
    for (const neighbor of neighbors) {
      const key = `${neighbor.gridRow},${neighbor.gridCol}`;
      if (!connected.has(key) && neighbor.active && !neighbor.markedForPop) {
        connected.add(key);
        queue.push(neighbor);
      }
    }
  }
  
  // Find detached bubbles
  const detached = [];
  for (const bubble of activeBubbles) {
    if (bubble.active && !bubble.markedForPop) {
      const key = `${bubble.gridRow},${bubble.gridCol}`;
      if (!connected.has(key)) {
        detached.push(bubble);
      }
    }
  }
  
  return detached;
}

function getNeighbors(row, col, grid) {
  const neighbors = [];
  const positions = [
    { r: row - 1, c: col },
    { r: row + 1, c: col },
    { r: row, c: col - 1 },
    { r: row, c: col + 1 },
    { r: row - 1, c: col - 1 },
    { r: row - 1, c: col + 1 },
    { r: row + 1, c: col - 1 },
    { r: row + 1, c: col + 1 }
  ];
  
  for (const pos of positions) {
    if (pos.r >= 0 && pos.r < grid.length && 
        pos.c >= 0 && pos.c < GRID_COLS &&
        grid[pos.r] && grid[pos.r][pos.c]) {
      neighbors.push(grid[pos.r][pos.c]);
    }
  }
  
  return neighbors;
}