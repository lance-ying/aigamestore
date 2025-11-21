import { HERO_CLASSES } from './globals.js';

export class Hero {
  constructor(className, level = 1) {
    const classData = HERO_CLASSES.find(c => c.name === className);
    this.class = className;
    this.level = level;
    this.maxHealth = classData.health + (level - 1) * 10;
    this.health = this.maxHealth;
    this.attack = classData.attack + (level - 1) * 2;
    this.defense = classData.defense + (level - 1) * 1;
    this.ability = classData.ability;
    this.abilityCooldown = classData.abilityCooldown;
    this.currentCooldown = 0;
    this.experience = 0;
    this.experienceToLevel = 100 * level;
    this.equipment = { weapon: null, armor: null };
  }
  
  takeDamage(amount) {
    const actualDamage = Math.max(1, amount - this.defense);
    this.health = Math.max(0, this.health - actualDamage);
    return actualDamage;
  }
  
  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }
  
  gainExperience(exp) {
    this.experience += exp;
    if (this.experience >= this.experienceToLevel) {
      this.levelUp();
    }
  }
  
  levelUp() {
    this.level++;
    this.experience = 0;
    this.experienceToLevel = 100 * this.level;
    this.maxHealth += 10;
    this.health = this.maxHealth;
    this.attack += 2;
    this.defense += 1;
  }
  
  canUseAbility() {
    return this.currentCooldown <= 0 && this.health > 0;
  }
  
  useAbility() {
    if (this.canUseAbility()) {
      this.currentCooldown = this.abilityCooldown;
      return true;
    }
    return false;
  }
  
  updateCooldown() {
    if (this.currentCooldown > 0) {
      this.currentCooldown--;
    }
  }
}

export class Enemy {
  constructor(type, zoneMultiplier = 1) {
    this.name = type.name;
    this.maxHealth = type.health * zoneMultiplier;
    this.health = this.maxHealth;
    this.attack = type.attack * zoneMultiplier;
    this.defense = type.defense * zoneMultiplier;
    this.exp = type.exp * zoneMultiplier;
    this.gold = type.gold * zoneMultiplier;
    this.attackTimer = 0;
    this.attackCooldown = 120;
  }
  
  takeDamage(amount) {
    const actualDamage = Math.max(1, amount - this.defense);
    this.health = Math.max(0, this.health - actualDamage);
    return actualDamage;
  }
  
  canAttack() {
    return this.attackTimer <= 0 && this.health > 0;
  }
  
  performAttack() {
    if (this.canAttack()) {
      this.attackTimer = this.attackCooldown;
      return true;
    }
    return false;
  }
  
  updateTimer() {
    if (this.attackTimer > 0) {
      this.attackTimer--;
    }
  }
}