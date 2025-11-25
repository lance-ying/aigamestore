// combat.js - Combat system and collision detection

import { gameState, BASE_KNOCKBACK } from './globals.js';
import { Effect } from './entities.js';

export function checkAttackCollisions(p, attacker, attack) {
  if (!attack) return;
  
  const hitbox = attack.hitbox;
  let target = null;
  
  // Determine target
  if (attacker === gameState.player) {
    target = gameState.opponent;
  } else {
    target = gameState.player;
  }
  
  if (!target || !target.isAlive || target.hitstun > 0) return;
  
  // Check collision using p5.collide2D
  if (p.collideRectRect(
    hitbox.x, hitbox.y, hitbox.width, hitbox.height,
    target.x, target.y, target.width, target.height
  )) {
    // Hit confirmed!
    const knockbackDir = attacker.facingRight ? 1 : -1;
    const knockbackX = attack.knockback * BASE_KNOCKBACK * knockbackDir;
    const knockbackY = -attack.knockback * BASE_KNOCKBACK * 0.7;
    
    target.takeDamage(attack.damage, knockbackX, knockbackY);
    
    // Create hit effect
    const hitColor = attacker.character.color;
    gameState.effects.push(new Effect(
      target.x + target.width/2,
      target.y + target.height/2,
      'hit',
      hitColor
    ));
    
    return true;
  }
  
  return false;
}

export function checkProjectileCollisions(p) {
  for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
    const proj = gameState.projectiles[i];
    if (!proj.active) continue;
    
    let target = proj.owner === gameState.player ? gameState.opponent : gameState.player;
    
    if (!target || !target.isAlive) continue;
    
    // Check collision
    if (p.collideCircleCircle(
      proj.x, proj.y, proj.radius * 2,
      target.x + target.width/2, target.y + target.height/2, target.width
    )) {
      const knockbackX = proj.vx * 0.5;
      const knockbackY = -3;
      target.takeDamage(proj.damage, knockbackX, knockbackY);
      proj.active = false;
      
      gameState.effects.push(new Effect(proj.x, proj.y, 'star', [255, 200, 100]));
    }
  }
}

export function checkPlatformCollisions(p, fighter) {
  for (let platform of gameState.platforms) {
    // Check if fighter is falling onto platform
    if (fighter.vy >= 0) {
      const prevY = fighter.y - fighter.vy;
      
      // Check if fighter's feet crossed the platform's top surface
      if (prevY + fighter.height <= platform.y && 
          fighter.y + fighter.height >= platform.y) {
        
        // Check horizontal overlap
        if (fighter.x + fighter.width > platform.x && 
            fighter.x < platform.x + platform.width) {
          
          // Can drop through with down key
          if (platform.canDropThrough && fighter.inputBuffer && fighter.inputBuffer.down) {
            continue;
          }
          
          // Land on platform
          fighter.y = platform.y - fighter.height;
          fighter.land();
        }
      }
    }
  }
}