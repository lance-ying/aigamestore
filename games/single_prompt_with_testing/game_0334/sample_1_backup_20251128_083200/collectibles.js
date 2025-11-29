// collectibles.js - Collectible items

import { gameState, COLORS } from './globals.js';
import { removeFromArray, isOnScreen } from './utils.js';
import { createParticleBurst } from './particles.js';

export class Collectible {
  constructor(x, y, type = 'artifact') {
    this.x = x;
    this.y = y;
    this.type = type; // artifact, health, energy
    this.radius = 10;
    
    // Animation
    this.rotation = 0;
    this.rotationSpeed = 0.05;
    this.bobOffset = 0;
    this.bobSpeed = 0.08;
    this.initialY = y;
    this.pulsePhase = Math.random() * Math.PI * 2;
    
    gameState.collectibles.push(this);
    gameState.entities.push(this);
  }
  
  update(p) {
    // Rotate
    this.rotation += this.rotationSpeed;
    
    // Bob up and down
    this.pulsePhase += this.bobSpeed;
    this.bobOffset = Math.sin(this.pulsePhase) * 5;
    this.y = this.initialY + this.bobOffset;
    
    // Check collision with player
    if (gameState.player) {
      const dx = gameState.player.x - this.x;
      const dy = gameState.player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < this.radius + gameState.player.radius) {
        this.collect();
      }
    }
  }
  
  collect() {
    gameState.artifactsCollected++;
    gameState.score += 50;
    
    createParticleBurst(this.x, this.y, 8, COLORS.artifact);
    
    removeFromArray(gameState.collectibles, this);
    removeFromArray(gameState.entities, this);
  }
  
  render(p) {
    if (!isOnScreen(this.x, this.y)) return;
    
    const screenX = this.x - gameState.cameraX + gameState.cameraShakeX;
    const screenY = this.y - gameState.cameraY + gameState.cameraShakeY;
    
    p.push();
    p.translate(screenX, screenY);
    p.rotate(this.rotation);
    
    // Glow
    p.fill(...COLORS.artifact, 100);
    p.noStroke();
    p.circle(0, 0, this.radius * 3);
    
    // Main shape
    p.fill(...COLORS.artifact);
    p.stroke(255);
    p.strokeWeight(2);
    
    // Star shape
    p.beginShape();
    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
      const r = i % 2 === 0 ? this.radius : this.radius * 0.5;
      p.vertex(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    p.endShape(p.CLOSE);
    
    p.pop();
  }
}

export class HealthPickup extends Collectible {
  constructor(x, y) {
    super(x, y, 'health');
    this.healAmount = 30;
  }
  
  collect() {
    if (gameState.player) {
      gameState.player.heal(this.healAmount);
    }
    
    createParticleBurst(this.x, this.y, 8, COLORS.health);
    
    removeFromArray(gameState.collectibles, this);
    removeFromArray(gameState.entities, this);
  }
  
  render(p) {
    if (!isOnScreen(this.x, this.y)) return;
    
    const screenX = this.x - gameState.cameraX + gameState.cameraShakeX;
    const screenY = this.y - gameState.cameraY + gameState.cameraShakeY;
    
    p.push();
    p.translate(screenX, screenY);
    p.rotate(this.rotation);
    
    // Glow
    p.fill(...COLORS.health, 100);
    p.noStroke();
    p.circle(0, 0, this.radius * 3);
    
    // Cross shape
    p.fill(...COLORS.health);
    p.stroke(255);
    p.strokeWeight(2);
    p.rectMode(p.CENTER);
    p.rect(0, 0, this.radius * 1.5, this.radius * 0.5);
    p.rect(0, 0, this.radius * 0.5, this.radius * 1.5);
    
    p.pop();
  }
}

export class EnergyPickup extends Collectible {
  constructor(x, y) {
    super(x, y, 'energy');
    this.energyAmount = 40;
  }
  
  collect() {
    if (gameState.player) {
      gameState.player.restoreEnergy(this.energyAmount);
    }
    
    createParticleBurst(this.x, this.y, 8, COLORS.energy);
    
    removeFromArray(gameState.collectibles, this);
    removeFromArray(gameState.entities, this);
  }
  
  render(p) {
    if (!isOnScreen(this.x, this.y)) return;
    
    const screenX = this.x - gameState.cameraX + gameState.cameraShakeX;
    const screenY = this.y - gameState.cameraY + gameState.cameraShakeY;
    
    p.push();
    p.translate(screenX, screenY);
    p.rotate(this.rotation);
    
    // Glow
    p.fill(...COLORS.energy, 100);
    p.noStroke();
    p.circle(0, 0, this.radius * 3);
    
    // Lightning bolt shape
    p.fill(...COLORS.energy);
    p.stroke(255);
    p.strokeWeight(2);
    p.beginShape();
    p.vertex(0, -this.radius);
    p.vertex(-3, 0);
    p.vertex(3, 0);
    p.vertex(0, this.radius);
    p.vertex(5, 2);
    p.vertex(0, 0);
    p.vertex(-5, -2);
    p.endShape(p.CLOSE);
    
    p.pop();
  }
}

export class HealingCrystal extends Collectible {
  constructor(x, y) {
    super(x, y, 'crystal');
    this.radius = 15;
  }
  
  collect() {
    gameState.crystalsCollected++;
    gameState.score += 500;
    
    createParticleBurst(this.x, this.y, 20, COLORS.crystal);
    
    if (gameState.crystalsCollected >= gameState.totalCrystals) {
      gameState.gamePhase = "GAME_OVER_WIN";
    }
    
    removeFromArray(gameState.collectibles, this);
    removeFromArray(gameState.entities, this);
  }
  
  render(p) {
    if (!isOnScreen(this.x, this.y)) return;
    
    const screenX = this.x - gameState.cameraX + gameState.cameraShakeX;
    const screenY = this.y - gameState.cameraY + gameState.cameraShakeY;
    
    p.push();
    p.translate(screenX, screenY);
    p.rotate(this.rotation);
    
    // Large glow
    p.fill(...COLORS.crystal, 80);
    p.noStroke();
    p.circle(0, 0, this.radius * 5);
    
    // Medium glow
    p.fill(...COLORS.crystal, 120);
    p.circle(0, 0, this.radius * 3);
    
    // Crystal shape
    p.fill(...COLORS.crystal);
    p.stroke(255);
    p.strokeWeight(2);
    
    // Diamond shape
    p.beginShape();
    p.vertex(0, -this.radius);
    p.vertex(this.radius * 0.5, 0);
    p.vertex(0, this.radius);
    p.vertex(-this.radius * 0.5, 0);
    p.endShape(p.CLOSE);
    
    // Inner detail
    p.fill(255, 255, 255, 150);
    p.noStroke();
    p.beginShape();
    p.vertex(0, -this.radius * 0.5);
    p.vertex(this.radius * 0.3, 0);
    p.vertex(0, this.radius * 0.5);
    p.vertex(-this.radius * 0.3, 0);
    p.endShape(p.CLOSE);
    
    p.pop();
  }
}