// ring.js
import { RING_RADIUS, COLORS, CORRECT_RING_BONUS, WRONG_RING_PENALTY, gameState } from './globals.js';

export class Ring {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.radius = RING_RADIUS;
    this.collected = false;
    this.pulsePhase = Math.random() * Math.PI * 2;
  }

  update(p, scrollSpeed) {
    this.y += scrollSpeed;
    this.pulsePhase += 0.1;
  }

  checkCollision(p, player) {
    if (this.collected) return;
    
    const d = p.dist(this.x, this.y, player.x, player.y);
    if (d < this.radius + player.size / 2) {
      this.collected = true;
      
      if (this.color === gameState.currentColor) {
        // Correct color
        player.addNeckLength(CORRECT_RING_BONUS);
        gameState.score += 10;
        this.createParticles(p, true);
      } else {
        // Wrong color
        player.addNeckLength(-WRONG_RING_PENALTY);
        gameState.score = Math.max(0, gameState.score - 5);
        this.createParticles(p, false);
      }
    }
  }

  createParticles(p, isCorrect) {
    const color = COLORS[this.color];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const speed = 2 + Math.random() * 2;
      gameState.particles.push({
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30,
        maxLife: 30,
        color: color.rgb,
        isCorrect: isCorrect
      });
    }
  }

  render(p) {
    if (this.collected) return;
    
    const color = COLORS[this.color];
    const pulse = Math.sin(this.pulsePhase) * 3;
    
    p.push();
    // Outer glow
    p.noFill();
    p.stroke(...color.rgb, 100);
    p.strokeWeight(4);
    p.ellipse(this.x, this.y, this.radius * 2 + pulse, this.radius * 2 + pulse);
    
    // Inner ring
    p.stroke(...color.rgb);
    p.strokeWeight(6);
    p.noFill();
    p.ellipse(this.x, this.y, this.radius * 1.5, this.radius * 1.5);
    
    // Center dot
    p.fill(...color.rgb);
    p.noStroke();
    p.ellipse(this.x, this.y, 8, 8);
    p.pop();
  }

  isOffScreen() {
    return this.y > 450;
  }
}