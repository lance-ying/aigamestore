import { PLAYER_MAX_HEALTH } from './globals.js';

export class Player {
  constructor() {
    this.health = PLAYER_MAX_HEALTH;
    this.maxHealth = PLAYER_MAX_HEALTH;
    this.block = 0;
    this.strength = 0;
    this.vulnerable = 0;
    this.weak = 0;
    this.x = 150;
    this.y = 200;
  }

  takeDamage(amount) {
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
    this.block = 0;
    
    if (this.vulnerable > 0) {
      this.vulnerable--;
    }
    
    if (this.weak > 0) {
      this.weak--;
    }
  }

  draw(p) {
    p.push();
    
    // Draw player character
    p.fill(50, 150, 200);
    p.stroke(20, 100, 150);
    p.strokeWeight(2);
    p.ellipse(this.x, this.y, 60, 60);
    
    // Draw health bar
    const healthBarWidth = 100;
    const healthPercent = this.health / this.maxHealth;
    
    p.noStroke();
    p.fill(60, 60, 60);
    p.rect(this.x - healthBarWidth/2, this.y + 40, healthBarWidth, 10);
    
    p.fill(220, 60, 60);
    p.rect(this.x - healthBarWidth/2, this.y + 40, healthBarWidth * healthPercent, 10);
    
    // Draw health text
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text(`${this.health}/${this.maxHealth}`, this.x, this.y + 40);
    
    // Draw block if any
    if (this.block > 0) {
      p.fill(100, 180, 255, 180);
      p.stroke(50, 100, 200);
      p.strokeWeight(2);
      p.ellipse(this.x + 25, this.y - 15, 30, 30);
      
      p.fill(255);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(14);
      p.text(this.block, this.x + 25, this.y - 15);
    }
    
    // Draw status effects
    let statusY = this.y - 30;
    if (this.strength > 0) {
      p.fill(200, 60, 60);
      p.noStroke();
      p.ellipse(this.x - 25, statusY, 20, 20);
      p.fill(255);
      p.textSize(10);
      p.text("S" + this.strength, this.x - 25, statusY);
      statusY -= 22;
    }
    
    if (this.vulnerable > 0) {
      p.fill(200, 120, 50);
      p.noStroke();
      p.ellipse(this.x - 25, statusY, 20, 20);
      p.fill(255);
      p.textSize(10);
      p.text("V" + this.vulnerable, this.x - 25, statusY);
      statusY -= 22;
    }
    
    if (this.weak > 0) {
      p.fill(150, 150, 50);
      p.noStroke();
      p.ellipse(this.x - 25, statusY, 20, 20);
      p.fill(255);
      p.textSize(10);
      p.text("W" + this.weak, this.x - 25, statusY);
    }
    
    p.pop();
  }
}