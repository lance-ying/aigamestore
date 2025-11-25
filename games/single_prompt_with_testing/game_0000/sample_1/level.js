// level.js - Level generation and management

import { gameState } from './globals.js';
import { Platform } from './entities.js';
import { Enemy } from './entities.js';
import { AncientRelic } from './entities.js';

export function generateLevel() {
  // Clear existing level
  gameState.platforms = [];
  gameState.enemies = [];
  gameState.collectibles = [];
  
  // Ground platforms
  createPlatform(0, gameState.worldHeight - 20, gameState.worldWidth, 20);
  
  // Starting area platforms
  createPlatform(100, 650, 200, 20);
  createPlatform(400, 600, 150, 20);
  createPlatform(650, 550, 180, 20);
  
  // Mid-level platforms (ascending)
  createPlatform(900, 500, 160, 20);
  createPlatform(1150, 450, 140, 20);
  createPlatform(1380, 400, 160, 20);
  
  // Upper area platforms
  createPlatform(1600, 350, 200, 20);
  createPlatform(1900, 300, 150, 20);
  createPlatform(2150, 350, 180, 20);
  
  // Descending to relic chamber
  createPlatform(2380, 400, 160, 20);
  createPlatform(2600, 450, 150, 20);
  createPlatform(2850, 500, 200, 20);
  
  // Relic chamber platforms
  createPlatform(3100, 550, 300, 20);
  createPlatform(3500, 600, 200, 20);
  createPlatform(3800, 650, 250, 20);
  
  // Vertical platforms for navigation
  createPlatform(850, 580, 100, 15);
  createPlatform(1300, 480, 80, 15);
  createPlatform(1550, 430, 90, 15);
  createPlatform(2200, 280, 100, 15);
  createPlatform(2950, 530, 120, 15);
  
  // Additional challenge platforms
  createPlatform(700, 500, 60, 15);
  createPlatform(1000, 450, 70, 15);
  createPlatform(1700, 380, 80, 15);
  createPlatform(2400, 330, 90, 15);
  
  // Spawn enemies throughout the level
  spawnEnemy(250, 600);
  spawnEnemy(500, 550);
  spawnEnemy(750, 500);
  spawnEnemy(1050, 450);
  spawnEnemy(1300, 400);
  spawnEnemy(1500, 350);
  spawnEnemy(1750, 300);
  spawnEnemy(2000, 300);
  spawnEnemy(2250, 350);
  spawnEnemy(2500, 400);
  spawnEnemy(2750, 450);
  spawnEnemy(3000, 500);
  spawnEnemy(3200, 550);
  spawnEnemy(3600, 600);
  
  // Additional crawling enemies
  spawnEnemy(600, 550);
  spawnEnemy(950, 500);
  spawnEnemy(1400, 400);
  spawnEnemy(1850, 300);
  spawnEnemy(2300, 350);
  spawnEnemy(2900, 500);
  spawnEnemy(3400, 600);
  
  // Place the ancient relic at the end
  const relic = new AncientRelic(3900, 600);
}

function createPlatform(x, y, width, height) {
  return new Platform(x, y, width, height);
}

function spawnEnemy(x, y) {
  return new Enemy(x, y, 'crawler');
}

export function resetLevel() {
  // Clear all entities
  gameState.entities = [];
  gameState.enemies = [];
  gameState.platforms = [];
  gameState.collectibles = [];
  gameState.particles = [];
  gameState.projectiles = [];
  
  // Reset state
  gameState.score = 0;
  gameState.soul = 0;
  gameState.enemiesDefeated = 0;
  gameState.relicCollected = false;
  gameState.relic = null;
  gameState.cameraX = 0;
  gameState.cameraY = 0;
  
  // Regenerate level
  generateLevel();
}