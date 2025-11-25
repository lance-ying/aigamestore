// entities.js - Entity classes

import { CANVAS_WIDTH, CANVAS_HEIGHT, SKILLS } from './globals.js';

export class DragonGirl {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.maxHP = 50;
    this.hp = 50;
    this.attack = 10;
    this.defense = 5;
    this.level = 1;
    this.experience = 0;
    this.skills = [SKILLS.TACKLE, SKILLS.FIRE_BREATH];
    this.appearance = 0; // Changes based on stats
    this.mood = "happy"; // happy, neutral, sad
    this.animFrame = 0;
  }

  feed(foodType) {
    this.maxHP += foodType.hp;
    this.hp = Math.min(this.hp + foodType.hp, this.maxHP);
    this.attack += foodType.attack;
    this.defense += foodType.defense;
    
    // Unlock skills based on stats
    if (this.attack >= 30 && !this.skills.find(s => s.name === "DRAGON_STRIKE")) {
      this.skills.push(SKILLS.DRAGON_STRIKE);
    }
    if (this.defense >= 25 && !this.skills.find(s => s.name === "DEFEND")) {
      this.skills.push(SKILLS.DEFEND);
    }
    if (this.maxHP >= 100 && !this.skills.find(s => s.name === "HEAL")) {
      this.skills.push(SKILLS.HEAL);
    }
    if (this.attack >= 20 && !this.skills.find(s => s.name === "TAIL_WHIP")) {
      this.skills.push(SKILLS.TAIL_WHIP);
    }
    if (this.attack >= 40 && !this.skills.find(s => s.name === "ROAR")) {
      this.skills.push(SKILLS.ROAR);
    }
    
    this.updateAppearance();
  }

  updateAppearance() {
    // Appearance changes based on dominant stat
    const totalStats = this.attack + this.defense + this.maxHP;
    if (this.attack > this.defense && this.attack > this.maxHP / 2) {
      this.appearance = 1; // Aggressive
    } else if (this.defense > this.attack && this.defense > this.maxHP / 2) {
      this.appearance = 2; // Defensive
    } else if (this.maxHP > this.attack * 2 && this.maxHP > this.defense * 2) {
      this.appearance = 3; // Balanced/Healthy
    } else {
      this.appearance = 0; // Default
    }
  }

  gainExperience(exp) {
    this.experience += exp;
    const expNeeded = this.level * 50;
    if (this.experience >= expNeeded) {
      this.levelUp();
    }
  }

  levelUp() {
    this.level++;
    this.experience = 0;
    this.maxHP += 10;
    this.hp = this.maxHP;
    this.attack += 3;
    this.defense += 2;
    this.updateAppearance();
  }

  takeDamage(damage) {
    const actualDamage = Math.max(1, damage - this.defense);
    this.hp = Math.max(0, this.hp - actualDamage);
    return actualDamage;
  }

  heal(amount) {
    const healed = Math.min(amount, this.maxHP - this.hp);
    this.hp += healed;
    return healed;
  }

  update() {
    this.animFrame += 0.1;
  }

  render(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Dragon girl body with appearance variations
    const baseColor = this.appearance === 1 ? [255, 100, 100] :
                      this.appearance === 2 ? [100, 100, 255] :
                      this.appearance === 3 ? [100, 255, 100] :
                      [255, 200, 150];
    
    // Body (oval)
    p.fill(...baseColor);
    p.stroke(0);
    p.strokeWeight(2);
    p.ellipse(0, 0, 40, 50);
    
    // Head
    p.ellipse(0, -30, 35, 35);
    
    // Eyes
    p.fill(255);
    p.ellipse(-8, -32, 8, 8);
    p.ellipse(8, -32, 8, 8);
    p.fill(0);
    p.ellipse(-8, -32, 4, 4);
    p.ellipse(8, -32, 4, 4);
    
    // Mouth based on mood
    p.noFill();
    p.stroke(0);
    p.strokeWeight(2);
    if (this.mood === "happy") {
      p.arc(0, -25, 15, 10, 0, p.PI);
    } else if (this.mood === "sad") {
      p.arc(0, -20, 15, 10, p.PI, p.TWO_PI);
    } else {
      p.line(-5, -22, 5, -22);
    }
    
    // Dragon horns
    p.fill(200, 150, 100);
    p.triangle(-12, -45, -8, -40, -15, -35);
    p.triangle(12, -45, 8, -40, 15, -35);
    
    // Wings with animation
    const wingFlap = Math.sin(this.animFrame) * 5;
    p.fill(...baseColor, 200);
    p.ellipse(-25, -5 + wingFlap, 20, 30);
    p.ellipse(25, -5 - wingFlap, 20, 30);
    
    // Tail
    p.noFill();
    p.stroke(...baseColor);
    p.strokeWeight(8);
    p.bezier(0, 20, -15, 30, -20, 40, -15, 50);
    
    // HP bar above head
    p.strokeWeight(1);
    p.stroke(0);
    p.fill(200, 50, 50);
    p.rect(-20, -55, 40, 5);
    p.fill(50, 255, 50);
    const hpPercent = this.hp / this.maxHP;
    p.rect(-20, -55, 40 * hpPercent, 5);
    
    p.pop();
  }
}

export class Enemy {
  constructor(x, y, type, day) {
    this.x = x;
    this.y = y;
    this.type = type;
    
    // Scale enemy based on day (progression)
    const dayScale = 1 + (day / 365) * 2;
    
    if (type === "slime") {
      this.name = "Slime";
      this.maxHP = Math.floor(30 * dayScale);
      this.attack = Math.floor(5 * dayScale);
      this.defense = Math.floor(2 * dayScale);
      this.color = [100, 255, 100];
      this.expReward = 20;
      this.goldReward = 15;
    } else if (type === "goblin") {
      this.name = "Goblin";
      this.maxHP = Math.floor(50 * dayScale);
      this.attack = Math.floor(8 * dayScale);
      this.defense = Math.floor(4 * dayScale);
      this.color = [100, 150, 100];
      this.expReward = 35;
      this.goldReward = 25;
    } else if (type === "dragon") {
      this.name = "Wild Dragon";
      this.maxHP = Math.floor(80 * dayScale);
      this.attack = Math.floor(12 * dayScale);
      this.defense = Math.floor(6 * dayScale);
      this.color = [200, 100, 100];
      this.expReward = 60;
      this.goldReward = 40;
    } else if (type === "boss") {
      this.name = "World Catastrophe";
      this.maxHP = 500;
      this.attack = 30;
      this.defense = 15;
      this.color = [150, 50, 200];
      this.expReward = 500;
      this.goldReward = 1000;
    }
    
    this.hp = this.maxHP;
    this.animFrame = 0;
  }

  takeDamage(damage) {
    const actualDamage = Math.max(1, damage - this.defense);
    this.hp = Math.max(0, this.hp - actualDamage);
    return actualDamage;
  }

  attack_enemy() {
    return this.attack;
  }

  update() {
    this.animFrame += 0.05;
  }

  render(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Different rendering based on type
    if (this.type === "slime") {
      const bounce = Math.sin(this.animFrame * 3) * 3;
      p.fill(...this.color);
      p.stroke(0);
      p.strokeWeight(2);
      p.ellipse(0, bounce, 50, 40);
      // Eyes
      p.fill(0);
      p.ellipse(-10, -5 + bounce, 8, 8);
      p.ellipse(10, -5 + bounce, 8, 8);
    } else if (this.type === "goblin") {
      // Body
      p.fill(...this.color);
      p.stroke(0);
      p.strokeWeight(2);
      p.ellipse(0, 0, 35, 45);
      // Head
      p.ellipse(0, -25, 30, 30);
      // Eyes
      p.fill(255, 0, 0);
      p.ellipse(-7, -27, 6, 6);
      p.ellipse(7, -27, 6, 6);
      // Ears
      p.fill(...this.color);
      p.triangle(-15, -30, -20, -25, -18, -35);
      p.triangle(15, -30, 20, -25, 18, -35);
    } else if (this.type === "dragon") {
      // Similar to player but different color
      p.fill(...this.color);
      p.stroke(0);
      p.strokeWeight(2);
      p.ellipse(0, 0, 45, 55);
      p.ellipse(0, -32, 38, 38);
      // Eyes
      p.fill(255, 200, 0);
      p.ellipse(-9, -34, 10, 10);
      p.ellipse(9, -34, 10, 10);
      p.fill(0);
      p.ellipse(-9, -34, 5, 5);
      p.ellipse(9, -34, 5, 5);
      // Horns
      p.fill(100, 50, 50);
      p.triangle(-13, -48, -9, -43, -16, -38);
      p.triangle(13, -48, 9, -43, 16, -38);
      // Wings
      p.fill(...this.color, 200);
      p.ellipse(-28, -5, 25, 35);
      p.ellipse(28, -5, 25, 35);
    } else if (this.type === "boss") {
      // Epic boss appearance
      const pulse = Math.sin(this.animFrame * 2) * 5;
      // Main body
      p.fill(...this.color);
      p.stroke(100, 0, 150);
      p.strokeWeight(3);
      p.ellipse(0, 0, 70 + pulse, 80 + pulse);
      // Multiple eyes
      p.fill(255, 0, 0);
      p.ellipse(-15, -10, 15, 15);
      p.ellipse(15, -10, 15, 15);
      p.ellipse(0, 10, 12, 12);
      // Dark aura
      p.noFill();
      p.stroke(...this.color, 100);
      p.strokeWeight(2);
      p.ellipse(0, 0, 90 + pulse * 2, 100 + pulse * 2);
      p.ellipse(0, 0, 110 + pulse * 3, 120 + pulse * 3);
    }
    
    // HP bar
    p.strokeWeight(1);
    p.stroke(0);
    p.fill(200, 50, 50);
    p.rect(-30, -60, 60, 6);
    p.fill(50, 255, 50);
    const hpPercent = this.hp / this.maxHP;
    p.rect(-30, -60, 60 * hpPercent, 6);
    
    // Name
    p.fill(255);
    p.stroke(0);
    p.strokeWeight(3);
    p.textAlign(p.CENTER);
    p.textSize(12);
    p.text(this.name, 0, -75);
    
    p.pop();
  }
}