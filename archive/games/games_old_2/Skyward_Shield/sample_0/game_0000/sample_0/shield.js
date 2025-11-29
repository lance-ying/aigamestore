import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, KEYS } from './globals.js';

export class Shield {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = 80;
    this.height = 80;
    this.speed = 4;
    this.fastSpeed = 7;
    this.opacity = 180;
  }

  update(keys) {
    const speed = keys[KEYS.SHIFT] ? this.fastSpeed : this.speed;
    
    if (keys[KEYS.LEFT]) {
      this.x -= speed;
    }
    if (keys[KEYS.RIGHT]) {
      this.x += speed;
    }
    if (keys[KEYS.UP]) {
      this.y -= speed;
    }
    if (keys[KEYS.DOWN]) {
      this.y += speed;
    }
    
    // Constrain to canvas
    this.x = this.p.constrain(this.x, this.width / 2, CANVAS_WIDTH - this.width / 2);
    this.y = this.p.constrain(this.y, this.height / 2, CANVAS_HEIGHT - this.height / 2);
    
    gameState.shieldX = this.x;
    gameState.shieldY = this.y;
  }

  draw() {
    const p = this.p;
    
    p.push();
    p.fill(200, 200, 200, this.opacity);
    p.stroke(150, 150, 150);
    p.strokeWeight(2);
    p.rectMode(p.CENTER);
    p.rect(this.x, this.y, this.width, this.height, 10);
    
    // Grid pattern
    p.stroke(150, 150, 150, 100);
    p.strokeWeight(1);
    for (let i = -1; i <= 1; i++) {
      p.line(this.x + i * 20, this.y - 30, this.x + i * 20, this.y + 30);
      p.line(this.x - 30, this.y + i * 20, this.x + 30, this.y + i * 20);
    }
    
    p.pop();
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }
}