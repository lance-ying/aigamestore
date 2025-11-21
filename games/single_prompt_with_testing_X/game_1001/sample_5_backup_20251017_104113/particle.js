export class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 4;
    this.vy = (Math.random() - 0.5) * 4 - 2;
    this.life = 60;
    this.maxLife = 60;
    this.color = color;
    this.size = Math.random() * 6 + 4;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2;
    this.life--;
  }

  draw(p) {
    const alpha = (this.life / this.maxLife) * 255;
    p.fill(this.color[0], this.color[1], this.color[2], alpha);
    p.noStroke();
    p.circle(this.x, this.y, this.size);
  }

  isDead() {
    return this.life <= 0;
  }
}