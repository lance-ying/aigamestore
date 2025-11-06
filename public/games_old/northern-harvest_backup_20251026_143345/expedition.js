// expedition.js - Expedition mini-game

import { gameState, EXPEDITION_TYPES } from './globals.js';

export class Expedition {
  constructor(type) {
    this.type = type;
    this.data = EXPEDITION_TYPES[type];
    this.startTime = gameState.gameTime;
    this.isActive = true;
    this.isComplete = false;
    this.resourceNodes = [];
    this.collectedResources = 0;
    this.targetResources = 10;
    
    // Generate resource nodes for mini-game
    this.generateNodes();
  }
  
  generateNodes() {
    const count = 15;
    for (let i = 0; i < count; i++) {
      this.resourceNodes.push({
        x: Math.random() * 500 + 50,
        y: Math.random() * 300 + 50,
        collected: false,
        radius: 15
      });
    }
  }
  
  update() {
    if (this.isActive && !this.isComplete) {
      const elapsed = gameState.gameTime - this.startTime;
      
      // Auto-complete after duration (for testing)
      if (elapsed >= this.data.duration) {
        this.complete();
      }
    }
  }
  
  collectNode(index) {
    if (index >= 0 && index < this.resourceNodes.length) {
      if (!this.resourceNodes[index].collected) {
        this.resourceNodes[index].collected = true;
        this.collectedResources++;
        
        if (this.collectedResources >= this.targetResources) {
          this.complete();
        }
        
        return true;
      }
    }
    return false;
  }
  
  complete() {
    this.isComplete = true;
    this.isActive = false;
    
    // Award rewards
    const rewards = {
      coins: this.data.rewards.coins,
      xp: this.data.xp,
      score: this.data.score,
      resources: {}
    };
    
    for (const resource in this.data.rewards) {
      if (resource !== "coins") {
        rewards.resources[resource] = this.data.rewards[resource];
      }
    }
    
    return rewards;
  }
}

export function createExpedition(type) {
  if (EXPEDITION_TYPES[type] && gameState.expeditionEnergy >= EXPEDITION_TYPES[type].energyCost) {
    gameState.expeditionEnergy -= EXPEDITION_TYPES[type].energyCost;
    return new Expedition(type);
  }
  return null;
}