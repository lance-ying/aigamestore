// memoryOrb.js - Collectible memory orbs
import { gameState } from './globals.js';

export class MemoryOrb {
  constructor(x, y, layer) {
    this.x = x;
    this.y = y;
    this.radius = 12;
    this.layer = layer;
    this.collected = false;
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.floatOffset = 0;
    this.particlePhase = 0;
  }

  update() {
    if (this.collected) return;

    this.pulsePhase += 0.08;
    this.floatOffset = Math.sin(this.pulsePhase) * 3;
    this.particlePhase += 0.1;
  }

  draw(p) {
    if (this.collected) return;

    p.push();
    p.translate(this.x, this.y + this.floatOffset);

    // Outer glow
    const pulseSize = Math.sin(this.pulsePhase) * 3 + this.radius;
    p.noStroke();
    p.fill(180, 220, 255, 50);
    p.ellipse(0, 0, pulseSize * 2.5);

    // Middle glow
    p.fill(200, 230, 255, 100);
    p.ellipse(0, 0, pulseSize * 1.8);

    // Core
    p.fill(220, 240, 255);
    p.ellipse(0, 0, this.radius * 2);

    // Inner shine
    p.fill(255, 255, 255, 200);
    p.ellipse(-3, -3, this.radius * 0.6);

    // Orbiting particles
    for (let i = 0; i < 3; i++) {
      const angle = this.particlePhase + (i * Math.PI * 2 / 3);
      const px = Math.cos(angle) * (this.radius + 8);
      const py = Math.sin(angle) * (this.radius + 8);
      p.fill(180, 220, 255, 150);
      p.ellipse(px, py, 4, 4);
    }

    p.pop();
  }

  checkCollection(player, p) {
    if (this.collected) return false;

    const distance = p.dist(this.x, this.y, player.x, player.y);
    if (distance < this.radius + player.width / 2) {
      this.collected = true;
      gameState.orbsCollected++;
      gameState.score += 100;
      gameState.framesSinceLastOrb = 0;
      return true;
    }
    return false;
  }
}