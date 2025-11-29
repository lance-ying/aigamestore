// building.js - Building management

import { gameState, BUILDING_TYPES, RECIPE_TYPES } from './globals.js';

export class Building {
  constructor(type, gridX, gridY) {
    this.type = type;
    this.gridX = gridX;
    this.gridY = gridY;
    this.data = BUILDING_TYPES[type];
    this.constructionStartTime = gameState.gameTime;
    this.constructionProgress = 0;
    this.isComplete = false;
    this.productionQueue = [];
    this.currentProduction = null;
    this.productionStartTime = 0;
  }
  
  update() {
    if (!this.isComplete) {
      const elapsed = gameState.gameTime - this.constructionStartTime;
      this.constructionProgress = elapsed / this.data.buildTime;
      
      if (this.constructionProgress >= 1) {
        this.isComplete = true;
        this.constructionProgress = 1;
      }
    } else if (this.currentProduction) {
      const recipe = RECIPE_TYPES[this.currentProduction];
      const elapsed = gameState.gameTime - this.productionStartTime;
      
      if (elapsed >= recipe.productionTime) {
        // Production complete
        this.completeProduction();
      }
    }
  }
  
  startProduction(recipeType) {
    if (!this.isComplete) return false;
    if (this.currentProduction) return false;
    
    const recipe = RECIPE_TYPES[recipeType];
    if (!recipe) return false;
    
    // Check if we have required inputs
    if (gameState.inventory[recipe.input] < recipe.inputAmount) {
      return false;
    }
    
    // Consume inputs
    gameState.inventory[recipe.input] -= recipe.inputAmount;
    
    // Start production
    this.currentProduction = recipeType;
    this.productionStartTime = gameState.gameTime;
    
    return true;
  }
  
  completeProduction() {
    if (!this.currentProduction) return null;
    
    const recipe = RECIPE_TYPES[this.currentProduction];
    const output = this.currentProduction;
    
    this.currentProduction = null;
    this.productionStartTime = 0;
    
    return {
      product: output,
      amount: recipe.outputAmount,
      xp: recipe.xp,
      score: recipe.score
    };
  }
  
  canCollect() {
    if (!this.currentProduction) return false;
    
    const recipe = RECIPE_TYPES[this.currentProduction];
    const elapsed = gameState.gameTime - this.productionStartTime;
    
    return elapsed >= recipe.productionTime;
  }
}

export function createBuilding(type, gridX, gridY) {
  if (BUILDING_TYPES[type]) {
    return new Building(type, gridX, gridY);
  }
  return null;
}