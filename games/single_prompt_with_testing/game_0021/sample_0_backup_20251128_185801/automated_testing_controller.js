// automated_testing_controller.js
import { DIRECTIONS } from './globals.js';

// Pathfinding using BFS
function findPath(grid, startX, startY, goalX, goalY, entities) {
  const queue = [{ x: startX, y: startY, path: [] }];
  const visited = new Set();
  visited.add(`${startX},${startY}`);
  
  while (queue.length > 0) {
    const current = queue.shift();
    
    if (current.x === goalX && current.y === goalY) {
      return current.path;
    }
    
    const moves = [
      { dir: DIRECTIONS.UP, x: current.x, y: current.y - 1 },
      { dir: DIRECTIONS.DOWN, x: current.x, y: current.y + 1 },
      { dir: DIRECTIONS.LEFT, x: current.x - 1, y: current.y },
      { dir: DIRECTIONS.RIGHT, x: current.x + 1, y: current.y }
    ];
    
    for (const move of moves) {
      const key = `${move.x},${move.y}`;
      if (visited.has(key)) continue;
      
      // Check if position is walkable
      if (move.y < 0 || move.y >= grid.length || move.x < 0 || move.x >= grid[0].length) continue;
      if (grid[move.y][move.x] === 1) continue; // Wall
      
      // Check for blocking entities
      const entity = entities.find(e => e.gridX === move.x && e.gridY === move.y);
      if (entity && entity.type !== 5 && entity.type !== 4) continue; // Block/Skeleton
      
      visited.add(key);
      queue.push({
        x: move.x,
        y: move.y,
        path: [...current.path, move.dir]
      });
    }
  }
  
  return null;
}

function getTestWinAction(gameState) {
  if (!gameState.player || gameState.gamePhase !== "PLAYING") {
    return null;
  }
  
  // Find demon girl
  const demonGirl = gameState.entities.find(e => e.type === 5);
  if (!demonGirl) return null;
  
  // Check if we need to push something
  const blockers = gameState.entities.filter(e => 
    (e.type === 2 || e.type === 3) && 
    Math.abs(e.gridX - gameState.player.gridX) + Math.abs(e.gridY - gameState.player.gridY) <= 3
  );
  
  // Try to find direct path to goal
  let path = findPath(
    gameState.grid,
    gameState.player.gridX,
    gameState.player.gridY,
    demonGirl.gridX,
    demonGirl.gridY,
    gameState.entities
  );
  
  if (path && path.length > 0) {
    return directionToKeyCode(path[0]);
  }
  
  // If blocked, try to push something out of the way
  if (blockers.length > 0) {
    for (const blocker of blockers) {
      // Try to get next to the blocker
      const adjacentPositions = [
        { x: blocker.gridX, y: blocker.gridY - 1, dir: DIRECTIONS.DOWN },
        { x: blocker.gridX, y: blocker.gridY + 1, dir: DIRECTIONS.UP },
        { x: blocker.gridX - 1, y: blocker.gridY, dir: DIRECTIONS.RIGHT },
        { x: blocker.gridX + 1, y: blocker.gridY, dir: DIRECTIONS.LEFT }
      ];
      
      for (const pos of adjacentPositions) {
        const pathToBlocker = findPath(
          gameState.grid,
          gameState.player.gridX,
          gameState.player.gridY,
          pos.x,
          pos.y,
          gameState.entities
        );
        
        if (pathToBlocker && pathToBlocker.length > 0) {
          // If already adjacent, push
          if (pathToBlocker.length === 1) {
            return 32; // SPACE to push
          }
          return directionToKeyCode(pathToBlocker[0]);
        }
      }
    }
  }
  
  // Random move as fallback
  const moves = [38, 40, 37, 39];
  return moves[Math.floor(Math.random() * moves.length)];
}

function getTestBasicAction(gameState) {
  if (!gameState.player || gameState.gamePhase !== "PLAYING") {
    return null;
  }
  
  // Just test movement in all directions
  const frame = gameState.player.gridX + gameState.player.gridY;
  const moves = [38, 40, 37, 39]; // UP, DOWN, LEFT, RIGHT
  return moves[frame % moves.length];
}

function getTestLoseAction(gameState) {
  if (!gameState.player || gameState.gamePhase !== "PLAYING") {
    return null;
  }
  
  // Make inefficient moves to run out
  const frame = Math.floor(Date.now() / 500);
  return frame % 2 === 0 ? 37 : 39; // Move left and right
}

function getTestPushAction(gameState) {
  if (!gameState.player || gameState.gamePhase !== "PLAYING") {
    return null;
  }
  
  // Find nearest pushable object
  const pushables = gameState.entities.filter(e => e.type === 2 || e.type === 3);
  if (pushables.length === 0) return getTestWinAction(gameState);
  
  const nearest = pushables.reduce((prev, curr) => {
    const prevDist = Math.abs(prev.gridX - gameState.player.gridX) + Math.abs(prev.gridY - gameState.player.gridY);
    const currDist = Math.abs(curr.gridX - gameState.player.gridX) + Math.abs(curr.gridY - gameState.player.gridY);
    return currDist < prevDist ? curr : prev;
  });
  
  // Navigate to be adjacent to it
  const adjacentPositions = [
    { x: nearest.gridX, y: nearest.gridY - 1 },
    { x: nearest.gridX, y: nearest.gridY + 1 },
    { x: nearest.gridX - 1, y: nearest.gridY },
    { x: nearest.gridX + 1, y: nearest.gridY }
  ];
  
  for (const pos of adjacentPositions) {
    const path = findPath(
      gameState.grid,
      gameState.player.gridX,
      gameState.player.gridY,
      pos.x,
      pos.y,
      gameState.entities
    );
    
    if (path && path.length > 0) {
      if (path.length === 1) {
        return 32; // Push
      }
      return directionToKeyCode(path[0]);
    }
  }
  
  return null;
}

function directionToKeyCode(direction) {
  if (direction === DIRECTIONS.UP) return 38;
  if (direction === DIRECTIONS.DOWN) return 40;
  if (direction === DIRECTIONS.LEFT) return 37;
  if (direction === DIRECTIONS.RIGHT) return 39;
  return null;
}

function getRandomAction(gameState) {
  if (gameState.gamePhase !== "PLAYING") return null;
  const actions = [38, 40, 37, 39, 32];
  return actions[Math.floor(Math.random() * actions.length)];
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestLoseAction(gameState);
    case "TEST_4":
      return getTestPushAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;