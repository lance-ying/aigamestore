import { gameState, OBSTACLE_TYPES, PLAYER_STATES, LANES } from './globals.js';
import { Obstacle, Coin } from './obstacles.js';

export function updateGameLogic(p) {
  if (gameState.gamePhase !== 'PLAYING') return;

  gameState.framesSinceStart++;
  
  // Update player
  if (gameState.player) {
    gameState.player.update();
  }

  // Update game speed based on distance
  gameState.distance += gameState.gameSpeed * 0.1;
  gameState.gameSpeed = gameState.baseSpeed + Math.floor(gameState.distance / 500) * 0.5;
  gameState.difficultyLevel = 1 + Math.floor(gameState.distance / 1000);

  // Update and remove inactive obstacles
  gameState.obstacles = gameState.obstacles.filter(obs => {
    obs.update();
    return obs.active;
  });

  // Update and remove inactive coins
  gameState.coins = gameState.coins.filter(coin => {
    coin.update();
    return coin.active;
  });

  // Spawn obstacles
  gameState.spawnTimer++;
  const adjustedSpawnInterval = Math.max(30, gameState.spawnInterval - gameState.difficultyLevel * 3);
  
  if (gameState.spawnTimer >= adjustedSpawnInterval) {
    spawnObstacle(p);
    gameState.spawnTimer = 0;
  }

  // Spawn coins
  gameState.coinSpawnTimer++;
  const adjustedCoinInterval = Math.max(25, gameState.coinSpawnInterval - gameState.difficultyLevel * 2);
  
  if (gameState.coinSpawnTimer >= adjustedCoinInterval) {
    spawnCoin(p);
    gameState.coinSpawnTimer = 0;
  }

  // Check collisions
  checkCollisions(p);
}

function spawnObstacle(p) {
  // Randomly choose a lane
  const lane = Math.floor(p.random(0, 3));
  
  // Choose obstacle type with weighted randomness
  let type;
  const rand = p.random(0, 1);
  
  // Prevent same obstacle type in a row for variety
  const availableTypes = [OBSTACLE_TYPES.TRAIN, OBSTACLE_TYPES.LOW_BARRIER, OBSTACLE_TYPES.HIGH_BARRIER];
  const filteredTypes = availableTypes.filter(t => t !== gameState.lastObstacleType);
  
  if (rand < 0.4) {
    type = OBSTACLE_TYPES.TRAIN;
  } else if (rand < 0.7) {
    type = OBSTACLE_TYPES.LOW_BARRIER;
  } else {
    type = OBSTACLE_TYPES.HIGH_BARRIER;
  }
  
  // Ensure variety
  if (filteredTypes.length > 0 && type === gameState.lastObstacleType && p.random(0, 1) > 0.3) {
    type = filteredTypes[Math.floor(p.random(0, filteredTypes.length))];
  }
  
  gameState.lastObstacleType = type;
  
  const obstacle = new Obstacle(p, lane, type, gameState.gameSpeed);
  obstacle.y = -50;
  gameState.obstacles.push(obstacle);
}

function spawnCoin(p) {
  // Choose a lane, prefer not spawning where obstacles are near
  const lane = Math.floor(p.random(0, 3));
  const coin = new Coin(p, lane, gameState.gameSpeed);
  gameState.coins.push(coin);
}

function checkCollisions(p) {
  if (!gameState.player) return;

  const playerHitbox = gameState.player.getHitbox();

  // Check obstacle collisions
  for (const obstacle of gameState.obstacles) {
    const obsHitbox = obstacle.getHitbox();
    
    // Use p5.collide2D for collision detection
    const collision = p.collideRectRect(
      playerHitbox.x, playerHitbox.y, playerHitbox.width, playerHitbox.height,
      obsHitbox.x, obsHitbox.y, obsHitbox.width, obsHitbox.height
    );

    if (collision) {
      // Check if player can avoid the obstacle
      let canAvoid = false;
      
      if (obstacle.type === OBSTACLE_TYPES.LOW_BARRIER && 
          gameState.player.state === PLAYER_STATES.JUMPING) {
        canAvoid = true;
      } else if (obstacle.type === OBSTACLE_TYPES.HIGH_BARRIER && 
                 gameState.player.state === PLAYER_STATES.SLIDING) {
        canAvoid = true;
      }

      if (!canAvoid) {
        gameOver(p, false);
        return;
      }
    }
  }

  // Check coin collisions
  for (const coin of gameState.coins) {
    if (coin.collected) continue;
    
    const coinHitbox = coin.getHitbox();
    const collision = p.collideCircleCircle(
      gameState.player.x, gameState.player.y - 20,
      20,
      coinHitbox.x, coinHitbox.y, coinHitbox.radius
    );

    if (collision) {
      coin.collected = true;
      coin.active = false;
      gameState.score += 10;
    }
  }
}

function gameOver(p, isWin) {
  gameState.gamePhase = isWin ? 'GAME_OVER_WIN' : 'GAME_OVER_LOSE';
  
  p.logs.game_info.push({
    data: { phase: gameState.gamePhase, score: gameState.score, distance: Math.floor(gameState.distance) },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function resetGame(p) {
  gameState.obstacles = [];
  gameState.coins = [];
  gameState.score = 0;
  gameState.distance = 0;
  gameState.gameSpeed = gameState.baseSpeed;
  gameState.spawnTimer = 0;
  gameState.coinSpawnTimer = 0;
  gameState.difficultyLevel = 1;
  gameState.lastObstacleType = null;
  gameState.framesSinceStart = 0;
  
  if (gameState.player) {
    gameState.player.lane = LANES.CENTER;
    gameState.player.x = gameState.player.targetX = 300;
    gameState.player.y = 320;
    gameState.player.state = PLAYER_STATES.RUNNING;
    gameState.player.jumpVelocity = 0;
    gameState.player.slideTimer = 0;
  }
}