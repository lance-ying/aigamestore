// hazards.js - Environmental hazards

import { gameState, COLORS } from './globals.js';
import { isOnScreen, distance } from './utils.js';

export class Hazard {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type; // spike, poison
    this.width = 25;
    this.height = 25;
    this.radius = 12;
    this.damage = this.type === 'spike' ? 15 : 5;
    this.damageInterval = this.type === 'spike' ? 60 : 30;
    this.lastDamageTime = 0;
    
    // Animation
    this.animFrame = 0;
    this.animSpeed = 0.1;
    
    gameState.hazards.push(this);
  }
  
  update(p) {
    this.animFrame += this.animSpeed;
    
    // Check collision with player
    if (gameState.player) {
      const dist = distance(this.x, this.y, gameState.player.x, gameState.player.y);
      
      if (dist < this.radius + gameState.player.radius) {
        const timeSinceLastDamage = gameState.frameCount - this.lastDamageTime;
        if (timeSinceLastDamage >= this.damageInterval) {
          gameState.player.takeDamage(this.damage);
          this.lastDamageTime = gameState.frameCount;
        }
      }
    }
  }
  
  render(p) {
    if (!isOnScreen(this.x, this.y)) return;
    
    const screenX = this.x - gameState.cameraX + gameState.cameraShakeX;
    const screenY = this.y - gameState.cameraY + gameState.cameraShakeY;
    
    p.push();
    p.translate(screenX, screenY);
    
    if (this.type === 'spike') {
      this.renderSpike(p);
    } else if (this.type === 'poison') {
      this.renderPoison(p);
    }
    
    p.pop();
  }
  
  renderSpike(p) {
    // Spike trap
    p.fill(...COLORS.hazardSpike);
    p.stroke(100, 0, 0);
    p.strokeWeight(2);
    
    // Multiple spikes
    for (let i = 0; i < 3; i++) {
      const offset = (i - 1) * 8;
      p.beginShape();
      p.vertex(offset - 5, 8);
      p.vertex(offset, -10);
      p.vertex(offset + 5, 8);
      p.endShape(p.CLOSE);
    }
    
    // Base
    p.noStroke();
    p.fill(80, 30, 30);
    p.rect(-12, 8, 24, 4);
  }
  
  renderPoison(p) {
    // Poison pool - bubbling effect
    const bubbleOffset = Math.sin(this.animFrame) * 2;
    
    p.fill(...COLORS.hazardPoison);
    p.noStroke();
    p.ellipse(0, 0, this.width, this.height * 0.8);
    
    // Bubbles
    for (let i = 0; i < 3; i++) {
      const angle = (Math.PI * 2 / 3) * i + this.animFrame;
      const bx = Math.cos(angle) * 6;
      const by = Math.sin(angle) * 4 + bubbleOffset;
      p.fill(150, 255, 180, 150);
      p.circle(bx, by, 4);
    }
  }
}