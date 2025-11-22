// game_manager.js - Game state management and main game loop logic
import { 
  gameState, 
  FOOD_COUNT, 
  AI_WORM_COUNT,
  ARENA_CENTER_X,
  ARENA_CENTER_Y,
  GAME_DURATION,
  POWERUP_SPAWN_INTERVAL,
  FOOD_MASS_VALUE
} from './globals.js';
import { Worm, Food, Powerup, WormRemains } from './entities.js';
import { AIController } from './ai.js';
import { randomPointInArena, distance } from './utils.js';

export function initGame(p) {
  gameState.entities = [];
  gameState.aiWorms = [];
  gameState.foods = [];
  gameState.powerups = [];
  gameState.score = 0;
  gameState.mass = 0;
  gameState.frameCounter = 0;
  gameState.nextPowerupSpawn = POWERUP_SPAWN_INTERVAL;
  gameState.activePowerups = { magnet: 0, shield: 0 };
  gameState.leaderboard = [];
  
  // Create player worm
  gameState.player = new Worm(ARENA_CENTER_X, ARENA_CENTER_Y - 50, true, [100, 200, 100], p);
  gameState.entities.push(gameState.player);
  gameState.mass = gameState.player.getMass();

  // Create AI worms
  for (let i = 0; i < AI_WORM_COUNT; i++) {
    const pos = randomPointInArena(p);
    const aiWorm = new Worm(pos.x, pos.y, false, null, p);
    gameState.entities.push(aiWorm);
    gameState.aiWorms.push({
      worm: aiWorm,
      controller: new AIController(aiWorm, p)
    });
  }

  // Create food
  spawnFood(p, FOOD_COUNT);
  
  gameState.gameStartTime = Date.now();
}

export function spawnFood(p, count) {
  for (let i = 0; i < count; i++) {
    const pos = randomPointInArena(p);
    const color = [
      p.random(100, 255),
      p.random(100, 255),
      p.random(100, 255)
    ];
    gameState.foods.push(new Food(pos.x, pos.y, color));
  }
}

export function spawnPowerup(p) {
  const pos = randomPointInArena(p);
  const type = p.random() < 0.5 ? 'magnet' : 'shield';
  gameState.powerups.push(new Powerup(pos.x, pos.y, type, p));
}

export function updateGame(p) {
  gameState.frameCounter++;
  
  // Update elapsed time
  if (gameState.gamePhase === "PLAYING") {
    gameState.elapsedTime = (Date.now() - gameState.gameStartTime) / 1000;
  }

  // Update power-up timers
  if (gameState.activePowerups.magnet > 0) {
    gameState.activePowerups.magnet--;
  }
  if (gameState.activePowerups.shield > 0) {
    gameState.activePowerups.shield--;
  }

  // Spawn powerups periodically
  if (gameState.frameCounter >= gameState.nextPowerupSpawn) {
    spawnPowerup(p);
    gameState.nextPowerupSpawn = gameState.frameCounter + POWERUP_SPAWN_INTERVAL + p.random(-60, 60);
  }

  // Update player
  if (gameState.player && gameState.player.isAlive) {
    gameState.player.update(p);
    gameState.mass = gameState.player.getMass();

    // Log player info
    const head = gameState.player.getHead();
    if (gameState.frameCounter % 10 === 0) {
      p.logs.player_info.push({
        screen_x: head.x,
        screen_y: head.y,
        game_x: head.x,
        game_y: head.y,
        framecount: p.frameCount
      });
    }

    // Magnet effect - attract nearby food
    if (gameState.activePowerups.magnet > 0) {
      for (const food of gameState.foods) {
        if (!food.active) continue;
        const dist = distance(head.x, head.y, food.x, food.y);
        if (dist < 80) {
          const angle = Math.atan2(head.y - food.y, head.x - food.x);
          food.x += Math.cos(angle) * 2;
          food.y += Math.sin(angle) * 2;
        }
      }
    }

    // Check food collection
    for (const food of gameState.foods) {
      if (!food.active) continue;
      if (distance(head.x, head.y, food.x, food.y) < 10) {
        food.active = false;
        gameState.player.addMass(food.mass);
        gameState.score += food.mass;
      }
    }

    // Check powerup collection
    for (const powerup of gameState.powerups) {
      if (!powerup.active) continue;
      if (distance(head.x, head.y, powerup.x, powerup.y) < 15) {
        powerup.active = false;
        gameState.activePowerups[powerup.type] = powerup.duration;
        gameState.score += 50;
      }
    }

    // Check collisions with other worms
    if (gameState.activePowerups.shield === 0) {
      for (const aiData of gameState.aiWorms) {
        if (gameState.player.checkCollisionWithWorm(aiData.worm)) {
          gameState.player.isAlive = false;
          break;
        }
      }
    }
  }

  // Update AI worms
  for (let i = gameState.aiWorms.length - 1; i >= 0; i--) {
    const aiData = gameState.aiWorms[i];
    
    if (aiData.worm.isAlive) {
      aiData.controller.update(gameState.foods, gameState.entities);
      aiData.worm.update(p);

      // AI collect food
      const aiHead = aiData.worm.getHead();
      for (const food of gameState.foods) {
        if (!food.active) continue;
        if (distance(aiHead.x, aiHead.y, food.x, food.y) < 10) {
          food.active = false;
          aiData.worm.addMass(food.mass);
        }
      }

      // Check AI collision with player
      if (gameState.player && gameState.player.isAlive) {
        if (aiData.worm.checkCollisionWithWorm(gameState.player)) {
          aiData.worm.isAlive = false;
          const remains = new WormRemains(aiData.worm.segments, aiData.worm.color);
          gameState.foods.push(...remains.getFoods());
          gameState.score += 100;
        }
      }

      // Check AI collision with other AI
      for (const otherAiData of gameState.aiWorms) {
        if (aiData === otherAiData) continue;
        if (aiData.worm.checkCollisionWithWorm(otherAiData.worm)) {
          aiData.worm.isAlive = false;
          const remains = new WormRemains(aiData.worm.segments, aiData.worm.color);
          gameState.foods.push(...remains.getFoods());
        }
      }
    }
  }

  // Remove inactive food
  gameState.foods = gameState.foods.filter(f => f.active);
  
  // Respawn food if needed
  if (gameState.foods.length < FOOD_COUNT * 0.7) {
    spawnFood(p, 10);
  }

  // Remove inactive powerups
  gameState.powerups = gameState.powerups.filter(p => p.active);

  // Update leaderboard
  updateLeaderboard();

  // Check win/lose conditions
  checkGameOver();
}

export function updateLeaderboard() {
  gameState.leaderboard = [];
  
  if (gameState.player && gameState.player.isAlive) {
    gameState.leaderboard.push({
      name: 'You',
      mass: gameState.player.getMass(),
      isPlayer: true
    });
  }

  for (const aiData of gameState.aiWorms) {
    if (aiData.worm.isAlive) {
      gameState.leaderboard.push({
        name: 'AI',
        mass: aiData.worm.getMass(),
        isPlayer: false
      });
    }
  }

  gameState.leaderboard.sort((a, b) => b.mass - a.mass);
}

export function checkGameOver() {
  // Lose condition: player dead
  if (gameState.player && !gameState.player.isAlive) {
    gameState.gamePhase = "GAME_OVER_LOSE";
    return;
  }

  // Win condition: Time elapsed or all AI defeated
  const allAiDead = gameState.aiWorms.every(ai => !ai.worm.isAlive);
  const timeUp = gameState.elapsedTime >= GAME_DURATION;
  
  if (allAiDead || timeUp) {
    if (gameState.leaderboard.length > 0 && gameState.leaderboard[0].isPlayer) {
      gameState.gamePhase = "GAME_OVER_WIN";
    } else {
      gameState.gamePhase = "GAME_OVER_LOSE";
    }
  }
}