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
    this.maxHP += 20;
    this.hp = this.maxHP;
    this.attack += 5;
    this.defense += 2;
    gameState.playerMaxHP = this.maxHP;
    gameState.playerHP = this.hp;
  }
}

export class Enemy {
  constructor(stage) {
    this.stage = stage;
    this.maxHP = 100 + (stage - 1) * 50;
    this.hp = this.maxHP;
    this.attack = 5 + (stage - 1) * 3;
    this.type = stage % 5; // Different enemy types based on stage
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    gameState.enemyHP = this.hp;
    return amount;
  }

  performAttack() {
    return this.attack;
  }

  isDead() {
    return this.hp <= 0;
  }
}