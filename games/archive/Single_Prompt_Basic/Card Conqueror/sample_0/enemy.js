export class Enemy {
  constructor(template) {
    this.id = template.id;
    this.name = template.name;
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
    this.x = 450;
    this.y = 200;
  }

  getCurrentIntention() {
    return this.intentions[this.currentIntentionIndex];
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
    
    // Draw enemy character
    p.fill(this.color);
    p.stroke(this.color[0] * 0.7, this.color[1] * 0.7, this.color[2] * 0.7);
    p.strokeWeight(2);
    
    if (this.id === "boss") {
      // Draw a more complex shape for the boss
      p.beginShape();
      p.vertex(this.x, this.y - 40);
      p.vertex(this.x + 30, this.y - 10);
      p.vertex(this.x + 30, this.y + 20);
      p.vertex(this.x, this.y + 40);
      p.vertex(this.x - 30, this.y + 20);
      p.vertex(this.x - 30, this.y - 10);
      p.endShape(p.CLOSE);
    } else {
      p.ellipse(this.x, this.y, 70, 70);
    }
    
    // Draw enemy name
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.text(this.name, this.x, this.y - 50);
    
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
      p.ellipse(this.x - 25, this.y - 15, 30, 30);
      
      p.fill(255);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(14);
      p.text(this.block, this.x - 25, this.y - 15);
    }
    
    // Draw intention
    const intention = this.getCurrentIntention();
    p.fill(220, 220, 220, 200);
    p.noStroke();
    p.ellipse(this.x, this.y - 80, 40, 40);
    
    p.textSize(20);
    p.fill(0);
    p.textAlign(p.CENTER, p.CENTER);
    
    switch (intention) {
      case "ATTACK":
        p.text("⚔️", this.x, this.y - 80);
        break;
      case "HEAVY_ATTACK":
        p.text("⚔️", this.x, this.y - 80);
        p.textSize(12);
        p.text(this.heavyAttackDamage, this.x, this.y - 60);
        break;
      case "DEFEND":
        p.text("🛡️", this.x, this.y - 80);
        break;
      case "BUFF":
        p.text("💪", this.x, this.y - 80);
        break;
      case "DEBUFF":
        p.text("⚡", this.x, this.y - 80);
        break;
    }
    
    // Draw damage number for attack intentions
    if (intention === "ATTACK") {
      p.textSize(12);
      p.text(this.attackDamage, this.x, this.y - 60);
    }
    
    // Draw status effects
    let statusY = this.y - 30;
    if (this.strength > 0) {
      p.fill(200, 60, 60);
      p.noStroke();
      p.ellipse(this.x + 25, statusY, 20, 20);
      p.fill(255);
      p.textSize(10);
      p.text("S" + this.strength, this.x + 25, statusY);
      statusY -= 22;
    }
    
    if (this.vulnerable > 0) {
      p.fill(200, 120, 50);
      p.noStroke();
      p.ellipse(this.x + 25, statusY, 20, 20);
      p.fill(255);
      p.textSize(10);
      p.text("V" + this.vulnerable, this.x + 25, statusY);
      statusY -= 22;
    }
    
    if (this.weak > 0) {
      p.fill(150, 150, 50);
      p.noStroke();
      p.ellipse(this.x + 25, statusY, 20, 20);
      p.fill(255);
      p.textSize(10);
      p.text("W" + this.weak, this.x + 25, statusY);
    }
    
    p.pop();
  }
}