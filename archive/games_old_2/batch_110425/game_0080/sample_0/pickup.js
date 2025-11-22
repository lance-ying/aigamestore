// pickup.js - Collectible pickups

import { gameState } from './globals.js';

export class Pickup {
  constructor(p, x, y, type = 'damage') {
    this.p = p;
    this.x = x;
    this.y = y;
    this.type = type;
    this.isDead = false;
    this.radius = 8;
    this.floatOffset = 0;
    this.age = 0;
    this.lifetime = 600; // 10 seconds at 60 FPS
    
    // Visual properties
    this.setupType();
  }
  
  setupType() {
    const types = {
      damage: { color: [255, 150, 50], label: 'DMG+' },
      fireRate: { color: [255, 220, 80], label: 'FIRE+' },
      speed: { color: [100, 255, 150], label: 'SPD+' },
      health: { color: [255, 100, 150], label: 'HP+' }
    };
    
    const typeData = types[this.type] || types.damage;
    this.color = typeData.color;
    this.label = typeData.label;
  }
  
  update() {
    this.age++;
    this.floatOffset = this.p.sin(this.age * 0.1) * 3;
    
    if (this.age >= this.lifetime) {
      this.isDead = true;
    }
    
    // Check collision with player
    if (gameState.player && !gameState.player.isDead) {
      const dist = this.p.dist(this.x, this.y, gameState.player.x, gameState.player.y);
      if (dist < this.radius + 15) {
        this.collect();
      }
    }
  }
  
  collect() {
    if (this.isDead || !gameState.player) return;
    
    const amounts = {
      damage: 0.2,
      fireRate: 0.15,
      speed: 0.1,
      health: 20
    };
    
    const amount = amounts[this.type] || 0.1;
    gameState.player.addUpgrade(this.type, amount);
    gameState.score += 5;
    
    this.isDead = true;
  }
  
  render() {
    const p = this.p;
    const y = this.y + this.floatOffset;
    
    p.push();
    
    // Fade out near end of lifetime
    const alpha = this.age > this.lifetime - 120 ? 
      p.map(this.age, this.lifetime - 120, this.lifetime, 255, 0) : 255;
    
    // Outer glow
    p.noStroke();
    p.fill(...this.color, alpha * 0.3);
    p.circle(this.x, y, this.radius * 4);
    
    // Core
    p.fill(...this.color, alpha);
    p.circle(this.x, y, this.radius * 2);
    
    // Inner highlight
    p.fill(255, 255, 255, alpha * 0.8);
    p.circle(this.x - 2, y - 2, this.radius * 0.8);
    
    p.pop();
  }
}