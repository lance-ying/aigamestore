// knife.js - Knife projectile

export class Knife {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = 8;
    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;
    this.width = 2;
    this.length = 15;
    this.active = true;
  }

  update(canvasWidth, canvasHeight) {
    if (!this.active) return;
    
    this.x += this.vx;
    this.y += this.vy;
    
    // Deactivate if out of bounds
    if (this.x < 0 || this.x > canvasWidth || this.y < 0 || this.y > canvasHeight) {
      this.active = false;
    }
  }

  draw(p) {
    if (!this.active) return;
    
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.angle);
    
    // Draw knife body
    p.fill(180, 180, 180);
    p.stroke(100);
    p.strokeWeight(1);
    p.rect(-this.width / 2, -this.length / 2, this.width, this.length);
    
    // Draw knife tip
    p.noStroke();
    p.fill(150, 150, 150);
    p.triangle(-2, -this.length / 2, 2, -this.length / 2, 0, -this.length / 2 - 3);
    
    p.pop();
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      radius: this.length / 2
    };
  }
}