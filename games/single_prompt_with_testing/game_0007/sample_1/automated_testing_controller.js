// Automated testing controller

import { gameState, KEY_LEFT, KEY_RIGHT, KEY_SPACE, KEY_SHIFT, KEY_Z } from './globals.js';
import { distance } from './utils.js';

// TEST_1: Basic movement and shooting
function getTest1Action() {
  if (!gameState.player || gameState.player.isDead) return null;
  
  // Alternate between moving left and right
  const moveDirection = Math.floor(gameState.frameCount / 60) % 2;
  
  // Always shoot
  if (gameState.frameCount % 5 === 0) {
    return { keyCode: KEY_SPACE };
  }
  
  // Move
  if (moveDirection === 0) {
    return { keyCode: KEY_LEFT };
  } else {
    return { keyCode: KEY_RIGHT };
  }
}

// TEST_2: Advanced strategy to win
function getTest2Action() {
  if (!gameState.player || gameState.player.isDead || !gameState.boss) return null;
  
  const player = gameState.player;
  const boss = gameState.boss;
  
  // Priority 1: Try to parry pink projectiles
  const parryableProjectile = findNearestParryableProjectile(player);
  if (parryableProjectile && distance(player.x, player.y, parryableProjectile.x, parryableProjectile.y) < 40) {
    if (gameState.parryCooldown <= 0) {
      return { keyCode: KEY_Z };
    }
  }
  
  // Priority 2: Dodge dangerous projectiles
  const dangerousProjectile = findNearestDangerousProjectile(player);
  if (dangerousProjectile && distance(player.x, player.y, dangerousProjectile.x, dangerousProjectile.y) < 80) {
    // Use dash if available
    if (gameState.dashCooldown <= 0 && gameState.frameCount % 15 === 0) {
      return { keyCode: KEY_SHIFT };
    }
    
    // Dodge by moving away
    if (dangerousProjectile.x < player.x) {
      return { keyCode: KEY_RIGHT };
    } else {
      return { keyCode: KEY_LEFT };
    }
  }
  
  // Priority 3: Maintain optimal distance from boss (200-300 pixels)
  const distToBoss = distance(player.x, player.y, boss.x, boss.y);
  
  if (distToBoss < 200) {
    // Too close, move away
    if (player.x < boss.x) {
      return { keyCode: KEY_LEFT };
    } else {
      return { keyCode: KEY_RIGHT };
    }
  } else if (distToBoss > 300) {
    // Too far, move closer
    if (player.x < boss.x) {
      return { keyCode: KEY_RIGHT };
    } else {
      return { keyCode: KEY_LEFT };
    }
  }
  
  // Priority 4: Always shoot when possible
  if (gameState.shootCooldown <= 0) {
    return { keyCode: KEY_SPACE };
  }
  
  // Default: slight random movement
  if (gameState.frameCount % 30 === 0) {
    return { keyCode: Math.random() > 0.5 ? KEY_LEFT : KEY_RIGHT };
  }
  
  return null;
}

function findNearestParryableProjectile(player) {
  let nearest = null;
  let minDist = Infinity;
  
  for (const proj of gameState.bossProjectiles) {
    if (proj.isParryable) {
      const dist = distance(player.x, player.y, proj.x, proj.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = proj;
      }
    }
  }
  
  return nearest;
}

function findNearestDangerousProjectile(player) {
  let nearest = null;
  let minDist = Infinity;
  
  for (const proj of gameState.bossProjectiles) {
    const dist = distance(player.x, player.y, proj.x, proj.y);
    
    // Check if projectile is heading towards player
    const dx = player.x - proj.x;
    const dy = player.y - proj.y;
    const projAngle = Math.atan2(proj.vy, proj.vx);
    const playerAngle = Math.atan2(dy, dx);
    const angleDiff = Math.abs(projAngle - playerAngle);
    
    if (dist < minDist && angleDiff < Math.PI / 3) {
      minDist = dist;
      nearest = proj;
    }
  }
  
  return nearest;
}

export function get_automated_testing_action(state) {
  if (state.controlMode === "TEST_1") {
    return getTest1Action();
  } else if (state.controlMode === "TEST_2") {
    return getTest2Action();
  }
  return null;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}