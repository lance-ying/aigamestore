import { gameState } from './globals.js';

export class Particle {
  constructor(p, x, y, vx, vy, color, life = 30) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.size = 4;
    this.active = true;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2;
    this.life--;
    if (this.life <= 0) {
      this.active = false;
    }
  }

  draw() {
    if (!this.active) return;
    
    const p = this.p;
    const screenX = this.x - gameState.camera.x;
    const screenY = this.y - gameState.camera.y;
    
    const alpha = (this.life / this.maxLife) * 255;
    p.fill(...this.color, alpha);
    p.noStroke();
    p.ellipse(screenX, screenY, this.size, this.size);
  }
}