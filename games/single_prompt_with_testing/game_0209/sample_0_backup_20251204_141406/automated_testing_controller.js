// automated_testing_controller.js - Automated testing AI

import { gameState } from './globals.js';
import { worldToTile, getTile, isSolid, distance } from './utils.js';

// Simple A* pathfinding for TEST_2
class PathNode {
  constructor(x, y, g, h, parent) {
    this.x = x;
    this.y = y;
    this.g = g; // Cost from start
    this.h = h; // Heuristic to goal
    this.f = g + h; // Total cost
    this.parent = parent;
  }
}

function heuristic(x1, y1, x2, y2) {
  return Math.abs(x2 - x1) + Math.abs(y2 - y1);
}

function findPath(startX, startY, goalX, goalY) {
  const openList = [];
  const closedList = new Set();
  
  const startNode = new PathNode(startX, startY, 0, heuristic(startX, startY, goalX, goalY), null);
  openList.push(startNode);
  
  let iterations = 0;
  const maxIterations = 500;
  
  while (openList.length > 0 && iterations < maxIterations) {
    iterations++;
    
    // Find node with lowest f cost
    openList.sort((a, b) => a.f - b.f);
    const current = openList.shift();
    
    // Check if reached goal
    if (Math.abs(current.x - goalX) < 2 && Math.abs(current.y - goalY) < 2) {
      // Reconstruct path
      const path = [];
      let node = current;
      while (node) {
        path.unshift({ x: node.x, y: node.y });
        node = node.parent;
      }
      return path;
    }
    
    closedList.add(`${current.x},${current.y}`);
    
    // Check neighbors
    const neighbors = [
      { dx: -1, dy: 0 },  // Left
      { dx: 1, dy: 0 },   // Right
      { dx: 0, dy: -1 },  // Up
      { dx: 0, dy: 1 }    // Down
    ];
    
    for (const { dx, dy } of neighbors) {
      const nx = current.x + dx * 20;
      const ny = current.y + dy * 20;
      const key = `${nx},${ny}`;
      
      if (closedList.has(key)) continue;
      
      const { tx, ty } = worldToTile(nx, ny);
      if (isSolid(tx, ty)) continue;
      
      const g = current.g + 1;
      const h = heuristic(nx, ny, goalX, goalY);
      const neighbor = new PathNode(nx, ny, g, h, current);
      
      const existingIndex = openList.findIndex(n => n.x === nx && n.y === ny);
      if (existingIndex === -1 || g < openList[existingIndex].g) {
        if (existingIndex !== -1) {
          openList.splice(existingIndex, 1);
        }
        openList.push(neighbor);
      }
    }
  }
  
  return null; // No path found
}

function getTestWinAction(gameState) {
  if (!gameState.player) return null;
  
  // Priority 1: Collect gems
  if (gameState.gemsCollected < gameState.totalGems) {
    // Find nearest uncollected gem
    let nearestGem = null;
    let minDist = Infinity;
    
    for (const gem of gameState.gems) {
      if (!gem.collected) {
        const dist = distance(gameState.player.x, gameState.player.y, gem.x, gem.y);
        if (dist < minDist) {
          minDist = dist;
          nearestGem = gem;
        }
      }
    }
    
    if (nearestGem) {
      // Move towards gem
      const dx = nearestGem.x - gameState.player.x;
      const dy = nearestGem.y - gameState.player.y;
      
      if (Math.abs(dx) > 10) {
        return { keyCode: dx > 0 ? 39 : 37 }; // Right or Left
      } else if (dy < -20) {
        return { keyCode: 32 }; // Jump up
      } else if (dy > 20) {
        return { keyCode: 40 }; // Down
      }
    }
  }
  
  // Priority 2: Go to exit door
  if (gameState.exitDoor && gameState.exitDoor.unlocked) {
    const dx = gameState.exitDoor.x - gameState.player.x;
    const dy = gameState.exitDoor.y - gameState.player.y;
    
    const dist = distance(gameState.player.x, gameState.player.y, 
                         gameState.exitDoor.x, gameState.exitDoor.y);
    
    if (dist < 30) {
      return { keyCode: 38 }; // Enter door
    }
    
    if (Math.abs(dx) > 10) {
      return { keyCode: dx > 0 ? 39 : 37 }; // Right or Left
    } else if (dy < -20 && gameState.player.onGround) {
      return { keyCode: 32 }; // Jump
    }
  }
  
  // Default: explore right
  return { keyCode: 39 };
}

function getBasicTestingAction(gameState) {
  if (!gameState.player) return null;
  
  // Random movement with some structure
  const actions = [];
  
  // Favor horizontal movement
  actions.push({ keyCode: 37, weight: 3 }); // Left
  actions.push({ keyCode: 39, weight: 3 }); // Right
  
  // Occasional jumps
  if (gameState.player.onGround && Math.random() < 0.1) {
    actions.push({ keyCode: 32, weight: 2 }); // Jump
  }
  
  // Climb ladders if on one
  if (gameState.player.onLadder) {
    actions.push({ keyCode: 38, weight: 2 }); // Up
    actions.push({ keyCode: 40, weight: 2 }); // Down
  }
  
  // Use items occasionally
  if (gameState.player.bombs > 0 && Math.random() < 0.05) {
    actions.push({ keyCode: 90, weight: 1 }); // Bomb
  }
  
  if (gameState.player.ropes > 0 && Math.random() < 0.05) {
    actions.push({ keyCode: 16, weight: 1 }); // Rope
  }
  
  // Weighted random selection
  const totalWeight = actions.reduce((sum, a) => sum + a.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const action of actions) {
    random -= action.weight;
    if (random <= 0) {
      return { keyCode: action.keyCode };
    }
  }
  
  return actions.length > 0 ? actions[0] : null;
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestingAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return null;
  }
}

window.get_automated_testing_action = get_automated_testing_action;