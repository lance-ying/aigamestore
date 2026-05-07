export class Particle {
  constructor(p, x, y, color, type = 'hit') {
    this.p = p;
    this.x = x;
    this.y = y;
    this.color = color;
    this.type = type;
    this.life = 1.0;
    this.active = true;
    
    const angle = this.p.random(this.p.TWO_PI);
    const speed = this.p.random(2, 5);
    this.vx = this.p.cos(angle) * speed;
    this.vy = this.p.sin(angle) * speed;
    this.size = this.p.random(3, 8);
    this.decay = this.p.random(0.02, 0.04);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2; // Gravity
    this.life -= this.decay;
    
    if (this.life <= 0) {
      this.active = false;
    }
  }

  draw() {
    if (!this.active) return;
    
    this.p.push();
    this.p.noStroke();
    this.p.fill(...this.color, this.life * 255);
    this.p.ellipse(this.x, this.y, this.size * this.life, this.size * this.life);
    this.p.pop();
  }
}