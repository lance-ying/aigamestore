// spawner.js - Entity spawning logic

import { Snake, Pellet, MassDrop, Obstacle } from './entities.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, SEGMENT_SIZE } from './globals.js';

export function spawnPlayer(p, config, skinColor) {
  const x = CANVAS_WIDTH / 2;
  const y = CANVAS_HEIGHT / 2;
  return new Snake(p, x, y, config.playerStartLength, skinColor, true);
}

export function spawnAISnakes(p, config) {
  const aiSnakes = [];
  const colors = [
    [220, 50, 50],   // Red
    [50, 50, 220],   // Blue
    [220, 220, 50],  // Yellow
    [220, 50, 220],  // Magenta
    [50, 220, 220],  // Cyan
    [220, 120, 50],  // Orange
    [120, 50, 220],  // Purple
    [50, 220, 120],  // Green-Cyan
  ];
  
  for (let i = 0; i < config.aiCount; i++) {
    let x, y;
    let attempts = 0;
    
    do {
      x = p.random(60, CANVAS_WIDTH - 60);
      y = p.random(60, CANVAS_HEIGHT - 60);
      attempts++;
    } while (attempts < 50 && p.dist(x, y, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2) < 150);
    
    const color = colors[i % colors.length];
    const snake = new Snake(p, x, y, config.aiStartLength, color, false);
    snake.baseSpeed = config.aiSpeed;
    snake.speed = config.aiSpeed;
    aiSnakes.push(snake);
  }
  
  return aiSnakes;
}

export function spawnPellets(p, count, existingPellets, obstacles) {
  const pellets = [...existingPellets];
  
  while (pellets.length < count) {
    let x, y;
    let valid = false;
    let attempts = 0;
    
    while (!valid && attempts < 100) {
      x = p.random(40, CANVAS_WIDTH - 40);
      y = p.random(40, CANVAS_HEIGHT - 40);
      valid = true;
      
      // Check not too close to obstacles
      for (let obstacle of obstacles) {
        const bounds = obstacle.getBounds();
        if (x > bounds.x - 20 && x < bounds.x + bounds.width + 20 &&
            y > bounds.y - 20 && y < bounds.y + bounds.height + 20) {
          valid = false;
          break;
        }
      }
      
      attempts++;
    }
    
    if (valid) {
      pellets.push(new Pellet(p, x, y, 'normal'));
    }
  }
  
  return pellets;
}

export function spawnMassDrops(p, positions, color) {
  const drops = [];
  
  for (let pos of positions) {
    // Add some spread
    const spreadX = p.random(-10, 10);
    const spreadY = p.random(-10, 10);
    drops.push(new MassDrop(p, pos.x + spreadX, pos.y + spreadY, color));
  }
  
  return drops;
}

export function spawnObstacles(p, config) {
  const obstacles = [];
  
  for (let i = 0; i < config.staticObstacles; i++) {
    const width = p.random(40, 80);
    const height = p.random(40, 80);
    const x = p.random(60 + width / 2, CANVAS_WIDTH - 60 - width / 2);
    const y = p.random(60 + height / 2, CANVAS_HEIGHT - 60 - height / 2);
    
    // Don't spawn near center
    if (p.dist(x, y, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2) > 100) {
      obstacles.push(new Obstacle(p, x, y, width, height, false));
    }
  }
  
  if (config.dynamicObstacles) {
    // Central dynamic obstacle
    obstacles.push(new Obstacle(p, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 60, 60, true));
  }
  
  return obstacles;
}