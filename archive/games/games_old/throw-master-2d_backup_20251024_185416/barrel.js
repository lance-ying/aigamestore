// barrel.js - Exploding barrel

export class Barrel {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 12.5;
    this.active = true;
    this.exploding = false;
    this.explosionTimer = 0;
    this.explosionDuration = 20;
    this.explosionRadius = 50;
  }

  explode() {
    if (!this.active || this.exploding) return false;
    this.exploding = true;
    this.explosionTimer = this.explosionDuration;
    return true;
  }

  update() {
    if (this.exploding) {
      this.explosionTimer--;
      if (this.explosionTimer <= 0) {
        this.active = false;
      }
    }
  }

  draw(p) {
    if (!this.active && !this.exploding) return;
    
    p.push();
    
    if (this.exploding) {
      // Draw explosion effect
      const explosionProgress = 1 - (this.explosionTimer / this.explosionDuration);
      const currentRadius = this.explosionRadius * explosionProgress;
      const alpha = 255 * (1 - explosionProgress);
      
      p.fill(255, 100, 0, alpha);
      p.noStroke();
      p.circle(this.x, this.y, currentRadius * 2);
      
      // Debris particles
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const dist = currentRadius * 0.8;
        const px = this.x + Math.cos(angle) * dist;
        const py = this.y + Math.sin(angle) * dist;
        p.fill(80, 80, 80, alpha);
        p.circle(px, py, 4);
      }
    } else {
      // Draw barrel
      p.fill(200, 50, 50);
      p.stroke(0);
      p.strokeWeight(2);
      p.circle(this.x, this.y, this.radius * 2);
    }
    
    p.pop();
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      radius: this.radius
    };
  }

  getExplosionBounds() {
    return {
      x: this.x,
      y: this.y,
      radius: this.explosionRadius
    };
  }
}