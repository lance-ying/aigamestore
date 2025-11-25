// level.js - Level generation
import { gameState } from './globals.js';
import { Platform, Ring, Enemy, GoalPost, Spring } from './entities.js';

export function generateLevel(p) {
  const platforms = [];
  const rings = [];
  const enemies = [];
  const springs = [];
  
  // Ground
  platforms.push(new Platform(p, gameState.levelWidth / 2, 380, gameState.levelWidth, 40, [80, 150, 80]));
  
  // Starting area platforms
  platforms.push(new Platform(p, 150, 320, 200, 20, [100, 200, 100]));
  platforms.push(new Platform(p, 350, 260, 150, 20, [100, 200, 100]));
  platforms.push(new Platform(p, 550, 200, 150, 20, [100, 200, 100]));
  
  // Mid section with loops and curves
  for (let i = 0; i < 5; i++) {
    const x = 700 + i * 200;
    const y = 300 - Math.sin(i * 0.8) * 50;
    platforms.push(new Platform(p, x, y, 120, 20, [120, 180, 120]));
  }
  
  // Upper path
  platforms.push(new Platform(p, 1800, 150, 200, 20, [100, 200, 100]));
  platforms.push(new Platform(p, 2050, 150, 200, 20, [100, 200, 100]));
  
  // Lower path
  platforms.push(new Platform(p, 1800, 330, 200, 20, [100, 200, 100]));
  platforms.push(new Platform(p, 2050, 330, 200, 20, [100, 200, 100]));
  
  // Final stretch
  platforms.push(new Platform(p, 2400, 280, 300, 20, [100, 200, 100]));
  platforms.push(new Platform(p, 2750, 280, 200, 20, [100, 200, 100]));
  
  // Add rings
  // Starting area rings
  for (let i = 0; i < 10; i++) {
    rings.push(new Ring(p, 100 + i * 40, 280));
  }
  
  // Platform rings
  for (let i = 0; i < 8; i++) {
    rings.push(new Ring(p, 350 + i * 30, 220));
  }
  
  // Mid section rings
  for (let i = 0; i < 15; i++) {
    const x = 700 + i * 80;
    const y = 250 - Math.sin(i * 0.8) * 50;
    rings.push(new Ring(p, x, y));
  }
  
  // Upper path rings
  for (let i = 0; i < 10; i++) {
    rings.push(new Ring(p, 1800 + i * 45, 110));
  }
  
  // Lower path rings
  for (let i = 0; i < 10; i++) {
    rings.push(new Ring(p, 1800 + i * 45, 290));
  }
  
  // Final stretch rings
  for (let i = 0; i < 15; i++) {
    rings.push(new Ring(p, 2300 + i * 40, 240));
  }
  
  // Add enemies
  enemies.push(new Enemy(p, 400, 240, 'basic'));
  enemies.push(new Enemy(p, 600, 180, 'basic'));
  enemies.push(new Enemy(p, 900, 280, 'patrol'));
  enemies.push(new Enemy(p, 1200, 280, 'patrol'));
  enemies.push(new Enemy(p, 1600, 320, 'basic'));
  enemies.push(new Enemy(p, 1850, 310, 'basic'));
  enemies.push(new Enemy(p, 2100, 130, 'basic'));
  enemies.push(new Enemy(p, 2500, 260, 'patrol'));
  
  // Add springs
  springs.push(new Spring(p, 500, 370));
  springs.push(new Spring(p, 1500, 370));
  springs.push(new Spring(p, 2200, 370));
  
  // Add goal post at the end
  const goalPost = new GoalPost(p, 2850, 230);
  
  return { platforms, rings, enemies, goalPost, springs };
}