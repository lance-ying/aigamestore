// campfire.js - Campfire cooking and trading

import { gameState } from './globals.js';

export const RECIPES = [
  { name: 'Grilled Fish', fish: 1, crops: 0, acornReward: 15 },
  { name: 'Veggie Stew', fish: 0, crops: 2, acornReward: 12 },
  { name: 'Fish Soup', fish: 2, crops: 1, acornReward: 30 },
  { name: 'Garden Feast', fish: 0, crops: 3, acornReward: 25 },
  { name: 'Fisherman\'s Pie', fish: 3, crops: 2, acornReward: 50 },
  { name: 'Harvest Roast', fish: 1, crops: 4, acornReward: 45 },
  { name: 'Forest Banquet', fish: 4, crops: 3, acornReward: 80 },
  { name: 'Ultimate Feast', fish: 5, crops: 5, acornReward: 120 }
];

export class CampfireSystem {
  constructor() {
    this.selectedRecipeIndex = 0;
    this.lastCookResult = null;
    this.resultTimer = 0;
    this.fireAnimation = 0;
    this.visitorTimer = 0;
    this.visitorPresent = false;
    this.visitorReward = 0;
  }
  
  update() {
    this.fireAnimation++;
    
    if (this.resultTimer > 0) {
      this.resultTimer--;
    }
    
    // Visitor system
    if (!this.visitorPresent) {
      this.visitorTimer++;
      if (this.visitorTimer > 600) { // Visitor every 10 seconds
        this.visitorPresent = true;
        this.visitorReward = 20 + Math.floor(Math.random() * 30);
        this.visitorTimer = 0;
      }
    }
  }
  
  navigateUp() {
    this.selectedRecipeIndex = Math.max(0, this.selectedRecipeIndex - 1);
  }
  
  navigateDown() {
    this.selectedRecipeIndex = Math.min(RECIPES.length - 1, this.selectedRecipeIndex + 1);
  }
  
  canCraftRecipe(recipe) {
    return gameState.fish >= recipe.fish && gameState.crops >= recipe.crops;
  }
  
  craftRecipe() {
    const recipe = RECIPES[this.selectedRecipeIndex];
    if (!this.canCraftRecipe(recipe)) {
      this.lastCookResult = "Not enough ingredients!";
      this.resultTimer = 90;
      return false;
    }
    
    gameState.fish -= recipe.fish;
    gameState.crops -= recipe.crops;
    gameState.acorns += recipe.acornReward;
    gameState.craftedItems++;
    gameState.score += recipe.acornReward;
    
    this.lastCookResult = `Crafted ${recipe.name}! +${recipe.acornReward} acorns`;
    this.resultTimer = 90;
    return true;
  }
  
  tradeWithVisitor() {
    if (!this.visitorPresent) return false;
    
    gameState.acorns += this.visitorReward;
    gameState.score += this.visitorReward;
    this.visitorPresent = false;
    this.lastCookResult = `Traded for ${this.visitorReward} acorns!`;
    this.resultTimer = 90;
    return true;
  }
  
  draw(p) {
    p.push();
    
    // Title
    p.fill(255, 150, 50);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(24);
    p.text("CAMPFIRE", 300, 20);
    
    // Instructions
    p.textSize(11);
    p.fill(200);
    p.text("↑↓: Select Recipe  Z: Cook/Trade", 300, 50);
    
    // Resources
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(13);
    p.fill(255, 230, 180);
    p.text(`Fish: ${gameState.fish}  Crops: ${gameState.crops}  Crafted: ${gameState.craftedItems}`, 20, 75);
    
    // Draw campfire
    p.push();
    p.translate(120, 180);
    
    // Fire
    const flicker = Math.sin(this.fireAnimation * 0.15) * 5;
    p.fill(255, 100, 0);
    p.triangle(-15, 20, 15, 20, 0, -20 + flicker);
    p.fill(255, 200, 0);
    p.triangle(-10, 15, 10, 15, 0, -10 + flicker * 0.7);
    
    // Logs
    p.fill(80, 50, 30);
    p.rect(-20, 20, 40, 8);
    p.rect(-15, 15, 30, 8);
    
    p.pop();
    
    // Recipe list
    let y = 100;
    const visibleRecipes = 5;
    const startIndex = Math.max(0, Math.min(this.selectedRecipeIndex - 2, RECIPES.length - visibleRecipes));
    
    for (let i = startIndex; i < Math.min(startIndex + visibleRecipes, RECIPES.length); i++) {
      const recipe = RECIPES[i];
      const isSelected = i === this.selectedRecipeIndex;
      const canCraft = this.canCraftRecipe(recipe);
      
      if (isSelected) {
        p.fill(80, 50, 30, 150);
        p.rect(230, y - 3, 350, 28);
      }
      
      p.textAlign(p.LEFT, p.TOP);
      p.textSize(13);
      p.fill(canCraft ? [255, 230, 180] : [150, 130, 100]);
      p.text(recipe.name, 240, y);
      
      p.textSize(11);
      p.fill(180);
      p.text(`Needs: ${recipe.fish}🐟 ${recipe.crops}🌱`, 240, y + 14);
      
      p.textAlign(p.RIGHT, p.TOP);
      p.textSize(12);
      p.fill(255, 215, 100);
      p.text(`→ ${recipe.acornReward} acorns`, 570, y + 6);
      
      y += 32;
    }
    
    // Visitor
    if (this.visitorPresent) {
      p.push();
      p.fill(50, 50, 50, 200);
      p.rect(220, 280, 360, 60);
      
      p.fill(255, 200, 150);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(14);
      p.text("A traveler has arrived!", 400, 295);
      p.textSize(12);
      p.text(`Press Z to trade for ${this.visitorReward} acorns`, 400, 315);
      p.pop();
    }
    
    // Show last result
    if (this.resultTimer > 0) {
      p.textAlign(p.CENTER, p.BOTTOM);
      p.textSize(14);
      const isSuccess = this.lastCookResult && this.lastCookResult.includes('Crafted');
      p.fill(isSuccess ? [100, 255, 100] : [255, 200, 100]);
      p.text(this.lastCookResult, 300, 385);
    }
    
    p.pop();
  }
}