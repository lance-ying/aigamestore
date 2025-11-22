import { Platform } from './platform.js';
import { Enemy, Boss } from './enemy.js';
import { Collectible } from './collectible.js';
import { gameState } from './globals.js';

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