import { gameState, CANVAS_HEIGHT } from './globals.js';

export class Projectile {
  constructor(p, x, y, vx, vy, owner = 'player') {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.owner = owner;
    this.radius = owner === 'player' ? 4 : 5;
    this.damage = owner === 'player' ? 15 : (owner === 'boss' ? 20 : 10);
    this.active = true;
    this.life = 120;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
    
    if (this.life <= 0 || this.y < -50 || this.y > CANVAS_HEIGHT + 50 || 
        this.x < -50 || this.x > gameState.stageWidth + 50) {
      this.active = false;
    }
  }

  draw() {
    if (!this.active) return;
    
    const p = this.p;
    const screenX = this.x - gameState.camera.x;
    const screenY = this.y - gameState.camera.y;
    
    p.push();
    p.translate(screenX, screenY);
    
    if (this.owner === 'player') {
      // Player projectile (blue energy)
      p.fill(100, 200, 255);
      p.noStroke();
      p.ellipse(0, 0, this.radius * 2, this.radius * 2);
      p.fill(200, 230, 255, 150);
      p.ellipse(0, 0, this.radius * 3, this.radius * 3);
    } else if (this.owner === 'boss') {
      // Boss projectile (purple)
      p.fill(200, 50, 255);
      p.ellipse(0, 0, this.radius * 2, this.radius * 2);
      p.fill(255, 100, 255, 100);
      p.ellipse(0, 0, this.radius * 3, this.radius * 3);
    } else {
      // Enemy projectile (red)
      p.fill(255, 50, 50);
      p.ellipse(0, 0, this.radius * 2, this.radius * 2);
      p.fill(255, 100, 100, 100);
      p.ellipse(0, 0, this.radius * 3, this.radius * 3);
    }
    
    p.pop();
  }
}