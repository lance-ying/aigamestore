// shadow_entity.js - Threatening shadow entity

import { gameState } from './globals.js';

export class ShadowEntity {
  constructor(x, y, room) {
    this.x = x;
    this.y = y;
    this.room = room;
    this.speed = 1.2;
    this.detectionRange = 150;
    this.damageRange = 30;
    this.active = false;
    this.phase = 0;
    this.targetX = x;
    this.targetY = y;
  }

  update(p) {
    if (!this.active || gameState.currentRoom !== this.room) return;
    
    this.phase += 0.08;
    
    const player = gameState.player;
    if (!player) return;
    
    // Check if player is in detection range
    const dist = p.dist(this.x, this.y, player.x, player.y);
    
    if (dist < this.detectionRange) {
      // Chase player
      const angle = Math.atan2(player.y - this.y, player.x - this.x);
      this.x += Math.cos(angle) * this.speed;
      this.y += Math.sin(angle) * this.speed;
      
      // Damage player if close enough
      if (dist < this.damageRange) {
        player.takeDamage(0.5);
      }
    } else {
      // Wander behavior
      if (p.dist(this.x, this.y, this.targetX, this.targetY) < 10) {
        this.targetX = p.random(100, 500);
        this.targetY = p.random(100, 300);
      }
      const angle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
      this.x += Math.cos(angle) * this.speed * 0.3;
      this.y += Math.sin(angle) * this.speed * 0.3;
    }
  }

  render(p) {
    if (!this.active || gameState.currentRoom !== this.room) return;
    
    p.push();
    p.translate(this.x, this.y);
    
    // Ethereal shadow form
    const pulse = Math.sin(this.phase) * 10 + 30;
    
    // Outer glow
    p.fill(50, 0, 50, 80);
    p.noStroke();
    p.circle(0, 0, pulse + 20);
    
    // Main body
    p.fill(30, 0, 30, 150);
    p.circle(0, 0, pulse);
    
    // Eyes
    const eyeGlow = Math.sin(this.phase * 2) * 100 + 155;
    p.fill(eyeGlow, 0, 0);
    p.circle(-10, -5, 8);
    p.circle(10, -5, 8);
    
    // Tendrils
    for (let i = 0; i < 5; i++) {
      const angle = this.phase + (i * Math.PI * 2 / 5);
      const length = Math.sin(this.phase + i) * 20 + 30;
      const endX = Math.cos(angle) * length;
      const endY = Math.sin(angle) * length;
      
      p.stroke(50, 0, 50, 100);
      p.strokeWeight(3);
      p.line(0, 0, endX, endY);
    }
    
    p.pop();
  }
}