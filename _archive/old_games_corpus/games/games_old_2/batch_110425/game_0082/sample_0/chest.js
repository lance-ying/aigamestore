// chest.js - Evolution chests and treasures
import { gameState, CHEST_TYPES } from './globals.js';

export class Chest {
  constructor(p, x, y, chestType) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = 32;
    this.height = 28;
    this.chestType = chestType;
    this.opened = false;
    this.openAnimation = 0;
    this.sparkles = [];
  }
  
  open() {
    if (this.opened) return;
    
    this.opened = true;
    gameState.chestsOpened++;
    
    // Apply evolution based on chest type
    switch (this.chestType) {
      case CHEST_TYPES.COLOR:
        gameState.hasColor = true;
        gameState.evolutionStage = 1;
        gameState.score += 500;
        break;
      case CHEST_TYPES.SCROLLING:
        gameState.hasScrolling = true;
        gameState.evolutionStage = 2;
        gameState.score += 500;
        break;
      case CHEST_TYPES.COMBAT:
        gameState.hasAdvancedCombat = true;
        gameState.evolutionStage = 3;
        gameState.score += 500;
        break;
      case CHEST_TYPES.TREASURE:
        gameState.score += 200;
        break;
    }
    
    // Create sparkle effect
    for (let i = 0; i < 20; i++) {
      this.sparkles.push({
        x: this.x,
        y: this.y,
        vx: this.p.random(-3, 3),
        vy: this.p.random(-5, -2),
        life: 40,
        maxLife: 40
      });
    }
  }
  
  update() {
    if (this.opened && this.openAnimation < 20) {
      this.openAnimation++;
    }
    
    // Update sparkles
    for (let sparkle of this.sparkles) {
      sparkle.x += sparkle.vx;
      sparkle.y += sparkle.vy;
      sparkle.vy += 0.2;
      sparkle.life--;
    }
    this.sparkles = this.sparkles.filter(s => s.life > 0);
  }
  
  render() {
    this.p.push();
    
    if (gameState.hasScrolling) {
      this.p.translate(-gameState.cameraX, -gameState.cameraY);
    }
    
    // Draw chest
    const chestColor = this.getChestColor();
    
    if (this.opened) {
      // Open chest
      const lid_y = this.y - this.height / 2 - this.openAnimation;
      
      // Bottom
      this.p.fill(...chestColor);
      this.p.stroke(gameState.hasColor ? [100, 70, 30] : [150]);
      this.p.strokeWeight(2);
      this.p.rectMode(this.p.CENTER);
      this.p.rect(this.x, this.y + 4, this.width, this.height / 2, 2);
      
      // Lid
      this.p.rect(this.x, lid_y, this.width, this.height / 2, 2);
    } else {
      // Closed chest
      this.p.fill(...chestColor);
      this.p.stroke(gameState.hasColor ? [100, 70, 30] : [150]);
      this.p.strokeWeight(2);
      this.p.rectMode(this.p.CENTER);
      this.p.rect(this.x, this.y, this.width, this.height, 2);
      
      // Lock
      this.p.fill(gameState.hasColor ? [255, 215, 0] : [200]);
      this.p.circle(this.x, this.y, 8);
    }
    
    // Draw sparkles
    for (let sparkle of this.sparkles) {
      const alpha = (sparkle.life / sparkle.maxLife) * 255;
      this.p.fill(gameState.hasColor ? [255, 255, 100, alpha] : [255, alpha]);
      this.p.noStroke();
      this.p.circle(sparkle.x, sparkle.y, 3);
    }
    
    this.p.pop();
  }
  
  getChestColor() {
    if (!gameState.hasColor) {
      return [180];
    }
    
    switch (this.chestType) {
      case CHEST_TYPES.COLOR:
        return [150, 100, 50]; // Brown
      case CHEST_TYPES.SCROLLING:
        return [100, 150, 200]; // Blue
      case CHEST_TYPES.COMBAT:
        return [200, 50, 50]; // Red
      case CHEST_TYPES.TREASURE:
        return [180, 150, 50]; // Gold
      default:
        return [150, 100, 50];
    }
  }
}