// player.js - Player class and related functions
import { gameState } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.maxHealth = 100;
    this.health = 100;
    this.attack = 10;
    this.defense = 5;
    this.level = 1;
    this.experience = 0;
    this.gold = 0;
  }

  takeDamage(damage) {
    const actualDamage = Math.max(1, damage - this.defense - gameState.defenseBonus);
    this.health -= actualDamage;
    if (this.health <= 0) {
      this.health = 0;
    }
    return actualDamage;
  }

  heal(amount) {
    const actualHeal = Math.min(amount, this.maxHealth - this.health);
    this.health += actualHeal;
    return actualHeal;
  }

  gainExperience(exp) {
    this.experience += exp;
    gameState.experience += exp;
    
    while (gameState.experience >= gameState.expToNextLevel) {
      this.levelUp();
    }
  }

  levelUp() {
    gameState.level++;
    this.level = gameState.level;
    gameState.experience -= gameState.expToNextLevel;
    gameState.expToNextLevel = Math.floor(gameState.expToNextLevel * 1.3);
    
    // Stat increases on level up
    this.maxHealth += 10;
    this.health = this.maxHealth;
    this.attack += 5;
    this.defense += 2;
    
    gameState.score += 100;
  }

  render(p) {
    // Player is represented as a hero icon in the UI area
    p.push();
    p.translate(this.x, this.y);
    
    // Body (armored)
    p.fill(70, 130, 180);
    p.stroke(40, 80, 120);
    p.strokeWeight(2);
    p.rect(-12, 0, 24, 30, 4);
    
    // Head
    p.fill(255, 220, 180);
    p.stroke(200, 160, 140);
    p.ellipse(0, -10, 20, 20);
    
    // Helmet
    p.fill(160, 160, 160);
    p.stroke(100, 100, 100);
    p.arc(0, -10, 22, 22, p.PI, p.TWO_PI);
    
    // Sword
    p.fill(180, 180, 180);
    p.stroke(120, 120, 120);
    p.rect(15, 5, 4, 20);
    p.fill(139, 69, 19);
    p.rect(14, 23, 6, 6);
    
    p.pop();
  }
}