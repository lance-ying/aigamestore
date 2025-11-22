// level.js - Level generation and management

import { gameState } from './globals.js';
import { Enemy, Cover } from './entities.js';

export function generateLevel(p, missionNumber) {
  // Clear existing entities
  gameState.enemies = [];
  gameState.cover = [];
  gameState.bullets = [];
  gameState.utilities = [];
  gameState.particles = [];
  
  // World size
  const worldWidth = 1200;
  const worldHeight = 800;
  
  // Generate cover objects
  generateCover(p, worldWidth, worldHeight);
  
  // Generate enemies based on mission
  generateEnemies(p, missionNumber, worldWidth, worldHeight);
  
  gameState.totalEnemies = gameState.enemies.length;
  
  return { worldWidth, worldHeight };
}

function generateCover(p, worldWidth, worldHeight) {
  // Add walls around the perimeter
  gameState.cover.push(new Cover(worldWidth / 2, 30, worldWidth - 60, 40, "wall"));
  gameState.cover.push(new Cover(worldWidth / 2, worldHeight - 30, worldWidth - 60, 40, "wall"));
  gameState.cover.push(new Cover(30, worldHeight / 2, 40, worldHeight - 60, "wall"));
  gameState.cover.push(new Cover(worldWidth - 30, worldHeight / 2, 40, worldHeight - 60, "wall"));
  
  // Add crates throughout the level
  const crates = [
    { x: 200, y: 150, w: 50, h: 50 },
    { x: 400, y: 200, w: 60, h: 40 },
    { x: 600, y: 150, w: 50, h: 50 },
    { x: 800, y: 300, w: 60, h: 60 },
    { x: 300, y: 400, w: 50, h: 50 },
    { x: 700, y: 450, w: 55, h: 45 },
    { x: 500, y: 550, w: 50, h: 50 },
    { x: 900, y: 500, w: 60, h: 50 },
    { x: 1000, y: 200, w: 50, h: 50 },
    { x: 200, y: 600, w: 50, h: 50 }
  ];
  
  for (let crate of crates) {
    gameState.cover.push(new Cover(crate.x, crate.y, crate.w, crate.h, "crate"));
  }
}

function generateEnemies(p, missionNumber, worldWidth, worldHeight) {
  const enemyCount = 5 + missionNumber * 2;
  
  // Define patrol routes
  const patrolRoutes = [
    [{ x: 300, y: 200 }, { x: 500, y: 200 }, { x: 500, y: 400 }, { x: 300, y: 400 }],
    [{ x: 700, y: 200 }, { x: 900, y: 200 }, { x: 900, y: 300 }, { x: 700, y: 300 }],
    [{ x: 400, y: 500 }, { x: 600, y: 500 }, { x: 600, y: 650 }, { x: 400, y: 650 }],
    [{ x: 800, y: 450 }, { x: 1000, y: 450 }, { x: 1000, y: 600 }, { x: 800, y: 600 }],
    [{ x: 150, y: 300 }, { x: 250, y: 300 }, { x: 250, y: 500 }, { x: 150, y: 500 }]
  ];
  
  for (let i = 0; i < enemyCount; i++) {
    const x = p.random(150, worldWidth - 150);
    const y = p.random(150, worldHeight - 150);
    const enemy = new Enemy(x, y, "guard");
    
    // Assign patrol route if available
    if (i < patrolRoutes.length) {
      enemy.setPatrolPoints(patrolRoutes[i]);
    }
    
    // Increase difficulty for later missions
    enemy.health += missionNumber * 10;
    enemy.maxHealth = enemy.health;
    enemy.damage += missionNumber * 2;
    
    gameState.enemies.push(enemy);
  }
}