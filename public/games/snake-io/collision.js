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
  // NOTE: Boundary collision is DISABLED - Pac-Man style wrapping is now enabled
  // Boundaries no longer kill snakes; they wrap around to the opposite side
  // This function is kept for compatibility but always returns false
  return false;
}

export function checkSnakeObstacleCollision(p, snake, obstacles) {
  const head = snake.getHead();
  
  for (let obstacle of obstacles) {
    const bounds = obstacle.getBounds();
    
    if (collideCircleRect(
      head.x, head.y, SEGMENT_SIZE,
      bounds.x, bounds.y, bounds.width, bounds.height
    )) {
      return true;
    }
  }
  
  return false;
}

// Custom circle-rect collision detection
function collideCircleRect(cx, cy, diameter, rx, ry, rw, rh) {
  const radius = diameter / 2;
  
  // Find the closest point on the rectangle to the circle
  const closestX = Math.max(rx, Math.min(cx, rx + rw));
  const closestY = Math.max(ry, Math.min(cy, ry + rh));
  
  // Calculate the distance between the circle's center and this closest point
  const distanceX = cx - closestX;
  const distanceY = cy - closestY;
  
  // If the distance is less than the circle's radius, there's a collision
  const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
  return distanceSquared < (radius * radius);
}