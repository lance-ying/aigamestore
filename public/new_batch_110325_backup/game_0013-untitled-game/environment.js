// environment.js - Level environment and platforms
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Platform {
  constructor(p, x, y, width, height) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  draw() {
    const p = this.p;
    p.push();
    p.fill(60, 60, 80);
    p.stroke(40, 40, 60);
    p.strokeWeight(2);
    p.rect(this.x, this.y, this.width, this.height);
    
    // Add some detail lines
    p.stroke(80, 80, 100);
    p.strokeWeight(1);
    for (let i = 0; i < this.width; i += 20) {
      p.line(this.x + i, this.y, this.x + i, this.y + this.height);
    }
    p.pop();
  }
}

export class Ladder {
  constructor(p, x, y, width, height) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  draw() {
    const p = this.p;
    p.push();
    p.stroke(120, 100, 60);
    p.strokeWeight(4);
    p.line(this.x + 5, this.y, this.x + 5, this.y + this.height);
    p.line(this.x + this.width - 5, this.y, this.x + this.width - 5, this.y + this.height);
    
    p.strokeWeight(2);
    for (let i = 0; i < this.height; i += 15) {
      p.line(this.x + 5, this.y + i, this.x + this.width - 5, this.y + i);
    }
    p.pop();
  }
}

export class Trap {
  constructor(p, x, y, width, height, type) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type;
    this.active = true;
    this.animFrame = 0;
  }

  update() {
    this.animFrame++;
  }

  draw() {
    const p = this.p;
    p.push();
    
    switch(this.type) {
      case "spike":
        p.fill(120, 120, 120);
        p.noStroke();
        p.rect(this.x, this.y + this.height - 5, this.width, 5);
        p.fill(200, 50, 50);
        p.stroke(100, 30, 30);
        p.strokeWeight(1);
        for (let i = 0; i < this.width; i += 10) {
          p.triangle(
            this.x + i, this.y + this.height,
            this.x + i + 5, this.y,
            this.x + i + 10, this.y + this.height
          );
        }
        break;
        
      case "electric":
        p.noStroke();
        const brightness = (Math.sin(this.animFrame * 0.2) + 1) * 127;
        p.fill(100, 150, 255, 100);
        p.rect(this.x, this.y, this.width, this.height);
        p.stroke(150, 200, 255, brightness);
        p.strokeWeight(2);
        for (let i = 0; i < 5; i++) {
          const x1 = this.x + (i / 5) * this.width;
          const x2 = this.x + ((i + 1) / 5) * this.width;
          const y1 = this.y + p.random(this.height);
          const y2 = this.y + p.random(this.height);
          p.line(x1, y1, x2, y2);
        }
        break;
        
      case "pit":
        p.fill(20, 20, 30);
        p.stroke(40, 40, 50);
        p.strokeWeight(2);
        p.rect(this.x, this.y, this.width, this.height);
        p.fill(0, 0, 0, 100);
        p.noStroke();
        p.rect(this.x + 5, this.y + 5, this.width - 10, this.height - 10);
        break;
    }
    
    p.pop();
  }
}

export class Background {
  constructor(p) {
    this.p = p;
  }

  draw(floorConfig) {
    const p = this.p;
    const bgColor = floorConfig.bgColor;
    
    // Gradient background
    for (let y = 0; y < CANVAS_HEIGHT; y++) {
      const inter = y / CANVAS_HEIGHT;
      const c = p.lerpColor(
        p.color(bgColor[0] * 0.5, bgColor[1] * 0.5, bgColor[2] * 0.5),
        p.color(bgColor[0], bgColor[1], bgColor[2]),
        inter
      );
      p.stroke(c);
      p.line(0, y, CANVAS_WIDTH, y);
    }
    
    // Ground
    p.fill(40, 40, 50);
    p.noStroke();
    p.rect(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 50);
    
    // Ground details
    p.stroke(60, 60, 70);
    p.strokeWeight(1);
    for (let i = 0; i < CANVAS_WIDTH; i += 30) {
      p.line(i, CANVAS_HEIGHT - 50, i, CANVAS_HEIGHT);
    }
    
    // Floor name
    p.fill(255, 255, 255, 100);
    p.noStroke();
    p.textSize(14);
    p.textAlign(p.LEFT, p.TOP);
    p.text(floorConfig.name, 10, 10);
  }
}