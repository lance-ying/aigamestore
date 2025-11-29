// bullet.js - Bullet projectile

export class Bullet {
  constructor(x, y, targetX, targetY) {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.targetX = targetX;
    this.targetY = targetY;
    this.active = true;
    this.speed = 30;
    
    // Calculate direction
    const dx = targetX - x;
    const dy = targetY - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    this.vx = (dx / dist) * this.speed;
    this.vy = (dy / dist) * this.speed;
    
    this.maxDistance = dist;
    this.traveledDistance = 0;
  }
  
  update() {
    if (!this.active) return;
    
    this.x += this.vx;
    this.y += this.vy;
    
    this.traveledDistance += this.speed;
    
    if (this.traveledDistance >= this.maxDistance) {
      this.active = false;
    }
  }
  
  draw(p) {
    if (!this.active) return;
    
    p.push();
    p.stroke(255, 255, 0);
    p.strokeWeight(2);
    p.line(this.x, this.y, this.x - this.vx * 0.3, this.y - this.vy * 0.3);
    p.pop();
  }
}