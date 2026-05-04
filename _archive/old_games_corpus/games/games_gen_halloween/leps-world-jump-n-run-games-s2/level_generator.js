// level_generator.js - Level generation
import { gameState } from './globals.js';
import { Platform, Goal } from './platform.js';
import { Enemy } from './enemies.js';
import { Coin, Cloverleaf } from './collectibles.js';

export function generateLevel(p, levelNum) {
  const platforms = [];
  const enemies = [];
  const coins = [];
  const powerups = [];
  
  // Level dimensions
  const levelWidth = 3000;
  const groundY = 360;
  
  // Ground platforms
  for (let x = 0; x < levelWidth; x += 200) {
    platforms.push(new Platform(p, x, groundY, 200, 40, "grass"));
  }
  
  // Generate platforms based on level progression
  const numPlatforms = 15 + levelNum * 2;
  const platformSpacing = levelWidth / numPlatforms;
  
  for (let i = 0; i < numPlatforms; i++) {
    const x = platformSpacing * i + p.random(50, 150);
    const y = p.random(150, 320);
    const width = p.random(80, 160);
    const height = 20;
    const types = ["grass", "stone", "wood"];
    const type = types[Math.floor(i / 5) % types.length];
    
    platforms.push(new Platform(p, x, y, width, height, type));
    
    // Add coins above platforms
    if (p.random() > 0.3) {
      const numCoins = Math.floor(p.random(2, 5));
      for (let j = 0; j < numCoins; j++) {
        coins.push(new Coin(p, x + (width / numCoins) * j + 20, y - 30));
      }
    }
  }
  
  // Add gaps (pits)
  const numGaps = 3 + Math.floor(levelNum / 2);
  for (let i = 0; i < numGaps; i++) {
    const gapX = p.random(400, levelWidth - 400);
    const gapWidth = p.random(150, 250);
    
    // Remove ground platforms in gap
    for (let j = platforms.length - 1; j >= 0; j--) {
      const plat = platforms[j];
      if (plat.y > 350 && plat.x < gapX + gapWidth && plat.x + plat.width > gapX) {
        platforms.splice(j, 1);
      }
    }
  }
  
  // Add enemies
  const numEnemies = 8 + levelNum;
  for (let i = 0; i < numEnemies; i++) {
    const x = p.random(300, levelWidth - 300);
    const enemyTypes = ["bee", "beetle", "snail"];
    const type = enemyTypes[Math.floor(p.random(enemyTypes.length))];
    
    let y;
    if (type === "bee") {
      y = p.random(100, 300);
    } else {
      // Place ground enemies on platforms
      const plat = platforms[Math.floor(p.random(platforms.length))];
      y = plat.y - 20;
    }
    
    const enemy = new Enemy(p, x, y, type);
    enemy.startX = x;
    enemies.push(enemy);
  }
  
  // Add cloverleaf power-ups
  const numPowerups = 3;
  for (let i = 0; i < numPowerups; i++) {
    const plat = platforms[Math.floor(p.random(5, platforms.length))];
    powerups.push(new Cloverleaf(p, plat.x + plat.width / 2, plat.y - 40));
  }
  
  // Add goal flag
  const goalPlat = platforms[platforms.length - 5];
  const goal = new Goal(p, goalPlat.x + goalPlat.width / 2, goalPlat.y - 100);
  
  return { platforms, enemies, coins, powerups, goal, levelWidth };
}