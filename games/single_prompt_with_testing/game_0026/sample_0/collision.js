// collision.js - Collision detection and handling

import { gameState } from './globals.js';

export function handleCollisions(p) {
  const player = gameState.player;
  
  if (!player || !player.alive) return;
  
  // Player slash vs enemies
  if (player.slashActive) {
    const slashHitbox = player.getSlashHitbox();
    if (slashHitbox) {
      for (const enemy of gameState.enemies) {
        if (!enemy.alive) continue;
        
        if (p.collideRectRect(
          slashHitbox.x - slashHitbox.width / 2,
          slashHitbox.y - slashHitbox.height / 2,
          slashHitbox.width,
          slashHitbox.height,
          enemy.x,
          enemy.y,
          enemy.width,
          enemy.height
        )) {
          enemy.takeDamage();
        }
      }
    }
  }
  
  // Player slash vs projectiles (deflect)
  if (player.slashActive) {
    const slashHitbox = player.getSlashHitbox();
    if (slashHitbox) {
      for (const projectile of gameState.projectiles) {
        if (!projectile.alive || projectile.owner === 'player') continue;
        
        if (p.collideCircleCircle(
          slashHitbox.x,
          slashHitbox.y,
          slashHitbox.width,
          projectile.x,
          projectile.y,
          projectile.width
        )) {
          projectile.deflect(player.slashDirection);
          gameState.score += 50;
        }
      }
    }
  }
  
  // Projectiles vs player
  for (const projectile of gameState.projectiles) {
    if (!projectile.alive || projectile.owner === 'player') continue;
    
    if (p.collideCircleCircle(
      projectile.x,
      projectile.y,
      projectile.width,
      player.x + player.width / 2,
      player.y + player.height / 2,
      player.width
    )) {
      projectile.alive = false;
      player.takeDamage();
    }
  }
  
  // Projectiles vs enemies (deflected bullets)
  for (const projectile of gameState.projectiles) {
    if (!projectile.alive || projectile.owner === 'enemy') continue;
    
    for (const enemy of gameState.enemies) {
      if (!enemy.alive) continue;
      
      if (p.collideCircleCircle(
        projectile.x,
        projectile.y,
        projectile.width,
        enemy.x + enemy.width / 2,
        enemy.y + enemy.height / 2,
        enemy.width
      )) {
        projectile.alive = false;
        enemy.takeDamage();
      }
    }
  }
  
  // Melee enemies vs player
  for (const enemy of gameState.enemies) {
    if (!enemy.alive || enemy.type !== 'melee') continue;
    
    if (p.collideRectRect(
      player.x,
      player.y,
      player.width,
      player.height,
      enemy.x,
      enemy.y,
      enemy.width,
      enemy.height
    )) {
      // Only damage if enemy is attacking
      if (enemy.attackCooldown > enemy.attackDelay - 20) {
        player.takeDamage();
      }
    }
  }
}