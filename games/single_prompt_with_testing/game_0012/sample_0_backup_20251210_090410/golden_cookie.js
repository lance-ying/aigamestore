// golden_cookie.js - Golden cookie entity
export class GoldenCookie {
  constructor(p) {
    this.p = p;
    this.x = p.random(50, 250);
    this.y = p.random(100, 350);
    this.radius = 20;
    this.lifetime = 300; // 5 seconds at 60fps
    this.age = 0;
    this.collected = false;
    this.value = Math.floor(p.random(10, 50));
  }

  update() {
    this.age++;
    if (this.age >= this.lifetime) {
      this.collected = true; // Mark for removal
    }
  }

  isExpired() {
    return this.age >= this.lifetime;
  }

  checkClick(clickX, clickY) {
    const d = this.p.dist(clickX, clickY, this.x, this.y);
    return d < this.radius;
  }

  draw() {
    const alpha = this.p.map(this.age, this.lifetime - 60, this.lifetime, 255, 0);
    
    this.p.push();
    this.p.noStroke();
    
    // Golden glow
    this.p.fill(255, 215, 0, alpha * 0.3);
    this.p.circle(this.x, this.y, this.radius * 2.5);
    
    // Cookie body
    this.p.fill(255, 215, 0, alpha);
    this.p.circle(this.x, this.y, this.radius * 2);
    
    // Shimmer effect
    const shimmer = Math.sin(this.age * 0.2) * 50 + 200;
    this.p.fill(255, 255, 150, alpha * 0.5);
    this.p.circle(this.x - 5, this.y - 5, this.radius * 0.8);
    
    this.p.pop();
  }
}