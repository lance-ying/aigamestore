// ai.js - Enemy AI and player auto-attack

import { gameState } from './globals.js';
import { checkWallCollision, checkEntityCollision } from './collision.js';
import { Projectile } from './projectiles.js';

export function updateEnemyAI(p) {
  for (const enemy of gameState.enemies) {
    if (!enemy.isAlive()) continue;

    const player = gameState.player;
    if (!player || !player.isAlive()) continue;

    // Move towards player
    if (enemy.moveProgress === 0 && p.frameCount % 20 === 0) {
      const dx = player.gridX - enemy.gridX;
      const dy = player.gridY - enemy.gridY;

      if (dx === 0 && dy === 0) continue;

      let moveX = 0;
      let moveY = 0;

      if (Math.abs(dx) > Math.abs(dy)) {
        moveX = dx > 0 ? 1 : -1;
      } else {
        moveY = dy > 0 ? 1 : -1;
      }

      const newGridX = enemy.gridX + moveX;
      const newGridY = enemy.gridY + moveY;

      if (!checkWallCollision(newGridX, newGridY) && 
          !checkEntityCollision(newGridX, newGridY, enemy)) {
        enemy.targetX = newGridX;
        enemy.targetY = newGridY;
        enemy.moveProgress = 10;
      }
    }

    if (enemy.moveProgress > 0) {
      enemy.moveProgress--;
      const startX = enemy.gridX * 40 + 20;
      const startY = enemy.gridY * 40 + 20;
      const endX = enemy.targetX * 40 + 20;
      const endY = enemy.targetY * 40 + 20;
      const t = 1 - (enemy.moveProgress / 10);
      enemy.x = startX + (endX - startX) * t;
      enemy.y = startY + (endY - startY) * t;
      
      if (enemy.moveProgress === 0) {
        enemy.gridX = enemy.targetX;
        enemy.gridY = enemy.targetY;
      }
    }

    // Attack logic
    if (enemy.type === "RANGED_ENEMY" && enemy.attackCooldown === 0) {
      const dist = Math.sqrt(
        Math.pow(player.x - enemy.x, 2) + Math.pow(player.y - enemy.y, 2)
      );
      if (dist < 300) {
        const proj = new Projectile(enemy.x, enemy.y, player.x, player.y, enemy.atk, false, 3);
        gameState.projectiles.push(proj);
        enemy.attackCooldown = enemy.asp;
      }
    } else if (enemy.type === "BOSS_ENEMY") {
      if (enemy.attackCooldown === 0) {
        const dist = Math.sqrt(
          Math.pow(player.x - enemy.x, 2) + Math.pow(player.y - enemy.y, 2)
        );
        if (dist < 350) {
          const proj = new Projectile(enemy.x, enemy.y, player.x, player.y, enemy.atk, false, 4);
          gameState.projectiles.push(proj);
          enemy.attackCooldown = enemy.asp;
        }
      }
      
      // Special multi-directional attack
      if (enemy.specialAttackCooldown === 0 && p.frameCount % 180 === 0) {
        for (let angle = 0; angle < p.TWO_PI; angle += p.PI / 4) {
          const targetX = enemy.x + p.cos(angle) * 100;
          const targetY = enemy.y + p.sin(angle) * 100;
          const proj = new Projectile(enemy.x, enemy.y, targetX, targetY, enemy.atk * 0.7, false, 3);
          gameState.projectiles.push(proj);
        }
        enemy.specialAttackCooldown = 180;
      }
    } else if (enemy.type === "MELEE_ENEMY" || enemy.type === "TANK_ENEMY") {
      // Melee contact damage
      if (enemy.gridX === player.gridX && enemy.gridY === player.gridY && enemy.attackCooldown === 0) {
        player.takeDamage(enemy.atk);
        enemy.attackCooldown = 60;
      }
    }
  }
}

export function playerAutoAttack(p) {
  if (!gameState.player || !gameState.player.isAlive()) return;
  if (gameState.attackCooldown > 0) return;
  if (gameState.framesSinceLastMove < 10) return; // Only attack when stationary

  // Find nearest enemy
  let nearestEnemy = null;
  let minDist = 400; // Attack range

  for (const enemy of gameState.enemies) {
    if (!enemy.isAlive()) continue;
    const dist = Math.sqrt(
      Math.pow(gameState.player.x - enemy.x, 2) + 
      Math.pow(gameState.player.y - enemy.y, 2)
    );
    if (dist < minDist) {
      minDist = dist;
      nearestEnemy = enemy;
    }
  }

  if (nearestEnemy) {
    // Fire projectile(s)
    const baseAngle = Math.atan2(
      nearestEnemy.y - gameState.player.y,
      nearestEnemy.x - gameState.player.x
    );

    for (let i = 0; i < gameState.player.multiShotCount; i++) {
      let angle = baseAngle;
      if (gameState.player.multiShotCount > 1) {
        const spread = 0.3;
        angle += (i - (gameState.player.multiShotCount - 1) / 2) * spread;
      }

      const targetX = gameState.player.x + Math.cos(angle) * 300;
      const targetY = gameState.player.y + Math.sin(angle) * 300;

      const proj = new Projectile(
        gameState.player.x,
        gameState.player.y,
        targetX,
        targetY,
        gameState.player.atk,
        true,
        gameState.player.projectileSpeed,
        gameState.player.hasPiercing
      );
      gameState.projectiles.push(proj);
    }

    gameState.attackCooldown = gameState.player.asp;
  }
}