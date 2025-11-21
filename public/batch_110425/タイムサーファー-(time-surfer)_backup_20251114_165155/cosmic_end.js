import { CANVAS_HEIGHT } from './globals.js';

export class CosmicEnd {
  constructor(p, x) {
    this.p = p;
    this.x = x;
    this.speed = 1.5;
    this.particles = [];
    
    // Initialize particles
    for (let i = 0; i < 30; i++) {
      this.particles.push({
        y: p.random(CANVAS_HEIGHT),
        offset: p.random(50),
        speed: p.random(1, 3)
      });
    }
  }

  update(difficulty) {
    this.speed = 1.5 + difficulty * 0.3;
    this.x += this.speed;
  }

  draw(scrollOffset) {
    const p = this.p;
    const screenX = this.x - scrollOffset;
    
    // Draw particles
    p.push();
    for (let particle of this.particles) {
      const x = screenX - particle.offset;
      const alpha = p.map(particle.offset, 0, 50, 255, 0);
      p.fill(255, 50, 100, alpha);
      p.noStroke();
      p.circle(x, particle.y, 5);
      
      particle.y += p.sin(p.frameCount * 0.05 + particle.y) * particle.speed;
      if (particle.y < 0) particle.y = CANVAS_HEIGHT;
      if (particle.y > CANVAS_HEIGHT) particle.y = 0;
    }
    p.pop();
    
    // Draw main wall
    p.push();
    p.noStroke();
    for (let i = 0; i < 5; i++) {
      const alpha = p.map(i, 0, 5, 200, 50);
      p.fill(255, 50, 100, alpha);
      p.rect(screenX - i * 10, 0, 10, CANVAS_HEIGHT);
    }
    p.pop();
  }

  checkCollision(player, scrollOffset) {
    const playerWorldX = player.x + scrollOffset;
    return playerWorldX - player.radius <= this.x;
  }

  getState() {
    return { x: this.x };
  }

  setState(state) {
    this.x = state.x;
  }
}