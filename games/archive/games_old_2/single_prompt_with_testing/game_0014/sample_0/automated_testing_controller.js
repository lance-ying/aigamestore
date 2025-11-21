// automated_testing_controller.js - Automated testing

import { gameState, PHASE, ENTITY_TYPE, DIRECTION } from './globals.js';
import { isWalkable, getEntityAt } from './grid.js';

function getRandomAction(gameState) {
  const actions = [37, 38, 39, 40, 16]; // arrows + shift
  return actions[Math.floor(Math.random() * actions.length)];
}

function findPath(start, goal, grid, entities) {
  // Simple A* pathfinding
  const openSet = [{ x: start.x, y: start.y, g: 0, h: manhattanDistance(start, goal), parent: null }];
  const closedSet = new Set();
  
  while (openSet.length > 0) {
    // Find node with lowest f score
    openSet.sort((a, b) => (a.g + a.h) - (b.g + b.h));
    const current = openSet.shift();
    
    if (current.x === goal.x && current.y === goal.y) {
      // Reconstruct path
      const path = [];
      let node = current;
      while (node.parent) {
        path.unshift({ x: node.x, y: node.y });
        node = node.parent;
      }
      return path;
    }
    
    closedSet.add(`${current.x},${current.y}`);
    
    // Check neighbors
    const neighbors = [
      { x: current.x - 1, y: current.y },
      { x: current.x + 1, y: current.y },
      { x: current.x, y: current.y - 1 },
      { x: current.x, y: current.y + 1 }
    ];
    
    for (const neighbor of neighbors) {
      if (!isWalkable(grid, neighbor.x, neighbor.y)) continue;
      if (closedSet.has(`${neighbor.x},${neighbor.y}`)) continue;
      
      const entity = getEntityAt(entities, neighbor.x, neighbor.y, true);
      if (entity && entity.type !== ENTITY_TYPE.EXIT && entity.type !== ENTITY_TYPE.TERMINAL) continue;
      
      const g = current.g + 1;
      const h = manhattanDistance(neighbor, goal);
      
      const existing = openSet.find(n => n.x === neighbor.x && n.y === neighbor.y);
      if (!existing || g < existing.g) {
        if (existing) {
          existing.g = g;
          existing.parent = current;
        } else {
          openSet.push({ x: neighbor.x, y: neighbor.y, g, h, parent: current });
        }
      }
    }
  }
  
  return null;
}

function manhattanDistance(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function isSafePosition(x, y, gameState) {
  // Check if position is safe from enemies
  for (const entity of gameState.entities) {
    if (entity.type === ENTITY_TYPE.GUARD) {
      const dx = entity.direction.x;
      const dy = entity.direction.y;
      for (let i = 1; i <= entity.viewDistance; i++) {
        const checkX = entity.gridX + dx * i;
        const checkY = entity.gridY + dy * i;
        if (checkX === x && checkY === y) {
          // Check for walls blocking view
          let blocked = false;
          for (let j = 1; j < i; j++) {
            const wallX = entity.gridX + dx * j;
            const wallY = entity.gridY + dy * j;
            if (gameState.grid[wallY] && gameState.grid[wallY][wallX] === 1) {
              blocked = true;
              break;
            }
          }
          if (!blocked) return false;
        }
      }
    } else if (entity.type === ENTITY_TYPE.TURRET && entity.active) {
      if (entity.canSeePlayer({ gridX: x, gridY: y }, gameState.grid)) {
        return false;
      }
    } else if (entity.type === ENTITY_TYPE.DRONE) {
      const dist = Math.abs(entity.gridX - x) + Math.abs(entity.gridY - y);
      if (dist <= entity.viewDistance) {
        return false;
      }
    }
  }
  return true;
}

function getTestBasicAction(gameState) {
  // Test basic movement in all directions
  if (!gameState.player) return 16;
  
  const actions = [
    { key: 37, dir: { x: -1, y: 0 } }, // LEFT
    { key: 38, dir: { x: 0, y: -1 } }, // UP
    { key: 39, dir: { x: 1, y: 0 } },  // RIGHT
    { key: 40, dir: { x: 0, y: 1 } }   // DOWN
  ];
  
  // Try each direction
  for (const action of actions) {
    const newX = gameState.player.gridX + action.dir.x;
    const newY = gameState.player.gridY + action.dir.y;
    
    if (isWalkable(gameState.grid, newX, newY)) {
      const entity = getEntityAt(gameState.entities, newX, newY, true);
      if (!entity || entity.type === ENTITY_TYPE.EXIT || entity.type === ENTITY_TYPE.TERMINAL) {
        return action.key;
      }
    }
  }
  
  return 16; // Wait if no valid move
}

function getTestWinAction(gameState) {
  if (!gameState.player) return 16;
  
  // Find exit
  const exit = gameState.entities.find(e => e.type === ENTITY_TYPE.EXIT);
  if (!exit) return getRandomAction(gameState);
  
  // Check if we need to hack terminals first
  const activeTurrets = gameState.entities.filter(e => 
    e.type === ENTITY_TYPE.TURRET && e.active
  );
  
  if (activeTurrets.length > 0) {
    // Try to find and hack a terminal
    const terminal = gameState.entities.find(e => e.type === ENTITY_TYPE.TERMINAL && !e.hacked);
    if (terminal) {
      // Check if adjacent
      const dist = Math.abs(gameState.player.gridX - terminal.gridX) + 
                   Math.abs(gameState.player.gridY - terminal.gridY);
      if (dist === 1) {
        return 90; // Z key to hack
      }
      
      // Move toward terminal
      const path = findPath(
        { x: gameState.player.gridX, y: gameState.player.gridY },
        { x: terminal.gridX, y: terminal.gridY },
        gameState.grid,
        gameState.entities
      );
      
      if (path && path.length > 0) {
        const next = path[0];
        const dx = next.x - gameState.player.gridX;
        const dy = next.y - gameState.player.gridY;
        
        if (dx < 0) return 37; // LEFT
        if (dx > 0) return 39; // RIGHT
        if (dy < 0) return 38; // UP
        if (dy > 0) return 40; // DOWN
      }
    }
  }
  
  // Find path to exit
  const path = findPath(
    { x: gameState.player.gridX, y: gameState.player.gridY },
    { x: exit.gridX, y: exit.gridY },
    gameState.grid,
    gameState.entities
  );
  
  if (!path || path.length === 0) {
    return 16; // Wait
  }
  
  const next = path[0];
  
  // Check if next position is safe
  if (!isSafePosition(next.x, next.y, gameState)) {
    // Use invisibility if available
    if (gameState.invisibilityCharges > 0 && !gameState.isInvisible) {
      return 32; // SPACE
    }
    // Otherwise wait for enemies to move
    return 16; // SHIFT
  }
  
  // Move toward next position
  const dx = next.x - gameState.player.gridX;
  const dy = next.y - gameState.player.gridY;
  
  if (dx < 0) return 37; // LEFT
  if (dx > 0) return 39; // RIGHT
  if (dy < 0) return 38; // UP
  if (dy > 0) return 40; // DOWN
  
  return 16; // Wait if no valid move
}

function getTestHackAction(gameState) {
  if (!gameState.player) return 16;
  
  // Find nearest terminal
  const terminal = gameState.entities.find(e => e.type === ENTITY_TYPE.TERMINAL);
  if (!terminal) return getRandomAction(gameState);
  
  // Check if adjacent
  const dist = Math.abs(gameState.player.gridX - terminal.gridX) + 
               Math.abs(gameState.player.gridY - terminal.gridY);
  
  if (dist === 1) {
    return 90; // Z key to hack
  }
  
  // Move toward terminal
  const path = findPath(
    { x: gameState.player.gridX, y: gameState.player.gridY },
    { x: terminal.gridX, y: terminal.gridY },
    gameState.grid,
    gameState.entities
  );
  
  if (path && path.length > 0) {
    const next = path[0];
    const dx = next.x - gameState.player.gridX;
    const dy = next.y - gameState.player.gridY;
    
    if (dx < 0) return 37;
    if (dx > 0) return 39;
    if (dy < 0) return 38;
    if (dy > 0) return 40;
  }
  
  return 16;
}

function getTestInvisibilityAction(gameState) {
  if (!gameState.player) return 16;
  
  // Find a dangerous position and test invisibility
  const guards = gameState.entities.filter(e => e.type === ENTITY_TYPE.GUARD);
  if (guards.length === 0) return getRandomAction(gameState);
  
  const guard = guards[0];
  
  // Move into line of sight
  const targetX = guard.gridX + guard.direction.x;
  const targetY = guard.gridY + guard.direction.y;
  
  if (!isWalkable(gameState.grid, targetX, targetY)) {
    return getRandomAction(gameState);
  }
  
  // Activate invisibility before moving
  if (!gameState.isInvisible && gameState.invisibilityCharges > 0) {
    return 32; // SPACE
  }
  
  // Move toward danger
  const dx = targetX - gameState.player.gridX;
  const dy = targetY - gameState.player.gridY;
  
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx < 0 ? 37 : 39;
  } else {
    return dy < 0 ? 38 : 40;
  }
}

function getTestLoseAction(gameState) {
  if (!gameState.player) return 16;
  
  // Find a guard and deliberately move into line of sight
  const guard = gameState.entities.find(e => e.type === ENTITY_TYPE.GUARD);
  if (!guard) return getRandomAction(gameState);
  
  const targetX = guard.gridX + guard.direction.x;
  const targetY = guard.gridY + guard.direction.y;
  
  if (!isWalkable(gameState.grid, targetX, targetY)) {
    return getRandomAction(gameState);
  }
  
  const dx = targetX - gameState.player.gridX;
  const dy = targetY - gameState.player.gridY;
  
  if (Math.abs(dx) > 0) {
    return dx < 0 ? 37 : 39;
  } else if (Math.abs(dy) > 0) {
    return dy < 0 ? 38 : 40;
  }
  
  return 16;
}

export function get_automated_testing_action(gameState) {
  if (gameState.gamePhase !== PHASE.PLAYING) {
    return null;
  }
  
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestHackAction(gameState);
    case "TEST_4":
      return getTestInvisibilityAction(gameState);
    case "TEST_5":
      return getTestLoseAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;