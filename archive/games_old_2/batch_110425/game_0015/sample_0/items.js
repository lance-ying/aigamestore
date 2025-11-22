// items.js - Item and equipment system

import { ITEM_SIZE, gameState } from './globals.js';

export class Item {
  constructor(x, y, type, rarity = 'common') {
    this.x = x;
    this.y = y;
    this.type = type; // 'weapon', 'armor', 'shield', 'gold'
    this.rarity = rarity; // 'common', 'rare', 'epic'
    this.size = ITEM_SIZE;
    this.collected = false;
    this.animationFrame = 0;
    
    // Generate stats based on type and rarity
    this.generateStats();
  }

  generateStats() {
    const rarityMultiplier = {
      'common': 1,
      'rare': 1.5,
      'epic': 2
    };
    
    const multiplier = rarityMultiplier[this.rarity];
    
    switch(this.type) {
      case 'weapon':
        this.name = `${this.rarity} Sword`;
        this.attackBonus = Math.floor(5 * multiplier + Math.random() * 5 * multiplier);
        break;
      case 'armor':
        this.name = `${this.rarity} Armor`;
        this.defenseBonus = Math.floor(3 * multiplier + Math.random() * 3 * multiplier);
        this.hpBonus = Math.floor(10 * multiplier + Math.random() * 10 * multiplier);
        break;
      case 'shield':
        this.name = `${this.rarity} Shield`;
        this.defenseBonus = Math.floor(4 * multiplier + Math.random() * 4 * multiplier);
        break;
      case 'gold':
        this.name = 'Gold';
        this.amount = Math.floor(20 * multiplier + Math.random() * 30 * multiplier);
        break;
    }
  }

  update() {
    this.animationFrame++;
  }
}

export function dropItem(x, y) {
  const rand = Math.random();
  let type, rarity;
  
  if (rand < 0.4) {
    type = 'gold';
    rarity = 'common';
  } else if (rand < 0.65) {
    type = 'weapon';
  } else if (rand < 0.85) {
    type = 'armor';
  } else {
    type = 'shield';
  }
  
  if (type !== 'gold') {
    const rarityRand = Math.random();
    if (rarityRand < 0.6) rarity = 'common';
    else if (rarityRand < 0.9) rarity = 'rare';
    else rarity = 'epic';
  }
  
  const item = new Item(x, y, type, rarity);
  gameState.items.push(item);
  return item;
}

export function collectItem(player, item) {
  if (item.type === 'gold') {
    gameState.gold += item.amount;
    gameState.score += item.amount * 5;
  } else {
    player.equipItem(item);
    gameState.score += 50;
  }
  item.collected = true;
}