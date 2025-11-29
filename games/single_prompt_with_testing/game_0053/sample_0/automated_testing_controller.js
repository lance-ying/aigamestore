// Automated testing AI controller
import { gameState, KEY_LEFT, KEY_UP, KEY_RIGHT, KEY_DOWN, KEY_SPACE, KEY_SHIFT, KEY_Z } from './globals.js';

function getTestWinAction(gameState) {
  if (!gameState.player) return null;
  
  const player = gameState.player;
  
  // Find nearest enemy
  let nearestEnemy = null;
  let nearestEnemyDist = Infinity;
  
  for (const enemy of gameState.enemies) {
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < nearestEnemyDist) {
      nearestEnemyDist = dist;
      nearestEnemy = enemy;
    }
  }
  
  // Find most dangerous projectile
  let mostDangerous = null;
  let minDanger = Infinity;
  
  for (const proj of gameState.enemyProjectiles) {
    const dx = proj.x - player.x;
    const dy = proj.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate danger based on distance and velocity towards player
    const dotProduct = (proj.vx * dx + proj.vy * dy) / (dist + 0.01);
    const danger = dist - dotProduct * 30; // Prioritize projectiles heading towards us
    
    if (danger < minDanger && dist < 150) {
      minDanger = danger;
      mostDangerous = proj;
    }
  }
  
  // Decision making
  const shouldDodge = mostDangerous && minDanger < 80;
  const shouldAttack = nearestEnemy && nearestEnemyDist < 250;
  const shouldUseShield = gameState.enemyProjectiles.length > 10 && player.shieldCooldown === 0;
  const shouldUseCharge = player.chargeLevel >= player.maxCharge && gameState.enemies.length > 2;
  
  // Use special abilities
  if (shouldUseCharge) {
    return { keyCode: KEY_Z };
  }
  
  if (shouldUseShield && !player.shieldActive) {
    return { keyCode: KEY_SHIFT };
  }
  
  // Dodge dangerous projectiles
  if (shouldDodge && mostDangerous) {
    const dx = mostDangerous.x - player.x;
    const dy = mostDangerous.y - player.y;
    
    // Move perpendicular to projectile velocity
    const perpX = -mostDangerous.vy;
    const perpY = mostDangerous.vx;
    
    if (Math.abs(perpX) > Math.abs(perpY)) {
      return perpX > 0 ? { keyCode: KEY_RIGHT } : { keyCode: KEY_LEFT };
    } else {
      return perpY > 0 ? { keyCode: KEY_DOWN } : { keyCode: KEY_UP };
    }
  }
  
  // Attack enemies
  if (shouldAttack && nearestEnemy) {
    // Shoot
    if (Math.random() < 0.3) {
      return { keyCode: KEY_SPACE };
    }
    
    // Position ourselves below enemy for better shots
    const targetX = nearestEnemy.x;
    const targetY = nearestEnemy.y + 100;
    
    const dx = targetX - player.x;
    const dy = targetY - player.y;
    
    if (Math.abs(dx) > 20) {
      return dx > 0 ? { keyCode: KEY_RIGHT } : { keyCode: KEY_LEFT };
    } else if (Math.abs(dy) > 20) {
      return dy > 0 ? { keyCode: KEY_DOWN } : { keyCode: KEY_UP };
    } else {
      return { keyCode: KEY_SPACE };
    }
  }
  
  // Default: move to safe position in center-bottom
  const safePosX = 300;
  const safePosY = 330;
  
  const dx = safePosX - player.x;
  const dy = safePosY - player.y;
  
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? { keyCode: KEY_RIGHT } : { keyCode: KEY_LEFT };
  } else {
    return dy > 0 ? { keyCode: KEY_DOWN } : { keyCode: KEY_UP };
  }
}

function getBasicTestAction(gameState) {
  if (!gameState.player) return null;
  
  const player = gameState.player;
  
  // Simple circular movement pattern
  const centerX = 300;
  const centerY = 330;
  const radius = 80;
  const angle = gameState.frameCount * 0.03;
  
  const targetX = centerX + Math.cos(angle) * radius;
  const targetY = centerY + Math.sin(angle) * radius;
  
  const dx = targetX - player.x;
  const dy = targetY - player.y;
  
  // Use shield if many projectiles nearby
  const nearbyProjectiles = gameState.enemyProjectiles.filter(proj => {
    const pdx = proj.x - player.x;
    const pdy = proj.y - player.y;
    return Math.sqrt(pdx * pdx + pdy * pdy) < 60;
  });
  
  if (nearbyProjectiles.length > 5 && player.shieldCooldown === 0) {
    return { keyCode: KEY_SHIFT };
  }
  
  // Shoot occasionally
  if (Math.random() < 0.1) {
    return { keyCode: KEY_SPACE };
  }
  
  // Move in pattern
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? { keyCode: KEY_RIGHT } : { keyCode: KEY_LEFT };
  } else {
    return dy > 0 ? { keyCode: KEY_DOWN } : { keyCode: KEY_UP };
  }
}

export function get_automated_testing_action(gameState) {
  if (!gameState || gameState.gamePhase !== "PLAYING") {
    return null;
  }
  
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return null;
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}