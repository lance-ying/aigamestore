import { gameState, SPECIAL_TYPES } from './globals.js';
import { findAllMatches } from './grid.js';

export function processMatches(p, grid) {
  const matches = findAllMatches(grid);
  
  if (matches.length === 0) {
    return false;
  }
  
  // Group matches by connected components to determine match size
  const matchGroups = groupMatches(matches);
  
  matchGroups.forEach(group => {
    const matchSize = group.length;
    let basePoints = 0;
    let boosterCreated = false;
    
    if (matchSize === 3) {
      basePoints = 10;
    } else if (matchSize === 4) {
      basePoints = 20;
      boosterCreated = true;
      createFlameBooster(grid, group);
      gameState.score += 50;
    } else if (matchSize >= 5) {
      basePoints = 30;
      boosterCreated = true;
      createGrillFlipBooster(grid, group);
      gameState.score += 100;
    }
    
    // Clear tiles and update objectives
    group.forEach(match => {
      const cell = grid[match.row][match.col];
      const type = cell.type;
      
      // Update objectives
      if (gameState.objectives[type] !== undefined) {
        gameState.objectives[type]++;
      }
      if (gameState.objectives.TOTAL !== undefined) {
        gameState.objectives.TOTAL++;
      }
      
      // Score points
      gameState.score += basePoints;
      
      // Clear adjacent burnt blocks
      clearAdjacentBurnt(grid, match.row, match.col);
      
      // Mark for clearing (unless booster is created there)
      if (!boosterCreated || group.indexOf(match) !== 0) {
        cell.type = SPECIAL_TYPES.EMPTY;
        cell.special = null;
      }
    });
  });
  
  return true;
}

function groupMatches(matches) {
  const groups = [];
  const processed = new Set();
  
  matches.forEach(match => {
    const key = `${match.row},${match.col}`;
    if (processed.has(key)) return;
    
    const group = [match];
    processed.add(key);
    
    // Find connected matches
    let i = 0;
    while (i < group.length) {
      const current = group[i];
      matches.forEach(other => {
        const otherKey = `${other.row},${other.col}`;
        if (processed.has(otherKey)) return;
        
        if ((Math.abs(current.row - other.row) === 1 && current.col === other.col) ||
            (Math.abs(current.col - other.col) === 1 && current.row === other.row)) {
          group.push(other);
          processed.add(otherKey);
        }
      });
      i++;
    }
    
    groups.push(group);
  });
  
  return groups;
}

function createFlameBooster(grid, group) {
  const pos = group[0];
  grid[pos.row][pos.col].special = SPECIAL_TYPES.FLAME;
}

function createGrillFlipBooster(grid, group) {
  const pos = group[0];
  grid[pos.row][pos.col].special = SPECIAL_TYPES.GRILL_FLIP;
}

function clearAdjacentBurnt(grid, row, col) {
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  
  directions.forEach(([dr, dc]) => {
    const newRow = row + dr;
    const newCol = col + dc;
    
    if (newRow >= 0 && newRow < grid.length && newCol >= 0 && newCol < grid[0].length) {
      if (grid[newRow][newCol].type === SPECIAL_TYPES.BURNT) {
        grid[newRow][newCol].type = SPECIAL_TYPES.EMPTY;
        gameState.score += 50;
        
        if (gameState.objectives.BURNT !== undefined) {
          gameState.objectives.BURNT++;
        }
      }
    }
  });
}

export function activateFlameBooster(p, grid, row, col) {
  // Clear entire row
  for (let c = 0; c < grid[0].length; c++) {
    if (grid[row][c].type !== SPECIAL_TYPES.EMPTY) {
      if (grid[row][c].type === SPECIAL_TYPES.BURNT) {
        gameState.score += 50;
        if (gameState.objectives.BURNT !== undefined) {
          gameState.objectives.BURNT++;
        }
      } else if (gameState.objectives[grid[row][c].type] !== undefined) {
        gameState.objectives[grid[row][c].type]++;
      }
      if (gameState.objectives.TOTAL !== undefined && grid[row][c].type !== SPECIAL_TYPES.BURNT) {
        gameState.objectives.TOTAL++;
      }
      grid[row][c].type = SPECIAL_TYPES.EMPTY;
      grid[row][c].special = null;
    }
  }
  
  gameState.score += 25;
  
  if (gameState.objectives.FLAME_ACTIVATED !== undefined) {
    gameState.objectives.FLAME_ACTIVATED++;
  }
}

export function activateGrillFlipBooster(p, grid, row, col, levelData) {
  // Clear the booster tile
  grid[row][col].type = SPECIAL_TYPES.EMPTY;
  grid[row][col].special = null;
  
  // Collect all non-special tiles
  const tiles = [];
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      if (grid[r][c].type !== SPECIAL_TYPES.BURNT && 
          grid[r][c].type !== SPECIAL_TYPES.EMPTY && 
          grid[r][c].special === null) {
        tiles.push(grid[r][c].type);
      }
    }
  }
  
  // Shuffle tiles
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(p.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  
  // Place shuffled tiles back
  let tileIndex = 0;
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      if (grid[r][c].type !== SPECIAL_TYPES.BURNT && 
          grid[r][c].type !== SPECIAL_TYPES.EMPTY && 
          grid[r][c].special === null) {
        grid[r][c].type = tiles[tileIndex++];
      }
    }
  }
  
  gameState.score += 50;
  
  if (gameState.objectives.GRILL_FLIP_ACTIVATED !== undefined) {
    gameState.objectives.GRILL_FLIP_ACTIVATED++;
  }
}