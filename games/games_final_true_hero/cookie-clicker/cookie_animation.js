// cookie_animation.js - Cookie click animation
export class CookieClickAnimation {
  constructor(x, y, value) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.age = 0;
    this.lifetime = 30; // 0.5 seconds
    this.vy = -2;
  }

  update() {
    this.age++;
    this.y += this.vy;
  }

  isDead() {
    return this.age >= this.lifetime;
  }

  draw(p) {
    const alpha = p.map(this.age, 0, this.lifetime, 255, 0);
    p.push();
    p.fill(255, 200, 0, alpha);
    p.textSize(16);
    p.textAlign(p.CENTER);
    p.text(`+${this.value}`, this.x, this.y);
    p.pop();
  }
}