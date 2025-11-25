// combat.js - Combat system and collision detection

import { gameState } from './globals.js';
import { createBloodParticles, createImpactParticles, createGoldParticles } from './particles.js';

export function checkCombat(p) {
  if (!gameState.player) return;

  const player = gameState.player;

  // Check player attacks on enemies
  const playerHitbox = player.getAttackHitbox();
  if (playerHitbox) {
    for (const enemy of gameState.enemies) {
      if (enemy.isDead) continue;

      const dx = playerHitbox.x - (enemy.x + enemy.width / 2);
      const dy = playerHitbox.y - (enemy.y + enemy.height / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < playerHitbox.radius + 20) {
        const damage = player.getDamage();
        const actualDamage = enemy.takeDamage(damage);
        
        if (actualDamage > 0) {
          // Create particles
          const particles = createBloodParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 8);
          gameState.particles.push(...particles);

          // Award score
          gameState.score += Math.floor(damage);

          // Check if enemy died
          if (enemy.isDead) {
            gameState.defeatedEnemies++;
            const goldReward = enemy.isChampion ? 100 : 25;
            gameState.gold += goldReward;
            gameState.score += goldReward * 10;
            
            // Gold particles
            const goldParticles = createGoldParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 15);
            gameState.particles.push(...goldParticles);
          }
        }
      }
    }
  }

  // Check enemy attacks on player
  for (const enemy of gameState.enemies) {
    if (enemy.isDead) continue;

    const enemyHitbox = enemy.getAttackHitbox();
    if (enemyHitbox) {
      const dx = enemyHitbox.x - (player.x + player.width / 2);
      const dy = enemyHitbox.y - (player.y + player.height / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < enemyHitbox.radius + 20) {
        const baseDamage = enemy.isChampion ? 20 : 12;
        const actualDamage = player.takeDamage(baseDamage);
        
        if (actualDamage > 0) {
          // Create particles
          const particles = player.isBlocking ? 
            createImpactParticles(player.x + player.width / 2, player.y + player.height / 2, 5) :
            createBloodParticles(player.x + player.width / 2, player.y + player.height / 2, 6);
          gameState.particles.push(...particles);
        }
      }
    }
  }
}

export function checkCollisions(p) {
  if (!gameState.player) return;

  const player = gameState.player;

  // Check player-enemy body collisions
  for (const enemy of gameState.enemies) {
    if (enemy.isDead) continue;

    // Simple rectangle collision
    if (p.collideRectRect(
      player.x, player.y, player.width, player.height,
      enemy.x, enemy.y, enemy.width, enemy.height
    )) {
      // Push apart
      const dx = (player.x + player.width / 2) - (enemy.x + enemy.width / 2);
      const pushForce = 2;
      
      if (Math.abs(dx) > 0.1) {
        player.x += dx > 0 ? pushForce : -pushForce;
        enemy.x += dx > 0 ? -pushForce : pushForce;
      }
    }
  }

  // Check enemy-enemy collisions
  for (let i = 0; i < gameState.enemies.length; i++) {
    for (let j = i + 1; j < gameState.enemies.length; j++) {
      const enemy1 = gameState.enemies[i];
      const enemy2 = gameState.enemies[j];
      
      if (enemy1.isDead || enemy2.isDead) continue;

      if (p.collideRectRect(
        enemy1.x, enemy1.y, enemy1.width, enemy1.height,
        enemy2.x, enemy2.y, enemy2.width, enemy2.height
      )) {
        const dx = (enemy1.x + enemy1.width / 2) - (enemy2.x + enemy2.width / 2);
        const pushForce = 1.5;
        
        if (Math.abs(dx) > 0.1) {
          enemy1.x += dx > 0 ? pushForce : -pushForce;
          enemy2.x += dx > 0 ? -pushForce : pushForce;
        }
      }
    }
  }
}