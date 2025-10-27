// collision.js - Collision detection

import { SEGMENT_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, COLLISION_BUFFER } from './globals.js';

export function checkSnakePelletCollision(p, snake, pellets) {
  const head = snake.getHead();
  const collectedPellets = [];
  
  for (let i = pellets.length - 1; i >= 0; i--) {
    const pellet = pellets[i];
    const dist = p.dist(head.x, head.y, pellet.pos.x, pellet.pos.y);
    
    if (dist < SEGMENT_SIZE + pellet.size) {
      collectedPellets.push(pellet);
      pellets.splice(i, 1);
    }
  }
  
  return collectedPellets;
}

export function checkSnakeMassCollision(p, snake, massDrops) {
  const head = snake.getHead();
  const collectedMass = [];
  
  for (let i = massDrops.length - 1; i >= 0; i--) {
    const mass = massDrops[i];
    const dist = p.dist(head.x, head.y, mass.pos.x, mass.pos.y);
    
    if (dist < SEGMENT_SIZE + mass.size) {
      collectedMass.push(mass);
      massDrops.splice(i, 1);
    }
  }
  
  return collectedMass;
}

export function checkSnakeBodyCollision(p, snake, otherSnakes) {
  const head = snake.getHead();
  
  // Check collision with other snakes
  for (let otherSnake of otherSnakes) {
    if (!otherSnake.isAlive) continue;
    
    const startIdx = otherSnake === snake ? 10 : 0;
    
    for (let i = startIdx; i < otherSnake.segments.length; i++) {
      const segment = otherSnake.segments[i];
      const dist = p.dist(head.x, head.y, segment.x, segment.y);
      
      if (dist < SEGMENT_SIZE - COLLISION_BUFFER) {
        return true;
      }
    }
  }
  
  return false;
}

export function checkSnakeBoundaryCollision(snake) {
  const head = snake.getHead();
  const margin = 20;
  
  return (
    head.x < margin ||
    head.x > CANVAS_WIDTH - margin ||
    head.y < margin ||
    head.y > CANVAS_HEIGHT - margin
  );
}

export function checkSnakeObstacleCollision(p, snake, obstacles) {
  const head = snake.getHead();
  
  for (let obstacle of obstacles) {
    const bounds = obstacle.getBounds();
    
    if (p.collideCircleRect(
      head.x, head.y, SEGMENT_SIZE,
      bounds.x, bounds.y, bounds.width, bounds.height
    )) {
      return true;
    }
  }
  
  return false;
}