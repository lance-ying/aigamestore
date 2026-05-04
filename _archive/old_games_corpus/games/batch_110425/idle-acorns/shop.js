// shop.js - Shop system and upgrades

import { gameState, AREAS } from './globals.js';

export const SHOP_ITEMS = [
  {
    id: 'scavenger',
    name: 'Scavenger',
    description: 'Auto-collects 5 acorns/sec',
    baseCost: 10,
    costMultiplier: 1.5,
    maxPurchases: 10
  },
  {
    id: 'clickUpgrade',
    name: 'Better Tools',
    description: 'Collect +1 acorn per click',
    baseCost: 25,
    costMultiplier: 2,
    maxPurchases: 10
  },
  {
    id: 'unlockPond',
    name: 'Unlock Fishing Pond',
    description: 'Access fishing mini-game',
    baseCost: 100,
    costMultiplier: 1,
    maxPurchases: 1
  },
  {
    id: 'unlockGarden',
    name: 'Unlock Garden',
    description: 'Grow crops for crafting',
    baseCost: 200,
    costMultiplier: 1,
    maxPurchases: 1
  },
  {
    id: 'unlockCampfire',
    name: 'Unlock Campfire',
    description: 'Cook and trade items',
    baseCost: 350,
    costMultiplier: 1,
    maxPurchases: 1
  },
  {
    id: 'fishingSkill',
    name: 'Fishing Skill',
    description: 'Easier fishing timing',
    baseCost: 150,
    costMultiplier: 1.8,
    maxPurchases: 5
  },
  {
    id: 'gardenSize',
    name: 'Expand Garden',
    description: '+1 garden plot',
    baseCost: 180,
    costMultiplier: 2,
    maxPurchases: 4
  },
  {
    id: 'cookingSkill',
    name: 'Cooking Skill',
    description: 'Better recipes & trades',
    baseCost: 220,
    costMultiplier: 1.9,
    maxPurchases: 5
  }
];

export class ShopSystem {
  constructor() {
    this.purchaseCounts = {};
    SHOP_ITEMS.forEach(item => {
      this.purchaseCounts[item.id] = 0;
    });
    this.selectedIndex = 0;
  }
  
  getCost(itemId) {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return 0;
    const count = this.purchaseCounts[itemId] || 0;
    return Math.floor(item.baseCost * Math.pow(item.costMultiplier, count));
  }
  
  canPurchase(itemId) {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return false;
    const count = this.purchaseCounts[itemId] || 0;
    if (count >= item.maxPurchases) return false;
    return gameState.acorns >= this.getCost(itemId);
  }
  
  purchase(itemId) {
    if (!this.canPurchase(itemId)) return false;
    
    const cost = this.getCost(itemId);
    gameState.acorns -= cost;
    this.purchaseCounts[itemId]++;
    
    // Apply upgrade effects
    switch(itemId) {
      case 'scavenger':
        gameState.scavengers++;
        break;
      case 'clickUpgrade':
        gameState.upgrades.clickPower++;
        break;
      case 'unlockPond':
        gameState.upgrades.unlockPond = true;
        if (!gameState.unlockedAreas.includes(AREAS.POND)) {
          gameState.unlockedAreas.push(AREAS.POND);
        }
        break;
      case 'unlockGarden':
        gameState.upgrades.unlockGarden = true;
        if (!gameState.unlockedAreas.includes(AREAS.GARDEN)) {
          gameState.unlockedAreas.push(AREAS.GARDEN);
        }
        break;
      case 'unlockCampfire':
        gameState.upgrades.unlockCampfire = true;
        if (!gameState.unlockedAreas.includes(AREAS.CAMPFIRE)) {
          gameState.unlockedAreas.push(AREAS.CAMPFIRE);
        }
        break;
      case 'fishingSkill':
        gameState.upgrades.fishingSkill++;
        break;
      case 'gardenSize':
        gameState.upgrades.gardenSize++;
        gameState.maxPlots++;
        break;
      case 'cookingSkill':
        gameState.upgrades.cookingSkill++;
        break;
    }
    
    return true;
  }
  
  navigateUp() {
    this.selectedIndex = Math.max(0, this.selectedIndex - 1);
  }
  
  navigateDown() {
    this.selectedIndex = Math.min(SHOP_ITEMS.length - 1, this.selectedIndex + 1);
  }
  
  draw(p) {
    p.push();
    
    // Title
    p.fill(255, 220, 150);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(24);
    p.text("SHOP", 300, 20);
    
    // Instructions
    p.textSize(12);
    p.fill(200);
    p.text("↑↓: Navigate  Z: Purchase  Shift: Toggle Auto-collect", 300, 50);
    
    // Auto-collect status
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(11);
    p.fill(gameState.autoCollectEnabled ? [100, 255, 100] : [255, 100, 100]);
    p.text(`Auto-collect: ${gameState.autoCollectEnabled ? 'ON' : 'OFF'}`, 20, 75);
    
    // Shop items
    let y = 100;
    const itemHeight = 35;
    
    SHOP_ITEMS.forEach((item, index) => {
      const isSelected = index === this.selectedIndex;
      const canAfford = this.canPurchase(item.id);
      const count = this.purchaseCounts[item.id] || 0;
      const maxed = count >= item.maxPurchases;
      
      // Background
      if (isSelected) {
        p.fill(80, 60, 40, 150);
        p.rect(15, y - 5, 570, itemHeight);
      }
      
      // Item info
      p.textAlign(p.LEFT, p.TOP);
      p.textSize(14);
      p.fill(maxed ? [150, 150, 150] : [255, 230, 180]);
      p.text(`${item.name} (${count}/${item.maxPurchases})`, 25, y);
      
      p.textSize(11);
      p.fill(180);
      p.text(item.description, 25, y + 16);
      
      // Cost
      p.textAlign(p.RIGHT, p.TOP);
      p.textSize(13);
      if (maxed) {
        p.fill(100, 200, 100);
        p.text("MAXED", 575, y + 5);
      } else {
        p.fill(canAfford ? [255, 215, 100] : [255, 100, 100]);
        p.text(`${this.getCost(item.id)} acorns`, 575, y + 5);
      }
      
      y += itemHeight;
    });
    
    p.pop();
  }
}