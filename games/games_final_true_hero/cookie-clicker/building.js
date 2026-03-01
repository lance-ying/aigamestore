// building.js - Building class
import { gameState } from './globals.js';

export class Building {
  constructor(type, index) {
    this.type = type;
    this.name = type.name;
    this.count = 0;
    this.baseCost = type.baseCost;
    this.baseCps = type.baseCps;
    this.description = type.description;
    this.icon = type.icon;
    this.multiplier = 1;
    this.index = index;
  }

  getCost() {
    // Cost increases by 15% for each owned building
    return Math.floor(this.baseCost * Math.pow(1.15, this.count));
  }

  getCps() {
    return this.baseCps * this.count * this.multiplier;
  }

  purchase() {
    const cost = this.getCost();
    if (gameState.cookies >= cost) {
      gameState.cookies -= cost;
      this.count++;
      return true;
    }
    return false;
  }

  applyUpgrade(multiplier) {
    this.multiplier *= multiplier;
  }
}