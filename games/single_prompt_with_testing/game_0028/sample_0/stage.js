// stage.js - Stage platforms and environment

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Platform {
  constructor(x, y, width, height, canDropThrough = false) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.canDropThrough = canDropThrough;
  }
  
  render(p) {
    p.push();
    
    if (this.canDropThrough) {
      // Semi-transparent platform
      p.fill(100, 120, 140);
      p.stroke(80, 100, 120);
    } else {
      // Solid platform
      p.fill(60, 80, 100);
      p.stroke(40, 60, 80);
    }
    
    p.strokeWeight(2);
    p.rect(this.x, this.y, this.width, this.height, 5);
    
    // Platform texture
    p.noStroke();
    p.fill(80, 100, 120, 100);
    for (let i = 0; i < this.width; i += 20) {
      p.rect(this.x + i, this.y + 2, 15, 4);
    }
    
    p.pop();
  }
}

export function createStage() {
  const platforms = [];
  
  // Main ground platform
  platforms.push(new Platform(50, CANVAS_HEIGHT - 50, CANVAS_WIDTH - 100, 20, false));
  
  // Left platform
  platforms.push(new Platform(80, CANVAS_HEIGHT - 150, 120, 15, true));
  
  // Right platform
  platforms.push(new Platform(CANVAS_WIDTH - 200, CANVAS_HEIGHT - 150, 120, 15, true));
  
  // Top center platform
  platforms.push(new Platform(CANVAS_WIDTH / 2 - 80, CANVAS_HEIGHT - 250, 160, 15, true));
  
  return platforms;
}

export function renderBackground(p) {
  // Sky gradient
  for (let y = 0; y < CANVAS_HEIGHT; y++) {
    const inter = y / CANVAS_HEIGHT;
    const col = p.lerpColor(
      p.color(135, 206, 235),
      p.color(70, 130, 180),
      inter
    );
    p.stroke(col);
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Clouds
  p.noStroke();
  p.fill(255, 255, 255, 150);
  p.ellipse(100, 80, 60, 30);
  p.ellipse(130, 75, 40, 25);
  p.ellipse(450, 120, 80, 40);
  p.ellipse(490, 115, 50, 30);
  
  // Mountains in background
  p.fill(100, 100, 120, 100);
  p.triangle(-50, CANVAS_HEIGHT - 50, 150, 150, 300, CANVAS_HEIGHT - 50);
  p.triangle(200, CANVAS_HEIGHT - 50, 400, 120, 650, CANVAS_HEIGHT - 50);
}