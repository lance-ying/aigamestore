// automated_testing_controller.js - Automated testing

import { gameState, GAME_PHASES, GRID_SIZE } from './globals.js';
import { findAdjacentTiles } from './grid.js';

// Helper to find best match on grid
function findBestMatch() {
  let bestMatch = null;
  let bestScore = 0;
  
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const tile = gameState.grid[row][col];
      if (!tile) continue;
      
      const matches = findAdjacentTiles(row, col, tile.type);
      if (matches.length >= 3) {
        // Score based on tile type and count
        let score = matches.length;
        
        // Prioritize attack when enemies present
        if (tile.type === 'RED' && gameState.enemies.length > 0) {
          score *= 3;
        }
        
        // Prioritize healing when low HP
        if (tile.type === 'GREEN' && gameState.player && gameState.player.hp < gameState.player.maxHP * 0.5) {
          score *= 2;
        }
        
        // Prioritize defense when enemies are strong
        if (tile.type === 'BLUE' && gameState.enemies.length > 0) {
          score *= 1.5;
        }
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = { row, col, type: tile.type, matches };
        }
      }
    }
  }
  
  return bestMatch;
}

// State tracking for test execution
const testState = {
  currentPath: [],
  pathIndex: 0,
  waitFrames: 0,
  lastAction: null
};

function getTestBasicAction(gameState) {
  // Basic movement and matching test
  
  if (testState.waitFrames > 0) {
    testState.waitFrames--;
    return null;
  }
  
  // If we have a path, follow it
  if (testState.currentPath.length > 0 && testState.pathIndex < testState.currentPath.length) {
    const action = testState.currentPath[testState.pathIndex];
    testState.pathIndex++;
    
    if (testState.pathIndex >= testState.currentPath.length) {
      testState.currentPath = [];
      testState.pathIndex = 0;
      testState.waitFrames = 30; // Wait after completing path
    }
    
    return action;
  }
  
  // Find new match
  const match = findBestMatch();
  if (match) {
    // Build path to match
    testState.currentPath = [];
    
    // Navigate to first tile
    const startTile = match.matches[0];
    testState.currentPath.push(...buildNavigationPath(startTile.row, startTile.col));
    
    // Select tiles
    for (let i = 0; i < Math.min(match.matches.length, 5); i++) {
      const tile = match.matches[i];
      testState.currentPath.push(...buildNavigationPath(tile.row, tile.col));
      testState.currentPath.push(32); // Space to select
    }
    
    testState.pathIndex = 0;
    return null;
  }
  
  // Random exploration if no matches found
  const directions = [37, 38, 39, 40]; // Arrow keys
  return directions[Math.floor(Math.random() * directions.length)];
}

function getTestWinAction(gameState) {
  // Optimal strategy to progress through floors
  
  if (testState.waitFrames > 0) {
    testState.waitFrames--;
    return null;
  }
  
  // If we have a path, follow it
  if (testState.currentPath.length > 0 && testState.pathIndex < testState.currentPath.length) {
    const action = testState.currentPath[testState.pathIndex];
    testState.pathIndex++;
    
    if (testState.pathIndex >= testState.currentPath.length) {
      testState.currentPath = [];
      testState.pathIndex = 0;
      testState.waitFrames = 20;
    }
    
    return action;
  }
  
  // Strategic matching
  const player = gameState.player;
  const hasEnemies = gameState.enemies.length > 0;
  
  let bestMatch = null;
  let bestPriority = -1;
  
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const tile = gameState.grid[row][col];
      if (!tile) continue;
      
      const matches = findAdjacentTiles(row, col, tile.type);
      if (matches.length >= 3) {
        let priority = matches.length;
        
        // Attack priority when enemies present
        if (tile.type === 'RED' && hasEnemies) {
          priority += 100;
        }
        
        // Healing priority when low HP
        if (tile.type === 'GREEN' && player.hp < player.maxHP * 0.6) {
          priority += 50;
        }
        
        // Defense priority before enemy turn
        if (tile.type === 'BLUE' && hasEnemies && gameState.selectedTiles.length === 0) {
          priority += 30;
        }
        
        // Longer chains are better
        priority += matches.length * 5;
        
        if (priority > bestPriority) {
          bestPriority = priority;
          bestMatch = { row, col, type: tile.type, matches };
        }
      }
    }
  }
  
  if (bestMatch) {
    testState.currentPath = [];
    
    // Navigate and select optimally
    for (let i = 0; i < Math.min(bestMatch.matches.length, 8); i++) {
      const tile = bestMatch.matches[i];
      testState.currentPath.push(...buildNavigationPath(tile.row, tile.col));
      testState.currentPath.push(32); // Space
    }
    
    testState.pathIndex = 0;
    return null;
  }
  
  return 39; // Move right by default
}

function getTestDefenseAction(gameState) {
  // Test defensive gameplay
  
  if (testState.waitFrames > 0) {
    testState.waitFrames--;
    return null;
  }
  
  if (testState.currentPath.length > 0 && testState.pathIndex < testState.currentPath.length) {
    const action = testState.currentPath[testState.pathIndex];
    testState.pathIndex++;
    
    if (testState.pathIndex >= testState.currentPath.length) {
      testState.currentPath = [];
      testState.pathIndex = 0;
      testState.waitFrames = 25;
    }
    
    return action;
  }
  
  const player = gameState.player;
  const hasEnemies = gameState.enemies.length > 0;
  
  // Prioritize defense and healing
  let bestMatch = null;
  let bestPriority = -1;
  
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const tile = gameState.grid[row][col];
      if (!tile) continue;
      
      const matches = findAdjacentTiles(row, col, tile.type);
      if (matches.length >= 3) {
        let priority = 0;
        
        if (tile.type === 'BLUE' && hasEnemies) {
          priority = 100 + matches.length * 10;
        } else if (tile.type === 'GREEN' && player.hp < player.maxHP * 0.8) {
          priority = 90 + matches.length * 10;
        } else if (tile.type === 'RED' && hasEnemies) {
          priority = 50 + matches.length * 5;
        } else {
          priority = matches.length;
        }
        
        if (priority > bestPriority) {
          bestPriority = priority;
          bestMatch = { row, col, type: tile.type, matches };
        }
      }
    }
  }
  
  if (bestMatch) {
    testState.currentPath = [];
    
    for (let i = 0; i < Math.min(bestMatch.matches.length, 6); i++) {
      const tile = bestMatch.matches[i];
      testState.currentPath.push(...buildNavigationPath(tile.row, tile.col));
      testState.currentPath.push(32);
    }
    
    testState.pathIndex = 0;
    return null;
  }
  
  return 40; // Move down
}

// Helper to build navigation path
function buildNavigationPath(targetRow, targetCol) {
  // Import cursor position would create circular dependency
  // So we'll use a simpler approach - just return the keys needed
  const path = [];
  
  // This is simplified - in real implementation would track current cursor
  // For now, just move in general direction
  if (targetRow < 2) path.push(38); // UP
  if (targetRow > 3) path.push(40); // DOWN
  if (targetCol < 2) path.push(37); // LEFT
  if (targetCol > 3) path.push(39); // RIGHT
  
  return path;
}

function getRandomAction(gameState) {
  const actions = [37, 38, 39, 40, 32]; // Arrows and space
  return actions[Math.floor(Math.random() * actions.length)];
}

export function get_automated_testing_action(gameState) {
  // Don't act during delays or non-playing phases
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  if (gameState.turnDelay > 0) {
    return null;
  }
  
  switch (gameState.controlMode) {
    case 'TEST_1':
      return getTestBasicAction(gameState);
    case 'TEST_2':
      return getTestWinAction(gameState);
    case 'TEST_3':
      return getTestDefenseAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;