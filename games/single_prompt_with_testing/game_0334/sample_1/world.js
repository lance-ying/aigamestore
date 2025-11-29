// world.js - World generation and tile management

import { gameState, WORLD_WIDTH, WORLD_HEIGHT, TILE_SIZE } from './globals.js';
import { Collectible, HealthPickup, EnergyPickup, HealingCrystal } from './collectibles.js';
import { Enemy } from './enemy.js';
import { Hazard } from './hazards.js';

export class Tile {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type; // 'ground', 'wall', 'void'
  }
}

export function generateWorld(p) {
  const tiles = [];
  const tilesX = Math.floor(WORLD_WIDTH / TILE_SIZE);
  const tilesY = Math.floor(WORLD_HEIGHT / TILE_SIZE);
  
  // Initialize all tiles as ground - simple open world
  for (let y = 0; y < tilesY; y++) {
    tiles[y] = [];
    for (let x = 0; x < tilesX; x++) {
      tiles[y][x] = new Tile(x * TILE_SIZE, y * TILE_SIZE, 'ground');
    }
  }
  
  gameState.worldTiles = tiles;
  
  // Populate world with entities - simple scattered placement
  populateWorld(p);
}

function populateWorld(p) {
  // Place player near center
  const playerX = WORLD_WIDTH / 2;
  const playerY = WORLD_HEIGHT / 2;
  
  // Scatter enemies throughout the world
  const numEnemies = 20;
  for (let i = 0; i < numEnemies; i++) {
    const ex = p.random(100, WORLD_WIDTH - 100);
    const ey = p.random(100, WORLD_HEIGHT - 100);
    // Don't spawn too close to player start
    const distFromPlayer = Math.sqrt((ex - playerX) * (ex - playerX) + (ey - playerY) * (ey - playerY));
    if (distFromPlayer > 150) {
      new Enemy(ex, ey, p);
    }
  }
  
  // Scatter health pickups
  const numHealth = 15;
  for (let i = 0; i < numHealth; i++) {
    const hx = p.random(100, WORLD_WIDTH - 100);
    const hy = p.random(100, WORLD_HEIGHT - 100);
    new HealthPickup(hx, hy);
  }
  
  // Scatter energy pickups
  const numEnergy = 15;
  for (let i = 0; i < numEnergy; i++) {
    const ex = p.random(100, WORLD_WIDTH - 100);
    const ey = p.random(100, WORLD_HEIGHT - 100);
    new EnergyPickup(ex, ey);
  }
  
  // Scatter artifacts
  const numArtifacts = 10;
  for (let i = 0; i < numArtifacts; i++) {
    const ax = p.random(100, WORLD_WIDTH - 100);
    const ay = p.random(100, WORLD_HEIGHT - 100);
    new Collectible(ax, ay, 'artifact');
  }
  
  // Scatter hazards
  const numHazards = 15;
  for (let i = 0; i < numHazards; i++) {
    const hx = p.random(100, WORLD_WIDTH - 100);
    const hy = p.random(100, WORLD_HEIGHT - 100);
    const hazardType = p.random() < 0.5 ? 'spike' : 'poison';
    new Hazard(hx, hy, hazardType);
  }
  
  // Place healing crystals spread across the world
  const crystalPositions = [
    { x: WORLD_WIDTH * 0.2, y: WORLD_HEIGHT * 0.2 },
    { x: WORLD_WIDTH * 0.8, y: WORLD_HEIGHT * 0.2 },
    { x: WORLD_WIDTH * 0.5, y: WORLD_HEIGHT * 0.8 },
    { x: WORLD_WIDTH * 0.2, y: WORLD_HEIGHT * 0.8 },
    { x: WORLD_WIDTH * 0.8, y: WORLD_HEIGHT * 0.8 }
  ];
  
  for (const pos of crystalPositions) {
    new HealingCrystal(pos.x, pos.y);
  }
  
  return { playerX, playerY };
}

export function getTileAt(worldX, worldY) {
  const tileX = Math.floor(worldX / TILE_SIZE);
  const tileY = Math.floor(worldY / TILE_SIZE);
  
  if (
    tileY >= 0 &&
    tileY < gameState.worldTiles.length &&
    tileX >= 0 &&
    tileX < gameState.worldTiles[0].length
  ) {
    return gameState.worldTiles[tileY][tileX];
  }
  
  return null;
}

export function isWalkable(worldX, worldY) {
  const tile = getTileAt(worldX, worldY);
  // All tiles are ground now, always walkable
  return tile && tile.type === 'ground';
}

// Check if a circle at position (x, y) with given radius can fit in walkable space
export function canMoveTo(x, y, radius) {
  // Check center and 8 points around the circle perimeter
  const checkPoints = [
    { x: x, y: y }, // center
    { x: x + radius, y: y }, // right
    { x: x - radius, y: y }, // left
    { x: x, y: y + radius }, // bottom
    { x: x, y: y - radius }, // top
    { x: x + radius * 0.707, y: y + radius * 0.707 }, // bottom-right
    { x: x - radius * 0.707, y: y + radius * 0.707 }, // bottom-left
    { x: x + radius * 0.707, y: y - radius * 0.707 }, // top-right
    { x: x - radius * 0.707, y: y - radius * 0.707 }  // top-left
  ];
  
  for (const point of checkPoints) {
    if (!isWalkable(point.x, point.y)) {
      return false;
    }
  }
  
  return true;
}