// Game logic and state management
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Player, Enemy, PowerUp } from './entities.js';

export function initializeGame(p) {
  // Create player
  gameState.player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 80);
  
  // Reset game state
  gameState.score = 0;
  gameState.wave = 1;
  gameState.enemiesDefeated = 0;
  gameState.bossActive = false;
  gameState.bossDefeated = false;
  gameState.waveTimer = 0;
  gameState.enemySpawnTimer = 0;
  gameState.enemiesInWave = 0;
  
  // Start first wave
  startWave(1);
}

export function resetGame(p) {
  // Clear all entities
  gameState.entities = [];
  gameState.enemies = [];
  gameState.projectiles = [];
  gameState.enemyProjectiles = [];
  gameState.powerUps = [];
  gameState.particles = [];
  gameState.player = null;
  
  // Reset state
  gameState.score = 0;
  gameState.wave = 1;
  gameState.enemiesDefeated = 0;
  gameState.bossActive = false;
  gameState.bossDefeated = false;
  gameState.waveTimer = 0;
  gameState.enemySpawnTimer = 0;
  gameState.enemiesInWave = 0;
}

export function startWave(waveNum) {
  gameState.wave = waveNum;
  gameState.enemiesInWave = 0;
  gameState.enemySpawnTimer = 0;
  
  // Boss wave
  if (waveNum === gameState.maxWaves) {
    gameState.bossActive = true;
    const boss = new Enemy(CANVAS_WIDTH / 2, 60, 'boss');
  }
}

export function updateGame(p) {
  // Update all entities
  for (let i = gameState.entities.length - 1; i >= 0; i--) {
    if (gameState.entities[i] && gameState.entities[i].update) {
      gameState.entities[i].update(p);
    }
  }
  
  // Update particles
  for (let i = gameState.particles.length - 1; i >= 0; i--) {
    gameState.particles[i].update();
    if (gameState.particles[i].isDead()) {
      gameState.particles.splice(i, 1);
    }
  }
  
  // Wave management
  if (!gameState.bossActive) {
    updateWaveSpawning(p);
  }
  
  // Update effects
  if (gameState.screenShake > 0) {
    gameState.screenShake--;
  }
  if (gameState.flashAlpha > 0) {
    gameState.flashAlpha = Math.max(0, gameState.flashAlpha - 10);
  }
}

function updateWaveSpawning(p) {
  if (gameState.wave >= gameState.maxWaves) return;
  
  // Check if wave is complete
  if (gameState.enemies.length === 0 && gameState.enemiesInWave > 0) {
    gameState.waveTimer++;
    
    if (gameState.waveTimer >= gameState.waveDelay) {
      gameState.wave++;
      if (gameState.wave < gameState.maxWaves) {
        startWave(gameState.wave);
      } else {
        startWave(gameState.maxWaves); // Boss wave
      }
      gameState.waveTimer = 0;
    }
  } else {
    // Spawn enemies for current wave
    const maxEnemiesPerWave = 3 + gameState.wave * 2;
    
    if (gameState.enemiesInWave < maxEnemiesPerWave) {
      gameState.enemySpawnTimer++;
      
      if (gameState.enemySpawnTimer >= gameState.enemySpawnDelay) {
        spawnEnemy();
        gameState.enemiesInWave++;
        gameState.enemySpawnTimer = 0;
      }
    }
  }
}

function spawnEnemy() {
  const types = ['basic', 'fast', 'tank'];
  let type = types[Math.floor(Math.random() * types.length)];
  
  // More variety in later waves
  if (gameState.wave >= 3) {
    const rand = Math.random();
    if (rand < 0.3) type = 'fast';
    else if (rand < 0.6) type = 'tank';
    else type = 'basic';
  }
  
  const x = 50 + Math.random() * (CANVAS_WIDTH - 100);
  const y = -30;
  
  const enemy = new Enemy(x, y, type);
}