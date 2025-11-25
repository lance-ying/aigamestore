// particle.js

export class Particle {
  constructor(p, x, y, vx, vy, color, size, lifetime) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.lifetime = lifetime;
    this.maxLifetime = lifetime;
    this.dead = false;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2; // Gravity
    this.lifetime--;
    
    if (this.lifetime <= 0) {
      this.dead = true;
    }
  }
  
  draw(p, cameraX) {
    const screenX = this.x - cameraX;
    const alpha = (this.lifetime / this.maxLifetime) * 255;
    
    p.push();
    p.fill(this.color[0], this.color[1], this.color[2], alpha);
    p.noStroke();
    p.circle(screenX, this.y, this.size);
    p.pop();
  }
}