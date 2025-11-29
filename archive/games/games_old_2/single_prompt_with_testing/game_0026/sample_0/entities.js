// entities.js - Hero and Enemy classes
import { HERO_CLASSES } from './globals.js';

export class Hero {
  constructor(name, heroClass, x, y) {
    this.name = name;
    this.heroClass = heroClass;
    this.x = x;
    this.y = y;
    
    // Stats
    this.maxHealth = 100;
    this.health = 100;
    this.level = 1;
    this.experience = 0;
    
    // Visual
    this.width = 60;
    this.height = 80;
    this.color = this.getClassColor();
    
    // Animation
    this.animOffsetX = 0;
    this.animOffsetY = 0;
    this.flashTimer = 0;
  }
  
  getClassColor() {
    switch (this.heroClass) {
      case HERO_CLASSES.WARRIOR: return [200, 60, 60];
      case HERO_CLASSES.MAGE: return [60, 100, 200];
      case HERO_CLASSES.ROGUE: return [100, 200, 100];
      default: return [150, 150, 150];
    }
  }
  
  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    this.flashTimer = 10;
  }
  
  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }
  
  gainExperience(amount) {
    this.experience += amount;
    while (this.experience >= this.getExpToNextLevel()) {
      this.levelUp();
    }
  }
  
  getExpToNextLevel() {
    return this.level * 50;
  }
  
  levelUp() {
    this.experience -= this.getExpToNextLevel();
    this.level++;
    this.maxHealth += 20;
    this.health = this.maxHealth;
  }
  
  isAlive() {
    return this.health > 0;
  }
  
  update() {
    // Update animations
    this.animOffsetX *= 0.8;
    this.animOffsetY *= 0.8;
    if (this.flashTimer > 0) this.flashTimer--;
  }
}

export class Enemy {
  constructor(name, type, x, y, encounterLevel) {
    this.name = name;
    this.type = type;
    this.x = x;
    this.y = y;
    
    // Stats scale with encounter
    const scaling = 1 + encounterLevel * 0.4;
    this.maxHealth = Math.floor(60 * scaling);
    this.health = this.maxHealth;
    this.damage = Math.floor(8 * scaling);
    
    // Visual
    this.width = 55;
    this.height = 70;
    this.color = this.getTypeColor();
    
    // Animation
    this.animOffsetX = 0;
    this.animOffsetY = 0;
    this.flashTimer = 0;
    this.intentDamage = 0;
    this.intentDefend = false;
  }
  
  getTypeColor() {
    switch (this.type) {
      case "GOBLIN": return [120, 180, 80];
      case "ROBOT": return [150, 150, 180];
      case "DEMON": return [180, 80, 120];
      default: return [130, 130, 130];
    }
  }
  
  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    this.flashTimer = 10;
  }
  
  isAlive() {
    return this.health > 0;
  }
  
  decideIntent(p) {
    // Simple AI: attack with varying damage
    if (p.random() < 0.3) {
      this.intentDefend = true;
      this.intentDamage = 0;
    } else {
      this.intentDefend = false;
      this.intentDamage = this.damage + Math.floor(p.random(-2, 3));
    }
  }
  
  update() {
    this.animOffsetX *= 0.8;
    this.animOffsetY *= 0.8;
    if (this.flashTimer > 0) this.flashTimer--;
  }
}