// pathfinding.js - Path validation and finding

import { gameState } from './globals.js';
import { PIPE_TYPES } from './globals.js';

export function validatePath() {
  const { grid, startPos, endPos, gridWidth, gridHeight } = gameState;
  const path = [];
  const visited = new Set();
  
  function getKey(x, y) {
    return `${x},${y}`;
  }
  
  function getOppositeDirection(dir) {
    const opposites = {
      'top': 'bottom',
      'bottom': 'top',
      'left': 'right',
      'right': 'left'
    };
    return opposites[dir];
  }
  
  function getNeighbor(x, y, direction) {
    const moves = {
      'top': { dx: 0, dy: -1 },
      'bottom': { dx: 0, dy: 1 },
      'left': { dx: -1, dy: 0 },
      'right': { dx: 1, dy: 0 }
    };
    const move = moves[direction];
    return { x: x + move.dx, y: y + move.dy };
  }
  
  function dfs(x, y, fromDirection = null) {
    if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight) {
      return false;
    }
    
    const key = getKey(x, y);
    if (visited.has(key)) {
      return false;
    }
    
    const pipe = grid[y][x];
    if (!pipe || pipe.type === PIPE_TYPES.EMPTY || pipe.type === PIPE_TYPES.BLOCKED) {
      return false;
    }
    
    visited.add(key);
    path.push({ x, y });
    
    // Check if we reached the end
    if (x === endPos.x && y === endPos.y) {
      return true;
    }
    
    const connections = pipe.getConnections();
    
    // If we came from a direction, verify this pipe connects to that direction
    if (fromDirection !== null) {
      const requiredConnection = getOppositeDirection(fromDirection);
      if (!connections.includes(requiredConnection)) {
        return false;
      }
    }
    
    // Try each connection direction
    for (const direction of connections) {
      if (fromDirection !== null && direction === getOppositeDirection(fromDirection)) {
        continue; // Don't go back
      }
      
      const neighbor = getNeighbor(x, y, direction);
      if (dfs(neighbor.x, neighbor.y, direction)) {
        return true;
      }
    }
    
    // Backtrack
    path.pop();
    return false;
  }
  
  const success = dfs(startPos.x, startPos.y);
  
  return { success, path };
}