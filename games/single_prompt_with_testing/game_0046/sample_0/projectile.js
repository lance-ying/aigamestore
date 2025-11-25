// projectile.js
import { gameState } from './globals.js';

export class Projectile {
  constructor(p, x, y, vx, vy, owner = 'enemy') {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.width = 12;
    this.height = 12;
    this.damage = 15;
    this.owner = owner;
    this.dead = false;
    this.lifetime = 120;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.lifetime--;
    
    if (this.lifetime <= 0 || this.y > 400 || this.x < 0 || this.x > gameState.worldWidth) {
      this.dead = true;
    }
  }
  
  draw(p, cameraX) {
    const screenX = this.x - cameraX;
    
    p.push();
    p.fill(150, 50, 200);
    p.noStroke();
    p.circle(screenX + this.width / 2, this.y + this.height / 2, this.width);
    
    // Glow effect
    p.fill(200, 100, 255, 100);
    p.circle(screenX + this.width / 2, this.y + this.height / 2, this.width + 6);
    p.pop();
  }
}