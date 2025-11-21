// building.js
import { BUILDING_SIZE, BUILDING_INTERACTION_RANGE } from './globals.js';

export class Building {
  constructor(x, y, p) {
    this.x = x;
    this.y = y;
    this.width = BUILDING_SIZE;
    this.height = BUILDING_SIZE;
    this.scavenged = false;
    this.type = Math.floor(p.random() * 3); // 0: apartments, 1: shop, 2: warehouse
  }
  
  canScavenge(playerX, playerY) {
    const dist = Math.sqrt((this.x - playerX) ** 2 + (this.y - playerY) ** 2);
    return !this.scavenged && dist < BUILDING_INTERACTION_RANGE;
  }
  
  scavenge(player, p) {
    if (this.scavenged) return null;
    
    this.scavenged = true;
    
    // Generate random loot based on building type
    const loot = {
      food: 0,
      water: 0,
      antirad: 0,
      scrap: 0
    };
    
    switch(this.type) {
      case 0: // apartments
        loot.food = Math.floor(p.random(1, 3));
        loot.water = Math.floor(p.random(1, 3));
        loot.scrap = Math.floor(p.random(0, 2));
        break;
      case 1: // shop
        loot.food = Math.floor(p.random(2, 4));
        loot.water = Math.floor(p.random(2, 4));
        loot.antirad = Math.floor(p.random(0, 2));
        break;
      case 2: // warehouse
        loot.scrap = Math.floor(p.random(3, 6));
        loot.antirad = Math.floor(p.random(1, 3));
        break;
    }
    
    // Add to player inventory
    player.inventory.food += loot.food;
    player.inventory.water += loot.water;
    player.inventory.antirad += loot.antirad;
    player.inventory.scrap += loot.scrap;
    
    return loot;
  }
}