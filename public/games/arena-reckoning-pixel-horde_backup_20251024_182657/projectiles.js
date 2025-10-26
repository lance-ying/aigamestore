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
  }
  
  update() {
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
      p.fill(255);
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