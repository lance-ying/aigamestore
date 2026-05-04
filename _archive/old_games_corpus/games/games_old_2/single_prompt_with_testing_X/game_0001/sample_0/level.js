// level.js - Level generation and management

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Platform, Coin, Enemy, Cloverleaf, Flag } from './entities.js';

export function createLevel(p, levelNumber) {
  // Clear existing entities
  gameState.entities = [];
  gameState.coins = [];
  gameState.enemies = [];
  gameState.cloverleaves = [];
  gameState.platforms = [];
  
  // Level width (scrolling)
  const levelWidth = 2400;
  
  // Ground platform
  const ground = new Platform(p, levelWidth / 2, CANVAS_HEIGHT - 20, levelWidth, 40);
  gameState.platforms.push(ground);
  gameState.entities.push(ground);

  // Create platforms based on level
  const platformConfigs = [
    { x: 200, y: 300, w: 120, h: 20 },
    { x: 400, y: 250, w: 100, h: 20 },
    { x: 600, y: 200, w: 140, h: 20 },
    { x: 850, y: 280, w: 100, h: 20 },
    { x: 1050, y: 220, w: 120, h: 20 },
    { x: 1300, y: 260, w: 100, h: 20 },
    { x: 1550, y: 200, w: 140, h: 20 },
    { x: 1800, y: 280, w: 120, h: 20 },
    { x: 2050, y: 240, w: 100, h: 20 }
  ];

  platformConfigs.forEach(config => {
    const platform = new Platform(p, config.x, config.y, config.w, config.h);
    gameState.platforms.push(platform);
    gameState.entities.push(platform);
  });

  // Add coins
  const coinPositions = [
    { x: 150, y: 320 }, { x: 200, y: 250 }, { x: 250, y: 320 },
    { x: 400, y: 200 }, { x: 450, y: 200 },
    { x: 600, y: 150 }, { x: 650, y: 150 }, { x: 700, y: 150 },
    { x: 850, y: 230 }, { x: 900, y: 230 },
    { x: 1050, y: 170 }, { x: 1100, y: 170 },
    { x: 1300, y: 210 }, { x: 1350, y: 210 },
    { x: 1550, y: 150 }, { x: 1600, y: 150 }, { x: 1650, y: 150 },
    { x: 1800, y: 230 }, { x: 1850, y: 230 },
    { x: 2050, y: 190 }, { x: 2100, y: 190 }
  ];

  coinPositions.forEach(pos => {
    const coin = new Coin(p, pos.x, pos.y);
    gameState.coins.push(coin);
    gameState.entities.push(coin);
  });

  // Add cloverleaves (health pickups)
  const cloverPositions = [
    { x: 500, y: 200 },
    { x: 1100, y: 170 },
    { x: 1900, y: 230 }
  ];

  cloverPositions.forEach(pos => {
    const clover = new Cloverleaf(p, pos.x, pos.y);
    gameState.cloverleaves.push(clover);
    gameState.entities.push(clover);
  });

  // Add enemies
  const enemyPositions = [
    { x: 300, y: 340 },
    { x: 700, y: 340 },
    { x: 950, y: 260 },
    { x: 1400, y: 340 },
    { x: 1700, y: 340 },
    { x: 1900, y: 260 },
    { x: 2200, y: 340 }
  ];

  enemyPositions.forEach(pos => {
    const enemy = new Enemy(p, pos.x, pos.y, 'walker');
    gameState.enemies.push(enemy);
    gameState.entities.push(enemy);
  });

  // Add flag at the end
  const flag = new Flag(p, levelWidth - 100, CANVAS_HEIGHT - 70);
  gameState.flag = flag;
  gameState.entities.push(flag);
}