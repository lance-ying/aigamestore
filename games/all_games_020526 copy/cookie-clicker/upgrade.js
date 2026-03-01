// upgrade.js - Upgrade class
import { gameState } from './globals.js';

export class Upgrade {
  constructor(type) {
    this.id = type.id;
    this.name = type.name;
    this.cost = type.cost;
    this.description = type.description;
    this.requirement = type.requirement;
    this.effect = type.effect;
    this.purchased = false;
  }

  isAvailable() {
    if (this.purchased) return false;

    if (this.requirement.building) {
      const building = gameState.buildings.find(b => b.name === this.requirement.building);
      return building && building.count >= this.requirement.count;
    }

    if (this.requirement.clicks) {
      return gameState.manualClicks >= this.requirement.clicks;
    }

    return false;
  }

  canAfford() {
    return gameState.cookies >= this.cost;
  }

  purchase() {
    if (!this.canAfford() || !this.isAvailable() || this.purchased) {
      return false;
    }

    gameState.cookies -= this.cost;
    this.purchased = true;
    gameState.ownedUpgrades.push(this.id);

    // Apply effect
    if (this.effect.building) {
      const building = gameState.buildings.find(b => b.name === this.effect.building);
      if (building) {
        building.applyUpgrade(this.effect.multiplier);
      }
    }

    return true;
  }
}