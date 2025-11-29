// levelgen.js - Procedural level generation

import { 
  gameState, 
  GRID_WIDTH, 
  GRID_HEIGHT, 
  TILE_EMPTY, 
  TILE_SOLID, 
  TILE_DESTRUCTIBLE, 
  TILE_LADDER,
  TILE_PLATFORM
} from './globals.js';
import { randomInt, randomChoice } from './utils.js';
import { Gem } from './entities.js';
import { Enemy } from './entities.js';
import { ExitDoor } from './entities.js';

export function generateLevel() {
  // Initialize empty grid
  gameState.tiles = [];
  for (let y = 0; y < GRID_HEIGHT; y++) {
    gameState.tiles[y] = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
      gameState.tiles[y][x] = TILE_EMPTY;
    }
  }
  
  // Create solid borders
  for (let x = 0; x < GRID_WIDTH; x++) {
    gameState.tiles[0][x] = TILE_SOLID; // Top
    gameState.tiles[GRID_HEIGHT - 1][x] = TILE_SOLID; // Bottom
  }
  for (let y = 0; y < GRID_HEIGHT; y++) {
    gameState.tiles[y][0] = TILE_SOLID; // Left
    gameState.tiles[y][GRID_WIDTH - 1] = TILE_SOLID; // Right
  }
  
  // Create floor with some variation
  const floorLevel = GRID_HEIGHT - 3;
  for (let x = 1; x < GRID_WIDTH - 1; x++) {
    const height = randomInt(0, 1);
    for (let y = floorLevel + height; y < GRID_HEIGHT - 1; y++) {
      gameState.tiles[y][x] = Math.random() < 0.7 ? TILE_SOLID : TILE_DESTRUCTIBLE;
    }
  }
  
  // Create platforms at different heights
  const numPlatforms = randomInt(8, 12);
  for (let i = 0; i < numPlatforms; i++) {
    const x = randomInt(2, GRID_WIDTH - 8);
    const y = randomInt(5, GRID_HEIGHT - 8);
    const width = randomInt(3, 6);
    const isOneWay = Math.random() < 0.4;
    
    for (let dx = 0; dx < width; dx++) {
      if (x + dx < GRID_WIDTH - 1) {
        if (isOneWay) {
          gameState.tiles[y][x + dx] = TILE_PLATFORM;
        } else {
          gameState.tiles[y][x + dx] = Math.random() < 0.6 ? TILE_SOLID : TILE_DESTRUCTIBLE;
        }
      }
    }
  }
  
  // Add some vertical structures
  const numColumns = randomInt(3, 5);
  for (let i = 0; i < numColumns; i++) {
    const x = randomInt(3, GRID_WIDTH - 4);
    const startY = randomInt(8, GRID_HEIGHT - 8);
    const height = randomInt(3, 6);
    
    for (let dy = 0; dy < height; dy++) {
      if (startY + dy < GRID_HEIGHT - 2) {
        gameState.tiles[startY + dy][x] = TILE_DESTRUCTIBLE;
      }
    }
  }
  
  // Add ladders connecting platforms
  const numLadders = randomInt(4, 7);
  for (let i = 0; i < numLadders; i++) {
    const x = randomInt(3, GRID_WIDTH - 4);
    const startY = randomInt(3, GRID_HEIGHT - 10);
    const height = randomInt(4, 8);
    
    for (let dy = 0; dy < height; dy++) {
      if (startY + dy < GRID_HEIGHT - 2 && gameState.tiles[startY + dy][x] === TILE_EMPTY) {
        gameState.tiles[startY + dy][x] = TILE_LADDER;
      }
    }
  }
  
  // Clear spawn area for player
  for (let x = 2; x < 5; x++) {
    for (let y = GRID_HEIGHT - 7; y < GRID_HEIGHT - 3; y++) {
      if (gameState.tiles[y][x] !== TILE_LADDER) {
        gameState.tiles[y][x] = TILE_EMPTY;
      }
    }
  }
  
  // Place exit door (top right area)
  const doorX = GRID_WIDTH - 4;
  const doorY = randomInt(3, 7);
  // Clear area around door
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -2; dy <= 1; dy++) {
      const tx = doorX + dx;
      const ty = doorY + dy;
      if (tx > 0 && tx < GRID_WIDTH - 1 && ty > 0 && ty < GRID_HEIGHT - 1) {
        gameState.tiles[ty][tx] = TILE_EMPTY;
      }
    }
  }
  // Place platform under door
  gameState.tiles[doorY + 1][doorX] = TILE_SOLID;
  gameState.tiles[doorY + 1][doorX - 1] = TILE_SOLID;
  gameState.tiles[doorY + 1][doorX + 1] = TILE_SOLID;
  
  gameState.exitDoor = new ExitDoor(doorX * 20 + 10, doorY * 20 + 10);
  
  // Place gems in interesting locations
  const numGems = randomInt(8, 12);
  gameState.gems = [];
  for (let i = 0; i < numGems; i++) {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 50) {
      const x = randomInt(4, GRID_WIDTH - 5);
      const y = randomInt(3, GRID_HEIGHT - 8);
      
      // Check if position is empty and not too close to player spawn
      if (gameState.tiles[y][x] === TILE_EMPTY && 
          (x > 8 || y < GRID_HEIGHT - 10)) {
        const gem = new Gem(x * 20 + 10, y * 20 + 10);
        gameState.gems.push(gem);
        placed = true;
      }
      attempts++;
    }
  }
  gameState.totalGems = gameState.gems.length;
  gameState.gemsCollected = 0;
  
  // Place enemies
  const numEnemies = randomInt(4, 7);
  gameState.enemies = [];
  for (let i = 0; i < numEnemies; i++) {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 50) {
      const x = randomInt(8, GRID_WIDTH - 5);
      const y = randomInt(5, GRID_HEIGHT - 8);
      
      // Check if position is empty and has ground below
      if (gameState.tiles[y][x] === TILE_EMPTY && 
          (gameState.tiles[y + 1][x] === TILE_SOLID || 
           gameState.tiles[y + 1][x] === TILE_DESTRUCTIBLE ||
           gameState.tiles[y + 1][x] === TILE_PLATFORM)) {
        const enemy = new Enemy(x * 20 + 10, y * 20 + 8);
        gameState.enemies.push(enemy);
        placed = true;
      }
      attempts++;
    }
  }
}