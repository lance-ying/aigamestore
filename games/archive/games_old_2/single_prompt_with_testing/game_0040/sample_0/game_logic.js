// game_logic.js - Core game logic

import { 
  gameState, 
  PHASE_START, 
  PHASE_PLAYING, 
  PHASE_PAUSED,
  PHASE_GAME_OVER_LOSE,
  CANVAS_WIDTH,
  CANVAS_HEIGHT
} from './globals.js';
import { Enemy, Projectile, Arrow, ExplosionEffect } from './entities.js';

export function initGame(p) {
  gameState.entities = [];
  gameState.enemies = [];
  gameState.projectiles = [];
  gameState.effects = [];
  gameState.upgrades = {
    castleHealth: 100,
    maxCastleHealth: 100,
    projectileDamage: 10,
    volleyDamage: 8,
    bomberDamage: 30
  };
  gameState.resources = 0;
  gameState.score = 0;
  gameState.wave = 0;
  gameState.cursor = { x: 300, y: 200 };
  gameState.bomberActive = false;
  gameState.bomberX = -50;
  gameState.bomberY = 100;
  gameState.bomberReadyToDetonate = false;
  gameState.nextWaveTimer = 0;
  gameState.enemySpawnTimer = 0;
  gameState.enemiesThisWave = 0;
  gameState.enemiesSpawnedThisWave = 0;
  gameState.waveComplete = false;
  gameState.lastVolleyTime = 0;
  gameState.lastBomberTime = 0;

  startNewWave(p);
}

export function startNewWave(p) {
  gameState.wave++;
  gameState.enemiesThisWave = 5 + gameState.wave * 2;
  gameState.enemiesSpawnedThisWave = 0;
  gameState.waveComplete = false;
  gameState.enemySpawnTimer = 0;

  p.logs.game_info.push({
    data: { message: "Wave started", wave: gameState.wave },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function updateGame(p) {
  // Update cursor position based on control mode
  if (gameState.controlMode === "HUMAN") {
    updateCursorHuman(p);
  }

  // Spawn enemies
  gameState.enemySpawnTimer++;
  const spawnInterval = Math.max(60 - gameState.wave * 2, 30);
  if (gameState.enemySpawnTimer >= spawnInterval && 
      gameState.enemiesSpawnedThisWave < gameState.enemiesThisWave) {
    spawnEnemy(p);
    gameState.enemySpawnTimer = 0;
  }

  // Update bomber
  if (gameState.bomberActive) {
    gameState.bomberX += 3;
    if (gameState.bomberX > CANVAS_WIDTH + 50) {
      gameState.bomberActive = false;
      gameState.bomberReadyToDetonate = false;
    }
  }

  // Update all entities
  for (const enemy of gameState.enemies) {
    enemy.update();
  }

  for (const projectile of gameState.projectiles) {
    projectile.update();
  }

  for (const effect of gameState.effects) {
    effect.update();
  }

  // Clean up dead entities
  gameState.enemies = gameState.enemies.filter(e => !e.isDead || e.deathTimer < 30);
  gameState.projectiles = gameState.projectiles.filter(p => !p.isDead);
  gameState.effects = gameState.effects.filter(e => !e.isDead());

  // Check wave completion
  if (gameState.enemiesSpawnedThisWave >= gameState.enemiesThisWave && 
      gameState.enemies.length === 0) {
    gameState.waveComplete = true;
    gameState.nextWaveTimer++;
    if (gameState.nextWaveTimer >= 120) { // 2 seconds at 60 FPS
      startNewWave(p);
      gameState.nextWaveTimer = 0;
    }
  }

  // Check game over
  if (gameState.upgrades.castleHealth <= 0) {
    gameState.gamePhase = PHASE_GAME_OVER_LOSE;
    p.logs.game_info.push({
      data: { message: "Game Over", reason: "Castle destroyed", wave: gameState.wave },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function updateCursorHuman(p) {
  if (p.keyIsDown(37)) gameState.cursor.x -= gameState.cursorSpeed; // LEFT
  if (p.keyIsDown(39)) gameState.cursor.x += gameState.cursorSpeed; // RIGHT
  if (p.keyIsDown(38)) gameState.cursor.y -= gameState.cursorSpeed; // UP
  if (p.keyIsDown(40)) gameState.cursor.y += gameState.cursorSpeed; // DOWN

  // Clamp cursor
  gameState.cursor.x = Math.max(0, Math.min(CANVAS_WIDTH, gameState.cursor.x));
  gameState.cursor.y = Math.max(0, Math.min(CANVAS_HEIGHT, gameState.cursor.y));
}

function spawnEnemy(p) {
  const y = p.random(80, CANVAS_HEIGHT - 80);
  const enemy = new Enemy(p, CANVAS_WIDTH + 20, y, gameState.wave);
  gameState.enemies.push(enemy);
  gameState.entities.push(enemy);
  gameState.enemiesSpawnedThisWave++;
}

export function fireProjectile(p) {
  const projectile = new Projectile(
    p,
    gameState.castleX + 30,
    gameState.castleY,
    gameState.cursor.x,
    gameState.cursor.y,
    gameState.upgrades.projectileDamage
  );
  gameState.projectiles.push(projectile);
  gameState.entities.push(projectile);
}

export function fireVolley(p) {
  const currentTime = Date.now();
  if (currentTime - gameState.lastVolleyTime < gameState.volleyCooldown) {
    return; // Still on cooldown
  }

  gameState.lastVolleyTime = currentTime;

  for (let i = 0; i < 8; i++) {
    const targetY = 50 + (CANVAS_HEIGHT - 100) * (i / 7);
    const arrow = new Arrow(
      p,
      gameState.castleX + 30,
      gameState.castleY - 20,
      targetY,
      gameState.upgrades.volleyDamage
    );
    gameState.projectiles.push(arrow);
    gameState.entities.push(arrow);
  }
}

export function deployBomber(p) {
  const currentTime = Date.now();
  
  if (!gameState.bomberActive) {
    // Deploy new bomber
    if (currentTime - gameState.lastBomberTime < gameState.bomberCooldown) {
      return; // Still on cooldown
    }
    
    gameState.lastBomberTime = currentTime;
    gameState.bomberActive = true;
    gameState.bomberX = -50;
    gameState.bomberY = 80;
    gameState.bomberReadyToDetonate = false;
  } else if (!gameState.bomberReadyToDetonate) {
    // Mark ready to detonate
    gameState.bomberReadyToDetonate = true;
  } else {
    // Detonate
    detonateBomber(p);
  }
}

function detonateBomber(p) {
  const explosionRadius = 80;
  const effect = new ExplosionEffect(p, gameState.bomberX, gameState.bomberY, explosionRadius);
  gameState.effects.push(effect);

  // Damage all enemies in range
  for (const enemy of gameState.enemies) {
    if (enemy.isDead) continue;
    const dist = Math.sqrt(
      (enemy.x - gameState.bomberX) ** 2 + 
      (enemy.y - gameState.bomberY) ** 2
    );
    if (dist < explosionRadius) {
      enemy.takeDamage(gameState.upgrades.bomberDamage);
    }
  }

  gameState.bomberActive = false;
  gameState.bomberReadyToDetonate = false;
}

export function tryUpgrade(upgradeType) {
  const costs = {
    health: 50,
    damage: 30,
    volley: 40,
    bomber: 60
  };

  const cost = costs[upgradeType];
  if (gameState.resources < cost) return false;

  gameState.resources -= cost;

  switch (upgradeType) {
    case 'health':
      gameState.upgrades.maxCastleHealth += 20;
      gameState.upgrades.castleHealth = Math.min(
        gameState.upgrades.castleHealth + 30,
        gameState.upgrades.maxCastleHealth
      );
      break;
    case 'damage':
      gameState.upgrades.projectileDamage += 5;
      break;
    case 'volley':
      gameState.upgrades.volleyDamage += 3;
      break;
    case 'bomber':
      gameState.upgrades.bomberDamage += 10;
      break;
  }

  return true;
}