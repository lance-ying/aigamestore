// game_logic.js - Core game logic
import { gameState, GAME_PHASES } from './globals.js';
import { Player, Projectile } from './entities.js';
import { spawnWave, getWaveDuration, hasNextWave, hasNextLevel } from './waves.js';
import { checkCollisions } from './collision.js';
import { keys, clearJustPressed } from './input.js';
import { generateUpgradeOptions, generateShopItems } from './upgrades.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, addHighScore } from './globals.js'; // Import addHighScore

// Helper to get p5 instance, as setTimeout doesn't pass it
const getP5Instance = () => window.gameInstance;

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
  gameState.gameTimeElapsed = 0; // Ensure game time is reset
  
  // Spawn first wave
  const enemies = spawnWave(p, gameState.currentLevel, gameState.currentWave);
  gameState.enemies = enemies;
  gameState.entities.push(...enemies);
  gameState.enemiesRemainingInWave = enemies.length;
  gameState.waveTimer = getWaveDuration(gameState.currentLevel, gameState.currentWave);
  
  // Log player info
  logPlayerInfo(p);
}

// New: Function to clear any pending auto-restart
export function clearAutoRestart() {
  if (gameState.autoRestartTimeoutId) {
    clearTimeout(gameState.autoRestartTimeoutId);
    gameState.autoRestartTimeoutId = null;
  }
  gameState.autoRestartScheduled = false;
}

// New: Function to reset game state to start screen
export function resetToStart(p) {
  clearAutoRestart(); // Clear any pending auto-restart
  gameState.gamePhase = GAME_PHASES.START;
  gameState.player = null;
  gameState.entities = [];
  gameState.enemies = [];
  gameState.projectiles = [];
  gameState.items = [];
  gameState.score = 0;
  gameState.currentLevel = 1;
  gameState.currentWave = 1;
  gameState.materials = 0;
  gameState.gameTimeElapsed = 0; // Reset game time

  p.logs.game_info.push({
    data: { phase: 'START', action: 'restart' },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

// New: Function to schedule an automatic restart
export function scheduleAutoRestart() {
  if (gameState.autoRestartScheduled) return; // Prevent multiple schedules
  gameState.autoRestartScheduled = true;
  gameState.autoRestartTimeoutId = setTimeout(() => {
    const p = getP5Instance();
    resetToStart(p); // Reset state to clean slate and set phase to START
    initializeGame(p); // Re-initialize game components (player, first wave, etc.)
    gameState.gamePhase = GAME_PHASES.PLAYING; // Go straight to playing
    gameState.autoRestartScheduled = false; // Reset flag after restart
    gameState.autoRestartTimeoutId = null;
    p.logs.game_info.push({
      data: { phase: 'PLAYING', action: 'auto_restart' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }, 1000); // 1 second delay
}

export function updateGame(p) {
  // Check for game over states and schedule auto-restart if needed
  if ((gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE || gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) && !gameState.autoRestartScheduled) {
    scheduleAutoRestart();
    return; // Don't run game logic if game is over (waiting for restart)
  }

  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return; // Only run game logic if playing
  
  const player = gameState.player;
  if (!player) return;
  
  // Update player
  player.update(p, keys);
  
  // Clear just pressed flags after update (for tap-based controls)
  clearJustPressed();
  
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
  
  // Check game over (LOSE condition)
  if (player.currentHP <= 0) {
    // Transition to GAME_OVER_LOSE only once
    if (gameState.gamePhase !== GAME_PHASES.GAME_OVER_LOSE) {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
      addHighScore(gameState.score); // Use the imported addHighScore

      p.logs.game_info.push({
        data: { phase: 'GAME_OVER_LOSE', final_score: gameState.score },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      // Auto-restart will be scheduled by the check at the top of updateGame in the next frame.
    }
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