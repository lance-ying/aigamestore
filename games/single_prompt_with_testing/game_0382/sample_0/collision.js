// collision.js - Collision detection and response
import { gameState } from './globals.js';

export function handleCollisions(p) {
  const player = gameState.player;
  if (!player) return;
  
  // Player collision with power gems
  for (let gem of gameState.powerGems) {
    if (gem.active && p.collideRectRect(
      player.x, player.y, player.width, player.height,
      gem.x - gem.width / 2, gem.y - gem.height / 2, gem.width, gem.height
    )) {
      gem.active = false;
      gameState.powerGemsCollected++;
      gameState.score += 50;
      
      // Unlock dash after collecting 3 gems
      if (gameState.powerGemsCollected >= 3 && !gameState.dashUnlocked) {
        gameState.dashUnlocked = true;
      }
    }
  }
  
  // Player collision with enemies
  for (let enemy of gameState.enemies) {
    if (enemy.active && p.collideRectRect(
      player.x, player.y, player.width, player.height,
      enemy.x, enemy.y, enemy.width, enemy.height
    )) {
      player.takeDamage(10);
    }
  }
  
  // Player collision with boss
  if (gameState.boss && gameState.boss.active && p.collideRectRect(
    player.x, player.y, player.width, player.height,
    gameState.boss.x, gameState.boss.y, gameState.boss.width, gameState.boss.height
  )) {
    player.takeDamage(20);
  }
  
  // Projectile collisions
  for (let projectile of gameState.projectiles) {
    if (!projectile.active) continue;
    
    if (projectile.isPlayerProjectile) {
      // Player projectiles hit enemies
      for (let enemy of gameState.enemies) {
        if (enemy.active && p.collideRectCircle(
          enemy.x, enemy.y, enemy.width, enemy.height,
          projectile.x, projectile.y, projectile.width
        )) {
          enemy.takeDamage(projectile.damage);
          projectile.active = false;
        }
      }
      
      // Player projectiles hit boss
      if (gameState.boss && gameState.boss.active && p.collideRectCircle(
        gameState.boss.x, gameState.boss.y, gameState.boss.width, gameState.boss.height,
        projectile.x, projectile.y, projectile.width
      )) {
        gameState.boss.takeDamage(projectile.damage);
        projectile.active = false;
      }
    } else {
      // Enemy projectiles hit player
      if (p.collideRectCircle(
        player.x, player.y, player.width, player.height,
        projectile.x, projectile.y, projectile.width
      )) {
        player.takeDamage(projectile.damage);
        projectile.active = false;
      }
    }
  }
  
  // Remove inactive entities
  gameState.projectiles = gameState.projectiles.filter(p => p.active);
  gameState.enemies = gameState.enemies.filter(e => e.active);
  gameState.powerGems = gameState.powerGems.filter(g => g.active);
  gameState.entities = gameState.entities.filter(e => {
    return e === player || e.active || e.constructor.name === 'Platform';
  });
}