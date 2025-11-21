// input_handler.js - Input handling for player

import {
  KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_DOWN,
  KEY_SPACE, KEY_Z, KEY_SHIFT,
  ATTACK_RANGE, FIREBALL_COOLDOWN, HEAL_COOLDOWN,
  gameState
} from './globals.js';
import { createFireball } from './projectile.js';
import { checkCircleCollision } from './utils.js';

export function handlePlayerInput(p) {
  const player = gameState.player;
  if (!player || !player.isAlive()) return;
  
  let dx = 0;
  let dy = 0;
  
  if (p.keyIsDown(KEY_LEFT)) dx -= 1;
  if (p.keyIsDown(KEY_RIGHT)) dx += 1;
  if (p.keyIsDown(KEY_UP)) dy -= 1;
  if (p.keyIsDown(KEY_DOWN)) dy += 1;
  
  if (dx !== 0 || dy !== 0) {
    player.move(dx, dy);
  }
}

export function handlePlayerActions(p, keyCode) {
  const player = gameState.player;
  if (!player || !player.isAlive()) return;
  
  // Basic attack
  if (keyCode === KEY_SPACE && gameState.attackCooldown === 0) {
    performMeleeAttack(player);
    gameState.attackCooldown = 30;
  }
  
  // Fireball skill
  if (keyCode === KEY_Z && gameState.fireballCooldown === 0) {
    const fireball = createFireball(player);
    gameState.projectiles.push(fireball);
    gameState.fireballCooldown = FIREBALL_COOLDOWN;
  }
  
  // Heal skill
  if (keyCode === KEY_SHIFT && gameState.healCooldown === 0) {
    const healAmount = Math.floor(player.maxHp * 0.3);
    player.heal(healAmount);
    gameState.healCooldown = HEAL_COOLDOWN;
  }
}

function performMeleeAttack(player) {
  const attackDamage = player.getAttackDamage();
  
  gameState.enemies.forEach(enemy => {
    if (!enemy.isAlive) return;
    
    const dist = Math.sqrt(
      Math.pow(enemy.x - player.x, 2) + 
      Math.pow(enemy.y - player.y, 2)
    );
    
    if (dist < ATTACK_RANGE) {
      enemy.takeDamage(attackDamage);
    }
  });
}