// ui.js - UI rendering functions

import { gameState, GAME_PHASES, INGREDIENT_DATA, COMBO_BONUSES } from './globals.js';

export function renderStartScreen(p) {
  p.background(40, 30, 50);
  
  // Title
  p.fill(255, 200, 50);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("BURGER CHAIN", p.width / 2, 80);
  p.textSize(28);
  p.text("STORY", p.width / 2, 120);
  
  // Description
  p.fill(255);
  p.textSize(14);
  p.text("Build your burger empire!", p.width / 2, 160);
  
  // Instructions box
  p.fill(60, 50, 70);
  p.rect(150, 190, 300, 140, 10);
  
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.CENTER);
  
  const instructions = [
    "HOW TO PLAY:",
    "• Arrow Keys: Navigate menus",
    "• Space: Confirm / Serve",
    "• Shift: View details",
    "• Create burgers & serve customers",
    "• Earn money to expand your chain",
    "• Goal: Open 3 branches!"
  ];
  
  for (let i = 0; i < instructions.length; i++) {
    p.text(instructions[i], 170, 210 + i * 18);
  }
  
  // Start prompt
  p.fill(255, 200, 50);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(16);
  const flash = Math.sin(p.frameCount * 0.1) * 0.5 + 0.5;
  p.fill(255, 200, 50, 150 + flash * 105);
  p.text("PRESS ENTER TO START", p.width / 2, 360);
}

export function renderPauseOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, p.width, p.height);
  
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", p.width - 10, 10);
}

export function renderGameOverScreen(p) {
  p.background(40, 30, 50);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Title
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "SUCCESS!" : "GAME OVER", p.width / 2, 80);
  
  // Stats box
  p.fill(60, 50, 70);
  p.rect(150, 140, 300, 160, 10);
  
  p.fill(255);
  p.textSize(16);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("FINAL STATS", p.width / 2, 160);
  
  p.textSize(14);
  p.textAlign(p.LEFT, p.CENTER);
  p.text(`Money: $${gameState.money}`, 180, 190);
  p.text(`Reputation: ${Math.floor(gameState.reputation)}`, 180, 215);
  p.text(`Branches: ${gameState.branches}`, 180, 240);
  p.text(`Satisfied Customers: ${gameState.customersSatisfied}`, 180, 265);
  
  if (isWin) {
    p.fill(100, 255, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.text("You've built a successful burger empire!", p.width / 2, 320);
  } else {
    p.fill(255, 100, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.text("Your reputation dropped too low!", p.width / 2, 320);
  }
  
  // Restart prompt
  p.fill(255);
  p.textSize(16);
  p.text("PRESS R TO RESTART", p.width / 2, 360);
}

export function renderHUD(p) {
  // Top bar
  p.fill(40, 30, 50);
  p.rect(0, 0, p.width, 40);
  
  p.fill(255);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(14);
  p.text(`Day ${gameState.currentDay}`, 10, 20);
  
  p.fill(255, 200, 50);
  p.text(`$${gameState.money}`, 100, 20);
  
  p.fill(100, 200, 255);
  p.text(`Rep: ${Math.floor(gameState.reputation)}`, 200, 20);
  
  p.fill(150, 255, 150);
  p.text(`Branches: ${gameState.branches}`, 320, 20);
  
  // Time bar
  const timePercent = gameState.currentTime / gameState.maxTime;
  p.fill(200);
  p.rect(450, 10, 140, 20);
  p.fill(100, 200, 255);
  p.rect(450, 10, 140 * (1 - timePercent), 20);
  p.fill(0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(12);
  p.text(`${Math.floor(gameState.maxTime - gameState.currentTime)}s`, 520, 20);
}

export function renderMainMenu(p) {
  const menuItems = ["Create Burger", "Serve Customers", "Shop", "Expand Business"];
  const menuX = 50;
  const menuY = 100;
  const itemHeight = 40;
  
  p.fill(60, 50, 70);
  p.rect(menuX - 10, menuY - 10, 200, menuItems.length * itemHeight + 20, 10);
  
  for (let i = 0; i < menuItems.length; i++) {
    if (i === gameState.selectedIndex) {
      p.fill(255, 200, 50);
      p.rect(menuX - 5, menuY + i * itemHeight, 190, 35, 5);
    }
    
    p.fill(i === gameState.selectedIndex ? [0] : [255]);
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(14);
    p.text(menuItems[i], menuX + 10, menuY + i * itemHeight + 17);
  }
  
  // Customer preview
  p.fill(60, 50, 70);
  p.rect(280, 80, 300, 100, 10);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  p.text(`Waiting Customers: ${gameState.customers.length}`, 430, 100);
  
  if (gameState.customers.length > 0) {
    p.textSize(12);
    const avgPatience = gameState.customers.reduce((sum, c) => sum + c.patience, 0) / gameState.customers.length;
    p.text(`Avg Patience: ${Math.floor(avgPatience)}%`, 430, 125);
  }
  
  // Tips
  p.fill(60, 50, 70);
  p.rect(50, 240, 530, 140, 10);
  
  p.fill(255, 200, 50);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text("TIPS:", 70, 260);
  
  p.fill(255);
  p.textSize(11);
  const tips = [
    "• Combine ingredients to create signature burgers",
    "• Special combos give bonus quality and reputation",
    "• Serve customers quickly before patience runs out",
    "• Higher quality burgers = more money & reputation",
    "• Open 3 branches to win the game!"
  ];
  
  for (let i = 0; i < tips.length; i++) {
    p.text(tips[i], 70, 285 + i * 18);
  }
}

export function renderCreateBurgerMenu(p) {
  p.fill(60, 50, 70);
  p.rect(50, 60, 500, 320, 10);
  
  p.fill(255, 200, 50);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(18);
  p.text("CREATE BURGER", 300, 75);
  
  // Available ingredients
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  p.text("Available Ingredients:", 70, 105);
  
  const ingredientList = gameState.ingredients.filter(ing => ing.quantity > 0);
  const startY = 130;
  const itemHeight = 30;
  
  for (let i = 0; i < Math.min(ingredientList.length, 8); i++) {
    const ing = ingredientList[i];
    
    if (i === gameState.selectedIndex) {
      p.fill(255, 200, 50, 100);
      p.rect(65, startY + i * itemHeight - 5, 220, 28, 5);
    }
    
    p.fill(255);
    p.textSize(12);
    p.text(`${ing.data.name} (${ing.quantity})`, 75, startY + i * itemHeight);
    p.text(`Q:${ing.data.quality}`, 210, startY + i * itemHeight);
    
    // Draw ingredient icon
    ing.render(p, 250, startY + i * itemHeight + 10, 0.5);
  }
  
  // Current burger
  p.fill(80, 70, 90);
  p.rect(310, 105, 230, 265, 10);
  
  p.fill(255, 200, 50);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(14);
  p.text("Current Burger", 425, 115);
  
  if (gameState.currentBurger.ingredients.length > 0) {
    const burgerStartY = 150;
    for (let i = 0; i < gameState.currentBurger.ingredients.length; i++) {
      const ingType = gameState.currentBurger.ingredients[i];
      const ingData = INGREDIENT_DATA[ingType];
      
      p.fill(255);
      p.textSize(10);
      p.textAlign(p.LEFT, p.CENTER);
      p.text(ingData.name, 330, burgerStartY + i * 25);
      
      // Draw small icon
      const ing = gameState.ingredients.find(it => it.type === ingType);
      if (ing) {
        ing.render(p, 500, burgerStartY + i * 25, 0.4);
      }
    }
    
    // Quality display
    p.fill(255, 200, 50);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.text(`Quality: ${gameState.currentBurger.quality}`, 425, 330);
    
    // Check for combos
    const combo = checkCombo(gameState.currentBurger.ingredients);
    if (combo) {
      p.fill(100, 255, 100);
      p.textSize(12);
      p.text(`COMBO: ${combo.name}`, 425, 350);
      p.text(`+${combo.bonus} Quality!`, 425, 365);
    }
  } else {
    p.fill(150);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text("No ingredients added", 425, 220);
  }
  
  // Instructions
  p.fill(255);
  p.textSize(10);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.text("Space: Add | Z: Remove Last | Enter: Done", 300, 375);
}

export function renderServeMenu(p) {
  p.fill(60, 50, 70);
  p.rect(50, 60, 500, 320, 10);
  
  p.fill(255, 200, 50);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(18);
  p.text("SERVE CUSTOMERS", 300, 75);
  
  if (gameState.customers.length === 0) {
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.text("No customers waiting!", 300, 220);
    p.textSize(12);
    p.text("Press ESC to return", 300, 250);
    return;
  }
  
  // Show customers
  const startX = 100;
  const startY = 140;
  const spacing = 100;
  
  for (let i = 0; i < Math.min(gameState.customers.length, 5); i++) {
    const customer = gameState.customers[i];
    const x = startX + (i % 5) * spacing;
    const y = startY + Math.floor(i / 5) * 120;
    
    if (i === gameState.selectedIndex) {
      p.fill(255, 200, 50, 100);
      p.ellipse(x, y, 60, 60);
    }
    
    customer.render(p);
    customer.x = x;
    customer.y = y;
    
    // Show desired quality
    p.fill(255);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(9);
    p.text(`Wants: ${customer.desiredQuality}`, x, y + 25);
  }
  
  // Current burger info
  if (gameState.currentBurger.ingredients.length > 0) {
    p.fill(80, 70, 90);
    p.rect(100, 280, 400, 80, 10);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text(`Your Burger Quality: ${gameState.currentBurger.quality}`, 300, 305);
    p.text("Space: Serve Selected Customer | ESC: Back", 300, 330);
  } else {
    p.fill(255, 100, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text("No burger to serve! Create one first.", 300, 320);
  }
}

export function renderShopMenu(p) {
  p.fill(60, 50, 70);
  p.rect(50, 60, 500, 320, 10);
  
  p.fill(255, 200, 50);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(18);
  p.text("INGREDIENT SHOP", 300, 75);
  
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.CENTER, p.TOP);
  p.text(`Your Money: $${gameState.money}`, 300, 100);
  
  // Available ingredients to buy
  const buyableIngredients = Object.keys(INGREDIENT_DATA).filter(key => {
    return gameState.unlockedIngredients.includes(key);
  });
  
  const startY = 140;
  const itemHeight = 35;
  
  for (let i = 0; i < Math.min(buyableIngredients.length, 6); i++) {
    const ingKey = buyableIngredients[i];
    const ingData = INGREDIENT_DATA[ingKey];
    
    if (i === gameState.selectedIndex) {
      p.fill(255, 200, 50, 100);
      p.rect(70, startY + i * itemHeight - 5, 460, 33, 5);
    }
    
    p.fill(255);
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(13);
    p.text(ingData.name, 90, startY + i * itemHeight + 10);
    
    p.textSize(11);
    p.text(`Cost: $${ingData.cost}`, 220, startY + i * itemHeight + 10);
    p.text(`Quality: ${ingData.quality}`, 320, startY + i * itemHeight + 10);
    
    const ing = gameState.ingredients.find(it => it.type === ingKey);
    if (ing) {
      p.text(`Stock: ${ing.quantity}`, 430, startY + i * itemHeight + 10);
    }
  }
  
  // Instructions
  p.fill(255);
  p.textSize(11);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.text("Space: Buy (x5) | ESC: Back", 300, 375);
}

export function renderExpandMenu(p) {
  p.fill(60, 50, 70);
  p.rect(50, 60, 500, 320, 10);
  
  p.fill(255, 200, 50);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(18);
  p.text("EXPAND BUSINESS", 300, 75);
  
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.CENTER, p.TOP);
  p.text(`Current Branches: ${gameState.branches}`, 300, 105);
  p.text(`Your Money: $${gameState.money}`, 300, 125);
  p.text(`Your Reputation: ${Math.floor(gameState.reputation)}`, 300, 145);
  
  // Expansion options
  const expansionCost = 200 + (gameState.branches - 1) * 150;
  const reputationRequired = 60 + (gameState.branches - 1) * 20;
  
  p.fill(80, 70, 90);
  p.rect(100, 180, 400, 120, 10);
  
  p.fill(255, 200, 50);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(16);
  p.text("Open New Branch", 300, 195);
  
  p.fill(255);
  p.textSize(13);
  p.text(`Cost: $${expansionCost}`, 300, 225);
  p.text(`Required Reputation: ${reputationRequired}`, 300, 245);
  
  const canExpand = gameState.money >= expansionCost && 
                   gameState.reputation >= reputationRequired;
  
  if (canExpand) {
    p.fill(100, 255, 100);
    p.textSize(14);
    p.text("Space: Open Branch", 300, 270);
  } else {
    p.fill(255, 100, 100);
    p.textSize(12);
    if (gameState.money < expansionCost) {
      p.text("Not enough money!", 300, 270);
    } else {
      p.text("Reputation too low!", 300, 270);
    }
  }
  
  p.fill(255);
  p.textSize(11);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.text("ESC: Back", 300, 375);
}

function checkCombo(ingredients) {
  for (const combo of COMBO_BONUSES) {
    const hasAll = combo.ingredients.every(ing => ingredients.includes(ing));
    if (hasAll) {
      return combo;
    }
  }
  return null;
}