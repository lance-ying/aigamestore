// player.js - Player class and management

import { gameState } from './globals.js';

export class Player {
  constructor() {
    this.maxHP = 100;
    this.hp = 100;
    this.attack = 10;
    this.defense = 0;
    this.defensePercent = 0;
    this.mana = 50;
    this.maxMana = 100;
    this.level = 1;
    this.experience = 0;
    this.experienceToLevel = 100;
    this.gold = 0;
    
    // Equipment
    this.weapon = { name: 'Wooden Sword', tier: 0, attackBonus: 0 };
    this.armor = { name: 'Cloth Armor', tier: 0, defenseBonus: 0 };
    
    // Position (for logging)
    this.x = 0;
    this.y = 0;
  }
  
  takeDamage(amount) {
    const actualDamage = Math.max(0, Math.floor(amount * (1 - this.defensePercent)));
    this.hp = Math.max(0, this.hp - actualDamage);
    return actualDamage;
  }
  
  heal(amount) {
    const oldHP = this.hp;
    this.hp = Math.min(this.maxHP, this.hp + amount);
    return this.hp - oldHP;
  }
  
  gainMana(amount) {
    this.mana = Math.min(this.maxMana, this.mana + amount);
  }
  
  addDefense(percent) {
    this.defensePercent = Math.min(0.9, this.defensePercent + percent);
  }
  
  resetDefense() {
    this.defensePercent = 0;
  }
  
  gainExperience(amount) {
    this.experience += amount;
    while (this.experience >= this.experienceToLevel) {
      this.levelUp();
    }
  }
  
  levelUp() {
    this.level++;
    this.experience -= this.experienceToLevel;
    this.experienceToLevel = Math.floor(this.experienceToLevel * 1.2);
    
    // Increase stats by 5%
    this.maxHP = Math.floor(this.maxHP * 1.05);
    this.hp = Math.min(this.hp + 20, this.maxHP);
    this.attack = Math.floor(this.attack * 1.05);
    this.maxMana = Math.floor(this.maxMana * 1.05);
    this.mana = Math.min(this.mana + 10, this.maxMana);
  }
  
  gainGold(amount) {
    this.gold += amount;
    gameState.totalGold += amount;
  }
  
  getTotalAttack() {
    return this.attack + this.weapon.attackBonus;
  }
  
  getTotalDefense() {
    return this.defense + this.armor.defenseBonus;
  }
}

export function createPlayer() {
  const player = new Player();
  gameState.player = player;
  gameState.entities.push(player);
  return player;
}