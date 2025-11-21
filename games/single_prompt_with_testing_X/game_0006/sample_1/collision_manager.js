// collision_manager.js - Collision detection and handling

import { gameState } from './globals.js';

export function checkCollisions(p) {
  if (!gameState.player) return;
  
  // Check block collection
  for (let block of gameState.blocks) {
    if (!block.collected) {
      const dist = Math.sqrt(
        (gameState.player.x - block.x) ** 2 +
        (gameState.player.y - block.y) ** 2
      );
      
      if (dist < gameState.player.size / 2 + block.size / 2) {
        // Only collect if matching color
        if (
          block.color.r === gameState.player.color.r &&
          block.color.g === gameState.player.color.g &&
          block.color.b === gameState.player.color.b
        ) {
          block.collected = true;
          gameState.player.collectBlock();
          gameState.score += 10;
        }
      }
    }
  }
  
  // Check bridge building
  for (let bridge of gameState.bridges) {
    if (!bridge.isComplete) {
      const inBridgeZone = p.collideRectCircle(
        bridge.x - bridge.width / 2,
        bridge.y - bridge.height / 2,
        bridge.width,
        bridge.height,
        gameState.player.x,
        gameState.player.y,
        gameState.player.size
      );
      
      if (inBridgeZone && gameState.player.blocks > 0) {
        if (bridge.addBlock(gameState.player)) {
          gameState.player.useBlock();
          gameState.score += 20;
        }
      }
    }
  }
  
  // Check collisions with AI opponents
  for (let ai of gameState.aiOpponents) {
    const dist = Math.sqrt(
      (gameState.player.x - ai.x) ** 2 +
      (gameState.player.y - ai.y) ** 2
    );
    
    if (dist < gameState.player.size) {
      // Knock blocks from opponent
      const knocked = ai.knockBlocks(2);
      if (knocked > 0) {
        gameState.score += knocked * 5;
      }
      
      // Push apart
      const angle = Math.atan2(
        gameState.player.y - ai.y,
        gameState.player.x - ai.x
      );
      gameState.player.x += Math.cos(angle) * 2;
      gameState.player.y += Math.sin(angle) * 2;
      ai.x -= Math.cos(angle) * 2;
      ai.y -= Math.sin(angle) * 2;
    }
  }
  
  // AI block collection
  for (let ai of gameState.aiOpponents) {
    for (let block of gameState.blocks) {
      if (!block.collected) {
        const dist = Math.sqrt(
          (ai.x - block.x) ** 2 +
          (ai.y - block.y) ** 2
        );
        
        if (dist < ai.size / 2 + block.size / 2) {
          if (
            block.color.r === ai.color.r &&
            block.color.g === ai.color.g &&
            block.color.b === ai.color.b
          ) {
            block.collected = true;
            ai.collectBlock();
          }
        }
      }
    }
    
    // AI bridge building
    for (let bridge of gameState.bridges) {
      if (!bridge.isComplete) {
        const inBridgeZone = p.collideRectCircle(
          bridge.x - bridge.width / 2,
          bridge.y - bridge.height / 2,
          bridge.width,
          bridge.height,
          ai.x,
          ai.y,
          ai.size
        );
        
        if (inBridgeZone && ai.blocks > 0) {
          if (bridge.addBlock(ai)) {
            ai.useBlock();
          }
        }
      }
    }
  }
}