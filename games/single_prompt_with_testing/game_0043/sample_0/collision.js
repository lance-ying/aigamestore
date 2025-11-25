// collision.js - Collision detection and handling

import { gameState, GROUND_LEVEL } from './globals.js';

export function checkCollisions(p) {
  const player = gameState.player;
  if (!player) return;
  
  const playerBox = player.getHitbox();
  
  // Check package pickup
  for (let pkg of gameState.packages) {
    if (pkg.pickedUp || pkg.delivered) continue;
    
    const pkgBox = pkg.getHitbox();
    if (p.collideRectRect(
      playerBox.x, playerBox.y, playerBox.width, playerBox.height,
      pkgBox.x, pkgBox.y, pkgBox.width, pkgBox.height
    )) {
      // Player is near package - allow pickup with Z key
      return;
    }
  }
  
  // Check treasure collection
  for (let treasure of gameState.treasures) {
    if (treasure.collected) continue;
    
    const treasureBox = treasure.getHitbox();
    if (p.collideRectRect(
      playerBox.x, playerBox.y, playerBox.width, playerBox.height,
      treasureBox.x, treasureBox.y, treasureBox.width, treasureBox.height
    )) {
      treasure.collected = true;
      gameState.treasuresCollected++;
      gameState.score += 20;
      gameState.money += 20;
    }
  }
  
  // Check platform collisions
  for (let obstacle of gameState.obstacles) {
    if (obstacle.type !== "platform") continue;
    
    const obstBox = obstacle.getHitbox();
    
    // Only collide from above
    if (player.velocityY >= 0 &&
        playerBox.x + playerBox.width > obstBox.x &&
        playerBox.x < obstBox.x + obstBox.width &&
        playerBox.y + playerBox.height > obstBox.y &&
        playerBox.y + playerBox.height < obstBox.y + obstBox.height) {
      
      player.y = obstBox.y - playerBox.height / 2;
      player.velocityY = 0;
      player.onGround = true;
    }
  }
  
  // Check rock collisions (block movement)
  for (let obstacle of gameState.obstacles) {
    if (obstacle.type !== "rock") continue;
    
    const obstBox = obstacle.getHitbox();
    
    if (p.collideRectRect(
      playerBox.x, playerBox.y, playerBox.width, playerBox.height,
      obstBox.x, obstBox.y, obstBox.width, obstBox.height
    )) {
      // Push player out
      const overlapX = Math.min(
        playerBox.x + playerBox.width - obstBox.x,
        obstBox.x + obstBox.width - playerBox.x
      );
      const overlapY = Math.min(
        playerBox.y + playerBox.height - obstBox.y,
        obstBox.y + obstBox.height - playerBox.y
      );
      
      if (overlapX < overlapY) {
        // Push horizontally
        if (player.x < obstacle.x) {
          player.x -= overlapX;
        } else {
          player.x += overlapX;
        }
        player.velocityX = 0;
      } else {
        // Push vertically
        if (player.y < obstacle.y) {
          player.y -= overlapY;
          player.velocityY = 0;
          player.onGround = true;
        } else {
          player.y += overlapY;
          player.velocityY = 0;
        }
      }
    }
  }
}

export function handleInteraction(p) {
  const player = gameState.player;
  if (!player) return;
  
  const playerBox = player.getHitbox();
  
  // Try to pick up package
  if (!player.holdingPackage) {
    for (let pkg of gameState.packages) {
      if (pkg.pickedUp || pkg.delivered) continue;
      
      const pkgBox = pkg.getHitbox();
      const distance = p.dist(player.x, player.y, pkg.x, pkg.y);
      
      if (distance < 50) {
        pkg.pickedUp = true;
        player.holdingPackage = pkg;
        return;
      }
    }
  }
  
  // Try to deliver package
  if (player.holdingPackage) {
    const pkg = player.holdingPackage;
    const customer = gameState.customers[pkg.destinationId];
    
    if (customer) {
      const distance = p.dist(player.x, player.y, customer.x, customer.y);
      
      if (distance < 60) {
        pkg.delivered = true;
        player.holdingPackage = null;
        customer.satisfied = true;
        customer.waiting = false;
        gameState.deliveriesCompleted++;
        gameState.score += 50;
        gameState.money += 50;
      }
    }
  }
}