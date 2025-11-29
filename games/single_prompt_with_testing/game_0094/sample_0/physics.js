// physics.js - Physics and collision detection

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y } from './globals.js';

export function checkCollisionAABB(entity1, entity2) {
  const e1 = {
    left: entity1.x - entity1.width / 2,
    right: entity1.x + entity1.width / 2,
    top: entity1.y - entity1.height / 2,
    bottom: entity1.y + entity1.height / 2
  };
  
  const e2 = {
    left: entity2.x - entity2.width / 2,
    right: entity2.x + entity2.width / 2,
    top: entity2.y - entity2.height / 2,
    bottom: entity2.y + entity2.height / 2
  };
  
  return (
    e1.left < e2.right &&
    e1.right > e2.left &&
    e1.top < e2.bottom &&
    e1.bottom > e2.top
  );
}

export function checkCollisionWithPlatforms(entity) {
  let onGround = false;
  
  for (const platform of gameState.platforms) {
    const entityBottom = entity.y + entity.height / 2;
    const entityTop = entity.y - entity.height / 2;
    const entityLeft = entity.x - entity.width / 2;
    const entityRight = entity.x + entity.width / 2;
    
    const platformTop = platform.y;
    const platformBottom = platform.y + platform.height;
    const platformLeft = platform.x;
    const platformRight = platform.x + platform.width;
    
    // Check if entity is overlapping platform
    if (entityRight > platformLeft && entityLeft < platformRight) {
      // Landing on top of platform
      if (entity.vy >= 0 && entityBottom >= platformTop && entityBottom <= platformTop + 10) {
        entity.y = platformTop - entity.height / 2;
        onGround = true;
      }
      
      // Hitting bottom of platform
      if (entity.vy < 0 && entityTop <= platformBottom && entityTop >= platformBottom - 10) {
        entity.y = platformBottom + entity.height / 2;
        entity.vy = 0;
      }
    }
    
    // Check if entity is overlapping platform vertically
    if (entityBottom > platformTop && entityTop < platformBottom) {
      // Hitting left side of platform
      if (entity.vx > 0 && entityRight >= platformLeft && entityRight <= platformLeft + 10) {
        entity.x = platformLeft - entity.width / 2;
        entity.vx = 0;
      }
      
      // Hitting right side of platform
      if (entity.vx < 0 && entityLeft <= platformRight && entityLeft >= platformRight - 10) {
        entity.x = platformRight + entity.width / 2;
        entity.vx = 0;
      }
    }
  }
  
  return { onGround };
}

export function applyPhysics(entity) {
  // Apply gravity
  if (!entity.onGround) {
    entity.vy += gameState.gravity;
  }
  
  // Apply friction or air resistance
  if (entity.onGround) {
    entity.vx *= gameState.friction;
  } else {
    entity.vx *= gameState.airResistance;
  }
  
  // Update position
  entity.x += entity.vx;
  entity.y += entity.vy;
}