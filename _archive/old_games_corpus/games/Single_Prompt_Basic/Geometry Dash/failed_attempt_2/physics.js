import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

// Check collision between player and obstacle
export function checkCollision(p, player, obstacle) {
  // Skip collision check for checkpoints
  if (obstacle.type === 'checkpoint') {
    return false;
  }
  
  // For spikes, use a more forgiving hitbox (triangle shape)
  if (obstacle.type === 'spike') {
    // Create a triangle for the spike
    const x1 = obstacle.x - obstacle.width / 2;
    const y1 = obstacle.y + obstacle.height / 2;
    const x2 = obstacle.x;
    const y2 = obstacle.y - obstacle.height / 2;
    const x3 = obstacle.x + obstacle.width / 2;
    const y3 = obstacle.y + obstacle.height / 2;
    
    // Check if player (as a circle) collides with triangle
    return p.collideRectPoly(
      player.x, player.y, 
      player.width * 0.8, player.height * 0.8,
      [
        { x: x1, y: y1 },
        { x: x2, y: y2 },
        { x: x3, y: y3 }
      ]
    );
  }
  
  // For finish line, check if player has passed it
  if (obstacle.type === 'finish') {
    return p.collideRectRect(
      player.x, player.y, player.width, player.height,
      obstacle.x, obstacle.y, obstacle.width, obstacle.height
    );
  }
  
  // For regular obstacles (platforms), use standard rectangle collision
  return p.collideRectRect(
    player.x, player.y, player.width * 0.9, player.height * 0.9,
    obstacle.x, obstacle.y, obstacle.width, obstacle.height
  );
}

// Check if player has reached a checkpoint
export function checkCheckpoint(p, player, checkpoint) {
  return p.collideRectRect(
    player.x, player.y, player.width, player.height,
    checkpoint.x, checkpoint.y, checkpoint.width, checkpoint.height
  );
}

// Check if an entity is visible on screen
export function isOnScreen(entity) {
  return entity.x + entity.width / 2 > 0 && 
         entity.x - entity.width / 2 < CANVAS_WIDTH &&
         entity.y + entity.height / 2 > 0 &&
         entity.y - entity.height / 2 < CANVAS_HEIGHT;
}