// ui.js - UI rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, INGREDIENT_DATA, STAR_REPUTATION_THRESHOLDS } from './globals.js';

export function drawStartScreen(p) {
  p.background(240, 230, 220);
  
  // Title
  p.fill(101, 67, 33);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("Blending Cafe Story", CANVAS_WIDTH/2, 80);
  
  // Coffee cup decoration
  p.fill(139, 69, 19);
  p.rect(CANVAS_WIDTH/2 - 20, 120, 40, 50, 5);
  p.fill(101, 67, 33);
  p.arc(CANVAS_WIDTH/2, 145, 30, 30, p.PI, 0, p.CHORD);
  
  // Description
  p.fill(60, 40, 20);
  p.textSize(14);
  p.textAlign(p.CENTER, p.TOP);
  const desc = [
    "Build your dream cafe by creating unique recipes!",
    "",
    "Combine ingredients to craft drinks and food,",
    "serve customers with different tastes,",
    "and grow your cafe to achieve 5-Star rating!"
  ];
  
  for (let i = 0; i < desc.length; i++) {
    p.text(desc[i], CANVAS_WIDTH/2, 190 + i * 20);
  }
  
  // Instructions
  p.fill(139, 69, 19);
  p.textSize(12);
  const instructions = [
    "Arrow Keys: Navigate menus",
    "Space: Confirm / Create / Serve",
    "Z: Cancel / Back",
    "Shift: Switch between Cafe and Recipe Lab"
  ];
  
  for (let i = 0; i < instructions.length; i++) {
    p.text(instructions[i], CANVAS_WIDTH/2, 290 + i * 18);
  }
  
  // Start prompt
  p.fill(139, 69, 19);
  p.textSize(20);
  const flash = Math.floor(p.frameCount / 30) % 2 === 0;
  if (flash) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, 370);
  }
}

export function drawGameOverScreen(p, isWin) {
  p.background(isWin ? [220, 255, 220] : [255, 220, 220]);
  
  p.fill(isWin ? [0, 100, 0] : [100, 0, 0]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "5-STAR CAFE!" : "GAME OVER", CANVAS_WIDTH/2, 100);
  
  // Trophy or sad face
  if (isWin) {
    p.fill(255, 215, 0);
    p.stroke(184, 134, 11);
    p.strokeWeight(3);
    // Trophy
    p.ellipse(CANVAS_WIDTH/2, 180, 60, 60);
    p.rect(CANVAS_WIDTH/2 - 15, 210, 30, 20);
    p.rect(CANVAS_WIDTH/2 - 25, 230, 50, 10);
    
    // Star
    p.fill(255, 255, 0);
    p.noStroke();
    p.star(CANVAS_WIDTH/2, 180, 15, 25, 5);
  } else {
    p.fill(100, 100, 100);
    p.noStroke();
    p.ellipse(CANVAS_WIDTH/2, 180, 80, 80);
    p.fill(50);
    p.ellipse(CANVAS_WIDTH/2 - 15, 170, 10, 10);
    p.ellipse(CANVAS_WIDTH/2 + 15, 170, 10, 10);
    p.arc(CANVAS_WIDTH/2, 200, 40, 20, 0, p.PI);
  }
  
  // Stats
  p.fill(60, 40, 20);
  p.textSize(18);
  p.text(`Final Rating: ${gameState.stars} Star${gameState.stars !== 1 ? 's' : ''}`, CANVAS_WIDTH/2, 270);
  p.text(`Total Earnings: $${gameState.totalEarnings}`, CANVAS_WIDTH/2, 295);
  p.text(`Customers Served: ${gameState.customersServed}`, CANVAS_WIDTH/2, 320);
  
  // Restart prompt
  p.textSize(16);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH/2, 360);
}

export function drawCafeView(p) {
  // Background
  p.background(250, 240, 230);
  
  // Floor
  p.fill(210, 180, 140);
  p.noStroke();
  p.rect(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 50);
  
  // Counter
  p.fill(139, 90, 43);
  p.stroke(101, 67, 33);
  p.strokeWeight(2);
  p.rect(CANVAS_WIDTH - 150, 50, 140, 300);
  
  // Menu board on counter
  p.fill(60, 40, 20);
  p.rect(CANVAS_WIDTH - 140, 60, 120, 100);
  
  p.fill(255, 253, 208);
  p.noStroke();
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  p.text("MENU", CANVAS_WIDTH - 135, 65);
  
  // Draw menu items
  for (let i = 0; i < 4; i++) {
    const item = gameState.menuSlots[i];
    p.fill(255, 253, 208);
    p.textSize(10);
    if (item) {
      p.text(`${i+1}. ${item.name.substring(0, 12)}`, CANVAS_WIDTH - 135, 85 + i * 15);
      p.text(`   $${item.price}`, CANVAS_WIDTH - 135, 95 + i * 15);
    } else {
      p.fill(180, 180, 180);
      p.text(`${i+1}. [Empty]`, CANVAS_WIDTH - 135, 85 + i * 15);
    }
  }
  
  // Draw customers
  for (const customer of gameState.customers) {
    customer.draw(p);
  }
  
  // UI Panel
  drawUIPanel(p);
  
  // View indicator
  p.fill(101, 67, 33);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(14);
  p.text("CAFE VIEW (Shift: Switch to Recipe Lab)", CANVAS_WIDTH/2, 10);
}

export function drawRecipeLabView(p) {
  p.background(230, 240, 250);
  
  // Lab bench
  p.fill(160, 160, 180);
  p.stroke(100, 100, 120);
  p.strokeWeight(2);
  p.rect(50, CANVAS_HEIGHT - 100, CANVAS_WIDTH - 100, 80);
  
  // Title
  p.fill(60, 60, 80);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(14);
  p.text("RECIPE LAB (Shift: Switch to Cafe)", CANVAS_WIDTH/2, 10);
  
  // Instructions
  p.textSize(11);
  p.text("Select up to 3 ingredients, then press Space to create recipe", CANVAS_WIDTH/2, 30);
  
  // Current recipe in progress
  if (gameState.recipeInProgress.active) {
    p.fill(80, 80, 100);
    p.textSize(12);
    p.textAlign(p.LEFT, p.TOP);
    p.text("Creating: " + gameState.recipeInProgress.ingredients.join(" + "), 60, 50);
    p.text("Press Space to finalize or Z to cancel", 60, 65);
  }
  
  // Draw available ingredients
  const startX = 80;
  const startY = 100;
  const cols = 5;
  const spacing = 90;
  
  p.textAlign(p.CENTER, p.CENTER);
  
  for (let i = 0; i < gameState.unlockedIngredients.length; i++) {
    const ing = gameState.unlockedIngredients[i];
    const x = startX + (i % cols) * spacing;
    const y = startY + Math.floor(i / cols) * 80;
    
    const isSelected = i === gameState.selectedMenuIndex;
    const isInRecipe = gameState.recipeInProgress.ingredients.includes(ing);
    
    // Container
    p.fill(isSelected ? [200, 220, 255] : [255, 255, 255]);
    p.stroke(isInRecipe ? [0, 150, 0] : [100, 100, 120]);
    p.strokeWeight(isSelected ? 3 : 2);
    p.rect(x - 30, y - 25, 60, 50, 5);
    
    // Ingredient icon
    const data = INGREDIENT_DATA[ing];
    if (data) {
      p.fill(...data.color);
      p.noStroke();
      p.ellipse(x, y - 5, 30, 30);
    }
    
    // Name
    p.fill(60, 60, 80);
    p.textSize(9);
    p.text(ing, x, y + 18);
  }
  
  // Shop section
  drawIngredientShop(p);
  
  // UI Panel
  drawUIPanel(p);
}

export function drawIngredientShop(p) {
  p.fill(255, 250, 240);
  p.stroke(139, 69, 19);
  p.strokeWeight(2);
  p.rect(CANVAS_WIDTH - 180, 100, 170, 250, 5);
  
  p.fill(101, 67, 33);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(12);
  p.text("INGREDIENT SHOP", CANVAS_WIDTH - 95, 110);
  
  p.textSize(9);
  p.textAlign(p.LEFT, p.TOP);
  
  let yOffset = 130;
  for (let i = 0; i < Math.min(6, gameState.availableIngredients.length); i++) {
    const ing = gameState.availableIngredients[i];
    if (!ing.unlocked) {
      p.fill(80, 60, 40);
      p.text(`${ing.name} - $${ing.cost}`, CANVAS_WIDTH - 170, yOffset);
      p.fill(180);
      p.text("(Not purchased)", CANVAS_WIDTH - 170, yOffset + 12);
      yOffset += 35;
    }
  }
  
  if (yOffset === 130) {
    p.fill(0, 150, 0);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("All ingredients\nunlocked!", CANVAS_WIDTH - 95, 200);
  }
}

export function drawUIPanel(p) {
  // Stats panel
  p.fill(255, 250, 240);
  p.stroke(139, 69, 19);
  p.strokeWeight(2);
  p.rect(10, CANVAS_HEIGHT - 80, 180, 70, 5);
  
  p.fill(101, 67, 33);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text(`Money: $${gameState.money}`, 20, CANVAS_HEIGHT - 70);
  p.text(`Reputation: ${gameState.reputation}`, 20, CANVAS_HEIGHT - 52);
  
  // Stars
  p.textSize(11);
  p.text("Rating:", 20, CANVAS_HEIGHT - 34);
  for (let i = 0; i < 5; i++) {
    if (i < gameState.stars) {
      p.fill(255, 215, 0);
    } else {
      p.fill(200, 200, 200);
    }
    p.noStroke();
    p.star(80 + i * 18, CANVAS_HEIGHT - 28, 4, 7, 5);
  }
  
  // Next star progress
  if (gameState.stars < 5) {
    const nextThreshold = STAR_REPUTATION_THRESHOLDS[gameState.stars + 1];
    const progress = gameState.reputation / nextThreshold;
    
    p.fill(220);
    p.noStroke();
    p.rect(20, CANVAS_HEIGHT - 18, 160, 6);
    
    p.fill(255, 215, 0);
    p.rect(20, CANVAS_HEIGHT - 18, 160 * Math.min(1, progress), 6);
  }
  
  // Pause indicator
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.fill(255, 0, 0);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(14);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }
}