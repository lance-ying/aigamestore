// game_logic.js - Core game logic
import { gameState, GAME_PHASES } from './globals.js';
import { Player, Projectile } from './entities.js';
import { spawnWave, getWaveDuration, hasNextWave, hasNextLevel } from './waves.js';
import { checkCollisions } from './collision.js';
import { keys } from './input.js';
import { generateUpgradeOptions, generateShopItems } from './upgrades.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function initializeGame(p) {
  // Create player
  gameState.player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  gameState.entities = [gameState.player];
  
  // Reset game state
  gameState.score = 0;
  gameState.currentLevel = 1;
  gameState.currentWave = 1;
  gameState.materials = 0;
  gameState.enemies = [];
  gameState.projectiles = [];
  gameState.items = [];
  
  // Spawn first wave
  const enemies = spawnWave(p, gameState.currentLevel, gameState.currentWave);
  gameState.enemies = enemies;
  gameState.entities.push(...enemies);
  gameState.enemiesRemainingInWave = enemies.length;
  gameState.waveTimer = getWaveDuration(gameState.currentLevel, gameState.currentWave);
  
  // Log player info
  logPlayerInfo(p);
}

export function updateGame(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  const player = gameState.player;
  if (!player) return;
  
  // Update player
  player.update(p, keys);
  
  // Auto-attack
  if (player.attackCooldown <= 0) {
    const nearestEnemy = player.findNearestEnemy();
    if (nearestEnemy) {
      const dx = nearestEnemy.x - player.x;
      const dy = nearestEnemy.y - player.y;
      const dist = Math.hypot(dx, dy);
      
      if (dist > 0) {
        const speed = 5;
        const projectile = new Projectile(
          player.x,
          player.y,
          (dx / dist) * speed,
          (dy / dist) * speed,
          player.damageStat,
          'player',
          player.rangeStat
        );
        gameState.projectiles.push(projectile);
        
        // Reset attack cooldown based on attack speed
        player.attackCooldown = Math.floor(60 / player.attackSpeedStat);
      }
    }
  }
  
  // Update enemies
  for (const enemy of gameState.enemies) {
    enemy.update(p, player);
  }
  
  // Update projectiles
  for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
    const proj = gameState.projectiles[i];
    proj.update();
    
    if (proj.isOutOfRange() || proj.isOffScreen()) {
      gameState.projectiles.splice(i, 1);
    }
  }
  
  // Update items
  for (let i = gameState.items.length - 1; i >= 0; i--) {
    const item = gameState.items[i];
    item.update();
    
    if (item.isExpired()) {
      gameState.items.splice(i, 1);
    }
  }
  
  // Check collisions
  checkCollisions(p);
  
  // Check wave completion
  gameState.waveTimer--;
  
  if (gameState.enemiesRemainingInWave <= 0 || gameState.waveTimer <= 0) {
    gameState.score += 100; // Wave completion bonus
    
    const isLevelComplete = gameState.currentWave >= getMaxWaveForLevel(gameState.currentLevel);
    
    if (isLevelComplete) {
      gameState.score += 500; // Level completion bonus
      gameState.shopItems = generateShopItems(p);
    }
    
    gameState.selectedUpgradeIndex = 0;
    gameState.gamePhase = GAME_PHASES.WAVE_COMPLETE;
    
    p.logs.game_info.push({
      data: { 
        phase: 'WAVE_COMPLETE', 
        level: gameState.currentLevel, 
        wave: gameState.currentWave,
        score: gameState.score
      },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Check game over
  if (player.currentHP <= 0) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    import('./globals.js').then(module => {
      module.addHighScore(gameState.score);
    });
    
    p.logs.game_info.push({
      data: { phase: 'GAME_OVER_LOSE', final_score: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Log player info periodically
  if (p.frameCount % 60 === 0) {
    logPlayerInfo(p);
  }
  
  gameState.gameTimeElapsed++;
}

function logPlayerInfo(p) {
  const player = gameState.player;
  if (!player) return;
  
  p.logs.player_info.push({
    screen_x: player.x,
    screen_y: player.y,
    game_x: player.x,
    game_y: player.y,
    framecount: p.frameCount
  });
}

function getMaxWaveForLevel(level) {
  const waveConfig = {
    1: 3,
    2: 4,
    3: 5
  };
  return waveConfig[level] || 3;
}

export function handleLevelUpMenuOpen(p) {
  gameState.availableUpgrades = generateUpgradeOptions(p);
  gameState.selectedUpgradeIndex = 0;
}