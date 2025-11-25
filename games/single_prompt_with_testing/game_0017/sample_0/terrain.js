// terrain.js - Terrain generation

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';
import { Enemy } from './entities.js';

export class Terrain {
  constructor(x, y, width, height, type = 'solid', destructible = false) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type; // 'solid', 'platform'
    this.destructible = destructible;
    this.health = 100;
  }
  
  draw(p) {
    p.push();
    p.translate(0, -gameState.cameraY);
    
    if (this.type === 'platform') {
      p.fill(80, 60, 40);
      p.rect(this.x, this.y, this.width, 8);
    } else {
      if (this.destructible) {
        const healthRatio = this.health / 100;
        p.fill(101, 67, 33, healthRatio * 255);
        p.rect(this.x, this.y, this.width, this.height);
        
        // Wood grain
        p.stroke(80, 50, 20, healthRatio * 100);
        for (let i = 0; i < this.width; i += 5) {
          p.line(this.x + i, this.y, this.x + i, this.y + this.height);
        }
        p.noStroke();
      } else {
        p.fill(70, 70, 80);
        p.rect(this.x, this.y, this.width, this.height);
        
        // Stone texture
        p.fill(60, 60, 70);
        for (let i = 0; i < this.width; i += 15) {
          for (let j = 0; j < this.height; j += 15) {
            p.rect(this.x + i + 2, this.y + j + 2, 4, 4);
          }
        }
      }
    }
    
    p.pop();
  }
}

export function generateRoom(roomIndex, p) {
  const baseY = roomIndex * gameState.roomHeight;
  const terrain = [];
  const entities = [];
  
  // Floor
  terrain.push(new Terrain(0, baseY + 390, CANVAS_WIDTH, 10, 'solid', false));
  
  // Side walls
  terrain.push(new Terrain(0, baseY, 20, CANVAS_HEIGHT, 'solid', false));
  terrain.push(new Terrain(CANVAS_WIDTH - 20, baseY, 20, CANVAS_HEIGHT, 'solid', false));
  
  // Room-specific generation
  if (roomIndex === 0) {
    // Starting room - simple
    terrain.push(new Terrain(100, baseY + 300, 150, 20, 'platform', false));
    terrain.push(new Terrain(350, baseY + 250, 150, 20, 'platform', false));
    
    entities.push(new Enemy(400, baseY + 200, 'basic'));
  } else if (roomIndex === 1) {
    // More platforms, destructible blocks
    terrain.push(new Terrain(150, baseY + 280, 100, 30, 'solid', true));
    terrain.push(new Terrain(350, baseY + 280, 100, 30, 'solid', true));
    terrain.push(new Terrain(200, baseY + 200, 200, 20, 'platform', false));
    
    entities.push(new Enemy(250, baseY + 150, 'basic'));
    entities.push(new Enemy(450, baseY + 150, 'basic'));
  } else if (roomIndex === 2) {
    // Vertical challenge
    terrain.push(new Terrain(80, baseY + 320, 100, 20, 'platform', false));
    terrain.push(new Terrain(300, baseY + 260, 100, 20, 'platform', false));
    terrain.push(new Terrain(150, baseY + 200, 100, 20, 'platform', false));
    terrain.push(new Terrain(400, baseY + 140, 100, 20, 'platform', false));
    
    terrain.push(new Terrain(250, baseY + 280, 60, 40, 'solid', true));
    
    entities.push(new Enemy(350, baseY + 210, 'basic'));
    entities.push(new Enemy(450, baseY + 90, 'tough'));
  } else if (roomIndex === 3) {
    // Maze-like with enemies
    terrain.push(new Terrain(100, baseY + 300, 100, 80, 'solid', true));
    terrain.push(new Terrain(300, baseY + 250, 100, 130, 'solid', true));
    terrain.push(new Terrain(150, baseY + 180, 200, 20, 'platform', false));
    terrain.push(new Terrain(450, baseY + 200, 100, 20, 'platform', false));
    
    entities.push(new Enemy(200, baseY + 130, 'basic'));
    entities.push(new Enemy(400, baseY + 130, 'basic'));
    entities.push(new Enemy(500, baseY + 150, 'tough'));
  } else if (roomIndex === 4) {
    // Combat arena
    terrain.push(new Terrain(150, baseY + 250, 300, 20, 'platform', false));
    terrain.push(new Terrain(100, baseY + 300, 80, 60, 'solid', true));
    terrain.push(new Terrain(420, baseY + 300, 80, 60, 'solid', true));
    
    entities.push(new Enemy(200, baseY + 200, 'tough'));
    entities.push(new Enemy(300, baseY + 200, 'basic'));
    entities.push(new Enemy(400, baseY + 200, 'tough'));
  } else if (roomIndex === 5) {
    // Final room - victory chamber
    terrain.push(new Terrain(50, baseY + 300, 500, 20, 'platform', false));
    terrain.push(new Terrain(250, baseY + 200, 100, 80, 'solid', false));
    
    // Victory pedestal
    terrain.push(new Terrain(275, baseY + 170, 50, 30, 'solid', false));
  }
  
  return { terrain, entities };
}