// platform.js - Platform and environment structures
import { CANVAS_WIDTH } from './globals.js';

export class Platform {
  constructor(x, y, width, height, type = 'normal') {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type;
  }

  draw(p, cameraY) {
    let screenY = this.y - cameraY;
    
    p.push();
    p.noStroke();
    
    if (this.type === 'citadel') {
      // Citadel platform - golden and ornate
      p.fill(220, 180, 100);
      p.rect(this.x - this.width / 2, screenY, this.width, this.height);
      
      // Decorative elements
      p.fill(240, 200, 120);
      for (let i = 0; i < this.width; i += 30) {
        p.rect(this.x - this.width / 2 + i, screenY, 4, this.height);
      }
      
      // Glow effect
      p.fill(255, 220, 150, 50);
      p.rect(this.x - this.width / 2 - 5, screenY - 10, this.width + 10, 10);
      
    } else if (this.type === 'silk') {
      // Silk-covered platforms
      p.fill(200, 200, 220);
      p.rect(this.x - this.width / 2, screenY, this.width, this.height);
      
      // Silk threads
      p.stroke(220, 220, 240, 100);
      p.strokeWeight(1);
      for (let i = 0; i < this.width; i += 20) {
        p.line(this.x - this.width / 2 + i, screenY, this.x - this.width / 2 + i + 10, screenY + this.height);
      }
      p.noStroke();
      
    } else {
      // Normal stone platforms
      p.fill(80, 70, 90);
      p.rect(this.x - this.width / 2, screenY, this.width, this.height);
      
      // Stone texture
      p.fill(90, 80, 100);
      for (let i = 0; i < this.width; i += 40) {
        p.rect(this.x - this.width / 2 + i + 5, screenY + 2, 30, this.height - 4);
      }
      
      // Moss
      p.fill(60, 100, 60, 150);
      p.rect(this.x - this.width / 2, screenY, this.width, 3);
    }
    
    p.pop();
  }
}

export function createLevelPlatforms(p) {
  const platforms = [];
  
  // Ground level
  platforms.push(new Platform(CANVAS_WIDTH / 2, 380, CANVAS_WIDTH, 40, 'normal'));
  
  // Layer 1 (bottom area)
  platforms.push(new Platform(100, 320, 120, 15, 'normal'));
  platforms.push(new Platform(300, 300, 100, 15, 'normal'));
  platforms.push(new Platform(500, 320, 120, 15, 'normal'));
  
  // Layer 2
  platforms.push(new Platform(150, 250, 100, 15, 'silk'));
  platforms.push(new Platform(400, 240, 120, 15, 'silk'));
  
  // Layer 3
  platforms.push(new Platform(80, 180, 100, 15, 'silk'));
  platforms.push(new Platform(280, 190, 140, 15, 'silk'));
  platforms.push(new Platform(500, 180, 100, 15, 'silk'));
  
  // Layer 4 (upper area)
  platforms.push(new Platform(150, 120, 120, 15, 'silk'));
  platforms.push(new Platform(420, 130, 100, 15, 'silk'));
  
  // Citadel (goal)
  platforms.push(new Platform(300, 50, 180, 20, 'citadel'));
  
  return platforms;
}