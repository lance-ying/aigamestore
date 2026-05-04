// tiles.js - Tile generation and management
import { TILE_TYPES, gameState } from './globals.js';

export function generateRandomTile(p) {
  const tileOptions = [
    { type: TILE_TYPES.TOWER, weight: 25 },
    { type: TILE_TYPES.ARCHER, weight: 20 },
    { type: TILE_TYPES.CANNON, weight: 15 },
    { type: TILE_TYPES.MAGIC, weight: 10 },
    { type: TILE_TYPES.ROAD, weight: 15 },
    { type: TILE_TYPES.FLAG, weight: 10 },
    { type: TILE_TYPES.GARDEN, weight: 5 }
  ];
  
  const totalWeight = tileOptions.reduce((sum, opt) => sum + opt.weight, 0);
  let rand = p.random(totalWeight);
  
  for (let option of tileOptions) {
    rand -= option.weight;
    if (rand <= 0) {
      return createTile(option.type);
    }
  }
  
  return createTile(TILE_TYPES.TOWER);
}

export function createTile(type) {
  switch (type) {
    case TILE_TYPES.TOWER:
      return {
        type: TILE_TYPES.TOWER,
        name: 'Basic Tower',
        description: 'Attacks nearby enemies',
        range: 2,
        damage: 10,
        cooldown: 60,
        color: [100, 150, 200]
      };
    case TILE_TYPES.ARCHER:
      return {
        type: TILE_TYPES.ARCHER,
        name: 'Archer Tower',
        description: 'Fast attacks, lower damage',
        range: 3,
        damage: 5,
        cooldown: 30,
        color: [150, 100, 50]
      };
    case TILE_TYPES.CANNON:
      return {
        type: TILE_TYPES.CANNON,
        name: 'Cannon Tower',
        description: 'Slow, heavy damage',
        range: 2.5,
        damage: 25,
        cooldown: 120,
        color: [80, 80, 80]
      };
    case TILE_TYPES.MAGIC:
      return {
        type: TILE_TYPES.MAGIC,
        name: 'Magic Tower',
        description: 'Long range, magic damage',
        range: 4,
        damage: 15,
        cooldown: 80,
        color: [150, 50, 200]
      };
    case TILE_TYPES.ROAD:
      return {
        type: TILE_TYPES.ROAD,
        name: 'Road',
        description: 'Extends enemy path',
        color: [120, 100, 80]
      };
    case TILE_TYPES.FLAG:
      return {
        type: TILE_TYPES.FLAG,
        name: 'Flag',
        description: 'Expands buildable area',
        color: [200, 50, 50]
      };
    case TILE_TYPES.GARDEN:
      return {
        type: TILE_TYPES.GARDEN,
        name: 'Garden',
        description: 'Generates 1 coin/sec',
        color: [50, 200, 50]
      };
    default:
      return null;
  }
}

export function canPlaceTile(x, y) {
  if (x < 0 || x >= 8 || y < 0 || y >= 8) return false;
  if (gameState.grid[y][x].type !== TILE_TYPES.EMPTY) return false;
  
  // Check if in buildable area
  return gameState.buildableArea.some(pos => pos.x === x && pos.y === y);
}

export function placeTile(x, y, tile) {
  if (!canPlaceTile(x, y)) return false;
  
  gameState.grid[y][x] = {
    type: tile.type,
    data: { ...tile }
  };
  
  // Handle flag expansion
  if (tile.type === TILE_TYPES.FLAG) {
    expandBuildableArea(x, y);
  }
  
  gameState.score += 10;
  return true;
}

function expandBuildableArea(x, y) {
  const directions = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
    [-1, -1], [-1, 1], [1, -1], [1, 1]
  ];
  
  for (let [dx, dy] of directions) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
      if (!gameState.buildableArea.some(pos => pos.x === nx && pos.y === ny)) {
        gameState.buildableArea.push({ x: nx, y: ny });
      }
    }
  }
}