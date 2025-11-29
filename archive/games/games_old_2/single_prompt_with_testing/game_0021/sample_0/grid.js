// grid.js - Grid and tile management
import { GRID_COLS, GRID_ROWS, TILE_TYPES, GRID_OFFSET_X, GRID_OFFSET_Y, TILE_SIZE, gameState } from './globals.js';

export class Tile {
  constructor(row, col, type) {
    this.row = row;
    this.col = col;
    this.type = type;
    this.selected = false;
    this.matched = false;
    this.fallDistance = 0;
    this.shimmer = Math.random() * Math.PI * 2;
  }

  getScreenX() {
    return GRID_OFFSET_X + this.col * TILE_SIZE;
  }

  getScreenY() {
    return GRID_OFFSET_Y + this.row * TILE_SIZE + this.fallDistance;
  }

  render(p) {
    const x = this.getScreenX();
    const y = this.getScreenY();
    
    p.push();
    p.translate(x + TILE_SIZE / 2, y + TILE_SIZE / 2);
    
    // Background
    if (this.selected) {
      p.fill(255, 255, 150, 200);
    } else {
      p.fill(60, 60, 80);
    }
    p.stroke(40, 40, 60);
    p.strokeWeight(2);
    p.rect(-TILE_SIZE / 2 + 2, -TILE_SIZE / 2 + 2, TILE_SIZE - 4, TILE_SIZE - 4, 4);
    
    // Icon based on type
    p.noStroke();
    const shimmerVal = Math.sin(this.shimmer + p.frameCount * 0.05) * 10 + 10;
    
    if (this.type === TILE_TYPES.SWORD) {
      p.fill(220 + shimmerVal, 50, 50);
      // Blade
      p.beginShape();
      p.vertex(0, -15);
      p.vertex(4, -10);
      p.vertex(4, 10);
      p.vertex(-4, 10);
      p.vertex(-4, -10);
      p.endShape(p.CLOSE);
      // Handle
      p.fill(139, 69, 19);
      p.rect(-3, 10, 6, 8);
      // Cross-guard
      p.fill(180, 180, 180);
      p.rect(-8, 8, 16, 3);
    } else if (this.type === TILE_TYPES.SHIELD) {
      p.fill(70 + shimmerVal, 130, 220);
      // Shield shape
      p.beginShape();
      p.vertex(0, -15);
      p.vertex(10, -10);
      p.vertex(10, 5);
      p.vertex(0, 15);
      p.vertex(-10, 5);
      p.vertex(-10, -10);
      p.endShape(p.CLOSE);
      // Cross
      p.fill(220, 220, 100);
      p.rect(-1, -10, 2, 20);
      p.rect(-8, -1, 16, 2);
    } else if (this.type === TILE_TYPES.POTION) {
      p.fill(50, 220 + shimmerVal, 50);
      // Bottle
      p.ellipse(0, 5, 12, 16);
      p.rect(-6, -5, 12, 10);
      // Cork
      p.fill(139, 69, 19);
      p.rect(-3, -8, 6, 4);
      // Shine
      p.fill(150, 255, 150, 150);
      p.ellipse(-3, 2, 4, 6);
    }
    
    p.pop();
  }
}

export function initializeGrid(p) {
  gameState.grid = [];
  const types = [TILE_TYPES.SWORD, TILE_TYPES.SHIELD, TILE_TYPES.POTION];
  
  for (let row = 0; row < GRID_ROWS; row++) {
    gameState.grid[row] = [];
    for (let col = 0; col < GRID_COLS; col++) {
      const type = types[p.floor(p.random(types.length))];
      gameState.grid[row][col] = new Tile(row, col, type);
    }
  }
}

export function getTileAt(screenX, screenY) {
  const col = Math.floor((screenX - GRID_OFFSET_X) / TILE_SIZE);
  const row = Math.floor((screenY - GRID_OFFSET_Y) / TILE_SIZE);
  
  if (row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS) {
    return gameState.grid[row][col];
  }
  return null;
}

export function isAdjacent(tile1, tile2) {
  if (!tile1 || !tile2) return false;
  const rowDiff = Math.abs(tile1.row - tile2.row);
  const colDiff = Math.abs(tile1.col - tile2.col);
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

export function selectPath(path) {
  // Clear previous selection
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      gameState.grid[row][col].selected = false;
    }
  }
  
  // Select new path
  for (const tile of path) {
    tile.selected = true;
  }
}

export function executeMatch(path, p) {
  if (path.length < 3) return false;
  
  const matchType = path[0].type;
  const matchLength = path.length;
  
  // Mark tiles as matched
  for (const tile of path) {
    tile.matched = true;
    tile.selected = false;
  }
  
  // Execute effect based on type
  let effectStrength = matchLength;
  
  if (matchType === TILE_TYPES.SWORD) {
    // Attack enemies
    const damage = gameState.player.attack * effectStrength;
    let totalDamage = 0;
    for (const enemy of gameState.enemies) {
      if (!enemy.isDead) {
        totalDamage += enemy.takeDamage(damage);
      }
    }
    gameState.score += totalDamage;
    gameState.lastMatchType = "ATTACK";
  } else if (matchType === TILE_TYPES.SHIELD) {
    // Add defense for this turn
    const defenseGain = effectStrength * 5;
    gameState.defenseBonus += defenseGain;
    gameState.lastMatchType = "DEFENSE";
  } else if (matchType === TILE_TYPES.POTION) {
    // Heal player
    const healAmount = effectStrength * 15;
    gameState.player.heal(healAmount);
    gameState.lastMatchType = "HEAL";
  }
  
  // Combo tracking
  gameState.combos++;
  if (gameState.combos > gameState.maxCombo) {
    gameState.maxCombo = gameState.combos;
  }
  
  // Bonus points for longer matches
  gameState.score += matchLength * 10;
  
  // Clear matched tiles and create new ones
  refillGrid(p);
  
  return true;
}

export function refillGrid(p) {
  const types = [TILE_TYPES.SWORD, TILE_TYPES.SHIELD, TILE_TYPES.POTION];
  
  // Remove matched tiles and shift down
  for (let col = 0; col < GRID_COLS; col++) {
    let emptyRow = GRID_ROWS - 1;
    for (let row = GRID_ROWS - 1; row >= 0; row--) {
      if (!gameState.grid[row][col].matched) {
        if (row !== emptyRow) {
          gameState.grid[emptyRow][col] = gameState.grid[row][col];
          gameState.grid[emptyRow][col].row = emptyRow;
        }
        emptyRow--;
      }
    }
    
    // Fill empty spaces at top
    for (let row = emptyRow; row >= 0; row--) {
      const type = types[p.floor(p.random(types.length))];
      gameState.grid[row][col] = new Tile(row, col, type);
      gameState.grid[row][col].fallDistance = -TILE_SIZE * (emptyRow - row + 1);
    }
  }
  
  // Animate falling tiles
  animateFallingTiles();
}

function animateFallingTiles() {
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const tile = gameState.grid[row][col];
      if (tile.fallDistance !== 0) {
        tile.fallDistance *= 0.7;
        if (Math.abs(tile.fallDistance) < 1) {
          tile.fallDistance = 0;
        }
      }
    }
  }
}

export function findLongestMatchingPath(startRow, startCol, p) {
  const startTile = gameState.grid[startRow][startCol];
  const targetType = startTile.type;
  let longestPath = [];
  
  function dfs(tile, visited, currentPath) {
    if (!tile || tile.type !== targetType || visited.has(tile)) {
      return;
    }
    
    visited.add(tile);
    currentPath.push(tile);
    
    if (currentPath.length > longestPath.length) {
      longestPath = [...currentPath];
    }
    
    // Try all adjacent tiles
    const neighbors = [
      {row: tile.row - 1, col: tile.col},
      {row: tile.row + 1, col: tile.col},
      {row: tile.row, col: tile.col - 1},
      {row: tile.row, col: tile.col + 1}
    ];
    
    for (const {row, col} of neighbors) {
      if (row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS) {
        const nextTile = gameState.grid[row][col];
        dfs(nextTile, visited, currentPath);
      }
    }
    
    currentPath.pop();
    visited.delete(tile);
  }
  
  dfs(startTile, new Set(), []);
  return longestPath;
}