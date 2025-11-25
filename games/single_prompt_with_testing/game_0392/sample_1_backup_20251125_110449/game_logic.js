// game_logic.js - Core game logic and spawning

import {
  gameState,
  PLAY_AREA_LEFT,
  PLAY_AREA_RIGHT,
  PLAY_AREA_TOP,
  PLAY_AREA_BOTTOM,
  randomRange,
  randomInt,
  randomChoice
} from './globals.js';

import { Enemy, Boss } from './entities.js';

export function updateGameLogic(p) {
  // Update spawn timer
  gameState.enemySpawnTimer++;
  
  // Spawn enemies
  if (!gameState.bossActive && gameState.enemySpawnTimer >= gameState.enemySpawnInterval) {
    spawnEnemy();
    gameState.enemySpawnTimer = 0;
    
    // Increase difficulty over time
    if (gameState.enemiesKilled > 20) {
      gameState.enemySpawnInterval = Math.max(30, 90 - gameState.enemiesKilled);
    }
  }
  
  // Check for boss spawn
  if (gameState.enemiesKilled >= gameState.requiredKills && !gameState.boss && !gameState.bossActive) {
    spawnBoss();
  }
  
  // Update stage progress
  gameState.stageProgress = Math.min(1.0, gameState.enemiesKilled / gameState.requiredKills);
}

export function spawnEnemy() {
  // Random spawn position at top of play area
  const x = randomRange(PLAY_AREA_LEFT + 30, PLAY_AREA_RIGHT - 30);
  const y = PLAY_AREA_TOP - 20;
  
  const enemy = new Enemy(x, y);
  enemy.health = 20 + Math.floor(gameState.enemiesKilled / 10) * 5;
  enemy.maxHealth = enemy.health;
  
  // Vary shoot interval
  enemy.shootInterval = randomInt(40, 80);
}

export function spawnBoss() {
  const x = PLAY_AREA_LEFT + (PLAY_AREA_RIGHT - PLAY_AREA_LEFT) / 2;
  const y = PLAY_AREA_TOP + 80;
  
  const boss = new Boss(x, y);
  gameState.boss = boss;
  gameState.bossActive = true;
}

export function updateEntities(p) {
  // Update player
  if (gameState.player) {
    gameState.player.update(p);
  }
  
  // Update enemies
  for (let i = gameState.enemies.length - 1; i >= 0; i--) {
    const enemy = gameState.enemies[i];
    enemy.update(p);
  }
  
  // Update boss
  if (gameState.boss) {
    gameState.boss.update(p);
  }
  
  // Update bullets
  for (let i = gameState.bullets.length - 1; i >= 0; i--) {
    const bullet = gameState.bullets[i];
    bullet.update(p);
  }
  
  // Update player bullets
  for (let i = gameState.playerBullets.length - 1; i >= 0; i--) {
    const bullet = gameState.playerBullets[i];
    bullet.update(p);
  }
  
  // Update collectibles
  for (let i = gameState.collectibles.length - 1; i >= 0; i--) {
    const item = gameState.collectibles[i];
    item.update(p);
  }
  
  // Update bentler items
  for (let i = gameState.bentlerItems.length - 1; i >= 0; i--) {
    const item = gameState.bentlerItems[i];
    item.update(p);
  }
  
  // Update UFOs
  for (let i = gameState.ufos.length - 1; i >= 0; i--) {
    const ufo = gameState.ufos[i];
    ufo.update(p);
  }
  
  // Update particles
  for (let i = gameState.particles.length - 1; i >= 0; i--) {
    const particle = gameState.particles[i];
    particle.update();
    if (particle.isDead()) {
      gameState.particles.splice(i, 1);
    }
  }
  
  // Update explosions
  for (let i = gameState.explosions.length - 1; i >= 0; i--) {
    const explosion = gameState.explosions[i];
    explosion.update();
    if (explosion.isDead()) {
      gameState.explosions.splice(i, 1);
    }
  }
}

export function renderEntities(p) {
  // Render enemies
  gameState.enemies.forEach(enemy => enemy.render(p));
  
  // Render boss
  if (gameState.boss) {
    gameState.boss.render(p);
  }
  
  // Render bullets
  gameState.bullets.forEach(bullet => bullet.render(p));
  
  // Render player bullets
  gameState.playerBullets.forEach(bullet => bullet.render(p));
  
  // Render collectibles
  gameState.collectibles.forEach(item => item.render(p));
  
  // Render bentler items
  gameState.bentlerItems.forEach(item => item.render(p));
  
  // Render UFOs
  gameState.ufos.forEach(ufo => ufo.render(p));
  
  // Render player
  if (gameState.player) {
    gameState.player.render(p);
  }
  
  // Render particles
  gameState.particles.forEach(particle => particle.render(p));
  
  // Render explosions
  gameState.explosions.forEach(explosion => explosion.render(p));
}