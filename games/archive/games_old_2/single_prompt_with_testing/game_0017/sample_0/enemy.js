// enemy.js - Enemy classes and management

import { gameState } from './globals.js';

export class Enemy {
  constructor(type, floor) {
    this.type = type;
    this.floor = floor;
    
    // Base stats scaled by floor
    const floorMultiplier = 1 + Math.floor(floor / 5) * 0.15;
    
    switch (type) {
      case 'GOBLIN':
        this.name = 'Goblin';
        this.maxHP = Math.floor(30 * floorMultiplier);
        this.attack = Math.floor(8 * (1 + Math.floor(floor / 5) * 0.1));
        this.expReward = 20 + floor * 5;
        this.goldReward = 10 + floor * 2;
        this.color = [100, 180, 100];
        break;
      case 'ORC':
        this.name = 'Orc';
        this.maxHP = Math.floor(50 * floorMultiplier);
        this.attack = Math.floor(12 * (1 + Math.floor(floor / 5) * 0.1));
        this.expReward = 35 + floor * 7;
        this.goldReward = 15 + floor * 3;
        this.color = [150, 100, 100];
        break;
      case 'DRAGON':
        this.name = 'Dragon';
        this.maxHP = Math.floor(80 * floorMultiplier);
        this.attack = Math.floor(18 * (1 + Math.floor(floor / 5) * 0.1));
        this.expReward = 60 + floor * 10;
        this.goldReward = 25 + floor * 5;
        this.color = [200, 50, 50];
        break;
      case 'BOSS':
        this.name = `Floor ${floor} Boss`;
        this.maxHP = Math.floor(150 * floorMultiplier);
        this.attack = Math.floor(25 * (1 + Math.floor(floor / 5) * 0.1));
        this.expReward = 100 + floor * 15;
        this.goldReward = 50 + floor * 10;
        this.color = [180, 100, 200];
        this.isBoss = true;
        break;
      default:
        this.name = 'Unknown';
        this.maxHP = 20;
        this.attack = 5;
        this.expReward = 10;
        this.goldReward = 5;
        this.color = [128, 128, 128];
    }
    
    this.hp = this.maxHP;
    this.x = 0;
    this.y = 0;
  }
  
  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    return this.hp <= 0;
  }
  
  isDead() {
    return this.hp <= 0;
  }
}

export function spawnEnemies(floor) {
  gameState.enemies = [];
  
  // Boss floor
  if (floor % 10 === 0) {
    const boss = new Enemy('BOSS', floor);
    gameState.enemies.push(boss);
    gameState.entities.push(boss);
    return;
  }
  
  // Regular enemies
  const enemyCount = 1 + Math.floor(floor / 3);
  const maxEnemies = Math.min(3, enemyCount);
  
  for (let i = 0; i < maxEnemies; i++) {
    let enemyType;
    if (floor < 5) {
      enemyType = 'GOBLIN';
    } else if (floor < 15) {
      enemyType = Math.random() < 0.6 ? 'GOBLIN' : 'ORC';
    } else {
      const rand = Math.random();
      if (rand < 0.4) enemyType = 'GOBLIN';
      else if (rand < 0.7) enemyType = 'ORC';
      else enemyType = 'DRAGON';
    }
    
    const enemy = new Enemy(enemyType, floor);
    gameState.enemies.push(enemy);
    gameState.entities.push(enemy);
  }
}