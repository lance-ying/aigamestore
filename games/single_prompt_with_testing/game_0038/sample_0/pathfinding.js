// pathfinding.js - A* pathfinding for cars

import { gameState, GRID_COLS, GRID_ROWS } from './globals.js';

export function findPath(start, end) {
  // A* pathfinding
  const openSet = [];
  const closedSet = new Set();
  
  const startNode = {
    x: Math.floor(start.x),
    y: Math.floor(start.y),
    g: 0,
    h: heuristic(start, end),
    f: 0,
    parent: null
  };
  startNode.f = startNode.g + startNode.h;
  
  openSet.push(startNode);
  
  const visited = {};
  const key = (x, y) => `${x},${y}`;
  visited[key(startNode.x, startNode.y)] = startNode;
  
  let iterations = 0;
  const maxIterations = 500;
  
  while (openSet.length > 0 && iterations < maxIterations) {
    iterations++;
    
    // Find node with lowest f score
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift();
    
    // Check if reached end
    if (current.x === Math.floor(end.x) && current.y === Math.floor(end.y)) {
      // Reconstruct path
      const path = [];
      let node = current;
      while (node) {
        path.unshift({ x: node.x, y: node.y });
        node = node.parent;
      }
      return path;
    }
    
    closedSet.add(key(current.x, current.y));
    
    // Check neighbors
    const neighbors = [
      { x: current.x + 1, y: current.y },
      { x: current.x - 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x, y: current.y - 1 }
    ];
    
    for (const neighbor of neighbors) {
      if (neighbor.x < 0 || neighbor.x >= GRID_COLS || 
          neighbor.y < 0 || neighbor.y >= GRID_ROWS) {
        continue;
      }
      
      const neighborKey = key(neighbor.x, neighbor.y);
      if (closedSet.has(neighborKey)) continue;
      
      const cell = gameState.grid[neighbor.y][neighbor.x];
      
      // Can move through roads, highways, and the destination
      const isWalkable = cell.type === "ROAD" || 
                        cell.type === "HIGHWAY" ||
                        (neighbor.x === Math.floor(end.x) && neighbor.y === Math.floor(end.y));
      
      if (!isWalkable) continue;
      
      const g = current.g + 1;
      const h = heuristic(neighbor, end);
      const f = g + h;
      
      if (visited[neighborKey] && visited[neighborKey].f <= f) {
        continue;
      }
      
      const neighborNode = {
        x: neighbor.x,
        y: neighbor.y,
        g: g,
        h: h,
        f: f,
        parent: current
      };
      
      visited[neighborKey] = neighborNode;
      openSet.push(neighborNode);
    }
  }
  
  return null;  // No path found
}

function heuristic(a, end) {
  return Math.abs(a.x - Math.floor(end.x)) + Math.abs(a.y - Math.floor(end.y));
}