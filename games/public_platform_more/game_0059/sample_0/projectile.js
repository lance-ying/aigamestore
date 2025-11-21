import { gameState } from './globals.js';

export class Projectile {
  constructor(x, y, target, damage, tier) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.damage = damage;
    this.tier = tier;
    this.speed = 5;
    this.alive = true;
    this.size = 3 + tier;
  }
  
  update() {
    if (!this.target || !this.target.alive) {
      this.alive = false;
      return;
    }
    
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < this.speed) {
      this.target.takeDamage(this.damage);
      this.alive = false;
    } else {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }
  }
  
  draw(p) {
    if (!this.alive) return;
    
    p.push();
    p.fill(255, 200, 100);
    p.noStroke();
    p.circle(this.x, this.y, this.size * 2);
    
    // Trail effect
    p.fill(255, 150, 50, 100);
    p.circle(this.x, this.y, this.size * 3);
    p.pop();
  }
}