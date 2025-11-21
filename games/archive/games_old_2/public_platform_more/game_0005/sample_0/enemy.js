// enemy.js - Enemy class

import { STATUS_EFFECTS } from './globals.js';

export class Enemy {
  constructor(name, maxHp, attack, x, y, goldReward, expReward) {
    this.name = name;
    this.maxHp = maxHp;
    this.hp = maxHp;
    this.attack = attack;
    this.x = x;
    this.y = y;
    this.goldReward = goldReward;
    this.expReward = expReward;
    this.shield = 0;
    this.statusEffects = {};
    this.nextAction = null;
    this.isPlayer = false;
  }
  
  takeDamage(amount) {
    if (this.shield > 0) {
      const blocked = Math.min(this.shield, amount);
      this.shield -= blocked;
      amount -= blocked;
    }
    
    this.hp = Math.max(0, this.hp - amount);
    return amount;
  }
  
  addShield(amount) {
    this.shield += amount;
  }
  
  updateStatusEffects() {
    for (const effect in this.statusEffects) {
      this.statusEffects[effect].duration--;
      if (this.statusEffects[effect].duration <= 0) {
        delete this.statusEffects[effect];
      }
    }
  }
  
  getAttackPenalty() {
    let penalty = 0;
    if (this.statusEffects[STATUS_EFFECTS.WEAK]) {
      penalty += this.statusEffects[STATUS_EFFECTS.WEAK].value;
    }
    return penalty;
  }
  
  isDead() {
    return this.hp <= 0;
  }
  
  planAction(p, heroes) {
    // Simple AI: attack random living hero
    const livingHeroes = heroes.filter(h => !h.isDead());
    if (livingHeroes.length > 0) {
      const targetIndex = Math.floor(p.random() * livingHeroes.length);
      this.nextAction = {
        type: "ATTACK",
        target: livingHeroes[targetIndex]
      };
    }
  }
}

export function createEnemyWave(battleNumber) {
  const enemies = [];
  const baseX = 400;
  const baseY = 150;
  
  if (battleNumber === 1) {
    enemies.push(new Enemy("Scout Bot", 40, 8, baseX, baseY, 10, 15));
    enemies.push(new Enemy("Scout Bot", 40, 8, baseX + 80, baseY + 30, 10, 15));
  } else if (battleNumber === 2) {
    enemies.push(new Enemy("Guard Bot", 60, 12, baseX, baseY, 15, 25));
    enemies.push(new Enemy("Scout Bot", 40, 8, baseX + 80, baseY - 20, 10, 15));
    enemies.push(new Enemy("Scout Bot", 40, 8, baseX + 80, baseY + 40, 10, 15));
  } else {
    // Scaling enemies
    const count = Math.min(2 + battleNumber, 5);
    for (let i = 0; i < count; i++) {
      const hp = 40 + battleNumber * 10;
      const attack = 8 + battleNumber * 2;
      const gold = 10 + battleNumber * 5;
      const exp = 15 + battleNumber * 10;
      enemies.push(new Enemy(
        `Enemy ${i + 1}`,
        hp,
        attack,
        baseX + (i % 2) * 80,
        baseY + (i * 35) - 35,
        gold,
        exp
      ));
    }
  }
  
  return enemies;
}