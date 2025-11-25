// game_logic.js - Core game logic

import { 
  gameState,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  WEAPONS,
  CANVAS_WIDTH
} from './globals.js';
import { Tank } from './tank.js';
import { Terrain } from './terrain.js';
import { Projectile } from './projectile.js';
import { EnemyAI } from './ai.js';
import { clamp } from './utils.js';
import { updateParticles } from './particles.js';

let enemyAIs = [];

export function initGame(p) {
  // Reset game state
  gameState.score = 0;
  gameState.currentTurn = 'player';
  gameState.projectiles = [];
  gameState.particles = [];
  gameState.entities = [];
  gameState.playerAngle = 45;
  gameState.playerPower = 50;
  gameState.currentWeaponIndex = 0;
  gameState.unlockedWeapons = [WEAPONS[0].name];
  gameState.turnTimer = 0;
  gameState.cameraShake = 0;
  gameState.shotsThisTurn = 0;
  
  // Generate wind
  gameState.windSpeed = p.random(0.3, 1.0);
  gameState.windDirection = p.random() > 0.5 ? 1 : -1;
  
  // Create terrain
  gameState.terrain = new Terrain(p);
  
  // Create player tank
  const playerX = 80;
  gameState.player = new Tank(p, playerX, gameState.terrain, true);
  gameState.entities.push(gameState.player);
  
  // Create enemy tanks
  gameState.enemies = [];
  enemyAIs = [];
  const enemyCount = 3;
  
  for (let i = 0; i < enemyCount; i++) {
    const enemyX = 200 + i * 150;
    const enemy = new Tank(p, enemyX, gameState.terrain, false);
    gameState.enemies.push(enemy);
    gameState.entities.push(enemy);
    enemyAIs.push(new EnemyAI(p, enemy));
  }
  
  gameState.gamePhase = PHASE_PLAYING;
  
  // Log game start
  p.logs.game_info.push({
    data: { phase: PHASE_PLAYING, message: "Game started" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function updateGame(p) {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  // Update camera shake
  if (gameState.cameraShake > 0) {
    gameState.cameraShake *= 0.9;
    if (gameState.cameraShake < 0.1) gameState.cameraShake = 0;
  }
  
  // Update tanks
  if (gameState.player) {
    gameState.player.update();
  }
  for (let enemy of gameState.enemies) {
    enemy.update();
  }
  
  // Update projectiles
  for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
    gameState.projectiles[i].update();
    if (!gameState.projectiles[i].alive) {
      gameState.projectiles.splice(i, 1);
    }
  }
  
  // Update particles
  updateParticles(gameState);
  
  // Check for turn transitions
  if (gameState.projectiles.length === 0 && gameState.shotsThisTurn > 0) {
    gameState.turnTimer++;
    
    if (gameState.turnTimer > 60) { // 1 second delay after projectiles clear
      switchTurn();
    }
  }
  
  // Handle enemy turns
  if (gameState.currentTurn !== 'player') {
    const enemyIndex = gameState.currentTurn;
    if (enemyIndex >= 0 && enemyIndex < enemyAIs.length) {
      const ai = enemyAIs[enemyIndex];
      const turnComplete = ai.update();
      
      if (turnComplete) {
        gameState.shotsThisTurn = 1;
      }
    }
  }
  
  // Check win/lose conditions
  checkGameOver(p);
  
  // Check weapon unlocks
  checkWeaponUnlocks();
  
  // Log player info periodically
  if (p.frameCount % 30 === 0 && gameState.player) {
    p.logs.player_info.push({
      screen_x: gameState.player.x,
      screen_y: gameState.player.y,
      game_x: gameState.player.x,
      game_y: gameState.player.y,
      framecount: p.frameCount
    });
  }
}

function switchTurn() {
  gameState.turnTimer = 0;
  gameState.shotsThisTurn = 0;
  
  if (gameState.currentTurn === 'player') {
    // Switch to first alive enemy
    for (let i = 0; i < gameState.enemies.length; i++) {
      if (gameState.enemies[i].alive) {
        gameState.currentTurn = i;
        enemyAIs[i].reset();
        return;
      }
    }
    // No alive enemies, player turn again
    gameState.currentTurn = 'player';
  } else {
    // Find next alive enemy
    let nextEnemy = gameState.currentTurn + 1;
    while (nextEnemy < gameState.enemies.length) {
      if (gameState.enemies[nextEnemy].alive) {
        gameState.currentTurn = nextEnemy;
        enemyAIs[nextEnemy].reset();
        return;
      }
      nextEnemy++;
    }
    // No more enemies, back to player
    gameState.currentTurn = 'player';
  }
}

function checkGameOver(p) {
  // Check if player is dead
  if (!gameState.player.alive) {
    gameState.gamePhase = PHASE_GAME_OVER_LOSE;
    p.logs.game_info.push({
      data: { phase: PHASE_GAME_OVER_LOSE, message: "Player defeated" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  // Check if all enemies are dead
  const aliveEnemies = gameState.enemies.filter(e => e.alive).length;
  if (aliveEnemies === 0) {
    gameState.gamePhase = PHASE_GAME_OVER_WIN;
    p.logs.game_info.push({
      data: { phase: PHASE_GAME_OVER_WIN, message: "Player victory" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function checkWeaponUnlocks() {
  for (let weapon of WEAPONS) {
    if (gameState.score >= weapon.unlockScore && 
        !gameState.unlockedWeapons.includes(weapon.name)) {
      gameState.unlockedWeapons.push(weapon.name);
    }
  }
}

export function handlePlayerInput(p, keyCode) {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  if (gameState.currentTurn !== 'player') return;
  
  // Angle adjustment
  if (keyCode === 37) { // Left arrow
    gameState.playerAngle = clamp(gameState.playerAngle + 2, 0, 180);
    gameState.player.angle = gameState.playerAngle;
  } else if (keyCode === 39) { // Right arrow
    gameState.playerAngle = clamp(gameState.playerAngle - 2, 0, 180);
    gameState.player.angle = gameState.playerAngle;
  }
  
  // Power adjustment
  if (keyCode === 38) { // Up arrow
    gameState.playerPower = clamp(gameState.playerPower + 2, 0, 100);
  } else if (keyCode === 40) { // Down arrow
    gameState.playerPower = clamp(gameState.playerPower - 2, 0, 100);
  }
  
  // Fire
  if (keyCode === 32 && gameState.shotsThisTurn === 0) { // Space
    firePlayerShot(p);
  }
  
  // Switch weapon
  if (keyCode === 90) { // Z
    gameState.currentWeaponIndex = (gameState.currentWeaponIndex + 1) % 
                                    gameState.unlockedWeapons.length;
  }
}

function firePlayerShot(p) {
  const weaponName = gameState.unlockedWeapons[gameState.currentWeaponIndex];
  const weapon = WEAPONS.find(w => w.name === weaponName);
  
  const turretEnd = gameState.player.getTurretEnd();
  const projectile = new Projectile(
    p,
    turretEnd.x,
    turretEnd.y,
    gameState.playerAngle,
    gameState.playerPower,
    weapon,
    gameState.windSpeed,
    gameState.windDirection
  );
  
  gameState.projectiles.push(projectile);
  gameState.shotsThisTurn = 1;
}