import { PLAYER_MAX_HEALTH } from './globals.js';

export class Player {
  constructor() {
    this.health = PLAYER_MAX_HEALTH;
    this.maxHealth = PLAYER_MAX_HEALTH;
    this.block = 0;
    this.strength = 0;
    this.vulnerable = 0;
    this.weak = 0;
    this.x = 200;
    this.y = 280;
    this.hitFlash = 0;
  }

  takeDamage(amount, sourceElement = null) {
    // Player currently doesn't have elemental weaknesses
    if (this.vulnerable > 0) {
      amount = Math.floor(amount * 1.5);
    }
    
    if (this.block >= amount) {
      this.block -= amount;
    } else {
      const remainingDamage = amount - this.block;
      this.block = 0;
      this.health -= remainingDamage;
    }

    if (this.health < 0) {
      this.health = 0;
    }
  }

  resetForNewTurn() {
    // Block is now retained across turns and battles
    
    if (this.vulnerable > 0) {
      this.vulnerable--;
    }
    
    if (this.weak > 0) {
      this.weak--;
    }
  }

  draw(p) {
    p.push();
    
    // Update hit flash
    if (this.hitFlash > 0) {
      this.hitFlash--;
    }
    
    // Draw player character with hit flash
    if (this.hitFlash > 0) {
      p.fill(255, 100, 100);
      p.stroke(255, 50, 50);
    } else {
      p.fill(50, 150, 200);
      p.stroke(20, 100, 150);
    }
    p.strokeWeight(3);
    p.ellipse(this.x, this.y, 80, 80);
    
    // Draw simple face
    p.fill(255);
    p.noStroke();
    p.ellipse(this.x - 15, this.y - 10, 8, 8);
    p.ellipse(this.x + 15, this.y - 10, 8, 8);
    p.arc(this.x, this.y + 5, 30, 20, 0, p.PI);
    
    // Player label
    p.fill(200, 200, 200);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.text("PLAYER", this.x, this.y - 60);
    
    // Draw health bar with better visuals
    const healthBarWidth = 120;
    const healthPercent = this.health / this.maxHealth;
    
    p.noStroke();
    p.fill(40, 40, 40);
    p.rect(this.x - healthBarWidth/2, this.y + 55, healthBarWidth, 16, 8);
    
    // Health bar color gradient based on health
    if (healthPercent > 0.5) {
      p.fill(60, 200, 60);
    } else if (healthPercent > 0.25) {
      p.fill(220, 180, 60);
    } else {
      p.fill(220, 60, 60);
    }
    p.rect(this.x - healthBarWidth/2 + 2, this.y + 57, (healthBarWidth - 4) * healthPercent, 12, 6);
    
    // Draw health text
    p.fill(255);
    p.stroke(0);
    p.strokeWeight(3);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(13);
    p.text(`${this.health}/${this.maxHealth}`, this.x, this.y + 63);
    
    // Draw block if any
    if (this.block > 0) {
      p.push();
      p.drawingContext.shadowBlur = 10;
      p.drawingContext.shadowColor = 'rgba(100, 180, 255, 0.6)';
      p.fill(100, 180, 255, 200);
      p.stroke(50, 100, 200);
      p.strokeWeight(3);
      p.ellipse(this.x + 35, this.y - 25, 40, 40);
      
      p.fill(255);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(18);
      p.textStyle(p.BOLD);
      p.text(this.block, this.x + 35, this.y - 25);
      p.textStyle(p.NORMAL);
      
      p.textSize(10);
      p.text("BLOCK", this.x + 35, this.y - 10);
      p.pop();
    }
    
    // Draw status effects
    let statusX = this.x - 35;
    if (this.strength > 0) {
      p.fill(200, 60, 60);
      p.stroke(150, 30, 30);
      p.strokeWeight(2);
      p.ellipse(statusX, this.y - 25, 28, 28);
      p.fill(255);
      p.noStroke();
      p.textSize(11);
      p.text("💪" + this.strength, statusX, this.y - 25);
      statusX -= 32;
    }
    
    if (this.vulnerable > 0) {
      p.fill(200, 120, 50);
      p.stroke(150, 80, 30);
      p.strokeWeight(2);
      p.ellipse(statusX, this.y - 25, 28, 28);
      p.fill(255);
      p.noStroke();
      p.textSize(11);
      p.text("V" + this.vulnerable, statusX, this.y - 25);
      statusX -= 32;
    }
    
    if (this.weak > 0) {
      p.fill(150, 150, 50);
      p.stroke(100, 100, 30);
      p.strokeWeight(2);
      p.ellipse(statusX, this.y - 25, 28, 28);
      p.fill(255);
      p.noStroke();
      p.textSize(11);
      p.text("W" + this.weak, statusX, this.y - 25);
    }
    
    p.pop();
  }
}