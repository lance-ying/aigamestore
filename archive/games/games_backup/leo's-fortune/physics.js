// physics.js - Physics and collision detection

import { gameState } from './globals.js';

export function handlePlatformCollisions(player, p) {
  player.grounded = false;

  for (let platform of gameState.platforms) {
    // Check collision with platform
    let closestX = Math.max(platform.x, Math.min(player.x, platform.x + platform.width));
    let closestY = Math.max(platform.y, Math.min(player.y, platform.y + platform.height));
    
    let distX = player.x - closestX;
    let distY = player.y - closestY;
    let distance = Math.sqrt(distX * distX + distY * distY);

    if (distance < player.radius) {
      // Collision detected - determine which side
      let overlapX = player.radius - Math.abs(distX);
      let overlapY = player.radius - Math.abs(distY);

      if (overlapY < overlapX) {
        // Vertical collision
        if (player.y < platform.y + platform.height / 2) {
          // Player is above platform
          player.y = platform.y - player.radius;
          player.vy = 0;
          player.grounded = true;
          
          // If platform is moving, move player with it
          if (platform.movable) {
            player.x += platform.moveSpeed * platform.moveDirection;
          }
        } else {
          // Player is below platform
          player.y = platform.y + platform.height + player.radius;
          player.vy = 0;
        }
      } else {
        // Horizontal collision
        if (player.x < platform.x + platform.width / 2) {
          // Player is left of platform
          player.x = platform.x - player.radius;
          player.vx = 0;
        } else {
          // Player is right of platform
          player.x = platform.x + platform.width + player.radius;
          player.vx = 0;
        }
      }
    }
  }
}

export function checkCoinCollisions(player, p) {
  for (let coin of gameState.coins) {
    if (!coin.collected) {
      let dist = p.dist(player.x, player.y, coin.x, coin.y);
      if (dist < player.radius + coin.radius) {
        coin.collect();
      }
    }
  }
}

export function checkHazardCollisions(player, p) {
  for (let hazard of gameState.hazards) {
    if (hazard.checkCollision(player)) {
      return true;
    }
  }
  return false;
}

export function checkExitCollision(player, p) {
  if (gameState.exitPortal && gameState.exitPortal.checkCollision(player)) {
    return true;
  }
  return false;
}

export function checkOutOfBounds(player) {
  // Check if player fell off the map
  if (player.y > 500 || player.y < -100 || player.x < -100 || player.x > 700) {
    return true;
  }
  return false;
}