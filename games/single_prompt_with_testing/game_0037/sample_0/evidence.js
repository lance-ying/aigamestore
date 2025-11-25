// evidence.js - Evidence collectible entity

import { gameState, EVIDENCE_SIZE, EVIDENCE_COLLECT_RANGE } from './globals.js';

export class Evidence {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.size = EVIDENCE_SIZE;
    this.type = type || "document"; // document, photo, item
    this.collected = false;
    this.glowPhase = Math.random() * Math.PI * 2;
  }

  update(p) {
    // Check if player is nearby and presses space
    if (gameState.player && !this.collected) {
      const dx = gameState.player.x - this.x;
      const dy = gameState.player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < EVIDENCE_COLLECT_RANGE) {
        // Visual indicator that player can collect
        this.glowPhase += 0.15;
      } else {
        this.glowPhase += 0.05;
      }
    }
  }

  collect() {
    if (!this.collected) {
      this.collected = true;
      gameState.evidenceCollected++;
      gameState.score += 100;
      return true;
    }
    return false;
  }

  render(p, camera) {
    if (this.collected) return;

    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    p.push();
    p.translate(screenX, screenY);

    // Glow effect
    const glowSize = this.size + Math.sin(this.glowPhase) * 3;
    p.fill(255, 220, 100, 80);
    p.noStroke();
    p.ellipse(0, 0, glowSize * 2, glowSize * 2);

    // Evidence icon based on type
    if (this.type === "document") {
      // Paper
      p.fill(240, 235, 220);
      p.stroke(100, 90, 70);
      p.strokeWeight(1);
      p.rect(-this.size / 2, -this.size / 2, this.size, this.size * 1.2);
      p.noStroke();
      p.fill(80, 70, 60);
      for (let i = 0; i < 3; i++) {
        p.rect(-this.size * 0.3, -this.size * 0.3 + i * 4, this.size * 0.6, 1);
      }
    } else if (this.type === "photo") {
      // Photograph
      p.fill(200, 190, 180);
      p.stroke(80, 70, 60);
      p.strokeWeight(1);
      p.rect(-this.size / 2, -this.size / 2, this.size, this.size);
      p.fill(100, 90, 80);
      p.noStroke();
      p.ellipse(0, -this.size * 0.1, this.size * 0.3, this.size * 0.3);
      p.rect(-this.size * 0.3, this.size * 0.1, this.size * 0.6, this.size * 0.3);
    } else {
      // Generic item
      p.fill(180, 160, 140);
      p.stroke(100, 80, 60);
      p.strokeWeight(1);
      p.ellipse(0, 0, this.size, this.size);
      p.fill(220, 200, 180);
      p.noStroke();
      p.ellipse(-this.size * 0.1, -this.size * 0.1, this.size * 0.4, this.size * 0.4);
    }

    // Interaction prompt if player is nearby
    if (gameState.player) {
      const dx = gameState.player.x - this.x;
      const dy = gameState.player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < EVIDENCE_COLLECT_RANGE) {
        p.fill(255, 255, 200);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(10);
        p.text("[SPACE]", 0, -this.size);
      }
    }

    p.pop();
  }

  canCollect(player) {
    const dx = this.x - player.x;
    const dy = this.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < EVIDENCE_COLLECT_RANGE;
  }
}