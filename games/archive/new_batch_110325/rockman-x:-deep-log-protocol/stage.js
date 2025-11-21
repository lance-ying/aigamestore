import { Platform } from './platform.js';
import { Enemy, Boss } from './enemy.js';
import { Collectible } from './collectible.js';
import { gameState } from './globals.js';

export function createStage(p, stageNumber) {
  switch (stageNumber) {
    case 1:
      return createStage1(p);
    case 2:
      return createStage2(p);
    case 3:
      return createStage3(p);
    default:
      return createStage1(p);
  }
}

export function createStage1(p) {
  const platforms = [];
  const enemies = [];
  const collectibles = [];
  
  // Ground
  platforms.push(new Platform(p, 0, 380, 2400, 20, 'ground'));
  
  // Starting area platforms
  platforms.push(new Platform(p, 200, 320, 120, 15, 'normal'));
  platforms.push(new Platform(p, 400, 260, 120, 15, 'normal'));
  platforms.push(new Platform(p, 600, 200, 120, 15, 'normal'));
  
  // Middle section
  platforms.push(new Platform(p, 850, 280, 150, 15, 'normal'));
  platforms.push(new Platform(p, 1100, 240, 100, 15, 'normal'));
  platforms.push(new Platform(p, 1300, 200, 120, 15, 'normal'));
  
  // Gap section
  platforms.push(new Platform(p, 1550, 300, 80, 15, 'normal'));
  platforms.push(new Platform(p, 1700, 250, 80, 15, 'normal'));
  
  // Boss area
  platforms.push(new Platform(p, 1900, 320, 200, 15, 'normal'));
  platforms.push(new Platform(p, 2150, 280, 150, 15, 'normal'));
  
  // Enemies
  enemies.push(new Enemy(p, 350, 300, 'basic'));
  enemies.push(new Enemy(p, 550, 240, 'basic'));
  enemies.push(new Enemy(p, 900, 260, 'advanced'));
  enemies.push(new Enemy(p, 1150, 220, 'basic'));
  enemies.push(new Enemy(p, 1350, 180, 'advanced'));
  enemies.push(new Enemy(p, 1600, 280, 'basic'));
  enemies.push(new Enemy(p, 2000, 300, 'advanced'));
  
  // Collectibles
  collectibles.push(new Collectible(p, 300, 290, 'energy'));
  collectibles.push(new Collectible(p, 450, 230, 'health'));
  collectibles.push(new Collectible(p, 950, 250, 'energy'));
  collectibles.push(new Collectible(p, 1200, 210, 'energy'));
  collectibles.push(new Collectible(p, 1600, 270, 'health'));
  collectibles.push(new Collectible(p, 1950, 290, 'energy'));
  
  return { platforms, enemies, collectibles };
}

export function createStage2(p) {
  const platforms = [];
  const enemies = [];
  const collectibles = [];
  
  // Ground
  platforms.push(new Platform(p, 0, 380, 2400, 20, 'ground'));
  
  // Elevated starting area
  platforms.push(new Platform(p, 100, 300, 200, 15, 'normal'));
  
  // Descending platforms
  platforms.push(new Platform(p, 350, 330, 100, 15, 'normal'));
  platforms.push(new Platform(p, 500, 360, 100, 15, 'normal'));
  
  // Mid section with gaps
  platforms.push(new Platform(p, 700, 320, 120, 15, 'normal'));
  platforms.push(new Platform(p, 900, 260, 100, 15, 'normal'));
  platforms.push(new Platform(p, 1100, 220, 120, 15, 'normal'));
  platforms.push(new Platform(p, 1300, 280, 100, 15, 'normal'));
  
  // Upper path
  platforms.push(new Platform(p, 1500, 200, 150, 15, 'normal'));
  platforms.push(new Platform(p, 1720, 180, 120, 15, 'normal'));
  
  // Boss area
  platforms.push(new Platform(p, 1920, 320, 180, 15, 'normal'));
  platforms.push(new Platform(p, 2150, 260, 150, 15, 'normal'));
  
  // More enemies in stage 2
  enemies.push(new Enemy(p, 200, 280, 'advanced'));
  enemies.push(new Enemy(p, 420, 310, 'basic'));
  enemies.push(new Enemy(p, 750, 300, 'advanced'));
  enemies.push(new Enemy(p, 950, 240, 'advanced'));
  enemies.push(new Enemy(p, 1150, 200, 'basic'));
  enemies.push(new Enemy(p, 1350, 260, 'advanced'));
  enemies.push(new Enemy(p, 1550, 180, 'advanced'));
  enemies.push(new Enemy(p, 1770, 160, 'basic'));
  enemies.push(new Enemy(p, 1970, 300, 'advanced'));
  enemies.push(new Enemy(p, 2200, 240, 'advanced'));
  
  // Collectibles
  collectibles.push(new Collectible(p, 150, 270, 'health'));
  collectibles.push(new Collectible(p, 425, 300, 'energy'));
  collectibles.push(new Collectible(p, 800, 290, 'energy'));
  collectibles.push(new Collectible(p, 1000, 230, 'health'));
  collectibles.push(new Collectible(p, 1200, 190, 'energy'));
  collectibles.push(new Collectible(p, 1400, 250, 'energy'));
  collectibles.push(new Collectible(p, 1600, 170, 'health'));
  collectibles.push(new Collectible(p, 2000, 290, 'energy'));
  
  return { platforms, enemies, collectibles };
}

export function createStage3(p) {
  const platforms = [];
  const enemies = [];
  const collectibles = [];
  
  // Ground
  platforms.push(new Platform(p, 0, 380, 2400, 20, 'ground'));
  
  // Complex vertical layout
  platforms.push(new Platform(p, 150, 320, 120, 15, 'normal'));
  platforms.push(new Platform(p, 150, 240, 120, 15, 'normal'));
  
  // Maze-like section
  platforms.push(new Platform(p, 350, 300, 100, 15, 'normal'));
  platforms.push(new Platform(p, 520, 260, 100, 15, 'normal'));
  platforms.push(new Platform(p, 350, 220, 100, 15, 'normal'));
  platforms.push(new Platform(p, 520, 180, 100, 15, 'normal'));
  
  // Climbing section
  platforms.push(new Platform(p, 720, 320, 80, 15, 'normal'));
  platforms.push(new Platform(p, 880, 280, 80, 15, 'normal'));
  platforms.push(new Platform(p, 1040, 240, 80, 15, 'normal'));
  platforms.push(new Platform(p, 1200, 200, 80, 15, 'normal'));
  platforms.push(new Platform(p, 1360, 160, 100, 15, 'normal'));
  
  // Final gauntlet
  platforms.push(new Platform(p, 1550, 280, 120, 15, 'normal'));
  platforms.push(new Platform(p, 1750, 240, 100, 15, 'normal'));
  
  // Boss area
  platforms.push(new Platform(p, 1950, 300, 200, 15, 'normal'));
  platforms.push(new Platform(p, 2200, 250, 150, 15, 'normal'));
  
  // Maximum enemy count for final stage
  enemies.push(new Enemy(p, 200, 300, 'advanced'));
  enemies.push(new Enemy(p, 200, 220, 'advanced'));
  enemies.push(new Enemy(p, 400, 280, 'advanced'));
  enemies.push(new Enemy(p, 570, 240, 'advanced'));
  enemies.push(new Enemy(p, 400, 200, 'basic'));
  enemies.push(new Enemy(p, 570, 160, 'advanced'));
  enemies.push(new Enemy(p, 770, 300, 'advanced'));
  enemies.push(new Enemy(p, 930, 260, 'advanced'));
  enemies.push(new Enemy(p, 1090, 220, 'basic'));
  enemies.push(new Enemy(p, 1250, 180, 'advanced'));
  enemies.push(new Enemy(p, 1410, 140, 'advanced'));
  enemies.push(new Enemy(p, 1600, 260, 'advanced'));
  enemies.push(new Enemy(p, 1800, 220, 'advanced'));
  enemies.push(new Enemy(p, 2000, 280, 'advanced'));
  
  // Generous collectibles for final stage
  collectibles.push(new Collectible(p, 220, 310, 'health'));
  collectibles.push(new Collectible(p, 220, 230, 'energy'));
  collectibles.push(new Collectible(p, 450, 270, 'energy'));
  collectibles.push(new Collectible(p, 620, 230, 'health'));
  collectibles.push(new Collectible(p, 450, 190, 'energy'));
  collectibles.push(new Collectible(p, 820, 290, 'energy'));
  collectibles.push(new Collectible(p, 1140, 210, 'health'));
  collectibles.push(new Collectible(p, 1300, 170, 'energy'));
  collectibles.push(new Collectible(p, 1650, 250, 'health'));
  collectibles.push(new Collectible(p, 1850, 210, 'energy'));
  collectibles.push(new Collectible(p, 2050, 270, 'health'));
  
  return { platforms, enemies, collectibles };
}