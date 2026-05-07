// gameLogic.js - Core game logic

import { 
  gameState, PHASE_PLAYING, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE,
  LEVELS, POINTS_LEVEL_COMPLETE, RIVAL_SPAWN_INTERVAL,
  OBSTACLE_SPAWN_INTERVAL, COIN_SPAWN_INTERVAL, NUM_LANES, CANVAS_HEIGHT
} from './globals.js';
import { PlayerCar, RivalCar, Obstacle, Coin, BossCar, Particle } from './entities.js';
import { checkCollisions } from './collision.js';

export function updateGame(p) {
  if (gameState.gamePhase !== PHASE_PLAYING) return;

  const currentLevel = LEVELS[gameState.currentLevel - 1];

  // Update camera/scroll
  if (gameState.player) {
    gameState.scrollSpeed = gameState.player.speed;
    gameState.cameraY += gameState.scrollSpeed;
    
    if (!currentLevel.isBoss) {
      gameState.levelDistance += gameState.scrollSpeed;
    }
  }

  // Update player
  if (gameState.player) {
    gameState.player.update();
    
    // Check if player is dead
    if (gameState.player.health <= 0) {
      createExplosion(p, gameState.player.x, gameState.player.y);
      gameState.gamePhase = PHASE_GAME_OVER_LOSE;
      p.logs.game_info.push({
        data: { phase: PHASE_GAME_OVER_LOSE, reason: "player_death" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      return;
    }
  }

  // Update boss
  if (gameState.boss) {
    gameState.boss.update();
    
    if (gameState.boss.health <= 0) {
      createExplosion(p, gameState.boss.x, gameState.boss.y);
      gameState.cash += currentLevel.cashReward;
      gameState.gamePhase = PHASE_GAME_OVER_WIN;
      p.logs.game_info.push({
        data: { phase: PHASE_GAME_OVER_WIN, reason: "boss_defeated" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      return;
    }
  }

  // Update rivals
  gameState.rivals.forEach(rival => rival.update());
  gameState.rivals = gameState.rivals.filter(rival => !rival.isOffScreen());

  // Update obstacles
  gameState.obstacles.forEach(obstacle => obstacle.update());
  gameState.obstacles = gameState.obstacles.filter(obstacle => !obstacle.isOffScreen());

  // Update coins
  gameState.coins.forEach(coin => coin.update());
  gameState.coins = gameState.coins.filter(coin => !coin.isOffScreen());

  // Update projectiles
  gameState.projectiles.forEach(projectile => projectile.update());
  gameState.projectiles = gameState.projectiles.filter(projectile => !projectile.isOffScreen());

  // Update particles
  gameState.particles.forEach(particle => particle.update());
  gameState.particles = gameState.particles.filter(particle => !particle.isDead());

  // Spawn rivals (for non-boss levels)
  if (!currentLevel.isBoss) {
    gameState.framesSinceRivalSpawn++;
    if (gameState.framesSinceRivalSpawn >= RIVAL_SPAWN_INTERVAL) {
      spawnRival(p, currentLevel);
      gameState.framesSinceRivalSpawn = 0;
    }

    // Spawn obstacles
    gameState.framesSinceObstacleSpawn++;
    if (gameState.framesSinceObstacleSpawn >= OBSTACLE_SPAWN_INTERVAL / currentLevel.obstacleFrequency) {
      spawnObstacle(p);
      gameState.framesSinceObstacleSpawn = 0;
    }

    // Spawn coins
    gameState.framesSinceCoinSpawn++;
    if (gameState.framesSinceCoinSpawn >= COIN_SPAWN_INTERVAL) {
      spawnCoin(p);
      gameState.framesSinceCoinSpawn = 0;
    }
  }

  // Check collisions
  checkCollisions(p);

  // Check level completion (for race levels)
  if (!currentLevel.isBoss && gameState.levelDistance >= gameState.levelLength) {
    completeLevel(p, currentLevel);
  }

  // Log player info
  if (gameState.player && p.frameCount % 10 === 0) {
    p.logs.player_info.push({
      screen_x: gameState.player.x,
      screen_y: gameState.player.y,
      game_x: gameState.player.x,
      game_y: gameState.cameraY + gameState.player.y,
      framecount: p.frameCount
    });
  }
}

function spawnRival(p, level) {
  if (gameState.rivals.length >= level.rivalCount) return;
  
  const lane = p.floor(p.random(NUM_LANES));
  const rival = new RivalCar(p, lane, level.rivalSpeed);
  gameState.rivals.push(rival);
}

function spawnObstacle(p) {
  const types = ['pothole', 'barrier', 'oil', 'ramp'];
  const type = types[p.floor(p.random(types.length))];
  const lane = p.floor(p.random(NUM_LANES));
  
  const obstacle = new Obstacle(p, type, lane);
  gameState.obstacles.push(obstacle);
}

function spawnCoin(p) {
  const lane = p.floor(p.random(NUM_LANES));
  const coin = new Coin(p, lane);
  gameState.coins.push(coin);
}

function completeLevel(p, level) {
  gameState.score += POINTS_LEVEL_COMPLETE;
  gameState.cash += level.cashReward;
  
  // Bonus for no collisions
  if (gameState.noCollisionBonus) {
    gameState.score += Math.floor(POINTS_LEVEL_COMPLETE * 0.5);
  }
  
  if (gameState.currentLevel < LEVELS.length) {
    gameState.currentLevel++;
    resetLevel(p);
  } else {
    gameState.gamePhase = PHASE_GAME_OVER_WIN;
    p.logs.game_info.push({
      data: { phase: PHASE_GAME_OVER_WIN, reason: "all_levels_complete" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function resetLevel(p) {
  const currentLevel = LEVELS[gameState.currentLevel - 1];
  
  gameState.player = new PlayerCar(p, Math.floor(NUM_LANES / 2));
  gameState.rivals = [];
  gameState.obstacles = [];
  gameState.coins = [];
  gameState.projectiles = [];
  gameState.particles = [];
  gameState.scrollSpeed = 0;
  gameState.cameraY = 0;
  gameState.levelDistance = 0;
  gameState.levelLength = currentLevel.targetTime ? currentLevel.targetTime * 60 * 5 : 3000;
  gameState.framesSinceRivalSpawn = 0;
  gameState.framesSinceObstacleSpawn = 0;
  gameState.framesSinceCoinSpawn = 0;
  gameState.driftChainMultiplier = 1;
  gameState.consecutiveDrifts = 0;
  gameState.noCollisionBonus = true;
  
  if (currentLevel.isBoss) {
    gameState.boss = new BossCar(p);
  } else {
    gameState.boss = null;
  }
  
  gameState.levelStartTime = Date.now();
  
  p.logs.game_info.push({
    data: { phase: PHASE_PLAYING, level: gameState.currentLevel, levelName: currentLevel.name },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function createExplosion(p, x, y) {
  for (let i = 0; i < 30; i++) {
    gameState.particles.push(new Particle(p, x, y, 'explosion'));
  }
  for (let i = 0; i < 20; i++) {
    gameState.particles.push(new Particle(p, x, y, 'spark'));
  }
  for (let i = 0; i < 15; i++) {
    gameState.particles.push(new Particle(p, x, y, 'smoke'));
  }
}