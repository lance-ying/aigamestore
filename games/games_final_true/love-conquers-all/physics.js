// physics.js - Physics and collision detection

import { gameState } from './globals.js';

export function updatePhysics() {
  // Update player projectiles
  for (let i = gameState.playerProjectiles.length - 1; i >= 0; i--) {
    const projectile = gameState.playerProjectiles[i];
    const shouldRemove = projectile.update(window.gameInstance);
    
    if (shouldRemove) {
      gameState.playerProjectiles.splice(i, 1);
    }
  }
  
  // Update enemy projectiles
  for (let i = gameState.enemyProjectiles.length - 1; i >= 0; i--) {
    const projectile = gameState.enemyProjectiles[i];
    const shouldRemove = projectile.update(window.gameInstance);
    
    if (shouldRemove) {
      gameState.enemyProjectiles.splice(i, 1);
    }
  }
}

export function checkCollisions() {
  // Collisions are handled in the projectile update methods
  // This keeps the code modular and efficient
}