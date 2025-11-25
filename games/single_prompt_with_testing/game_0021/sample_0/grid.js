// grid.js
import { TILE_SIZE, GRID_WIDTH, GRID_HEIGHT, GRID_OFFSET_X, GRID_OFFSET_Y, TILE_TYPES } from './globals.js';
import { Block, Skeleton, DemonGirl, Spike } from './entities.js';

export function initializeGrid(level, gameState) {
  gameState.grid = [];
  gameState.entities = [];
  
  // Copy level grid
  for (let y = 0; y < GRID_HEIGHT; y++) {
    gameState.grid[y] = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
      gameState.grid[y][x] = level.grid[y][x];
    }
  }
  
  // Create entities from grid
  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      const tile = gameState.grid[y][x];
      if (tile === TILE_TYPES.BLOCK) {
        gameState.entities.push(new Block(x, y));
        gameState.grid[y][x] = TILE_TYPES.EMPTY;
      } else if (tile === TILE_TYPES.SKELETON) {
        gameState.entities.push(new Skeleton(x, y));
        gameState.grid[y][x] = TILE_TYPES.EMPTY;
      } else if (tile === TILE_TYPES.GOAL) {
        gameState.entities.push(new DemonGirl(x, y));
        gameState.grid[y][x] = TILE_TYPES.EMPTY;
      } else if (tile === TILE_TYPES.SPIKE) {
        gameState.entities.push(new Spike(x, y));
      }
    }
  }
}

export function renderGrid(p, gameState) {
  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      const screenX = GRID_OFFSET_X + x * TILE_SIZE;
      const screenY = GRID_OFFSET_Y + y * TILE_SIZE;
      const tile = gameState.grid[y][x];
      
      // Background tile
      p.fill(60, 50, 50);
      p.stroke(80, 70, 70);
      p.strokeWeight(1);
      p.rect(screenX, screenY, TILE_SIZE, TILE_SIZE);
      
      // Wall
      if (tile === TILE_TYPES.WALL) {
        p.fill(40, 35, 35);
        p.stroke(20, 15, 15);
        p.strokeWeight(2);
        p.rect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        
        // Wall texture
        p.noStroke();
        p.fill(50, 45, 45);
        p.rect(screenX + 2, screenY + 2, 8, 8);
        p.rect(screenX + TILE_SIZE - 10, screenY + 2, 8, 8);
        p.rect(screenX + 2, screenY + TILE_SIZE - 10, 8, 8);
        p.rect(screenX + TILE_SIZE - 10, screenY + TILE_SIZE - 10, 8, 8);
      }
      // Floor pattern
      else if (tile === TILE_TYPES.EMPTY) {
        const shade = ((x + y) % 2 === 0) ? 70 : 60;
        p.noStroke();
        p.fill(shade, shade - 10, shade - 10);
        p.rect(screenX, screenY, TILE_SIZE, TILE_SIZE);
      }
    }
  }
}

export function getTileAt(grid, x, y) {
  if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) {
    return TILE_TYPES.WALL;
  }
  return grid[y][x];
}

export function getEntityAt(entities, x, y) {
  return entities.find(e => e.gridX === x && e.gridY === y);
}

export function isPositionFree(gameState, x, y, ignoreEntity = null) {
  if (getTileAt(gameState.grid, x, y) !== TILE_TYPES.EMPTY) {
    return false;
  }
  
  const entity = getEntityAt(gameState.entities, x, y);
  if (entity && entity !== ignoreEntity && entity.type !== TILE_TYPES.GOAL && entity.type !== TILE_TYPES.SPIKE) {
    return false;
  }
  
  return true;
}