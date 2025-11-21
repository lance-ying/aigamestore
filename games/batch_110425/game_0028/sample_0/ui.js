// ui.js - UI rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, RECIPES, DISHES_TO_WIN } from './globals.js';

export function renderStartScreen(p) {
  p.background(220, 250, 220);
  
  // Title with decorative elements
  p.fill(100, 150, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("🌲 Little Berry Forest 🌲", CANVAS_WIDTH/2, 60);
  
  // Story box
  p.fill(255, 255, 240, 230);
  p.stroke(100, 150, 100);
  p.strokeWeight(2);
  p.rect(50, 100, CANVAS_WIDTH - 100, 180, 10);
  
  p.noStroke();
  p.fill(80, 120, 80);
  p.textSize(14);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("Welcome to the magical Berry Forest!", CANVAS_WIDTH/2, 120);
  
  p.textSize(11);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    "🎯 Goal: Meet all forest friends and cook 5 dishes!",
    "",
    "🎮 Controls:",
    "  Arrow Keys - Move around the forest",
    "  Shift - Sprint (move faster)",
    "  Space - Interact with characters and items",
    "  Z - Open cooking menu (at cooking station)",
    "",
    "Explore, collect ingredients, unlock recipes,",
    "and discover the stories of forest friends!"
  ];
  
  let yPos = 145;
  instructions.forEach(line => {
    p.text(line, 70, yPos);
    yPos += 16;
  });
  
  // Start prompt
  p.fill(180, 100, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  const pulse = Math.sin(p.frameCount * 0.1) * 20 + 235;
  p.fill(pulse, 150, 100);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, 340);
  
  // Decorative berries
  for (let i = 0; i < 5; i++) {
    const x = 80 + i * 110;
    p.fill(255, 100, 100);
    p.ellipse(x, 370, 8, 8);
  }
}

export function renderGameOverScreen(p, win) {
  p.background(win ? [200, 250, 200] : [250, 200, 200]);
  
  p.fill(win ? [60, 120, 60] : [120, 60, 60]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.text(win ? "🎉 Adventure Complete! 🎉" : "Game Over", CANVAS_WIDTH/2, 80);
  
  // Stats box
  p.fill(255, 255, 240, 230);
  p.stroke(win ? [100, 150, 100] : [150, 100, 100]);
  p.strokeWeight(2);
  p.rect(100, 120, CANVAS_WIDTH - 200, 180, 10);
  
  p.noStroke();
  p.fill(80);
  p.textSize(16);
  p.text("Your Adventure Stats:", CANVAS_WIDTH/2, 145);
  
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  const stats = [
    `Friends Met: ${gameState.interactedCharacters}/${gameState.totalCharacters}`,
    `Dishes Cooked: ${gameState.cookedDishes.length}`,
    `Score: ${gameState.score}`,
    "",
    win ? "You've discovered the magic of the forest!" : "Keep exploring to complete your adventure!"
  ];
  
  let yPos = 170;
  stats.forEach(line => {
    p.textAlign(p.CENTER, p.TOP);
    p.text(line, CANVAS_WIDTH/2, yPos);
    yPos += 22;
  });
  
  // Restart prompt
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  p.fill(100, 150, 100);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH/2, 340);
}

export function renderHUD(p) {
  // Semi-transparent background for HUD
  p.fill(0, 0, 0, 100);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 30);
  
  // Score and progress
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.CENTER);
  p.text(`Score: ${gameState.score}`, 10, 15);
  
  p.text(`Friends: ${gameState.interactedCharacters}/${gameState.totalCharacters}`, 120, 15);
  p.text(`Dishes: ${gameState.cookedDishes.length}/${DISHES_TO_WIN}`, 260, 15);
  
  // Inventory summary
  const totalItems = Object.values(gameState.inventory).reduce((a, b) => a + b, 0);
  p.text(`Items: ${totalItems}`, 390, 15);
  
  // Recipes unlocked
  p.text(`Recipes: ${gameState.unlockedRecipes.length}/${RECIPES.length}`, 480, 15);
  
  // Paused indicator
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.fill(255, 200, 100);
    p.textAlign(p.RIGHT, p.CENTER);
    p.textSize(14);
    p.text("PAUSED", CANVAS_WIDTH - 10, 15);
  }
}

export function renderCookingMenu(p) {
  // Dark overlay
  p.fill(0, 0, 0, 180);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Menu box
  p.fill(255, 250, 230);
  p.stroke(139, 90, 60);
  p.strokeWeight(3);
  p.rect(50, 40, CANVAS_WIDTH - 100, CANVAS_HEIGHT - 80, 10);
  
  // Title
  p.noStroke();
  p.fill(139, 90, 60);
  p.textSize(20);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("🍳 Cooking Menu 🍳", CANVAS_WIDTH/2, 65);
  
  // Instructions
  p.textSize(11);
  p.text("Press Z to close | Space to cook selected recipe", CANVAS_WIDTH/2, 90);
  
  // Display inventory
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text("Inventory:", 70, 110);
  
  let invY = 130;
  Object.entries(gameState.inventory).forEach(([item, count]) => {
    p.fill(count > 0 ? [80, 150, 80] : [150, 150, 150]);
    p.text(`${item}: ${count}`, 70, invY);
    invY += 18;
  });
  
  // Display recipes
  p.fill(139, 90, 60);
  p.text("Available Recipes:", 250, 110);
  
  if (gameState.unlockedRecipes.length === 0) {
    p.fill(150);
    p.textSize(11);
    p.text("Meet forest friends to unlock recipes!", 250, 130);
  } else {
    let recipeY = 130;
    gameState.unlockedRecipes.forEach((recipeId, index) => {
      const recipe = RECIPES.find(r => r.id === recipeId);
      if (!recipe) return;
      
      const alreadyCooked = gameState.cookedDishes.includes(recipeId);
      const canCook = canCookRecipe(recipe);
      
      p.fill(alreadyCooked ? [100, 200, 100] : (canCook ? [80, 150, 80] : [150, 150, 150]));
      p.text(`${index + 1}. ${recipe.name}`, 250, recipeY);
      
      p.textSize(10);
      p.fill(100);
      const ingredientText = Object.entries(recipe.ingredients)
        .map(([item, count]) => `${item}:${count}`)
        .join(", ");
      p.text(`  ${ingredientText}`, 250, recipeY + 15);
      
      if (alreadyCooked) {
        p.fill(100, 200, 100);
        p.text("  ✓ Cooked!", 250, recipeY + 28);
      }
      
      p.textSize(12);
      recipeY += 50;
    });
  }
  
  // Close instruction
  p.fill(139, 90, 60);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.textSize(12);
  p.text("Select recipes by meeting characters!", CANVAS_WIDTH/2, CANVAS_HEIGHT - 50);
}

function canCookRecipe(recipe) {
  return Object.entries(recipe.ingredients).every(([item, count]) => {
    return gameState.inventory[item] >= count;
  });
}

export function renderMiniGame(p) {
  if (!gameState.miniGameActive || !gameState.miniGameData) return;
  
  p.background(200, 220, 250);
  
  const mgData = gameState.miniGameData;
  
  if (gameState.miniGameType === "berry_catch") {
    // Berry catching mini-game
    p.fill(100, 150, 200);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(18);
    p.text("Catch the Berries!", CANVAS_WIDTH/2, 30);
    
    p.textSize(14);
    p.text(`Caught: ${mgData.caught}/${mgData.target}`, CANVAS_WIDTH/2, 60);
    p.text(`Time: ${Math.ceil(mgData.timeLeft / 60)}s`, CANVAS_WIDTH/2, 85);
    
    // Player basket
    p.fill(139, 90, 60);
    p.rect(mgData.basketX - 30, CANVAS_HEIGHT - 50, 60, 15);
    
    // Falling berries
    mgData.berries.forEach(berry => {
      p.fill(255, 100, 100);
      p.ellipse(berry.x, berry.y, 15, 15);
    });
    
    p.fill(100);
    p.textSize(12);
    p.text("Use Arrow Keys to move basket", CANVAS_WIDTH/2, CANVAS_HEIGHT - 20);
  }
}

export function renderInteractionPrompt(p, x, y, text) {
  p.push();
  p.fill(255, 255, 230, 230);
  p.stroke(100, 150, 100);
  p.strokeWeight(2);
  p.rect(x - 60, y - 50, 120, 30, 5);
  
  p.noStroke();
  p.fill(80, 120, 80);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(11);
  p.text(text, x, y - 35);
  p.pop();
}