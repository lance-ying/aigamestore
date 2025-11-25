// collision.js - Collision detection and handling

import { gameState } from './globals.js';

export function checkTearEnemyCollisions(p) {
  for (let i = gameState.tears.length - 1; i >= 0; i--) {
    const tear = gameState.tears[i];
    
    for (let j = gameState.enemies.length - 1; j >= 0; j--) {
      const enemy = gameState.enemies[j];
      
      const dist = p.dist(tear.x, tear.y, enemy.x, enemy.y);
      if (dist < tear.radius + enemy.size / 2) {
        // Hit!
        const killed = enemy.takeDamage(tear.damage);
        gameState.tears.splice(i, 1);
        
        if (killed) {
          gameState.enemies.splice(j, 1);
          gameState.totalEnemiesKilled++;
          gameState.score += 10;
        }
        
        break;
      }
    }
  }
}

export function checkPlayerEnemyCollisions(p) {
  if (!gameState.player) return;
  
  gameState.enemies.forEach(enemy => {
    const dist = p.dist(
      gameState.player.x, gameState.player.y,
      enemy.x, enemy.y
    );
    
    const collisionDist = (gameState.player.width / 2) + (enemy.size / 2);
    
    if (dist < collisionDist) {
      gameState.player.takeDamage(1);
    }
  });
}

export function checkPlayerItemCollisions(p) {
  if (!gameState.player) return;
  
  for (let i = gameState.items.length - 1; i >= 0; i--) {
    const item = gameState.items[i];
    if (item.collected) continue;
    
    const dist = p.dist(
      gameState.player.x, gameState.player.y,
      item.x, item.y
    );
    
    if (dist < gameState.player.width / 2 + item.size / 2) {
      collectItem(item);
      gameState.items.splice(i, 1);
    }
  }
}

export function checkPlayerHeartCollisions(p) {
  if (!gameState.player) return;
  
  for (let i = gameState.hearts.length - 1; i >= 0; i--) {
    const heart = gameState.hearts[i];
    if (heart.collected) continue;
    
    const dist = p.dist(
      gameState.player.x, gameState.player.y,
      heart.x, heart.y
    );
    
    if (dist < gameState.player.width / 2 + heart.size / 2) {
      // Heal player
      if (gameState.playerHealth < gameState.playerMaxHealth) {
        gameState.playerHealth = Math.min(
          gameState.playerHealth + 2,
          gameState.playerMaxHealth
        );
        gameState.hearts.splice(i, 1);
        gameState.score += 5;
      }
    }
  }
}

export function checkPlayerPortalCollision(p) {
  if (!gameState.player || !gameState.exitPortal) return false;
  
  if (!gameState.exitPortal.active) return false;
  
  const dist = p.dist(
    gameState.player.x, gameState.player.y,
    gameState.exitPortal.x, gameState.exitPortal.y
  );
  
  return dist < gameState.player.width / 2 + gameState.exitPortal.size / 2;
}

export function checkProjectilePlayerCollisions(p) {
  if (!gameState.player) return;
  
  for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
    const proj = gameState.projectiles[i];
    
    const dist = p.dist(
      gameState.player.x, gameState.player.y,
      proj.x, proj.y
    );
    
    if (dist < gameState.player.width / 2 + proj.radius) {
      gameState.player.takeDamage(proj.damage);
      gameState.projectiles.splice(i, 1);
    }
  }
}

function collectItem(item) {
  gameState.itemsCollected++;
  gameState.score += 50;
  
  switch (item.type) {
    case 'damage':
      gameState.playerDamage += 0.5;
      break;
    case 'speed':
      gameState.playerSpeed += 0.5;
      break;
    case 'firerate':
      gameState.playerFireRate = Math.max(5, gameState.playerFireRate - 3);
      break;
    case 'health':
      gameState.playerMaxHealth += 2;
      gameState.playerHealth += 2;
      break;
  }
}