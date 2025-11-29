// game_logic.js - Core game logic

import { 
  gameState, PHASE_PLAYING, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE,
  FOOD_COUNT, ARENA_WIDTH, ARENA_HEIGHT, POWERUP_SPAWN_INTERVAL,
  WIN_SIZE_THRESHOLD, AI_WORM_COUNT, INITIAL_WORM_LENGTH
} from './globals.js';
import { Worm, Food, PowerUp } from './entities.js';
import { AIController } from './ai.js';
import { 
  checkWormCollision, checkFoodCollision, checkPowerUpCollision,
  checkEncirclement, applyMagnetEffect 
} from './physics.js';

export function initGame(p) {
  // Create player worm at center
  gameState.player = new Worm(ARENA_WIDTH / 2, ARENA_HEIGHT / 2, true, "Player");
  gameState.entities = [gameState.player];
  
  // Create AI worms
  gameState.aiWorms = [];
  gameState.aiControllers = [];
  
  for (let i = 0; i < AI_WORM_COUNT; i++) {
    const x = p.random(200, ARENA_WIDTH - 200);
    const y = p.random(200, ARENA_HEIGHT - 200);
    const aiWorm = new Worm(x, y, false, `Bot ${i + 1}`);
    gameState.aiWorms.push(aiWorm);
    gameState.aiControllers.push(new AIController(aiWorm));
    gameState.entities.push(aiWorm);
  }
  
  // Spawn initial food
  gameState.food = [];
  spawnFood(p, FOOD_COUNT);
  
  // Initialize powerups
  gameState.powerups = [];
  gameState.powerupTimer = POWERUP_SPAWN_INTERVAL;
  
  // Reset game state
  gameState.score = 0;
  gameState.frameCount = 0;
  gameState.camera = { x: 0, y: 0 };
  gameState.leaderboard = [];
}

export function spawnFood(p, count) {
  for (let i = 0; i < count; i++) {
    const x = p.random(50, ARENA_WIDTH - 50);
    const y = p.random(50, ARENA_HEIGHT - 50);
    gameState.food.push(new Food(x, y));
  }
}

export function spawnPowerUp(p) {
  const x = p.random(100, ARENA_WIDTH - 100);
  const y = p.random(100, ARENA_HEIGHT - 100);
  const type = p.random() < 0.5 ? 'magnet' : 'speed';
  gameState.powerups.push(new PowerUp(x, y, type));
}

export function updateGame(p) {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  gameState.frameCount++;
  
  // Update player
  if (gameState.player && gameState.player.alive) {
    gameState.player.update(p);
    
    // Update camera to follow player
    updateCamera();
    
    // Log player info
    if (gameState.frameCount % 30 === 0) {
      const head = gameState.player.getHead();
      p.logs.player_info.push({
        screen_x: head.x - gameState.camera.x,
        screen_y: head.y - gameState.camera.y,
        game_x: head.x,
        game_y: head.y,
        framecount: p.frameCount
      });
    }
  }
  
  // Update AI worms
  for (let i = 0; i < gameState.aiWorms.length; i++) {
    const aiWorm = gameState.aiWorms[i];
    if (aiWorm.alive) {
      aiWorm.update(p);
      gameState.aiControllers[i].update(gameState);
    }
  }
  
  // Update powerups
  for (const powerup of gameState.powerups) {
    powerup.update(p);
  }
  
  // Spawn new powerups
  gameState.powerupTimer--;
  if (gameState.powerupTimer <= 0) {
    spawnPowerUp(p);
    gameState.powerupTimer = POWERUP_SPAWN_INTERVAL;
  }
  
  // Check collisions
  checkCollisions(p);
  
  // Apply magnet effects
  if (gameState.player && gameState.player.magnetActive) {
    for (const food of gameState.food) {
      if (!food.collected) {
        applyMagnetEffect(p, gameState.player, food);
      }
    }
  }
  
  // Maintain food count
  const activeFood = gameState.food.filter(f => !f.collected).length;
  if (activeFood < FOOD_COUNT * 0.7) {
    spawnFood(p, 20);
  }
  
  // Update leaderboard
  updateLeaderboard();
  
  // Check win/lose conditions
  checkGameOver(p);
}

export function checkCollisions(p) {
  if (!gameState.player || !gameState.player.alive) return;
  
  // Player collision with food
  for (const food of gameState.food) {
    if (checkFoodCollision(p, gameState.player, food)) {
      food.collect();
      gameState.player.grow(food.value);
      gameState.score += food.value;
    }
  }
  
  // AI collision with food
  for (const aiWorm of gameState.aiWorms) {
    if (!aiWorm.alive) continue;
    for (const food of gameState.food) {
      if (checkFoodCollision(p, aiWorm, food)) {
        food.collect();
        aiWorm.grow(food.value);
      }
    }
  }
  
  // Player collision with powerups
  for (const powerup of gameState.powerups) {
    if (checkPowerUpCollision(p, gameState.player, powerup)) {
      powerup.collect();
      if (powerup.type === 'magnet') {
        gameState.player.powerups.magnet++;
      }
    }
  }
  
  // Player collision with AI worms
  for (const aiWorm of gameState.aiWorms) {
    if (!aiWorm.alive) continue;
    
    if (checkWormCollision(p, gameState.player, aiWorm)) {
      // Player hit AI body - player dies
      eliminateWorm(p, gameState.player);
      return;
    }
    
    if (checkWormCollision(p, aiWorm, gameState.player)) {
      // AI hit player body - AI dies
      eliminateWorm(p, aiWorm);
      gameState.score += Math.floor(aiWorm.mass);
    }
    
    // Check encirclement
    if (checkEncirclement(gameState.player, aiWorm)) {
      eliminateWorm(p, aiWorm);
      gameState.score += Math.floor(aiWorm.mass * 1.5);
    }
  }
  
  // AI vs AI collisions
  for (let i = 0; i < gameState.aiWorms.length; i++) {
    for (let j = i + 1; j < gameState.aiWorms.length; j++) {
      const ai1 = gameState.aiWorms[i];
      const ai2 = gameState.aiWorms[j];
      
      if (!ai1.alive || !ai2.alive) continue;
      
      if (checkWormCollision(p, ai1, ai2)) {
        eliminateWorm(p, ai1);
      } else if (checkWormCollision(p, ai2, ai1)) {
        eliminateWorm(p, ai2);
      }
    }
  }
}

export function eliminateWorm(p, worm) {
  if (!worm.alive) return;
  
  worm.die();
  
  // Convert worm to food
  for (const seg of worm.segments) {
    if (Math.random() < 0.3) {
      gameState.food.push(new Food(seg.x, seg.y, 2));
    }
  }
  
  // Respawn AI worm after delay
  if (!worm.isPlayer && gameState.gamePhase === PHASE_PLAYING) {
    setTimeout(() => {
      const x = p.random(200, ARENA_WIDTH - 200);
      const y = p.random(200, ARENA_HEIGHT - 200);
      worm.segments = [];
      worm.x = x;
      worm.y = y;
      worm.alive = true;
      worm.mass = INITIAL_WORM_LENGTH;
      worm.length = INITIAL_WORM_LENGTH;
      worm.angle = Math.random() * Math.PI * 2;
      for (let i = 0; i < worm.length; i++) {
        worm.segments.push({
          x: worm.x - i * 8 * Math.cos(worm.angle),
          y: worm.y - i * 8 * Math.sin(worm.angle)
        });
      }
    }, 3000);
  }
}

export function updateCamera() {
  if (!gameState.player || !gameState.player.alive) return;
  
  const head = gameState.player.getHead();
  gameState.camera.x = head.x - 300;
  gameState.camera.y = head.y - 200;
  
  // Keep camera in bounds
  gameState.camera.x = Math.max(0, Math.min(ARENA_WIDTH - 600, gameState.camera.x));
  gameState.camera.y = Math.max(0, Math.min(ARENA_HEIGHT - 400, gameState.camera.y));
}

export function updateLeaderboard() {
  gameState.leaderboard = [];
  
  if (gameState.player && gameState.player.alive) {
    gameState.leaderboard.push({
      name: gameState.player.name,
      mass: Math.floor(gameState.player.mass),
      isPlayer: true
    });
  }
  
  for (const aiWorm of gameState.aiWorms) {
    if (aiWorm.alive) {
      gameState.leaderboard.push({
        name: aiWorm.name,
        mass: Math.floor(aiWorm.mass),
        isPlayer: false
      });
    }
  }
  
  gameState.leaderboard.sort((a, b) => b.mass - a.mass);
}

export function checkGameOver(p) {
  // Check win condition
  if (gameState.player && gameState.player.alive) {
    if (gameState.player.mass >= WIN_SIZE_THRESHOLD) {
      gameState.gamePhase = PHASE_GAME_OVER_WIN;
      if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
      }
      p.logs.game_info.push({
        data: { phase: PHASE_GAME_OVER_WIN, score: gameState.score },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  // Check lose condition
  if (!gameState.player || !gameState.player.alive) {
    gameState.gamePhase = PHASE_GAME_OVER_LOSE;
    if (gameState.score > gameState.highScore) {
      gameState.highScore = gameState.score;
    }
    p.logs.game_info.push({
      data: { phase: PHASE_GAME_OVER_LOSE, score: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}