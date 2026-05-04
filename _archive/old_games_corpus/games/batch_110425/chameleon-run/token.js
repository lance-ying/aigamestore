// token.js - Collectible token entity

import { gameState } from './globals.js';

export class Token {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.size = 15;
    this.collected = false;
    this.rotation = 0;
    this.pulse = 0;
  }

  update() {
    this.rotation += 0.05;
    this.pulse += 0.1;
  }

  render() {
    if (this.collected) return;

    const p = this.p;
    const screenX = this.x - gameState.cameraX;
    const pulseSize = this.size + p.sin(this.pulse) * 2;

    p.push();
    p.translate(screenX, this.y);
    p.rotate(this.rotation);
    
    // Outer glow
    p.noStroke();
    p.fill(255, 200, 0, 100);
    p.ellipse(0, 0, pulseSize * 1.5);
    
    // Token body
    p.fill(255, 215, 0);
    p.stroke(200, 170, 0);
    p.strokeWeight(2);
    p.ellipse(0, 0, pulseSize);
    
    // Star shape inside
    p.fill(255, 255, 100);
    p.noStroke();
    p.beginShape();
    for (let i = 0; i < 5; i++) {
      const angle = p.map(i, 0, 5, 0, p.TWO_PI) - p.PI / 2;
      const x = p.cos(angle) * pulseSize * 0.3;
      const y = p.sin(angle) * pulseSize * 0.3;
      p.vertex(x, y);
    }
    p.endShape(p.CLOSE);
    
    p.pop();
  }

  checkCollection(player) {
    if (this.collected) return false;
    
    const distance = p5.Vector.dist(
      this.p.createVector(this.x, this.y),
      this.p.createVector(player.x, player.y)
    );
    
    return distance < (this.size + player.size) / 2;
  }
}