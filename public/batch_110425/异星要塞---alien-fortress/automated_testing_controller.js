// automated_testing_controller.js - Automated testing functions

import { gameState } from './globals.js';

// Track previous positions to detect stalling
let positionHistory = [];
const HISTORY_SIZE = 30;

function updatePositionHistory() {
  if (!gameState.player) return;
  
  positionHistory.push({ x: gameState.player.x, y: gameState.player.y });
  if (positionHistory.length > HISTORY_SIZE) {
    positionHistory.shift();
  }
}

function isStalling() {
  if (positionHistory.length < HISTORY_SIZE) return false;
  
  const recent = positionHistory[positionHistory.length - 1];
  let totalDist = 0;
  
  for (let i = positionHistory.length - HISTORY_SIZE; i < positionHistory.length - 1; i++) {
    const dx = positionHistory[i + 1].x - positionHistory[i].x;
    const dy = positionHistory[i + 1].y - positionHistory[i].y;
    totalDist += Math.sqrt(dx * dx + dy * dy);
  }
  
  return totalDist < 50; // Less than 50 pixels in 30 frames
}

function getTestMovementAction(gameState) {
  // Test basic movement in a circular pattern
  if (!gameState.player) return {};
  
  const centerX = 300;
  const centerY = 200;
  const radius = 80;
  const angle = (gameState.frameCount * 0.03) % (Math.PI * 2);
  
  const targetX = centerX + Math.cos(angle) * radius;
  const targetY = centerY + Math.sin(angle) * radius;
  
  const dx = targetX - gameState.player.x;
  const dy = targetY - gameState.player.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  const keys = {};
  
  if (dist > 5) {
    if (dx > 2) keys[39] = true; // Right
    if (dx < -2) keys[37] = true; // Left
    if (dy > 2) keys[40] = true; // Down
    if (dy < -2) keys[38] = true; // Up
  }
  
  return keys;
}

function getTestWinAction(gameState) {
  // Optimal strategy to win the game
  if (!gameState.player || gameState.player.isDead) return {};
  
  updatePositionHistory();
  
  const player = gameState.player;
  const keys = {};
  
  // Priority 1: Go to portal if active
  if (gameState.exitPortal && gameState.exitPortal.active) {
    const dx = gameState.exitPortal.x - player.x;
    const dy = gameState.exitPortal.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 10) {
      if (dx > 2) keys[39] = true;
      if (dx < -2) keys[37] = true;
      if (dy > 2) keys[40] = true;
      if (dy < -2) keys[38] = true;
    }
    
    return keys;
  }
  
  // Priority 2: Dodge enemy bullets
  let nearestBulletDist = 1000;
  let nearestBullet = null;
  
  for (let bullet of gameState.enemyBullets) {
    const dist = Math.sqrt(
      Math.pow(bullet.x - player.x, 2) + 
      Math.pow(bullet.y - player.y, 2)
    );
    
    if (dist < nearestBulletDist) {
      nearestBulletDist = dist;
      nearestBullet = bullet;
    }
  }
  
  if (nearestBullet && nearestBulletDist < 80) {
    // Evade perpendicular to bullet direction
    const bulletDx = nearestBullet.vx;
    const bulletDy = nearestBullet.vy;
    
    // Perpendicular vector
    const evadeX = -bulletDy;
    const evadeY = bulletDx;
    
    if (evadeX > 0.1) keys[39] = true;
    if (evadeX < -0.1) keys[37] = true;
    if (evadeY > 0.1) keys[40] = true;
    if (evadeY < -0.1) keys[38] = true;
    
    // Use dash if very close
    if (nearestBulletDist < 40) {
      keys[32] = true;
    }
    
    return keys;
  }
  
  // Priority 3: Collect nearby pickups
  let nearestPickupDist = 150;
  let nearestPickup = null;
  
  for (let pickup of gameState.pickups) {
    const dist = Math.sqrt(
      Math.pow(pickup.x - player.x, 2) + 
      Math.pow(pickup.y - player.y, 2)
    );
    
    if (dist < nearestPickupDist) {
      nearestPickupDist = dist;
      nearestPickup = pickup;
    }
  }
  
  if (nearestPickup) {
    const dx = nearestPickup.x - player.x;
    const dy = nearestPickup.y - player.y;
    
    if (dx > 2) keys[39] = true;
    if (dx < -2) keys[37] = true;
    if (dy > 2) keys[40] = true;
    if (dy < -2) keys[38] = true;
    
    return keys;
  }
  
  // Priority 4: Position for optimal combat
  // Stay at medium range from enemies, kiting
  if (gameState.enemies.length > 0) {
    let avgEnemyX = 0;
    let avgEnemyY = 0;
    let enemyCount = 0;
    
    for (let enemy of gameState.enemies) {
      if (!enemy.isDead) {
        avgEnemyX += enemy.x;
        avgEnemyY += enemy.y;
        enemyCount++;
      }
    }
    
    if (enemyCount > 0) {
      avgEnemyX /= enemyCount;
      avgEnemyY /= enemyCount;
      
      const dx = avgEnemyX - player.x;
      const dy = avgEnemyY - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      const optimalRange = 150;
      
      if (dist < optimalRange - 20) {
        // Too close, back away
        if (dx > 0) keys[37] = true;
        else keys[39] = true;
        if (dy > 0) keys[38] = true;
        else keys[40] = true;
      } else if (dist > optimalRange + 20) {
        // Too far, move closer
        if (dx > 0) keys[39] = true;
        else keys[37] = true;
        if (dy > 0) keys[40] = true;
        else keys[38] = true;
      } else {
        // Circle strafe
        const strafeAngle = Math.atan2(dy, dx) + Math.PI / 2;
        const strafeX = Math.cos(strafeAngle);
        const strafeY = Math.sin(strafeAngle);
        
        if (strafeX > 0.3) keys[39] = true;
        if (strafeX < -0.3) keys[37] = true;
        if (strafeY > 0.3) keys[40] = true;
        if (strafeY < -0.3) keys[38] = true;
      }
    }
  }
  
  // Use shield if health is low
  if (player.health < 40 && gameState.shieldCharges > 0) {
    keys[16] = true;
  }
  
  // Avoid staying still
  if (isStalling()) {
    const randomAngle = Math.random() * Math.PI * 2;
    if (Math.cos(randomAngle) > 0) keys[39] = true;
    else keys[37] = true;
    if (Math.sin(randomAngle) > 0) keys[40] = true;
    else keys[38] = true;
  }
  
  return keys;
}

function getTestDefenseAction(gameState) {
  // Test defensive abilities
  if (!gameState.player) return {};
  
  const player = gameState.player;
  const keys = {};
  
  // Cycle through abilities
  const cycle = Math.floor(gameState.frameCount / 60) % 4;
  
  if (cycle === 0) {
    // Test dash
    keys[32] = true;
    keys[39] = true; // Move right while dashing
  } else if (cycle === 1) {
    // Test shield
    keys[16] = true;
  } else {
    // Regular movement
    keys[38] = true;
  }
  
  return keys;
}

function getTestCollectionAction(gameState) {
  // Focus on collecting pickups
  if (!gameState.player) return {};
  
  const player = gameState.player;
  const keys = {};
  
  // Find nearest pickup
  let nearestDist = 1000;
  let nearestPickup = null;
  
  for (let pickup of gameState.pickups) {
    const dist = Math.sqrt(
      Math.pow(pickup.x - player.x, 2) + 
      Math.pow(pickup.y - player.y, 2)
    );
    
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestPickup = pickup;
    }
  }
  
  if (nearestPickup) {
    const dx = nearestPickup.x - player.x;
    const dy = nearestPickup.y - player.y;
    
    if (dx > 2) keys[39] = true;
    if (dx < -2) keys[37] = true;
    if (dy > 2) keys[40] = true;
    if (dy < -2) keys[38] = true;
  } else {
    // Move around to generate more enemies/pickups
    keys[39] = true;
  }
  
  return keys;
}

function getRandomAction(gameState) {
  const keys = {};
  
  if (Math.random() < 0.3) keys[37] = true;
  if (Math.random() < 0.3) keys[39] = true;
  if (Math.random() < 0.3) keys[38] = true;
  if (Math.random() < 0.3) keys[40] = true;
  if (Math.random() < 0.1) keys[32] = true;
  
  return keys;
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestMovementAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestDefenseAction(gameState);
    case "TEST_4":
      return getTestCollectionAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;