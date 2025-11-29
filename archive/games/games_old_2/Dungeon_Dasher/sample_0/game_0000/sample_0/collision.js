// collision.js - Collision detection and handling

import { GRID_SIZE, gameState } from './globals.js';

export function checkWallCollision(gridX, gridY) {
  return gameState.walls.some(w => w.x === gridX && w.y === gridY);
}

export function checkEntityCollision(gridX, gridY, excludeEntity) {
  return gameState.entities.some(e => 
    e !== excludeEntity && 
    e.isAlive() && 
    e.gridX === gridX && 
    e.gridY === gridY
  );
}

export function checkProjectileCollisions(p) {
  const projectilesToRemove = [];

  for (let i = 0; i < gameState.projectiles.length; i++) {
    const proj = gameState.projectiles[i];

    // Check collision with walls
    const gridX = Math.floor(proj.x / GRID_SIZE);
    const gridY = Math.floor(proj.y / GRID_SIZE);
    if (checkWallCollision(gridX, gridY)) {
      projectilesToRemove.push(i);
      continue;
    }

    // Check collision with entities
    if (proj.isPlayerProjectile) {
      for (const enemy of gameState.enemies) {
        if (enemy.isAlive() && p.collideCircleCircle(proj.x, proj.y, 10, enemy.x, enemy.y, enemy.size)) {
          enemy.takeDamage(proj.damage);
          
          if (enemy.hp <= 0) {
            awardScoreForEnemy(enemy);
          }
          
          if (!proj.piercing) {
            projectilesToRemove.push(i);
          }
          break;
        }
      }
    } else {
      if (gameState.player.isAlive() && 
          p.collideCircleCircle(proj.x, proj.y, 10, gameState.player.x, gameState.player.y, gameState.player.size)) {
        gameState.player.takeDamage(proj.damage);
        projectilesToRemove.push(i);
      }
    }
  }

  // Remove projectiles (reverse order to maintain indices)
  for (let i = projectilesToRemove.length - 1; i >= 0; i--) {
    gameState.projectiles.splice(projectilesToRemove[i], 1);
  }
}

function awardScoreForEnemy(enemy) {
  switch (enemy.type) {
    case "MELEE_ENEMY":
      gameState.score += 50;
      break;
    case "RANGED_ENEMY":
      gameState.score += 100;
      break;
    case "TANK_ENEMY":
      gameState.score += 150;
      break;
    case "BOSS_ENEMY":
      gameState.score += 500;
      break;
  }
}