// levels.js
import { Platform } from './platform.js';
import { Enemy } from './enemy.js';
import { Spirit } from './spirit.js';
import { WORLD_MATERIAL, WORLD_ENERGY } from './globals.js';

export function createLevel(levelNum) {
  const platforms = [];
  const enemies = [];
  let spirit = null;
  let playerStart = { x: 50, y: 100 };

  if (levelNum === 0) {
    // Tutorial level - basic movement and world shift
    playerStart = { x: 30, y: 300 };
    
    // Ground platforms
    platforms.push(new Platform(0, 350, 200, 50, 'BOTH'));
    platforms.push(new Platform(250, 350, 200, 50, WORLD_MATERIAL));
    platforms.push(new Platform(250, 350, 200, 50, WORLD_ENERGY));
    platforms.push(new Platform(500, 350, 100, 50, 'BOTH'));
    
    // First platform jump
    platforms.push(new Platform(150, 280, 80, 20, 'BOTH'));
    
    // Dimension-specific platforms
    platforms.push(new Platform(280, 220, 100, 20, WORLD_MATERIAL));
    platforms.push(new Platform(400, 220, 100, 20, WORLD_ENERGY));
    
    spirit = new Spirit(550, 320);
    
  } else if (levelNum === 1) {
    // Level 1 - Introducing enemies
    playerStart = { x: 30, y: 300 };
    
    platforms.push(new Platform(0, 350, 150, 50, 'BOTH'));
    platforms.push(new Platform(200, 350, 150, 50, WORLD_MATERIAL));
    platforms.push(new Platform(200, 280, 100, 20, WORLD_ENERGY));
    platforms.push(new Platform(350, 220, 150, 20, WORLD_MATERIAL));
    platforms.push(new Platform(450, 350, 150, 50, 'BOTH'));
    
    enemies.push(new Enemy(220, 330, WORLD_MATERIAL, 80));
    enemies.push(new Enemy(360, 200, WORLD_MATERIAL, 100));
    
    spirit = new Spirit(525, 320);
    
  } else if (levelNum === 2) {
    // Level 2 - Complex dimension puzzle
    playerStart = { x: 30, y: 320 };
    
    platforms.push(new Platform(0, 350, 120, 50, 'BOTH'));
    platforms.push(new Platform(150, 300, 80, 20, WORLD_MATERIAL));
    platforms.push(new Platform(150, 250, 80, 20, WORLD_ENERGY));
    platforms.push(new Platform(260, 200, 100, 20, WORLD_MATERIAL));
    platforms.push(new Platform(260, 280, 100, 20, WORLD_ENERGY));
    platforms.push(new Platform(390, 230, 90, 20, WORLD_ENERGY));
    platforms.push(new Platform(390, 160, 90, 20, WORLD_MATERIAL));
    platforms.push(new Platform(500, 350, 100, 50, 'BOTH'));
    
    enemies.push(new Enemy(160, 280, WORLD_MATERIAL, 50));
    enemies.push(new Enemy(270, 180, WORLD_MATERIAL, 70));
    enemies.push(new Enemy(270, 260, WORLD_ENERGY, 70));
    enemies.push(new Enemy(400, 210, WORLD_ENERGY, 60));
    
    spirit = new Spirit(550, 320);
    
  } else if (levelNum === 3) {
    // Level 3 - Vertical challenge
    playerStart = { x: 30, y: 350 };
    
    platforms.push(new Platform(0, 380, 100, 20, 'BOTH'));
    platforms.push(new Platform(130, 330, 70, 20, WORLD_MATERIAL));
    platforms.push(new Platform(230, 330, 70, 20, WORLD_ENERGY));
    platforms.push(new Platform(130, 270, 70, 20, WORLD_ENERGY));
    platforms.push(new Platform(230, 270, 70, 20, WORLD_MATERIAL));
    platforms.push(new Platform(130, 210, 70, 20, WORLD_MATERIAL));
    platforms.push(new Platform(230, 210, 70, 20, WORLD_ENERGY));
    platforms.push(new Platform(330, 150, 100, 20, 'BOTH'));
    platforms.push(new Platform(460, 200, 80, 20, WORLD_MATERIAL));
    platforms.push(new Platform(460, 270, 80, 20, WORLD_ENERGY));
    platforms.push(new Platform(500, 380, 100, 20, 'BOTH'));
    
    enemies.push(new Enemy(140, 310, WORLD_MATERIAL, 40));
    enemies.push(new Enemy(240, 310, WORLD_ENERGY, 40));
    enemies.push(new Enemy(140, 250, WORLD_ENERGY, 40));
    enemies.push(new Enemy(240, 190, WORLD_ENERGY, 40));
    enemies.push(new Enemy(470, 180, WORLD_MATERIAL, 50));
    
    spirit = new Spirit(550, 360);
    
  } else if (levelNum === 4) {
    // Level 4 - Timing challenge
    playerStart = { x: 30, y: 320 };
    
    platforms.push(new Platform(0, 350, 100, 50, 'BOTH'));
    platforms.push(new Platform(130, 300, 60, 20, WORLD_MATERIAL));
    platforms.push(new Platform(220, 250, 60, 20, WORLD_ENERGY));
    platforms.push(new Platform(310, 200, 60, 20, WORLD_MATERIAL));
    platforms.push(new Platform(400, 250, 60, 20, WORLD_ENERGY));
    platforms.push(new Platform(490, 300, 110, 50, 'BOTH'));
    
    enemies.push(new Enemy(140, 280, WORLD_MATERIAL, 30));
    enemies.push(new Enemy(230, 230, WORLD_ENERGY, 30));
    enemies.push(new Enemy(320, 180, WORLD_MATERIAL, 30));
    enemies.push(new Enemy(410, 230, WORLD_ENERGY, 30));
    
    spirit = new Spirit(545, 270);
    
  } else {
    // Victory lap - celebration level
    playerStart = { x: 280, y: 200 };
    
    // Central platform
    platforms.push(new Platform(250, 250, 100, 20, 'BOTH'));
    
    // Decorative platforms around
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const dist = 120;
      const px = 300 + Math.cos(angle) * dist - 40;
      const py = 270 + Math.sin(angle) * dist - 10;
      const world = i % 2 === 0 ? WORLD_MATERIAL : WORLD_ENERGY;
      platforms.push(new Platform(px, py, 80, 20, world));
    }
    
    spirit = new Spirit(300, 220);
  }

  return { platforms, enemies, spirit, playerStart };
}

export const TOTAL_LEVELS = 6;