import { gameState } from './globals.js';
import { Platform, Spike, SaveStation, LifeCapsule, BoosterUpgrade, Boss, WaterZone, ExpTriangle, Enemy } from './entities.js';

export function createLevel(p) {
  gameState.platforms = [];
  gameState.hazards = [];
  gameState.collectibles = [];
  gameState.saveStations = [];
  gameState.entities = [];
  gameState.enemies = [];
  
  // Ground
  gameState.platforms.push(new Platform(p, 0, 380, 600, 20, "normal"));
  gameState.platforms.push(new Platform(p, 600, 380, 600, 20, "normal"));
  gameState.platforms.push(new Platform(p, 1200, 380, 600, 20, "normal"));
  gameState.platforms.push(new Platform(p, 1800, 380, 600, 20, "normal"));
  gameState.platforms.push(new Platform(p, 2400, 380, 600, 20, "normal"));
  
  // Starting area platforms
  gameState.platforms.push(new Platform(p, 100, 320, 100, 15, "normal"));
  gameState.platforms.push(new Platform(p, 250, 260, 100, 15, "normal"));
  gameState.platforms.push(new Platform(p, 400, 200, 100, 15, "normal"));
  
  // Save station at start
  gameState.saveStations.push(new SaveStation(p, 50, 320));
  
  // Early enemies
  gameState.enemies.push(new Enemy(p, 300, 350, 200, 400));
  gameState.enemies.push(new Enemy(p, 500, 350, 450, 650));
  
  // Early hazards
  gameState.hazards.push(new Spike(p, 550, 365, 45, "up"));
  gameState.hazards.push(new Spike(p, 700, 365, 60, "up"));
  
  // Mid-level platforms and challenges
  gameState.platforms.push(new Platform(p, 800, 320, 80, 15, "normal"));
  gameState.platforms.push(new Platform(p, 950, 280, 80, 15, "normal"));
  gameState.platforms.push(new Platform(p, 1100, 240, 80, 15, "normal"));
  
  // Enemies on platforms
  gameState.enemies.push(new Enemy(p, 850, 305, 800, 880));
  gameState.enemies.push(new Enemy(p, 1000, 265, 950, 1030));
  
  // Life capsule
  gameState.collectibles.push(new LifeCapsule(p, 950, 240));
  
  // Water zone
  const water = new WaterZone(p, 1200, 300, 400, 100);
  gameState.entities.push(water);
  
  // Underwater platforms
  gameState.platforms.push(new Platform(p, 1250, 350, 60, 15, "metal"));
  gameState.platforms.push(new Platform(p, 1400, 320, 60, 15, "metal"));
  
  // Enemy near water
  gameState.enemies.push(new Enemy(p, 1300, 335, 1250, 1350));
  
  // More hazards
  gameState.hazards.push(new Spike(p, 1650, 365, 90, "up"));
  
  // Upper area with booster
  gameState.platforms.push(new Platform(p, 1700, 250, 100, 15, "normal"));
  gameState.platforms.push(new Platform(p, 1850, 180, 100, 15, "normal"));
  gameState.collectibles.push(new BoosterUpgrade(p, 1850, 140));
  
  // Enemy guarding booster
  gameState.enemies.push(new Enemy(p, 1750, 235, 1700, 1800));
  
  // Save station mid-level
  gameState.saveStations.push(new SaveStation(p, 1950, 320));
  
  // Challenge section
  gameState.platforms.push(new Platform(p, 2100, 320, 60, 15, "normal"));
  gameState.platforms.push(new Platform(p, 2200, 280, 60, 15, "normal"));
  gameState.platforms.push(new Platform(p, 2300, 240, 60, 15, "normal"));
  
  // More enemies in challenge section
  gameState.enemies.push(new Enemy(p, 2130, 305, 2100, 2160));
  gameState.enemies.push(new Enemy(p, 2230, 265, 2200, 2260));
  
  gameState.hazards.push(new Spike(p, 2050, 365, 45, "up"));
  gameState.hazards.push(new Spike(p, 2250, 365, 45, "up"));
  gameState.hazards.push(new Spike(p, 2450, 365, 45, "up"));
  
  // Boss platform
  gameState.platforms.push(new Platform(p, 2550, 300, 400, 20, "metal"));
  
  // Final enemy before boss
  gameState.enemies.push(new Enemy(p, 2600, 285, 2550, 2750));
  
  // Boss
  gameState.boss = new Boss(p, 2750, 200);
  
  // Scatter some EXP triangles
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * 2000 + 100;
    const y = 350;
    gameState.collectibles.push(new ExpTriangle(p, x, y));
  }
}