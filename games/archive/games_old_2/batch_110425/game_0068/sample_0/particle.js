export class Particle {
  constructor(x, y, color, speed = 2) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * speed * 2;
    this.vy = (Math.random() - 0.5) * speed * 2;
    this.life = 1.0;
    this.decay = 0.02 + Math.random() * 0.02;
    this.size = 3 + Math.random() * 3;
    this.color = color;
    this.isActive = true;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= this.decay;
    this.vx *= 0.97;
    this.vy *= 0.97;

    if (this.life <= 0) {
      this.isActive = false;
    }
  }

  draw(p) {
    if (!this.isActive) return;

    p.push();
    p.noStroke();
    p.fill(...this.color, this.life * 255);
    p.circle(this.x, this.y, this.size * this.life);
    p.pop();
  }
}