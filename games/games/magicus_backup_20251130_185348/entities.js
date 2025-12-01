// entities.js - Player and Enemy classes

import { gameState } from './globals.js';

export class Player {
  constructor() {
    this.hp = 100;
    this.maxHP = 100;
    this.attack = 10;
    this.defense = 5;
    this.level = 1;
  }

  takeDamage(amount) {
    const actualDamage = Math.max(1, amount - this.defense);
    this.hp = Math.max(0, this.hp - actualDamage);
    gameState.playerHP = this.hp;
    return actualDamage;
  }

  heal(amount) {
    this.hp = Math.min(this.maxHP, this.hp + amount);
    gameState.playerHP = this.hp;
  }

  levelUp() {
    this.level++;
    this.maxHP += 40; // Increased from 20 to 40 for better scaling
    this.hp = this.maxHP; // Full heal on level up
    this.attack += 5;
    this.defense += 3; // Increased from 2 to 3
    gameState.playerMaxHP = this.maxHP;
    gameState.playerHP = this.hp;
  }
}

export class Enemy {
  constructor(stage) {
    this.stage = stage;
    this.type = (stage - 1) % 5; // Different enemy types based on stage
    this.isBoss = (stage === 3); // Only stage 3 (Hard) is a boss
    
    // Base stats scaled for 3 difficulty levels
    // Stage 1 = Easy, Stage 2 = Medium, Stage 3 = Hard (Boss)
    if (this.isBoss) {
      this.maxHP = 400; // Hard boss
      this.attack = 30;
    } else if (stage === 2) {
      this.maxHP = 200; // Medium
      this.attack = 18;
    } else {
      this.maxHP = 120; // Easy
      this.attack = 12;
    }
    
    this.hp = this.maxHP;
    this.attackCounter = 0; // For special attack patterns
    
    // Type-specific mechanics
    this.specialAbility = this.getSpecialAbility();
  }

  getSpecialAbility() {
    switch (this.type) {
      case 0: // Fire - Can do double damage attacks
        return "Fire Rage: Every 3rd attack deals double damage!";
      case 1: // Ice - Consistent high damage
        return "Ice Shards: Attacks deal 30% more damage!";
      case 2: // Nature - Can heal
        return "Regeneration: Heals 5 HP each turn!";
      case 3: // Light - Fast attacks
        return "Divine Fury: Attacks 20% faster!";
      case 4: // Shadow - Draining attacks
        return "Life Drain: Heals for 25% of damage dealt!";
      default:
        return "";
    }
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    gameState.enemyHP = this.hp;
    return amount;
  }

  performAttack() {
    this.attackCounter++;
    let damage = this.attack;
    
    // Boss bonus
    if (this.isBoss) {
      damage = Math.floor(damage * 1.3);
    }
    
    // Type-specific abilities
    switch (this.type) {
      case 0: // Fire - Every 3rd attack is double damage
        if (this.attackCounter % 3 === 0) {
          damage *= 2;
        }
        break;
      case 1: // Ice - Always 30% more damage
        damage = Math.floor(damage * 1.3);
        break;
      case 2: // Nature - Heal self
        this.hp = Math.min(this.maxHP, this.hp + 5);
        gameState.enemyHP = this.hp;
        break;
      case 3: // Light - Faster attacks (handled elsewhere, slight damage boost here)
        damage = Math.floor(damage * 1.2);
        break;
      case 4: // Shadow - Life drain
        const drainAmount = Math.floor(damage * 0.25);
        this.hp = Math.min(this.maxHP, this.hp + drainAmount);
        gameState.enemyHP = this.hp;
        break;
    }
    
    return damage;
  }

  isDead() {
    return this.hp <= 0;
  }
  
  getName() {
    const typeNames = ["Fire", "Ice", "Nature", "Light", "Shadow"];
    const difficultyNames = ["Easy", "Medium", "Hard"];
    const prefix = this.isBoss ? "BOSS: " : "";
    const suffix = this.isBoss ? " Lord" : " Elemental";
    return prefix + typeNames[this.type] + suffix + ` (${difficultyNames[this.stage - 1]})`;
  }
}