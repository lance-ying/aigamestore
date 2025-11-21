// projectiles.js - Projectile class

export class Projectile {
  constructor(x, y, vx, vy, damage, owner = "PLAYER") {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.owner = owner;
    this.radius = 3;
    this.lifetime = 180; // 3 seconds at 60fps
    this.isDead = false;
    
    // Special properties
    this.piercing = 0;
    this.isBoomerang = false;
    this.returnTime = 0;
    this.isLaser = false;
    this.isExplosive = false;
    this.explosionRadius = 0;
  }
  
  update() {
    // Boomerang behavior
    if (this.isBoomerang && this.lifetime < this.returnTime) {
      this.vx *= -1;
      this.vy *= -1;
      this.returnTime = -999; // Only reverse once
    }
    
    this.x += this.vx;
    this.y += this.vy;
    this.lifetime--;
    
    if (this.lifetime <= 0) {
      this.isDead = true;
    }
  }
  
  render(p) {
    p.push();
    
    if (this.owner === "PLAYER") {
      if (this.isLaser) {
        p.fill(100, 200, 255);
      } else if (this.isExplosive) {
        p.fill(255, 150, 50);
      } else if (this.isBoomerang) {
        p.fill(255, 255, 100);
      } else {
        p.fill(255);
      }
    } else {
      p.fill(255, 150, 50);
    }
    
    p.noStroke();
    p.circle(this.x, this.y, this.radius * 2);
    
    p.pop();
  }
  
  collidesWith(x, y, radius) {
    const dx = this.x - x;
    const dy = this.y - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < (this.radius + radius);
  }
}