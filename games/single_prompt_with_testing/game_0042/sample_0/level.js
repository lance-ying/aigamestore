// level.js - Level generation

import { gameState, TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Terrain, Enemy, Prisoner, Helicopter } from './entities.js';

export function generateLevel() {
  gameState.terrain = [];
  gameState.enemies = [];
  gameState.prisoners = [];
  gameState.projectiles = [];
  gameState.explosions = [];
  gameState.particles = [];
  
  const levelWidth = 2000;
  const groundLevel = CANVAS_HEIGHT - 40;
  
  // Ground
  for (let x = 0; x < levelWidth; x += TILE_SIZE) {
    gameState.terrain.push(new Terrain(x, groundLevel, TILE_SIZE, 60, 'dirt'));
  }
  
  // Platforms and obstacles
  createPlatform(200, groundLevel - 60, 4, 'dirt');
  createPlatform(350, groundLevel - 120, 5, 'stone');
  createPlatform(550, groundLevel - 80, 6, 'dirt');
  createPlatform(750, groundLevel - 140, 4, 'stone');
  createPlatform(950, groundLevel - 100, 5, 'dirt');
  createPlatform(1150, groundLevel - 160, 6, 'stone');
  createPlatform(1400, groundLevel - 120, 5, 'dirt');
  createPlatform(1600, groundLevel - 80, 4, 'stone');
  
  // Walls and structures
  createWall(300, groundLevel - 120, 6, 'metal');
  createWall(700, groundLevel - 180, 4, 'metal');
  createWall(1300, groundLevel - 140, 5, 'metal');
  
  // Explosive barrels
  gameState.terrain.push(new Terrain(400, groundLevel - TILE_SIZE, TILE_SIZE, TILE_SIZE, 'barrel'));
  gameState.terrain.push(new Terrain(650, groundLevel - TILE_SIZE, TILE_SIZE, TILE_SIZE, 'barrel'));
  gameState.terrain.push(new Terrain(900, groundLevel - TILE_SIZE, TILE_SIZE, TILE_SIZE, 'barrel'));
  gameState.terrain.push(new Terrain(1250, groundLevel - TILE_SIZE, TILE_SIZE, TILE_SIZE, 'barrel'));
  gameState.terrain.push(new Terrain(1500, groundLevel - TILE_SIZE, TILE_SIZE, TILE_SIZE, 'barrel'));
  
  // Enemies - soldiers
  gameState.enemies.push(new Enemy(300, groundLevel - 60, 'soldier'));
  gameState.enemies.push(new Enemy(500, groundLevel - 60, 'soldier'));
  gameState.enemies.push(new Enemy(700, groundLevel - 60, 'soldier'));
  gameState.enemies.push(new Enemy(900, groundLevel - 60, 'soldier'));
  gameState.enemies.push(new Enemy(1100, groundLevel - 60, 'soldier'));
  gameState.enemies.push(new Enemy(1300, groundLevel - 60, 'soldier'));
  gameState.enemies.push(new Enemy(1500, groundLevel - 60, 'soldier'));
  gameState.enemies.push(new Enemy(1700, groundLevel - 60, 'soldier'));
  
  // Enemies - turrets
  gameState.enemies.push(new Enemy(450, groundLevel - 80, 'turret'));
  gameState.enemies.push(new Enemy(800, groundLevel - 140, 'turret'));
  gameState.enemies.push(new Enemy(1200, groundLevel - 160, 'turret'));
  gameState.enemies.push(new Enemy(1550, groundLevel - 80, 'turret'));
  
  // Prisoners
  gameState.prisoners.push(new Prisoner(600, groundLevel - 60));
  gameState.prisoners.push(new Prisoner(1000, groundLevel - 140));
  
  // Helicopter at the end
  gameState.helicopter = new Helicopter(1850, 100);
  
  gameState.entities = [
    ...gameState.enemies,
    ...gameState.prisoners
  ];
}

function createPlatform(x, y, length, type) {
  for (let i = 0; i < length; i++) {
    gameState.terrain.push(new Terrain(x + i * TILE_SIZE, y, TILE_SIZE, TILE_SIZE, type));
  }
}

function createWall(x, y, height, type) {
  for (let i = 0; i < height; i++) {
    gameState.terrain.push(new Terrain(x, y - i * TILE_SIZE, TILE_SIZE, TILE_SIZE, type));
  }
}