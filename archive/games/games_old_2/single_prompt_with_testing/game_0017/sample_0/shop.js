// shop.js - Shop system

import { gameState } from './globals.js';

export class ShopItem {
  constructor(type, name, baseCost, tier = 0) {
    this.type = type; // 'weapon' or 'armor'
    this.name = name;
    this.tier = tier;
    this.baseCost = baseCost;
    this.cost = this.calculateCost();
  }
  
  calculateCost() {
    return Math.floor(this.baseCost * Math.pow(1.5, this.tier));
  }
  
  getBonus() {
    const baseBonus = this.type === 'weapon' ? 5 : 3;
    return Math.floor(baseBonus * (1 + this.tier * 0.15));
  }
}

export function initializeShop() {
  gameState.shopItems = [
    new ShopItem('weapon', 'Iron Sword', 50, gameState.player.weapon.tier + 1),
    new ShopItem('weapon', 'Steel Blade', 100, gameState.player.weapon.tier + 2),
    new ShopItem('armor', 'Leather Armor', 40, gameState.player.armor.tier + 1),
    new ShopItem('armor', 'Chain Mail', 80, gameState.player.armor.tier + 2),
  ];
}

export function purchaseItem(item) {
  const player = gameState.player;
  
  if (player.gold >= item.cost) {
    player.gold -= item.cost;
    
    if (item.type === 'weapon') {
      player.weapon = {
        name: item.name,
        tier: item.tier,
        attackBonus: item.getBonus()
      };
    } else if (item.type === 'armor') {
      player.armor = {
        name: item.name,
        tier: item.tier,
        defenseBonus: item.getBonus()
      };
    }
    
    return true;
  }
  
  return false;
}