import { ELEMENTS } from './globals.js';

export class Enemy {
  constructor(template) {
    this.id = template.id;
    this.name = template.name;
    this.element = template.element || ELEMENTS.NONE;
    this.health = template.health;
    this.maxHealth = template.maxHealth;
    this.intentions = [...template.intentions];
    this.currentIntentionIndex = 0;
    this.attackDamage = template.attackDamage;
    this.heavyAttackDamage = template.heavyAttackDamage || template.attackDamage * 2;
    this.blockAmount = template.blockAmount;
    this.color = template.color;
    this.block = 0;
    this.strength = 0;
    this.vulnerable = 0;
    this.weak = 0;
    this.x = 700;
    this.y = 280;
    this.hitFlash = 0;
    this.lastHitEffectiveness = null; // "SUPER", "RESIST", "NORMAL"
  }

  getCurrentIntention() {
    return this.intentions[this.currentIntentionIndex];
  }

  takeDamage(amount, sourceElement = ELEMENTS.NONE) {
    // Calculate elemental effectiveness
    let multiplier = 1.0;
    this.lastHitEffectiveness = "NORMAL";

    if (sourceElement && sourceElement !== ELEMENTS.NONE && this.element !== ELEMENTS.NONE) {
      if (
        (sourceElement === ELEMENTS.FIRE && this.element === ELEMENTS.NATURE) ||
        (sourceElement === ELEMENTS.NATURE && this.element === ELEMENTS.WATER) ||
        (sourceElement === ELEMENTS.WATER && this.element === ELEMENTS.FIRE)
      ) {
        multiplier = 1.5;
        this.lastHitEffectiveness = "SUPER";
      } else if (
        (sourceElement === ELEMENTS.FIRE && this.element === ELEMENTS.WATER) ||
        (sourceElement === ELEMENTS.NATURE && this.element === ELEMENTS.FIRE) ||
        (sourceElement === ELEMENTS.WATER && this.element === ELEMENTS.NATURE)
      ) {
        multiplier = 0.5;
        this.lastHitEffectiveness = "RESIST";
      }
    }

    amount = Math.floor(amount * multiplier);

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

  takeTurn(player) {
    const intention = this.getCurrentIntention();
    
    switch (intention) {
      case "ATTACK":
        let damage = this.attackDamage;
        if (this.strength > 0) {
          damage += this.strength;
        }
        if (this.weak > 0) {
          damage = Math.floor(damage * 0.75);
        }
        player.takeDamage(damage);
        break;
      case "HEAVY_ATTACK":
        let heavyDamage = this.heavyAttackDamage;
        if (this.strength > 0) {
          heavyDamage += this.strength;
        }
        if (this.weak > 0) {
          heavyDamage = Math.floor(heavyDamage * 0.75);
        }
        player.takeDamage(heavyDamage);
        break;
      case "DEFEND":
        this.block += this.blockAmount;
        break;
      case "BUFF":
        this.strength += 2;
        break;
      case "DEBUFF":
        player.weak = (player.weak || 0) + 1;
        break;
    }

    // Move to next intention
    this.currentIntentionIndex = (this.currentIntentionIndex + 1) % this.intentions.length;
    
    // Reset status effects
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
    
    // Draw enemy character with hit flash
    if (this.hitFlash > 0) {
      p.fill(255, 200, 200);
      p.stroke(255, 150, 150);
    } else {
      p.fill(this.color);
      p.stroke(this.color[0] * 0.7, this.color[1] * 0.7, this.color[2] * 0.7);
    }
    p.strokeWeight(3);
    
    if (this.id === "boss") {
      // Draw a more complex shape for the boss
      p.beginShape();
      p.vertex(this.x, this.y - 50);
      p.vertex(this.x + 40, this.y - 10);
      p.vertex(this.x + 40, this.y + 30);
      p.vertex(this.x, this.y + 50);
      p.vertex(this.x - 40, this.y + 30);
      p.vertex(this.x - 40, this.y - 10);
      p.endShape(p.CLOSE);
    } else {
      p.ellipse(this.x, this.y, 90, 90);
    }
    
    // Draw Element Icon
    if (this.element && this.element !== ELEMENTS.NONE) {
      p.push();
      p.fill(this.element.color);
      p.stroke(255);
      p.strokeWeight(2);
      p.circle(this.x + 35, this.y + 35, 30);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(16);
      p.noStroke();
      p.fill(255);
      p.text(this.element.icon, this.x + 35, this.y + 35);
      p.pop();
    }
    
    // Draw enemy name
    p.fill(200, 200, 200);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.text(this.name, this.x, this.y - 70);
    
    // Draw health bar with better visuals
    const healthBarWidth = 120;
    const healthPercent = this.health / this.maxHealth;
    
    p.noStroke();
    p.fill(40, 40, 40);
    p.rect(this.x - healthBarWidth/2, this.y + 55, healthBarWidth, 16, 8);
    
    p.fill(220, 60, 60);
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
      p.ellipse(this.x - 35, this.y - 25, 40, 40);
      
      p.fill(255);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(18);
      p.textStyle(p.BOLD);
      p.text(this.block, this.x - 35, this.y - 25);
      p.textStyle(p.NORMAL);
      
      p.textSize(10);
      p.text("BLOCK", this.x - 35, this.y - 10);
      p.pop();
    }
    
    // Draw intention with better visuals
    const intention = this.getCurrentIntention();
    p.push();
    p.drawingContext.shadowBlur = 10;
    p.drawingContext.shadowColor = 'rgba(220, 220, 220, 0.5)';
    p.fill(220, 220, 220, 230);
    p.stroke(180, 180, 180);
    p.strokeWeight(2);
    p.ellipse(this.x, this.y - 100, 50, 50);
    p.pop();
    
    p.textSize(24);
    p.fill(0);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    
    switch (intention) {
      case "ATTACK":
        p.text("⚔️", this.x, this.y - 100);
        p.textSize(14);
        p.text(this.attackDamage, this.x, this.y - 75);
        break;
      case "HEAVY_ATTACK":
        p.text("⚔️", this.x, this.y - 100);
        p.textSize(14);
        p.fill(200, 0, 0);
        p.text(this.heavyAttackDamage, this.x, this.y - 75);
        break;
      case "DEFEND":
        p.text("🛡️", this.x, this.y - 100);
        break;
      case "BUFF":
        p.text("💪", this.x, this.y - 100);
        break;
      case "DEBUFF":
        p.text("⚡", this.x, this.y - 100);
        break;
    }
    
    // Draw status effects
    let statusX = this.x + 35;
    if (this.strength > 0) {
      p.fill(200, 60, 60);
      p.stroke(150, 30, 30);
      p.strokeWeight(2);
      p.ellipse(statusX, this.y - 25, 28, 28);
      p.fill(255);
      p.noStroke();
      p.textSize(11);
      p.text("💪" + this.strength, statusX, this.y - 25);
      statusX += 32;
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
      statusX += 32;
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