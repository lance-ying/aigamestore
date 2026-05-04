// effect.js - Visual effects (explosions, impacts)

export class Effect {
  constructor(x, y, type = "impact") {
    this.x = x;
    this.y = y;
    this.type = type;
    this.timer = 0;
    this.maxTimer = type === "explosion" ? 30 : 15;
    this.active = true;
    this.particles = [];
    
    if (type === "explosion") {
      // Create explosion particles
      for (let i = 0; i < 20; i++) {
        const angle = (Math.PI * 2 * i) / 20;
        const speed = 2 + Math.random() * 3;
        this.particles.push({
          x: 0,
          y: 0,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 3 + Math.random() * 5
        });
      }
    }
  }
  
  update() {
    this.timer++;
    if (this.timer >= this.maxTimer) {
      this.active = false;
    }
    
    // Update particles
    for (let particle of this.particles) {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.1; // Gravity
    }
  }
  
  draw(p) {
    if (!this.active) return;
    
    p.push();
    
    if (this.type === "explosion") {
      // Draw explosion particles
      const progress = this.timer / this.maxTimer;
      const alpha = 255 * (1 - progress);
      
      for (let particle of this.particles) {
        p.fill(255, 150 - progress * 150, 0, alpha);
        p.noStroke();
        p.circle(this.x + particle.x, this.y + particle.y, particle.size * (1 - progress * 0.5));
      }
      
      // Central flash
      if (this.timer < 10) {
        p.fill(255, 255, 200, 200 - progress * 200);
        p.circle(this.x, this.y, 40 * (1 + progress));
      }
    } else {
      // Impact effect
      const progress = this.timer / this.maxTimer;
      const alpha = 255 * (1 - progress);
      p.fill(255, 255, 255, alpha);
      p.noStroke();
      p.circle(this.x, this.y, 10 * (1 + progress * 2));
    }
    
    p.pop();
  }
}