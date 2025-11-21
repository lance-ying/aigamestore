// particle.js - Visual particle effects

export class Particle {
  constructor(p, x, y, type = 'explosion') {
    this.p = p;
    this.x = x;
    this.y = y;
    this.type = type;
    this.isDead = false;
    
    // Random velocity
    const angle = p.random(0, p.TWO_PI);
    const speed = p.random(1, 4);
    this.vx = p.cos(angle) * speed;
    this.vy = p.sin(angle) * speed;
    
    this.life = 1;
    this.decay = p.random(0.02, 0.04);
    this.size = p.random(3, 8);
    
    this.setupType();
  }
  
  setupType() {
    const types = {
      explosion: { color: [255, 150, 50] },
      hit: { color: [255, 100, 100] },
      collect: { color: [100, 255, 200] }
    };
    
    const typeData = types[this.type] || types.explosion;
    this.color = typeData.color;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    
    this.vx *= 0.95;
    this.vy *= 0.95;
    
    this.life -= this.decay;
    
    if (this.life <= 0) {
      this.isDead = true;
    }
  }
  
  render() {
    const p = this.p;
    
    p.push();
    p.noStroke();
    
    const alpha = this.life * 255;
    p.fill(...this.color, alpha);
    p.circle(this.x, this.y, this.size * this.life);
    
    p.pop();
  }
}