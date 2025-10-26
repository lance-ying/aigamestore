// testing.js - Automated testing modes
import { gameState } from './globals.js';

export function getTestingAction(p) {
  if (gameState.controlMode === 'HUMAN') return null;
  
  if (gameState.controlMode === 'TEST_1') {
    return getBasicTestAction(p);
  } else if (gameState.controlMode === 'TEST_2') {
    return getWinTestAction(p);
  }
  
  return null;
}

function getBasicTestAction(p) {
  // Basic testing: summon units and place them
  if (gameState.gamePhase === 'START') {
    return { keyCode: 13 }; // ENTER
  }
  
  if (gameState.gamePhase === 'PLAYING' && !gameState.placementMode) {
    const config = gameState.levelConfigs[gameState.level - 1];
    if (gameState.currency >= config.summonCost) {
      if (p.frameCount % 120 === 0) {
        return { keyCode: 32 }; // SPACE - summon
      }
    }
  }
  
  if (gameState.placementMode) {
    // Find empty spot
    for (let y = 0; y < 6; y++) {
      for (let x = 0; x < 10; x++) {
        if (!gameState.grid[y][x]) {
          if (gameState.cursorX !== x || gameState.cursorY !== y) {
            // Move cursor
            if (gameState.cursorX < x) return { keyCode: 39 }; // RIGHT
            if (gameState.cursorX > x) return { keyCode: 37 }; // LEFT
            if (gameState.cursorY < y) return { keyCode: 40 }; // DOWN
            if (gameState.cursorY > y) return { keyCode: 38 }; // UP
          } else {
            return { keyCode: 16 }; // SHIFT - place
          }
        }
      }
    }
  }
  
  return null;
}

function getWinTestAction(p) {
  // Win test: aggressive unit spawning and merging
  if (gameState.gamePhase === 'START') {
    return { keyCode: 13 }; // ENTER
  }
  
  if (gameState.gamePhase === 'PLAYING') {
    // Summon frequently
    if (!gameState.placementMode) {
      const config = gameState.levelConfigs[gameState.level - 1];
      if (gameState.currency >= config.summonCost) {
        if (p.frameCount % 30 === 0) {
          return { keyCode: 32 }; // SPACE
        }
      }
      
      // Try to merge
      if (p.frameCount % 180 === 0) {
        for (const unit of gameState.units) {
          const neighbors = getAdjacentUnits(unit);
          for (const neighbor of neighbors) {
            if (unit.type === neighbor.type && unit.rarity === neighbor.rarity && unit.rarity !== 'Legendary') {
              // Select first unit
              gameState.cursorX = unit.gridX;
              gameState.cursorY = unit.gridY;
              return { keyCode: 16 }; // SHIFT
            }
          }
        }
      }
    }
    
    if (gameState.placementMode) {
      // Quick placement
      for (let y = 0; y < 6; y++) {
        for (let x = 0; x < 10; x++) {
          if (!gameState.grid[y][x]) {
            if (gameState.cursorX !== x || gameState.cursorY !== y) {
              if (gameState.cursorX < x) return { keyCode: 39 };
              if (gameState.cursorX > x) return { keyCode: 37 };
              if (gameState.cursorY < y) return { keyCode: 40 };
              if (gameState.cursorY > y) return { keyCode: 38 };
            } else {
              return { keyCode: 16 };
            }
          }
        }
      }
    }
  }
  
  return null;
}

function getAdjacentUnits(unit) {
  const adjacent = [];
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  
  for (const [dx, dy] of dirs) {
    const nx = unit.gridX + dx;
    const ny = unit.gridY + dy;
    
    if (nx >= 0 && nx < 10 && ny >= 0 && ny < 6) {
      const neighbor = gameState.grid[ny][nx];
      if (neighbor) {
        adjacent.push(neighbor);
      }
    }
  }
  
  return adjacent;
}