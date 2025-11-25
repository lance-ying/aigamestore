// room_generator.js - Procedural room generation

import { ROOM_X, ROOM_Y, ROOM_WIDTH, ROOM_HEIGHT, gameState } from './globals.js';
import { Enemy, Item, Heart, ExitPortal } from './entities.js';

export function generateRoom(p, floor) {
  const room = {
    obstacles: [],
    enemies: [],
    items: [],
    hearts: [],
    exitPortal: null
  };
  
  // Generate obstacles (rocks)
  const numObstacles = p.floor(p.random(3, 7));
  for (let i = 0; i < numObstacles; i++) {
    const x = ROOM_X + p.random(60, ROOM_WIDTH - 60);
    const y = ROOM_Y + p.random(60, ROOM_HEIGHT - 60);
    const size = p.random(30, 50);
    room.obstacles.push({ x, y, size });
  }
  
  // Generate enemies based on floor
  const numEnemies = p.floor(p.random(2 + floor, 5 + floor * 1.5));
  const enemyTypes = ['fly', 'fly', 'charger', 'shooter'];
  
  for (let i = 0; i < numEnemies; i++) {
    let x, y;
    let validPosition = false;
    let attempts = 0;
    
    while (!validPosition && attempts < 50) {
      x = ROOM_X + p.random(50, ROOM_WIDTH - 50);
      y = ROOM_Y + p.random(50, ROOM_HEIGHT - 50);
      
      // Check distance from player start position
      const distFromPlayer = p.dist(x, y, ROOM_X + ROOM_WIDTH / 2, ROOM_Y + ROOM_HEIGHT / 2);
      
      validPosition = distFromPlayer > 100;
      attempts++;
    }
    
    const typeIndex = p.floor(p.random(enemyTypes.length));
    const enemy = new Enemy(x, y, enemyTypes[typeIndex]);
    room.enemies.push(enemy);
  }
  
  // Occasionally spawn items (20% chance)
  if (p.random() < 0.2) {
    const itemTypes = ['damage', 'speed', 'firerate', 'health'];
    const itemType = itemTypes[p.floor(p.random(itemTypes.length))];
    const item = new Item(
      ROOM_X + ROOM_WIDTH / 2 + p.random(-50, 50),
      ROOM_Y + ROOM_HEIGHT / 2 + p.random(-50, 50),
      itemType
    );
    room.items.push(item);
  }
  
  // Spawn hearts (30% chance)
  if (p.random() < 0.3) {
    const numHearts = p.floor(p.random(1, 3));
    for (let i = 0; i < numHearts; i++) {
      const heart = new Heart(
        ROOM_X + p.random(50, ROOM_WIDTH - 50),
        ROOM_Y + p.random(50, ROOM_HEIGHT - 50)
      );
      room.hearts.push(heart);
    }
  }
  
  // Exit portal (inactive until room is cleared)
  room.exitPortal = new ExitPortal(
    ROOM_X + ROOM_WIDTH / 2,
    ROOM_Y + ROOM_HEIGHT - 60
  );
  
  return room;
}

export function renderRoom(p, room) {
  // Room background
  p.fill(60, 50, 45);
  p.noStroke();
  p.rect(ROOM_X, ROOM_Y, ROOM_WIDTH, ROOM_HEIGHT);
  
  // Floor pattern
  p.stroke(50, 40, 35);
  p.strokeWeight(1);
  const gridSize = 40;
  for (let x = ROOM_X; x < ROOM_X + ROOM_WIDTH; x += gridSize) {
    p.line(x, ROOM_Y, x, ROOM_Y + ROOM_HEIGHT);
  }
  for (let y = ROOM_Y; y < ROOM_Y + ROOM_HEIGHT; y += gridSize) {
    p.line(ROOM_X, y, ROOM_X + ROOM_WIDTH, y);
  }
  
  // Obstacles (rocks)
  room.obstacles.forEach(obstacle => {
    p.fill(80, 70, 65);
    p.noStroke();
    p.ellipse(obstacle.x, obstacle.y, obstacle.size, obstacle.size * 0.9);
    
    // Shading
    p.fill(100, 90, 85);
    p.ellipse(obstacle.x - 5, obstacle.y - 5, obstacle.size * 0.4, obstacle.size * 0.3);
  });
  
  // Room borders
  p.stroke(100, 80, 70);
  p.strokeWeight(4);
  p.noFill();
  p.rect(ROOM_X, ROOM_Y, ROOM_WIDTH, ROOM_HEIGHT);
}