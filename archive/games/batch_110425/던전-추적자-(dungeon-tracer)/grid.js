import { gameState, GRID_SIZE, TILE_TYPES } from './globals.js';

export function initializeGrid(p) {
  gameState.grid = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    gameState.grid[y] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      gameState.grid[y][x] = generateTile(p, x, y);
    }
  }
  
  // Spawn initial enemies
  spawnEnemies(p, 3);
}

function generateTile(p, x, y) {
  const rand = p.random();
  
  if (rand < 0.3) {
    return { type: TILE_TYPES.WEAPON, value: p.floor(p.random(5, 15)), x, y };
  } else if (rand < 0.5) {
    return { type: TILE_TYPES.MAGIC, value: p.floor(p.random(8, 20)), x, y };
  } else if (rand < 0.6) {
    return { type: TILE_TYPES.DEFENSE, value: p.floor(p.random(3, 10)), x, y };
  } else if (rand < 0.75) {
    return { type: TILE_TYPES.GOLD, value: p.floor(p.random(10, 30)), x, y };
  } else if (rand < 0.85) {
    return { type: TILE_TYPES.HEALTH, value: p.floor(p.random(10, 25)), x, y };
  } else if (rand < 0.95) {
    return { type: TILE_TYPES.EMPTY, x, y };
  } else {
    return { type: TILE_TYPES.ABILITY, abilityIndex: p.floor(p.random(0, 5)), x, y };
  }
}

export function spawnEnemies(p, count) {
  for (let i = 0; i < count; i++) {
    const emptyTiles = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (gameState.grid[y][x].type === TILE_TYPES.EMPTY) {
          emptyTiles.push({ x, y });
        }
      }
    }
    
    if (emptyTiles.length > 0) {
      const pos = emptyTiles[p.floor(p.random(emptyTiles.length))];
      const isSpecial = gameState.specialMonstersDefeated < 25 && p.random() < 0.15;
      
      const enemy = {
        type: isSpecial ? TILE_TYPES.SPECIAL_ENEMY : TILE_TYPES.ENEMY,
        health: isSpecial ? p.floor(p.random(50, 100)) : p.floor(p.random(20, 50)),
        maxHealth: isSpecial ? p.floor(p.random(50, 100)) : p.floor(p.random(20, 50)),
        damage: isSpecial ? p.floor(p.random(10, 25)) : p.floor(p.random(5, 15)),
        x: pos.x,
        y: pos.y,
        moveTimer: p.floor(p.random(2, 5))
      };
      enemy.maxHealth = enemy.health;
      
      gameState.grid[pos.y][pos.x] = enemy;
      gameState.enemiesOnBoard.push(enemy);
    }
  }
}

export function refillGrid(p) {
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (gameState.grid[y][x].type === TILE_TYPES.EMPTY) {
        gameState.grid[y][x] = generateTile(p, x, y);
      }
    }
  }
}

export function isAdjacent(x1, y1, x2, y2) {
  const dx = Math.abs(x1 - x2);
  const dy = Math.abs(y1 - y2);
  return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
}

export function isTileInPath(x, y) {
  return gameState.currentPath.some(tile => tile.x === x && tile.y === y);
}