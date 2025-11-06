// projectiles.js - Projectile class

export class Projectile {
  constructor(x, y, targetX, targetY, damage, isPlayerProjectile, speed = 5, piercing = false) {
    this.x = x;
    this.y = y;
    this.damage = damage;
    this.isPlayerProjectile = isPlayerProjectile;
    this.speed = speed;
    this.piercing = piercing;
    this.hasHit = false;

    const dx = targetX - x;
    const dy = targetY - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    this.vx = (dx / dist) * speed;
    this.vy = (dy / dist) * speed;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
  }

  render(p) {
    if (this.isPlayerProjectile) {
      p.fill(255, 255, 100);
      p.ellipse(this.x, this.y, 10, 10);
    } else {
      p.fill(255, 150, 50);
      p.rectMode(p.CENTER);
      p.rect(this.x, this.y, 10, 10);
    }
  }

  isOffScreen(canvasWidth, canvasHeight) {
    return this.x < 0 || this.x > canvasWidth || this.y < 0 || this.y > canvasHeight;
  }
}