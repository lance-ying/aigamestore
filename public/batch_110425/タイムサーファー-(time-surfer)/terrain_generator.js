import { Platform } from './platform.js';
import { Gem } from './gem.js';
import { Obstacle } from './obstacle.js';
import { CANVAS_HEIGHT } from './globals.js';

export class TerrainGenerator {
  constructor(p) {
    this.p = p;
    this.lastPlatformX = 0;
    this.lastPlatformY = CANVAS_HEIGHT - 100;
  }

  generateInitialTerrain(platforms, gems, obstacles) {
    // Generate starting platforms
    for (let i = 0; i < 5; i++) {
      const x = i * 150;
      const y = CANVAS_HEIGHT - 100;
      platforms.push(new Platform(this.p, x, y, 150, 'flat'));
      
      // Add some gems
      if (i > 0) {
        gems.push(new Gem(this.p, x + 75, y - 50));
      }
    }
    this.lastPlatformX = 600;
    this.lastPlatformY = CANVAS_HEIGHT - 100;
  }

  generateTerrain(platforms, gems, obstacles, difficulty) {
    const p = this.p;
    
    // Generate platforms ahead
    while (this.lastPlatformX < platforms[platforms.length - 1].x + 1000) {
      const gap = p.random(50, 150);
      const x = this.lastPlatformX + gap;
      
      // Determine platform type and height
      let type = 'flat';
      let y = this.lastPlatformY;
      
      const rand = p.random();
      if (rand < 0.3) {
        type = 'slope_down';
        y = this.lastPlatformY;
      } else if (rand < 0.5) {
        type = 'slope_up';
        y = this.lastPlatformY + 60;
      } else {
        y = p.constrain(this.lastPlatformY + p.random(-40, 40), 200, CANVAS_HEIGHT - 50);
      }
      
      const width = p.random(120, 200);
      platforms.push(new Platform(p, x, y, width, type));
      
      // Add gems
      const gemCount = p.floor(p.random(1, 4));
      for (let i = 0; i < gemCount; i++) {
        const gemX = x + p.random(20, width - 20);
        const gemY = y - p.random(40, 80);
        gems.push(new Gem(p, gemX, gemY));
      }
      
      // Add obstacles based on difficulty
      if (difficulty > 0.5 && p.random() < 0.3 * difficulty) {
        const obstacleType = p.random() < 0.6 ? 'spike' : 'gap';
        if (obstacleType === 'spike') {
          obstacles.push(new Obstacle(p, x + p.random(20, width - 50), y, 'spike'));
        } else {
          // Create gap between platforms
          if (gap > 100) {
            obstacles.push(new Obstacle(p, this.lastPlatformX + platforms[platforms.length - 2].width, y, 'gap'));
          }
        }
      }
      
      this.lastPlatformX = x;
      this.lastPlatformY = y;
    }
  }

  cleanup(platforms, gems, obstacles, scrollOffset) {
    // Remove platforms that are off-screen
    platforms.splice(0, platforms.findIndex(p => p.x + p.width > scrollOffset - 100));
    gems.splice(0, gems.findIndex(g => !g.collected && g.x > scrollOffset - 100));
    obstacles.splice(0, obstacles.findIndex(o => o.x + o.width > scrollOffset - 100));
  }
}