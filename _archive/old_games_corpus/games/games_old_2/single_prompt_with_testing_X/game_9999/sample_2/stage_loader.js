// stage_loader.js
import { gameState, GROUND_Y } from './globals.js';
import { Player, Enemy, Coin, Platform, Pickup, Goal } from './entities.js';

export function loadStage(stageNum, p) {
  // Clear existing entities
  gameState.entities = [];
  gameState.coins = [];
  gameState.enemies = [];
  gameState.platforms = [];
  gameState.pickups = [];

  // Reset stage state
  gameState.score = 0;
  gameState.timeElapsed = 0;
  gameState.damageStreak = 0;
  gameState.coinsCollected = 0;
  gameState.hitsTaken = 0;
  gameState.goalReached = false;
  gameState.stageStartTime = Date.now();
  gameState.health = 3;
  gameState.camera.x = 0;
  gameState.camera.y = 0;

  // Create player
  gameState.player = new Player(50, GROUND_Y - 32);
  gameState.entities.push(gameState.player);

  // Stage 1 - Tutorial/Easy
  if (stageNum === 1) {
    gameState.parTime = 25;
    gameState.totalCoins = 15;

    // Simple platforms
    gameState.platforms.push(new Platform(200, 280, 100, 20));
    gameState.platforms.push(new Platform(350, 240, 100, 20));
    gameState.platforms.push(new Platform(500, 200, 100, 20));
    gameState.platforms.push(new Platform(700, 240, 120, 20));
    gameState.platforms.push(new Platform(900, 280, 100, 20));
    gameState.platforms.push(new Platform(1100, 260, 100, 20));
    gameState.platforms.push(new Platform(1300, 240, 100, 20));
    gameState.platforms.push(new Platform(1500, 280, 150, 20));

    // Coins along the path
    for (let i = 0; i < 8; i++) {
      gameState.coins.push(new Coin(220 + i * 190, 240));
    }
    
    // Gold coins
    gameState.coins.push(new Coin(500, 160, 10));
    gameState.coins.push(new Coin(1300, 200, 10));

    // Enemies
    gameState.enemies.push(new Enemy(400, GROUND_Y - 20, 'walker'));
    gameState.enemies.push(new Enemy(800, GROUND_Y - 20, 'walker'));
    gameState.enemies.push(new Enemy(1200, GROUND_Y - 20, 'walker'));

    // Clover pickup
    gameState.pickups.push(new Pickup(700, 200));

    // Goal
    const goal = new Goal(1700, GROUND_Y - 80);
    gameState.entities.push(goal);
  }
  // Stage 2 - Moving platforms
  else if (stageNum === 2) {
    gameState.parTime = 30;
    gameState.totalCoins = 18;

    // Mix of static and moving platforms
    gameState.platforms.push(new Platform(200, 280, 100, 20));
    gameState.platforms.push(new Platform(400, 240, 80, 20, 'moving'));
    gameState.platforms.push(new Platform(600, 200, 100, 20));
    gameState.platforms.push(new Platform(800, 240, 80, 20, 'moving'));
    gameState.platforms.push(new Platform(1000, 280, 100, 20));
    gameState.platforms.push(new Platform(1200, 220, 80, 20, 'moving'));
    gameState.platforms.push(new Platform(1400, 260, 100, 20));
    gameState.platforms.push(new Platform(1650, 240, 120, 20));

    // Coins
    for (let i = 0; i < 10; i++) {
      gameState.coins.push(new Coin(220 + i * 150, 220));
    }
    
    // Gold
    gameState.coins.push(new Coin(600, 160, 10));
    gameState.coins.push(new Coin(1000, 240, 10));
    gameState.coins.push(new Coin(1400, 220, 10));

    // More enemies
    gameState.enemies.push(new Enemy(300, GROUND_Y - 20, 'walker'));
    gameState.enemies.push(new Enemy(700, GROUND_Y - 20, 'walker'));
    gameState.enemies.push(new Enemy(1100, GROUND_Y - 20, 'walker'));
    gameState.enemies.push(new Enemy(1500, GROUND_Y - 20, 'walker'));

    // Pickups
    gameState.pickups.push(new Pickup(800, 200));
    gameState.pickups.push(new Pickup(1200, 180));

    // Goal
    const goal = new Goal(1850, GROUND_Y - 80);
    gameState.entities.push(goal);
  }
  // Default/fallback stage
  else {
    gameState.parTime = 25;
    gameState.totalCoins = 10;

    // Simple layout
    gameState.platforms.push(new Platform(200, 280, 100, 20));
    gameState.platforms.push(new Platform(400, 240, 100, 20));
    gameState.platforms.push(new Platform(700, 260, 120, 20));

    for (let i = 0; i < 10; i++) {
      gameState.coins.push(new Coin(220 + i * 80, 240));
    }

    gameState.enemies.push(new Enemy(500, GROUND_Y - 20, 'walker'));

    const goal = new Goal(900, GROUND_Y - 80);
    gameState.entities.push(goal);
  }

  // Add all stage entities to global entities list
  gameState.entities.push(...gameState.platforms);
  gameState.entities.push(...gameState.coins);
  gameState.entities.push(...gameState.enemies);
  gameState.entities.push(...gameState.pickups);
}