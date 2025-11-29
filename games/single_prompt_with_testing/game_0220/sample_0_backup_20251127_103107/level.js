// level.js - Level generation and initialization

import { gameState } from './globals.js';
import { Creature, Human, Wall } from './entities.js';

export function initializeLevel() {
  // Create creature at starting position
  gameState.player = new Creature(100, 200);
  
  // Create facility walls (room layout)
  createFacilityLayout();
  
  // Spawn humans throughout the facility
  spawnHumans();
}

function createFacilityLayout() {
  // Outer walls
  new Wall(0, 0, gameState.levelWidth, 20); // Top
  new Wall(0, gameState.levelHeight - 20, gameState.levelWidth, 20); // Bottom
  new Wall(0, 0, 20, gameState.levelHeight); // Left
  new Wall(gameState.levelWidth - 20, 0, 20, gameState.levelHeight); // Right
  
  // Interior rooms and corridors
  
  // Horizontal corridors
  new Wall(250, 150, 200, 20);
  new Wall(600, 300, 300, 20);
  new Wall(150, 450, 250, 20);
  new Wall(700, 550, 300, 20);
  
  // Vertical corridors
  new Wall(400, 100, 20, 200);
  new Wall(800, 200, 20, 250);
  new Wall(300, 400, 20, 200);
  new Wall(900, 350, 20, 300);
  
  // Room dividers
  new Wall(200, 200, 100, 100);
  new Wall(550, 400, 120, 80);
  new Wall(750, 100, 80, 120);
  new Wall(100, 550, 100, 100);
  new Wall(500, 600, 150, 100);
  new Wall(950, 500, 100, 150);
  
  // Small obstacles
  new Wall(350, 250, 60, 60);
  new Wall(650, 450, 50, 50);
  new Wall(850, 250, 70, 40);
  new Wall(200, 400, 40, 80);
  new Wall(600, 150, 60, 50);
}

function spawnHumans() {
  // Spawn humans in various locations throughout the facility
  const spawnPoints = [
    { x: 150, y: 100 },
    { x: 300, y: 250 },
    { x: 500, y: 150 },
    { x: 700, y: 200 },
    { x: 850, y: 350 },
    { x: 950, y: 250 },
    { x: 200, y: 500 },
    { x: 400, y: 600 },
    { x: 650, y: 550 },
    { x: 800, y: 650 },
    { x: 1000, y: 600 },
    { x: 350, y: 400 },
    { x: 550, y: 300 },
    { x: 750, y: 450 },
    { x: 150, y: 650 }
  ];
  
  for (let point of spawnPoints) {
    new Human(point.x, point.y);
  }
  
  gameState.totalHumans = spawnPoints.length;
}