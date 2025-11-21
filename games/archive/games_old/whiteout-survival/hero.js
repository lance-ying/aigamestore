// hero.js - Hero class and management

import { gameState } from './globals.js';

export class Hero {
  constructor(id, name, heroClass) {
    this.id = id;
    this.name = name;
    this.heroClass = heroClass; // "warrior", "ranger", "mage"
    this.level = 1;
    this.xp = 0;
    this.maxHP = 100;
    this.currentHP = 100;
    this.atk = 10;
    this.def = 5;
    this.abilityCooldown = 0;
    this.maxAbilityCooldown = 3;
    this.isRecruited = false;
    this.isDefeated = false;
  }
  
  getColor() {
    switch(this.heroClass) {
      case "warrior": return [100, 150, 255];
      case "ranger": return [100, 255, 150];
      case "mage": return [255, 100, 200];
      default: return [150, 150, 255];
    }
  }
  
  getIcon() {
    switch(this.heroClass) {
      case "warrior": return "W";
      case "ranger": return "R";
      case "mage": return "M";
      default: return "H";
    }
  }
  
  takeDamage(damage) {
    const actualDamage = Math.max(1, damage - this.def);
    this.currentHP = Math.max(0, this.currentHP - actualDamage);
    if (this.currentHP === 0) {
      this.isDefeated = true;
    }
    return actualDamage;
  }
  
  heal(amount) {
    this.currentHP = Math.min(this.maxHP, this.currentHP + amount);
    this.isDefeated = false;
  }
  
  gainXP(amount) {
    this.xp += amount;
    const xpNeeded = this.level * 100;
    if (this.xp >= xpNeeded) {
      this.levelUp();
    }
  }
  
  levelUp() {
    this.level++;
    this.xp = 0;
    this.maxHP += 20;
    this.currentHP = this.maxHP;
    this.atk += 5;
    this.def += 2;
    
    // Award points
    gameState.score += 200;
  }
  
  useAbility() {
    if (this.abilityCooldown === 0) {
      this.abilityCooldown = this.maxAbilityCooldown;
      return true;
    }
    return false;
  }
  
  tickCooldown() {
    if (this.abilityCooldown > 0) {
      this.abilityCooldown--;
    }
  }
}

export function createStartingHero() {
  const hero = new Hero(0, "First Hero", "warrior");
  hero.isRecruited = true;
  return hero;
}

export function createRecruitableHero(id) {
  const classes = ["warrior", "ranger", "mage"];
  const names = [
    ["Bjorn", "Erik", "Ragnar"],
    ["Astrid", "Freya", "Ingrid"],
    ["Odin", "Thor", "Loki"]
  ];
  const classIndex = id % 3;
  const nameIndex = Math.floor(id / 3) % 3;
  
  return new Hero(id, names[classIndex][nameIndex], classes[classIndex]);
}