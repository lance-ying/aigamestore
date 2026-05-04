export class Particle {
  constructor(x, y, color, p) {
    this.x = x;
    this.y = y;
    this.vx = p.random(-3, 3);
    this.vy = p.random(-5, -2);
    this.life = 1.0;
    this.color = color;
    this.size = p.random(3, 8);
    this.p = p;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.3; // gravity
    this.life -= 0.02;
  }

  draw() {
    if (this.life <= 0) return;
    
    const p = this.p;
    p.push();
    p.noStroke();
    p.fill(this.color[0], this.color[1], this.color[2], this.life * 255);
    p.ellipse(this.x, this.y, this.size * this.life);
    p.pop();
  }

  isDead() {
    return this.life <= 0;
  }
}