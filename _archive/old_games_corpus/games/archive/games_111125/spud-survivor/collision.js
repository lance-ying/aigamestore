// collision.js - Collision detection and handling
import { gameState, GAME_PHASES } from './globals.js';
import { Item } from './entities.js';

export function checkCollisions(p) {
  const player = gameState.player;
  
  // Player-Enemy collisions
  for (let i = gameState.enemies.length - 1; i >= 0; i--) {
    const enemy = gameState.enemies[i];
    const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
    
    if (dist < player.radius + enemy.radius) {
      // Contact damage
      if (!player.isDashing) {
        player.takeDamage(enemy.damage * 0.1); // Continuous damage
      }
    }
  }
  
  // Player projectile - Enemy collisions
  for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
    const proj = gameState.projectiles[i];
    
    if (proj.source === 'player') {
      for (let j = gameState.enemies.length - 1; j >= 0; j--) {
        const enemy = gameState.enemies[j];
        const dist = Math.hypot(enemy.x - proj.x, enemy.y - proj.y);
        
        if (dist < enemy.radius + proj.radius) {
          enemy.takeDamage(proj.damage);
          gameState.projectiles.splice(i, 1);
          
          // Enemy death
          if (enemy.currentHP <= 0) {
            handleEnemyDeath(p, enemy, j);
          }
          break;
        }
      }
    } else if (proj.source === 'enemy') {
      // Enemy projectile - Player collision
      const dist = Math.hypot(player.x - proj.x, player.y - proj.y);
      
      if (dist < player.radius + proj.radius) {
        player.takeDamage(proj.damage);
        gameState.projectiles.splice(i, 1);
      }
    }
  }
  
  // Player - Item collisions
  for (let i = gameState.items.length - 1; i >= 0; i--) {
    const item = gameState.items[i];
    const dist = Math.hypot(item.x - player.x, item.y - player.y);
    
    if (dist < player.radius + item.radius + 10) {
      handleItemPickup(item);
      gameState.items.splice(i, 1);
    }
  }
}

function handleEnemyDeath(p, enemy, index) {
  gameState.score += enemy.scoreValue;
  gameState.enemies.splice(index, 1);
  
  // Remove from entities
  const entityIndex = gameState.entities.indexOf(enemy);
  if (entityIndex > -1) {
    gameState.entities.splice(entityIndex, 1);
  }
  
  gameState.enemiesRemainingInWave--;
  
  // Drop items
  const roll = p.random(100);
  if (roll < 60) { // 60% chance for exp
    gameState.items.push(new Item(enemy.x, enemy.y, 'exp'));
  } else if (roll < 80) { // 20% chance for materials
    gameState.items.push(new Item(enemy.x, enemy.y, 'materials'));
  } else if (roll < 95) { // 15% chance for health
    gameState.items.push(new Item(enemy.x, enemy.y, 'health'));
  }
}

function handleItemPickup(item) {
  const player = gameState.player;
  
  switch (item.type) {
    case 'exp':
      const leveledUp = player.addExp(item.value);
      if (leveledUp) {
        gameState.gamePhase = GAME_PHASES.LEVEL_UP_MENU;
      }
      break;
    case 'materials':
      gameState.materials += item.value;
      break;
    case 'health':
      player.currentHP = Math.min(player.currentHP + item.value, player.maxHP);
      break;
  }
}