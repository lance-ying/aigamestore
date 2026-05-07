// level.js - Level generation and initialization

import { gameState } from './globals.js';
import { Creature, Human, Wall } from './entities.js';

export function initializeLevel() {
  // Create creature at starting position
  gameState.player = new Creature(100, 200);
  
  // Generate layout based on current level
  switch(gameState.currentLevel) {
    case 1:
      createLevel1();
      break;
    case 2:
      createLevel2();
      break;
    case 3:
      createLevel3();
      break;
    default:
      createLevel1();
  }
}

function createLevel1() {
  // Standard Facility Layout
  // Outer walls
  new Wall(0, 0, gameState.levelWidth, 20); // Top
  new Wall(0, gameState.levelHeight - 20, gameState.levelWidth, 20); // Bottom
  new Wall(0, 0, 20, gameState.levelHeight); // Left
  new Wall(gameState.levelWidth - 20, 0, 20, gameState.levelHeight); // Right
  
  // Interior rooms and corridors
  new Wall(250, 150, 200, 20);
  new Wall(600, 300, 300, 20);
  new Wall(150, 450, 250, 20);
  new Wall(700, 550, 300, 20);
  
  new Wall(400, 100, 20, 200);
  new Wall(800, 200, 20, 250);
  new Wall(300, 400, 20, 200);
  new Wall(900, 350, 20, 300);
  
  new Wall(200, 200, 100, 100);
  new Wall(550, 400, 120, 80);
  new Wall(750, 100, 80, 120);
  new Wall(100, 550, 100, 100);
  new Wall(500, 600, 150, 100);
  new Wall(950, 500, 100, 150);
  
  new Wall(350, 250, 60, 60);
  new Wall(650, 450, 50, 50);
  new Wall(850, 250, 70, 40);
  new Wall(200, 400, 40, 80);
  new Wall(600, 150, 60, 50);

  // Spawn 15 humans
  spawnHumans(15);
}

function createLevel2() {
  // Toxic Waste Layout - More tight corridors
  
  // Outer walls
  new Wall(0, 0, gameState.levelWidth, 20);
  new Wall(0, gameState.levelHeight - 20, gameState.levelWidth, 20);
  new Wall(0, 0, 20, gameState.levelHeight);
  new Wall(gameState.levelWidth - 20, 0, 20, gameState.levelHeight);
  
  // A maze-like structure
  for (let x = 200; x < gameState.levelWidth - 200; x += 200) {
    new Wall(x, 100, 20, 400); // Vertical bars
  }
  
  for (let y = 300; y < gameState.levelHeight - 100; y += 200) {
    new Wall(100, y, 600, 20); // Horizontal bars
  }
  
  // Central block
  new Wall(500, 350, 200, 100);
  
  // Random scattered blocks
  new Wall(300, 150, 50, 50);
  new Wall(900, 600, 50, 50);
  new Wall(150, 700, 100, 20);
  new Wall(800, 200, 20, 100);
  
  // Spawn 20 humans
  spawnHumans(20);
}

function createLevel3() {
  // Deep Containment - Large open areas with pillars
  
  // Outer walls
  new Wall(0, 0, gameState.levelWidth, 20);
  new Wall(0, gameState.levelHeight - 20, gameState.levelWidth, 20);
  new Wall(0, 0, 20, gameState.levelHeight);
  new Wall(gameState.levelWidth - 20, 0, 20, gameState.levelHeight);
  
  // Large pillars
  const pillarSize = 80;
  for (let x = 200; x < gameState.levelWidth - 100; x += 300) {
    for (let y = 200; y < gameState.levelHeight - 100; y += 250) {
      new Wall(x, y, pillarSize, pillarSize);
    }
  }
  
  // Central fortress
  new Wall(500, 350, 200, 20);
  new Wall(500, 430, 200, 20);
  new Wall(500, 350, 20, 100);
  new Wall(700, 350, 20, 100);
  
  // Spawn 25 humans
  spawnHumans(25);
}

function spawnHumans(count) {
  // Spawn humans in random valid locations away from player
  let spawned = 0;
  while (spawned < count) {
    const x = Math.random() * (gameState.levelWidth - 100) + 50;
    const y = Math.random() * (gameState.levelHeight - 100) + 50;
    
    // Keep away from spawn
    const dist = Math.sqrt(Math.pow(x - 100, 2) + Math.pow(y - 200, 2));
    if (dist > 200) {
      // Check wall collision
      let collides = false;
      for (let wall of gameState.walls) {
        if (x > wall.x - 20 && x < wall.x + wall.width + 20 &&
            y > wall.y - 20 && y < wall.y + wall.height + 20) {
          collides = true;
          break;
        }
      }
      
      if (!collides) {
        new Human(x, y);
        spawned++;
      }
    }
  }
  
  gameState.totalHumans = count;
}