// input.js - Input handling
import { gameState, KEY_SPACE, KEY_SHIFT, KEY_Z, KEY_LEFT, KEY_UP, KEY_RIGHT, KEY_DOWN } from './globals.js';
import { fireBolt } from './shooting.js';

export function handleGameplayInput(p) {
  // Check aim direction
  if (p.keyIsDown(KEY_UP)) {
    gameState.aimDirection = 0;
  } else if (p.keyIsDown(KEY_RIGHT)) {
    gameState.aimDirection = 1;
  } else if (p.keyIsDown(KEY_DOWN)) {
    gameState.aimDirection = 2;
  } else if (p.keyIsDown(KEY_LEFT)) {
    gameState.aimDirection = 3;
  }
  
  // Fire bolt
  if (p.keyIsDown(KEY_SPACE)) {
    fireBolt(p);
  }
  
  // Multi-shot power
  if (p.keyIsDown(KEY_SHIFT) && gameState.upgrades.multiShotUnlocked) {
    if (gameState.multiShotCooldown === 0) {
      activateMultiShot(p);
    }
  }
  
  // Shield power
  if (p.keyIsDown(KEY_Z) && gameState.upgrades.shieldUnlocked) {
    if (gameState.shieldCooldown === 0) {
      activateShield(p);
    }
  }
}

function activateMultiShot(p) {
  gameState.multiShotDuration = 180; // 3 seconds
  gameState.multiShotCooldown = 600; // 10 seconds
  
  p.logs.game_info.push({
    data: { event: 'multishot_activated' },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function activateShield(p) {
  gameState.shieldDuration = 300; // 5 seconds
  gameState.shieldCooldown = 900; // 15 seconds
  
  p.logs.game_info.push({
    data: { event: 'shield_activated' },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function updatePowerUps(p) {
  // Update durations and cooldowns
  if (gameState.multiShotDuration > 0) {
    gameState.multiShotDuration--;
  }
  if (gameState.multiShotCooldown > 0) {
    gameState.multiShotCooldown--;
  }
  
  if (gameState.shieldDuration > 0) {
    gameState.shieldDuration--;
  }
  if (gameState.shieldCooldown > 0) {
    gameState.shieldCooldown--;
  }
}