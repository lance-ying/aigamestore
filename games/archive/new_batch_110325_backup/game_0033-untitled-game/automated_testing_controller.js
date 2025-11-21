// automated_testing_controller.js - Automated testing
import { gameState } from './globals.js';

let testState = {
  lastActionFrame: 0,
  placementPriority: [],
  phase: 'SETUP',
  towerCount: 0,
  gardenCount: 0,
  roadCount: 0,
  waveCallDelay: 0
};

function getTestWinAction(gameState) {
  const framesSinceLastAction = gameState.frameCount - testState.lastActionFrame;
  
  // Wait between actions
  if (framesSinceLastAction < 15) {
    return null;
  }
  
  // If no current tile, wait
  if (!gameState.currentTile && !gameState.waveInProgress) {
    return null;
  }
  
  // Wave management
  if (!gameState.waveInProgress && gameState.wave < gameState.maxWaves) {
    testState.waveCallDelay++;
    
    // Build defense before calling wave
    const hasEnoughDefense = testState.towerCount >= 3 + gameState.wave * 2;
    
    if (hasEnoughDefense && testState.waveCallDelay > 30) {
      testState.waveCallDelay = 0;
      testState.lastActionFrame = gameState.frameCount;
      return { key: 'z', keyCode: 90 };
    }
  }
  
  // During wave, don't place tiles
  if (gameState.waveInProgress) {
    return null;
  }
  
  // Tile placement strategy
  if (gameState.currentTile) {
    const action = decideTilePlacement(gameState);
    if (action) {
      testState.lastActionFrame = gameState.frameCount;
      return action;
    }
  }
  
  return null;
}

function decideTilePlacement(gameState) {
  const tile = gameState.currentTile;
  
  // Priority: Garden early, then towers, then roads, flags
  if (tile.type === 'GARDEN' && testState.gardenCount < 2) {
    const pos = findSafePosition(gameState);
    if (pos) {
      testState.gardenCount++;
      return navigateAndPlace(gameState, pos);
    }
  }
  
  if (tile.type === 'TOWER' || tile.type === 'ARCHER' || 
      tile.type === 'CANNON' || tile.type === 'MAGIC') {
    const pos = findTowerPosition(gameState);
    if (pos) {
      testState.towerCount++;
      return navigateAndPlace(gameState, pos);
    }
  }
  
  if (tile.type === 'ROAD') {
    const pos = findRoadPosition(gameState);
    if (pos) {
      testState.roadCount++;
      return navigateAndPlace(gameState, pos);
    }
  }
  
  if (tile.type === 'FLAG') {
    const pos = findEdgePosition(gameState);
    if (pos) {
      return navigateAndPlace(gameState, pos);
    }
  }
  
  // If no good position, skip if we have coins
  if (gameState.coins >= 10) {
    return { key: 'Shift', keyCode: 16 };
  }
  
  // Otherwise place anywhere valid
  const anyPos = findAnyValidPosition(gameState);
  if (anyPos) {
    return navigateAndPlace(gameState, anyPos);
  }
  
  return null;
}

function findTowerPosition(gameState) {
  // Find positions near roads (good coverage)
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      if (!isPositionBuildable(gameState, x, y)) continue;
      
      // Check if near road
      const nearRoad = checkAdjacent(gameState, x, y, 'ROAD');
      if (nearRoad) {
        return { x, y };
      }
    }
  }
  
  return findAnyValidPosition(gameState);
}

function findRoadPosition(gameState) {
  // Extend from existing roads
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      if (gameState.grid[y][x].type === 'ROAD') {
        const adjacent = [
          { x: x + 1, y },
          { x: x - 1, y },
          { x, y: y + 1 },
          { x, y: y - 1 }
        ];
        
        for (let pos of adjacent) {
          if (isPositionBuildable(gameState, pos.x, pos.y)) {
            return pos;
          }
        }
      }
    }
  }
  
  return null;
}

function findSafePosition(gameState) {
  // Find corner or edge positions away from roads
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      if (!isPositionBuildable(gameState, x, y)) continue;
      
      const nearRoad = checkAdjacent(gameState, x, y, 'ROAD');
      if (!nearRoad && (x < 2 || x > 5 || y < 2 || y > 5)) {
        return { x, y };
      }
    }
  }
  
  return findAnyValidPosition(gameState);
}

function findEdgePosition(gameState) {
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      if (!isPositionBuildable(gameState, x, y)) continue;
      if (x === 0 || x === 7 || y === 0 || y === 7) {
        return { x, y };
      }
    }
  }
  return findAnyValidPosition(gameState);
}

function findAnyValidPosition(gameState) {
  for (let pos of gameState.buildableArea) {
    if (gameState.grid[pos.y][pos.x].type === 'EMPTY') {
      return pos;
    }
  }
  return null;
}

function isPositionBuildable(gameState, x, y) {
  if (x < 0 || x >= 8 || y < 0 || y >= 8) return false;
  if (gameState.grid[y][x].type !== 'EMPTY') return false;
  return gameState.buildableArea.some(pos => pos.x === x && pos.y === y);
}

function checkAdjacent(gameState, x, y, type) {
  const adjacent = [
    { x: x + 1, y },
    { x: x - 1, y },
    { x, y: y + 1 },
    { x, y: y - 1 }
  ];
  
  for (let pos of adjacent) {
    if (pos.x >= 0 && pos.x < 8 && pos.y >= 0 && pos.y < 8) {
      if (gameState.grid[pos.y][pos.x].type === type) {
        return true;
      }
    }
  }
  return false;
}

function navigateAndPlace(gameState, target) {
  const dx = target.x - gameState.cursorX;
  const dy = target.y - gameState.cursorY;
  
  if (dx !== 0) {
    return { key: dx > 0 ? 'ArrowRight' : 'ArrowLeft', keyCode: dx > 0 ? 39 : 37 };
  }
  if (dy !== 0) {
    return { key: dy > 0 ? 'ArrowDown' : 'ArrowUp', keyCode: dy > 0 ? 40 : 38 };
  }
  
  // At target position, place tile
  return { key: ' ', keyCode: 32 };
}

function getBasicTestAction(gameState) {
  const framesSinceLastAction = gameState.frameCount - testState.lastActionFrame;
  
  if (framesSinceLastAction < 20) {
    return null;
  }
  
  if (!gameState.waveInProgress && gameState.wave < gameState.maxWaves) {
    if (Math.random() < 0.05) {
      testState.lastActionFrame = gameState.frameCount;
      return { key: 'z', keyCode: 90 };
    }
  }
  
  if (gameState.waveInProgress) {
    return null;
  }
  
  if (gameState.currentTile) {
    const actions = [
      { key: 'ArrowLeft', keyCode: 37 },
      { key: 'ArrowRight', keyCode: 39 },
      { key: 'ArrowUp', keyCode: 38 },
      { key: 'ArrowDown', keyCode: 40 },
      { key: ' ', keyCode: 32 }
    ];
    
    if (gameState.coins >= 10 && Math.random() < 0.1) {
      testState.lastActionFrame = gameState.frameCount;
      return { key: 'Shift', keyCode: 16 };
    }
    
    testState.lastActionFrame = gameState.frameCount;
    return actions[Math.floor(Math.random() * actions.length)];
  }
  
  return null;
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case 'TEST_1':
      return getBasicTestAction(gameState);
    case 'TEST_2':
      return getTestWinAction(gameState);
    default:
      return null;
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;