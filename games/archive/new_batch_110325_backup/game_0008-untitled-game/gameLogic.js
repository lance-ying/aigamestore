// gameLogic.js - Core game logic

import {
  gameState,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PRIMARY_TARGETS_COUNT,
  GUARDS_COUNT,
  EXPLOSIVE_BARRELS_COUNT,
  WEAPON_CLIP_SIZE,
  WEAPON_RELOAD_TIME,
  WEAPON_DAMAGE,
  SCORE_PRIMARY_TARGET,
  SCORE_GUARD,
  SCORE_ENVIRONMENTAL_KILL,
  SCORE_HEADSHOT_BONUS,
  SCORE_STEALTH_MULTIPLIER,
  ALERT_THRESHOLD_HIGH,
  ZOOM_NORMAL,
  ZOOM_2X,
  ZOOM_4X,
  MISSION_TIME_LIMIT,
  FPS
} from './globals.js';

import { Crosshair } from './crosshair.js';
import { Target } from './target.js';
import { ExplosiveBarrel } from './explosive.js';
import { Bullet } from './bullet.js';
import { Effect } from './effect.js';

export function initializeGame(p) {
  // Reset game state
  gameState.gamePhase = PHASE_PLAYING;
  gameState.missionTimer = MISSION_TIME_LIMIT * FPS;
  gameState.score = 0;
  gameState.multiplier = 1;
  gameState.alertLevel = 0;
  gameState.currentAmmo = WEAPON_CLIP_SIZE;
  gameState.isReloading = false;
  gameState.reloadTimer = 0;
  gameState.zoomLevel = ZOOM_NORMAL;
  gameState.targetsEliminated = 0;
  gameState.guardsEliminated = 0;
  gameState.environmentalKills = 0;
  gameState.headshotCount = 0;
  gameState.shotsAttempted = 0;
  
  // Clear arrays
  gameState.primaryTargets = [];
  gameState.guards = [];
  gameState.explosiveBarrels = [];
  gameState.bullets = [];
  gameState.effects = [];
  
  // Initialize crosshair
  gameState.crosshair = new Crosshair(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  // Spawn primary targets
  const targetPositions = [
    { x: 110, y: 300 },
    { x: 300, y: 280 },
    { x: 490, y: 310 }
  ];
  
  for (let i = 0; i < PRIMARY_TARGETS_COUNT; i++) {
    const pos = targetPositions[i];
    gameState.primaryTargets.push(new Target(pos.x, pos.y, true));
  }
  
  // Spawn guards
  const guardPositions = [
    { x: 80, y: 340 },
    { x: 150, y: 320 },
    { x: 260, y: 330 },
    { x: 370, y: 320 },
    { x: 520, y: 340 }
  ];
  
  for (let i = 0; i < GUARDS_COUNT; i++) {
    const pos = guardPositions[i];
    gameState.guards.push(new Target(pos.x, pos.y, false));
  }
  
  // Spawn explosive barrels
  const barrelPositions = [
    { x: 130, y: 280 },
    { x: 350, y: 270 },
    { x: 470, y: 285 }
  ];
  
  for (let i = 0; i < EXPLOSIVE_BARRELS_COUNT; i++) {
    const pos = barrelPositions[i];
    gameState.explosiveBarrels.push(new ExplosiveBarrel(pos.x, pos.y));
  }
  
  // Log game start
  p.logs.game_info.push({
    data: { phase: PHASE_PLAYING, message: "Mission started" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function updateGame(p) {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  // Update timer
  gameState.missionTimer--;
  if (gameState.missionTimer <= 0) {
    endGame(p, false, "Time expired");
    return;
  }
  
  // Check win condition
  const primaryTargetsAlive = gameState.primaryTargets.filter(t => t.alive).length;
  if (primaryTargetsAlive === 0) {
    endGame(p, true, "All targets eliminated");
    return;
  }
  
  // Check detection
  if (gameState.alertLevel >= ALERT_THRESHOLD_HIGH) {
    endGame(p, false, "Detected by guards");
    return;
  }
  
  // Update crosshair
  gameState.crosshair.update(gameState.keys, gameState.zoomLevel);
  
  // Update reload
  if (gameState.isReloading) {
    gameState.reloadTimer++;
    if (gameState.reloadTimer >= WEAPON_RELOAD_TIME) {
      gameState.currentAmmo = WEAPON_CLIP_SIZE;
      gameState.isReloading = false;
      gameState.reloadTimer = 0;
    }
  }
  
  // Update targets
  for (let target of gameState.primaryTargets) {
    target.update();
  }
  for (let guard of gameState.guards) {
    guard.update();
  }
  
  // Update barrels
  for (let barrel of gameState.explosiveBarrels) {
    barrel.update();
  }
  
  // Update bullets
  for (let bullet of gameState.bullets) {
    bullet.update();
    
    if (bullet.active && bullet.traveledDistance >= bullet.maxDistance - 5) {
      // Check hits
      checkBulletHit(p, bullet);
    }
  }
  
  // Remove inactive bullets
  gameState.bullets = gameState.bullets.filter(b => b.active);
  
  // Update effects
  for (let effect of gameState.effects) {
    effect.update();
  }
  
  // Remove inactive effects
  gameState.effects = gameState.effects.filter(e => e.active);
  
  // Decay alert level
  if (gameState.alertLevel > 0) {
    gameState.alertLevel = Math.max(0, gameState.alertLevel - 0.1);
  }
  
  // Update multiplier based on alert level
  if (gameState.alertLevel < 20) {
    gameState.multiplier = SCORE_STEALTH_MULTIPLIER;
  } else {
    gameState.multiplier = 1;
  }
  
  // Log player position periodically
  if (p.frameCount % 30 === 0) {
    p.logs.player_info.push({
      screen_x: gameState.crosshair.x,
      screen_y: gameState.crosshair.y,
      game_x: gameState.crosshair.x,
      game_y: gameState.crosshair.y,
      framecount: p.frameCount
    });
  }
}

function checkBulletHit(p, bullet) {
  const x = bullet.targetX;
  const y = bullet.targetY;
  
  let hitSomething = false;
  let isHeadshot = false;
  
  // Check primary targets
  for (let target of gameState.primaryTargets) {
    if (!target.alive) continue;
    
    if (target.isHeadshot(x, y)) {
      isHeadshot = true;
      if (target.takeDamage(WEAPON_DAMAGE, true)) {
        gameState.targetsEliminated++;
        gameState.headshotCount++;
        gameState.score += (SCORE_PRIMARY_TARGET + SCORE_HEADSHOT_BONUS) * gameState.multiplier;
        gameState.effects.push(new Effect(target.x, target.y - 30, "impact"));
        hitSomething = true;
      }
      break;
    } else if (target.isBodyshot(x, y)) {
      if (target.takeDamage(WEAPON_DAMAGE, false)) {
        gameState.targetsEliminated++;
        gameState.score += SCORE_PRIMARY_TARGET * gameState.multiplier;
        gameState.effects.push(new Effect(target.x, target.y, "impact"));
        hitSomething = true;
        // Body shot increases alert
        increaseAlert(10);
      }
      break;
    }
  }
  
  // Check guards
  if (!hitSomething) {
    for (let guard of gameState.guards) {
      if (!guard.alive) continue;
      
      if (guard.isHeadshot(x, y)) {
        isHeadshot = true;
        if (guard.takeDamage(WEAPON_DAMAGE, true)) {
          gameState.guardsEliminated++;
          gameState.headshotCount++;
          gameState.score += (SCORE_GUARD + SCORE_HEADSHOT_BONUS) * gameState.multiplier;
          gameState.effects.push(new Effect(guard.x, guard.y - 30, "impact"));
          hitSomething = true;
        }
        break;
      } else if (guard.isBodyshot(x, y)) {
        if (guard.takeDamage(WEAPON_DAMAGE, false)) {
          gameState.guardsEliminated++;
          gameState.score += SCORE_GUARD * gameState.multiplier;
          gameState.effects.push(new Effect(guard.x, guard.y, "impact"));
          hitSomething = true;
          increaseAlert(15);
        }
        break;
      }
    }
  }
  
  // Check explosive barrels
  if (!hitSomething) {
    for (let barrel of gameState.explosiveBarrels) {
      if (barrel.isHit(x, y)) {
        if (barrel.explode()) {
          gameState.effects.push(new Effect(barrel.x, barrel.y, "explosion"));
          hitSomething = true;
          
          // Check for targets in blast radius
          let targetsHit = 0;
          
          for (let target of gameState.primaryTargets) {
            if (!target.alive) continue;
            const dist = Math.sqrt((target.x - barrel.x) ** 2 + (target.y - barrel.y) ** 2);
            if (dist <= barrel.blastRadius) {
              if (target.takeDamage(WEAPON_DAMAGE, false)) {
                gameState.targetsEliminated++;
                gameState.environmentalKills++;
                targetsHit++;
              }
            }
          }
          
          for (let guard of gameState.guards) {
            if (!guard.alive) continue;
            const dist = Math.sqrt((guard.x - barrel.x) ** 2 + (guard.y - barrel.y) ** 2);
            if (dist <= barrel.blastRadius) {
              if (guard.takeDamage(WEAPON_DAMAGE, false)) {
                gameState.guardsEliminated++;
                gameState.environmentalKills++;
                targetsHit++;
              }
            }
          }
          
          if (targetsHit > 0) {
            gameState.score += targetsHit * SCORE_ENVIRONMENTAL_KILL * gameState.multiplier;
          }
        }
        break;
      }
    }
  }
  
  // If missed, increase alert
  if (!hitSomething) {
    // Check if near any guard
    let nearGuard = false;
    for (let guard of gameState.guards) {
      if (!guard.alive) continue;
      const dist = Math.sqrt((guard.x - x) ** 2 + (guard.y - y) ** 2);
      if (dist < 50) {
        nearGuard = true;
        guard.alert();
        break;
      }
    }
    
    if (nearGuard) {
      increaseAlert(25);
    } else {
      increaseAlert(5);
    }
  }
}

function increaseAlert(amount) {
  gameState.alertLevel = Math.min(ALERT_THRESHOLD_HIGH, gameState.alertLevel + amount);
}

export function fireWeapon(p) {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  if (gameState.isReloading) return;
  if (gameState.currentAmmo <= 0) return;
  
  gameState.currentAmmo--;
  gameState.shotsAttempted++;
  
  // Create bullet
  const bullet = new Bullet(
    gameState.crosshair.x,
    gameState.crosshair.y,
    gameState.crosshair.x,
    gameState.crosshair.y
  );
  gameState.bullets.push(bullet);
  
  // Auto-reload if empty
  if (gameState.currentAmmo === 0) {
    startReload();
  }
}

export function startReload() {
  if (gameState.isReloading) return;
  if (gameState.currentAmmo >= WEAPON_CLIP_SIZE) return;
  
  gameState.isReloading = true;
  gameState.reloadTimer = 0;
}

export function toggleZoom() {
  if (gameState.zoomLevel === ZOOM_NORMAL) {
    gameState.zoomLevel = ZOOM_2X;
  } else if (gameState.zoomLevel === ZOOM_2X) {
    gameState.zoomLevel = ZOOM_4X;
  } else {
    gameState.zoomLevel = ZOOM_NORMAL;
  }
}

function endGame(p, isWin, reason) {
  gameState.gamePhase = isWin ? PHASE_GAME_OVER_WIN : PHASE_GAME_OVER_LOSE;
  
  p.logs.game_info.push({
    data: { 
      phase: gameState.gamePhase, 
      message: reason,
      score: gameState.score,
      targetsEliminated: gameState.targetsEliminated
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function resetGame() {
  gameState.gamePhase = PHASE_START;
  gameState.controlMode = "HUMAN";
}