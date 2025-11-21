// combat_system.js - Combat and collision handling

import { gameState, HIT_STUN_DURATION } from './globals.js';

export function checkCombat(p, player, enemy) {
  // Check player attacks hitting enemy
  if (player.isAttacking && player.attackFrame > 5 && player.attackFrame < 15) {
    const hitbox = player.getHitbox();
    if (hitbox) {
      const hit = p.collideRectRect(
        hitbox.x, hitbox.y, hitbox.width, hitbox.height,
        enemy.x, enemy.y, enemy.width, enemy.height
      );
      
      if (hit && enemy.hitStun === 0) {
        const damage = player.getAttackDamage();
        enemy.takeDamage(damage);
        gameState.comboCounter++;
        gameState.lastHitTime = p.frameCount;
        
        // Knockback
        const knockbackDir = player.facingRight ? 1 : -1;
        enemy.x += knockbackDir * 15;
        
        return true;
      }
    }
  }
  
  // Check enemy attacks hitting player
  if (enemy.isAttacking && enemy.attackFrame > 5 && enemy.attackFrame < 15) {
    const hitbox = enemy.getHitbox();
    if (hitbox) {
      const hit = p.collideRectRect(
        hitbox.x, hitbox.y, hitbox.width, hitbox.height,
        player.x, player.y, player.width, player.height
      );
      
      if (hit && player.hitStun === 0) {
        const damage = enemy.getAttackDamage();
        player.takeDamage(damage);
        gameState.comboCounter = 0;
        
        // Knockback
        const knockbackDir = enemy.facingRight ? 1 : -1;
        player.x += knockbackDir * 15;
        
        return true;
      }
    }
  }
  
  return false;
}

export function resetComboIfExpired(p) {
  if (p.frameCount - gameState.lastHitTime > 60) {
    gameState.comboCounter = 0;
  }
}