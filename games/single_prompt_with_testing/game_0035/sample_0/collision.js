// collision.js - Collision detection and handling

import { gameState } from './globals.js';
import { createExplosion } from './particle.js';

export function checkCollisions(p) {
  // Check projectile collisions with characters
  for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
    const proj = gameState.projectiles[i];
    
    if (proj.owner === 'player' && gameState.enemy) {
      if (p.collideCircleCircle(proj.x, proj.y, proj.size, 
                                 gameState.enemy.x, gameState.enemy.y, 
                                 Math.max(gameState.enemy.width, gameState.enemy.height))) {
        if (gameState.enemy.takeDamage(proj.damage)) {
          proj.onHit();
          gameState.projectiles.splice(i, 1);
        } else {
          // Blocked by shield
          createExplosion(proj.x, proj.y, [150, 200, 255], 10);
          proj.onHit();
          gameState.projectiles.splice(i, 1);
        }
      }
    } else if (proj.owner === 'enemy' && gameState.player) {
      if (p.collideCircleCircle(proj.x, proj.y, proj.size,
                                 gameState.player.x, gameState.player.y,
                                 Math.max(gameState.player.width, gameState.player.height))) {
        if (gameState.player.takeDamage(proj.damage)) {
          proj.onHit();
          gameState.projectiles.splice(i, 1);
        } else {
          // Blocked by shield
          createExplosion(proj.x, proj.y, [150, 200, 255], 10);
          proj.onHit();
          gameState.projectiles.splice(i, 1);
        }
      }
    }
  }
}