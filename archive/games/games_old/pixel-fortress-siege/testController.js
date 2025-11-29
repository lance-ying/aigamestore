// testController.js - Automated test controllers

import { gameState } from './globals.js';

export class TestController {
  constructor(mode) {
    this.mode = mode;
    this.actionTimer = 0;
    this.actionIndex = 0;
  }
  
  getAction(p, deltaTime) {
    this.actionTimer += deltaTime;
    
    if (this.mode === 'TEST_1') {
      return this.basicTest(p);
    } else if (this.mode === 'TEST_2') {
      return this.winTest(p);
    }
    
    return null;
  }
  
  basicTest(p) {
    // Basic test: Deploy warriors periodically
    if (this.actionTimer > 1000) {
      this.actionTimer = 0;
      
      if (gameState.playerGold >= 50) {
        return { type: 'DEPLOY', unitType: 'WARRIOR' };
      }
    }
    
    return null;
  }
  
  winTest(p) {
    // Aggressive test to win: Deploy units strategically
    if (this.actionTimer > 500) {
      this.actionTimer = 0;
      
      const unitCost = gameState.selectedUnitType === 'WARRIOR' ? 
        (gameState.levelNumber === 1 ? 50 : 60) : 
        gameState.selectedUnitType === 'ARCHER' ? 75 : 120;
      
      // Cycle through unit types if we have gold
      if (gameState.playerGold >= 120 && gameState.levelNumber >= 3) {
        return { type: 'DEPLOY', unitType: 'SORCERER' };
      } else if (gameState.playerGold >= 75 && gameState.levelNumber >= 2) {
        return { type: 'DEPLOY', unitType: 'ARCHER' };
      } else if (gameState.playerGold >= unitCost) {
        return { type: 'DEPLOY', unitType: 'WARRIOR' };
      }
      
      // Move cursor around deployment zone
      if (this.actionIndex % 5 === 0) {
        return { type: 'MOVE_CURSOR', direction: 'DOWN' };
      } else if (this.actionIndex % 5 === 2) {
        return { type: 'MOVE_CURSOR', direction: 'UP' };
      }
      
      this.actionIndex++;
    }
    
    return null;
  }
}