// powerups.js - Power-up collectibles

import { gameState, COLORS, POWERUP_TYPES } from './globals.js';
import { Particle } from './particles.js';

export class PowerUp {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.radius = 12;
    
    // Animation
    this.rotation = 0;
    this.bobOffset = 0;
    this.bobSpeed = 0.05;
    this.initialY = y;
    
    // Lifetime
    this.lifetime = 600; // 10 seconds
    this.age = 0;
    
    // Get color based on type
    this.color = this.getColor();
    
    gameState.powerUps.push(this);
  }
  
  getColor() {
    switch (this.type) {
      case POWERUP_TYPES.HEALTH:
        return [0, 255, 100];
      case POWERUP_TYPES.DAMAGE:
        return [255, 100, 0];
      case POWERUP_TYPES.SPEED:
        return [100, 100, 255];
      case POWERUP_TYPES.ARMOR:
        return [200, 200, 0];
      default:
        return [...COLORS.powerUp];
    }
  }
  
  update(p) {
    this.age++;
    
    // Despawn if too old
    if (this.age >= this.lifetime) {
      this.destroy();
      return;
    }
    
    // Animation
    this.rotation += 0.05;
    this.bobOffset = Math.sin(this.age * this.bobSpeed) * 5;
    this.y = this.initialY + this.bobOffset;
    
    // Check collision with player
    if (gameState.player) {
      const dx = gameState.player.x - this.x;
      const dy = gameState.player.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < this.radius + 20) {
        this.collect(p);
      }
    }
  }
  
  collect(p) {
    if (!gameState.player) return;
    
    gameState.powerUpsCollected++;
    
    // Apply effect based on type
    switch (this.type) {
      case POWERUP_TYPES.HEALTH:
        // Heal all attached parts
        Object.values(gameState.player.parts).forEach(part => {
          if (part.attached) {
            part.health = Math.min(part.maxHealth, part.health + 50);
          }
        });
        break;
        
      case POWERUP_TYPES.DAMAGE:
        gameState.player.damageMultiplier += 0.3;
        break;
        
      case POWERUP_TYPES.SPEED:
        gameState.player.moveSpeed += 0.2;
        break;
        
      case POWERUP_TYPES.ARMOR:
        gameState.player.block.effectiveness = Math.min(0.8, gameState.player.block.effectiveness + 0.1);
        break;
    }
    
    // Create collection particles
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const speed = 3;
      gameState.particles.push(new Particle(
        this.x,
        this.y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        this.color
      ));
    }
    
    this.destroy();
  }
  
  destroy() {
    const index = gameState.powerUps.indexOf(this);
    if (index > -1) {
      gameState.powerUps.splice(index, 1);
    }
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.rotation);
    
    // Outer glow
    p.fill(...this.color, 50);
    p.noStroke();
    p.circle(0, 0, this.radius * 3);
    
    // Main circle
    p.fill(...this.color);
    p.stroke(255);
    p.strokeWeight(2);
    p.circle(0, 0, this.radius * 2);
    
    // Inner detail
    p.fill(255, 255, 255, 200);
    p.noStroke();
    p.circle(0, 0, this.radius);
    
    // Type indicator
    p.fill(0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    const symbol = this.getSymbol();
    p.text(symbol, 0, 0);
    
    p.pop();
  }
  
  getSymbol() {
    switch (this.type) {
      case POWERUP_TYPES.HEALTH:
        return '+';
      case POWERUP_TYPES.DAMAGE:
        return '!';
      case POWERUP_TYPES.SPEED:
        return '>';
      case POWERUP_TYPES.ARMOR:
        return '=';
      default:
        return '?';
    }
  }
}