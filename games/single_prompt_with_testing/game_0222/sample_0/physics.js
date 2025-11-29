// physics.js - Physics and collision detection

import { gameState } from './globals.js';

export function checkCollision(entity1, entity2) {
  // AABB collision detection
  return (
    entity1.x - entity1.width / 2 < entity2.x + entity2.width / 2 &&
    entity1.x + entity1.width / 2 > entity2.x - entity2.width / 2 &&
    entity1.y - entity1.height / 2 < entity2.y + entity2.height / 2 &&
    entity1.y + entity1.height / 2 > entity2.y - entity2.height / 2
  );
}

export function checkCircleCollision(entity1, entity2, radius1, radius2) {
  const dx = entity2.x - entity1.x;
  const dy = entity2.y - entity1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < (radius1 + radius2);
}

export function checkPlayerEnemyCollisions() {
  if (!gameState.player || gameState.player.invulnerable > 0) return;
  
  for (const enemy of gameState.enemies) {
    if (checkCollision(gameState.player, enemy)) {
      // Check if player is sliding (chainsaw attack)
      if (gameState.player.isSliding) {
        enemy.takeDamage(50); // Instant kill with chainsaw
        gameState.player.vx *= 0.8; // Slow down slightly
      } else {
        // Enemy damages player
        gameState.player.takeDamage(enemy.damage);
      }
    }
  }
}

export function updatePhysics() {
  checkPlayerEnemyCollisions();
}