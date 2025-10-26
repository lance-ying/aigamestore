// buildings.js - Building management

import { gameState, BUILDING_DATA, RECIPE_DATA } from './globals.js';

export class Building {
  constructor(type, x, y) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.status = 'idle'; // 'idle', 'producing', 'ready'
    this.currentRecipe = null;
    this.productionStartTime = 0;
    this.productionProgress = 0;
  }
  
  startProduction(recipe, currentTime) {
    if (this.status === 'idle' && RECIPE_DATA[recipe]) {
      const recipeData = RECIPE_DATA[recipe];
      
      // Check if we have ingredients
      let canProduce = true;
      for (const [ingredient, amount] of Object.entries(recipeData.ingredients)) {
        if (gameState.resources[ingredient] < amount) {
          canProduce = false;
          break;
        }
      }
      
      if (canProduce) {
        // Consume ingredients
        for (const [ingredient, amount] of Object.entries(recipeData.ingredients)) {
          gameState.resources[ingredient] -= amount;
        }
        
        this.status = 'producing';
        this.currentRecipe = recipe;
        this.productionStartTime = currentTime;
        this.productionProgress = 0;
        return true;
      }
    }
    return false;
  }
  
  update(currentTime) {
    if (this.status === 'producing' && this.currentRecipe) {
      const recipeData = RECIPE_DATA[this.currentRecipe];
      const elapsed = currentTime - this.productionStartTime;
      this.productionProgress = Math.min(elapsed / recipeData.productionTime, 1);
      
      if (this.productionProgress >= 1) {
        this.status = 'ready';
      }
    }
  }
  
  collect() {
    if (this.status === 'ready' && this.currentRecipe) {
      const recipe = this.currentRecipe;
      this.status = 'idle';
      this.currentRecipe = null;
      this.productionStartTime = 0;
      this.productionProgress = 0;
      return recipe;
    }
    return null;
  }
  
  render(p) {
    p.push();
    
    const buildingData = BUILDING_DATA[this.type];
    
    // Building structure
    p.fill(...buildingData.color);
    p.stroke(60);
    p.strokeWeight(2);
    p.rect(this.x, this.y, 60, 60);
    
    // Roof
    p.fill(100, 50, 50);
    p.triangle(this.x, this.y, this.x + 30, this.y - 15, this.x + 60, this.y);
    
    // Progress bar
    if (this.status === 'producing') {
      p.fill(100);
      p.rect(this.x + 5, this.y + 50, 50, 5);
      p.fill(0, 255, 0);
      p.rect(this.x + 5, this.y + 50, 50 * this.productionProgress, 5);
    }
    
    // Ready indicator
    if (this.status === 'ready') {
      p.fill(255, 255, 0);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(20);
      p.text('!', this.x + 30, this.y + 10);
    }
    
    p.pop();
  }
}

export function updateBuildings(gameState) {
  const currentTime = gameState.gameTime;
  gameState.buildings.forEach(building => building.update(currentTime));
}

export function renderBuildings(p, gameState) {
  gameState.buildings.forEach(building => building.render(p));
}

export function addBuilding(gameState, type) {
  const buildingData = BUILDING_DATA[type];
  if (gameState.playerGold >= buildingData.cost) {
    const x = 350 + (gameState.buildings.length % 2) * 100;
    const y = 250 + Math.floor(gameState.buildings.length / 2) * 80;
    const building = new Building(type, x, y);
    gameState.buildings.push(building);
    gameState.playerGold -= buildingData.cost;
    return true;
  }
  return false;
}