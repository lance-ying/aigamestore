// renderer.js
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, WIN_REVENUE_TARGET } from './globals.js';

export function renderStartScreen(p) {
  p.background(245, 222, 179);
  
  // Title
  p.fill(139, 69, 19);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("🍔 BURGER SHOP STORY 🍔", CANVAS_WIDTH / 2, 60);
  
  // Description
  p.textSize(14);
  p.fill(101, 67, 33);
  const desc = "Manage your burger restaurant!\nCreate recipes, hire staff, serve customers.";
  p.text(desc, CANVAS_WIDTH / 2, 120);
  
  // Instructions
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  p.fill(139, 69, 19);
  const instructions = [
    "HOW TO PLAY:",
    "• Use Arrow Keys to navigate menus",
    "• Press SPACE to select/confirm",
    "• Press Z to go back/cancel",
    "",
    "OBJECTIVE:",
    "• Buy ingredients and create burger recipes",
    "• Hire staff to improve service speed",
    "• Serve customers to earn money",
    "• Reach $10,000 revenue to win!",
    "• Keep satisfaction above 20%"
  ];
  
  let y = 160;
  for (const line of instructions) {
    p.text(line, 100, y);
    y += 18;
  }
  
  // Start prompt
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.fill(220, 20, 60);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
}

export function renderGameScreen(p) {
  p.background(255, 248, 220);
  
  // Draw UI background
  p.fill(210, 180, 140);
  p.rect(0, 0, CANVAS_WIDTH, 50);
  
  // Top bar - stats
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.LEFT, p.CENTER);
  p.text(`💰 $${gameState.money}`, 10, 15);
  p.text(`📊 Revenue: $${gameState.totalRevenue}`, 10, 35);
  
  p.text(`😊 Satisfaction: ${Math.floor(gameState.satisfactionScore)}%`, 180, 15);
  p.text(`👥 Staff: ${gameState.staff.length}`, 180, 35);
  
  p.text(`🍔 Recipes: ${gameState.recipes.length}`, 350, 15);
  p.text(`📅 Day ${gameState.day}`, 350, 35);
  
  // Customers served
  p.text(`🎯 Served: ${gameState.totalCustomersServed}`, 480, 25);
  
  // Render current menu
  if (gameState.currentMenu === "MAIN") {
    renderMainMenu(p);
  } else if (gameState.currentMenu === "INGREDIENTS") {
    renderIngredientsMenu(p);
  } else if (gameState.currentMenu === "RECIPES") {
    renderRecipesMenu(p);
  } else if (gameState.currentMenu === "STAFF") {
    renderStaffMenu(p);
  } else if (gameState.currentMenu === "SERVE") {
    renderServeMenu(p);
  }
  
  // Render customers in background
  renderCustomers(p);
}

function renderMainMenu(p) {
  p.fill(101, 67, 33);
  p.textSize(20);
  p.textAlign(p.CENTER, p.TOP);
  p.text("MAIN MENU", CANVAS_WIDTH / 2, 70);
  
  const options = [
    "🛒 Buy Ingredients",
    "🍔 Create Recipes",
    "👤 Hire Staff",
    "🔔 Serve Customers"
  ];
  
  p.textSize(16);
  for (let i = 0; i < options.length; i++) {
    const selected = i === gameState.selectedIndex;
    p.fill(...(selected ? [220, 20, 60] : [101, 67, 33]));
    
    if (selected) {
      p.fill(255, 255, 200);
      p.rect(150, 110 + i * 50, 300, 40, 5);
      p.fill(220, 20, 60);
    }
    
    p.text(options[i], CANVAS_WIDTH / 2, 125 + i * 50);
  }
  
  // Instructions
  p.textSize(12);
  p.fill(101, 67, 33);
  p.text("Use ↑↓ to navigate, SPACE to select", CANVAS_WIDTH / 2, 350);
}

function renderIngredientsMenu(p) {
  p.fill(101, 67, 33);
  p.textSize(18);
  p.textAlign(p.CENTER, p.TOP);
  p.text("INGREDIENT SHOP", CANVAS_WIDTH / 2, 70);
  
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  
  const startY = 100;
  const itemHeight = 30;
  const visibleItems = 8;
  
  const scrollOffset = Math.max(0, gameState.selectedIndex - visibleItems + 1);
  
  for (let i = 0; i < Math.min(visibleItems, gameState.availableIngredients.length); i++) {
    const index = i + scrollOffset;
    if (index >= gameState.availableIngredients.length) break;
    
    const ingredient = gameState.availableIngredients[index];
    const selected = index === gameState.selectedIndex;
    const y = startY + i * itemHeight;
    
    if (selected) {
      p.fill(255, 255, 200);
      p.rect(20, y - 5, 560, 25, 3);
    }
    
    p.fill(...(selected ? [220, 20, 60] : [101, 67, 33]));
    p.text(`${ingredient.name} - $${ingredient.cost}`, 30, y);
    
    const owned = gameState.ownedIngredients.find(o => o.id === ingredient.id);
    if (owned && owned.quantity > 0) {
      p.text(`(Owned: ${owned.quantity})`, 300, y);
    }
  }
  
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(11);
  p.fill(101, 67, 33);
  p.text("SPACE to buy | Z to go back", CANVAS_WIDTH / 2, 360);
}

function renderRecipesMenu(p) {
  p.fill(101, 67, 33);
  p.textSize(18);
  p.textAlign(p.CENTER, p.TOP);
  p.text("RECIPE MANAGEMENT", CANVAS_WIDTH / 2, 70);
  
  if (!gameState.subMenu) {
    p.textSize(14);
    p.text("Your Recipes:", CANVAS_WIDTH / 2, 100);
    
    if (gameState.recipes.length === 0) {
      p.textSize(12);
      p.text("No recipes yet. Press SPACE to create one!", CANVAS_WIDTH / 2, 130);
    } else {
      p.textSize(11);
      p.textAlign(p.LEFT, p.TOP);
      let y = 130;
      for (let i = 0; i < gameState.recipes.length; i++) {
        const recipe = gameState.recipes[i];
        p.text(`${recipe.name} - $${recipe.basePrice} (Q:${recipe.quality})`, 40, y);
        y += 20;
      }
    }
    
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(11);
    p.fill(220, 20, 60);
    p.text("SPACE to create new recipe | Z to go back", CANVAS_WIDTH / 2, 360);
  } else if (gameState.subMenu === "CREATE") {
    p.textSize(14);
    p.text("Create Recipe (Select 1-3 ingredients)", CANVAS_WIDTH / 2, 95);
    
    p.textSize(12);
    p.text(`Selected: ${gameState.selectedIngredients.map(i => i.name).join(", ")}`, CANVAS_WIDTH / 2, 115);
    
    p.textSize(11);
    p.textAlign(p.LEFT, p.TOP);
    let y = 140;
    
    for (let i = 0; i < gameState.ownedIngredients.length; i++) {
      const ingredient = gameState.ownedIngredients[i];
      if (ingredient.quantity === 0) continue;
      
      const selected = i === gameState.selectedIndex;
      
      if (selected) {
        p.fill(255, 255, 200);
        p.rect(20, y - 3, 560, 18, 3);
      }
      
      p.fill(...(selected ? [220, 20, 60] : [101, 67, 33]));
      p.text(`${ingredient.name} (x${ingredient.quantity})`, 30, y);
      y += 20;
    }
    
    p.textAlign(p.CENTER, p.TOP);
    p.fill(220, 20, 60);
    p.text("SPACE to select | Z to remove/cancel", CANVAS_WIDTH / 2, 360);
  }
}

function renderStaffMenu(p) {
  p.fill(101, 67, 33);
  p.textSize(18);
  p.textAlign(p.CENTER, p.TOP);
  p.text("STAFF HIRING (Cost: $20)", CANVAS_WIDTH / 2, 70);
  
  p.textSize(14);
  p.text("Current Staff:", 150, 100);
  
  p.textSize(11);
  p.textAlign(p.LEFT, p.TOP);
  let y = 125;
  if (gameState.staff.length === 0) {
    p.text("No staff hired yet.", 40, y);
  } else {
    for (const staff of gameState.staff) {
      p.text(`${staff.name} (${staff.specialty}) Lv.${staff.level}`, 40, y);
      y += 18;
    }
  }
  
  p.textSize(14);
  p.textAlign(p.CENTER, p.TOP);
  p.text("Available Applicants:", CANVAS_WIDTH / 2, 220);
  
  p.textSize(11);
  p.textAlign(p.LEFT, p.TOP);
  y = 245;
  for (let i = 0; i < gameState.availableApplicants.length; i++) {
    const applicant = gameState.availableApplicants[i];
    const selected = i === gameState.selectedIndex;
    
    if (selected) {
      p.fill(255, 255, 200);
      p.rect(20, y - 3, 560, 18, 3);
    }
    
    p.fill(...(selected ? [220, 20, 60] : [101, 67, 33]));
    p.text(`${applicant.name} - ${applicant.specialty}`, 30, y);
    y += 20;
  }
  
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(11);
  p.fill(220, 20, 60);
  p.text("SPACE to hire | Z to go back", CANVAS_WIDTH / 2, 360);
}

function renderServeMenu(p) {
  p.fill(101, 67, 33);
  p.textSize(18);
  p.textAlign(p.CENTER, p.TOP);
  p.text("SERVE CUSTOMERS", CANVAS_WIDTH / 2, 70);
  
  if (!gameState.subMenu) {
    p.textSize(12);
    p.text(`Waiting customers: ${gameState.customers.filter(c => !c.served).length}`, CANVAS_WIDTH / 2, 95);
    
    if (gameState.customers.length === 0) {
      p.textSize(11);
      p.text("No customers waiting. Create recipes to attract customers!", CANVAS_WIDTH / 2, 200);
    } else {
      p.textSize(11);
      p.text("Select a customer and press SPACE to serve", CANVAS_WIDTH / 2, 115);
    }
  } else if (gameState.subMenu === "SELECT_RECIPE") {
    p.textSize(12);
    p.text("Select Recipe to Serve:", CANVAS_WIDTH / 2, 95);
    
    p.textSize(11);
    p.textAlign(p.LEFT, p.TOP);
    let y = 120;
    
    for (let i = 0; i < gameState.recipes.length; i++) {
      const recipe = gameState.recipes[i];
      const selected = i === gameState.selectedIndex;
      
      if (selected) {
        p.fill(255, 255, 200);
        p.rect(20, y - 3, 560, 18, 3);
      }
      
      p.fill(...(selected ? [220, 20, 60] : [101, 67, 33]));
      p.text(`${recipe.name} - $${recipe.basePrice}`, 30, y);
      y += 20;
    }
    
    p.textAlign(p.CENTER, p.TOP);
    p.fill(220, 20, 60);
    p.text("SPACE to serve | Z to cancel", CANVAS_WIDTH / 2, 360);
  }
  
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(11);
  p.fill(101, 67, 33);
  p.text("Z to go back", CANVAS_WIDTH / 2, 380);
}

function renderCustomers(p) {
  for (const customer of gameState.customers) {
    const size = 25;
    
    // Customer body
    if (customer.served) {
      p.fill(150, 255, 150);
    } else if (customer.patience > 0.5) {
      p.fill(100, 150, 255);
    } else if (customer.patience > 0.3) {
      p.fill(255, 200, 100);
    } else {
      p.fill(255, 100, 100);
    }
    
    p.ellipse(customer.x, customer.y, size, size);
    
    // Patience bar
    if (!customer.served) {
      const barWidth = 30;
      const barHeight = 4;
      p.fill(200);
      p.rect(customer.x - barWidth / 2, customer.y - size / 2 - 8, barWidth, barHeight);
      p.fill(100, 255, 100);
      p.rect(customer.x - barWidth / 2, customer.y - size / 2 - 8, barWidth * customer.patience, barHeight);
    }
  }
}

export function renderPauseOverlay(p) {
  p.fill(0, 0, 0, 100);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

export function renderGameOverScreen(p) {
  p.background(245, 222, 179);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  p.fill(isWin ? [34, 139, 34] : [220, 20, 60]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.text(isWin ? "🎉 YOU WIN! 🎉" : "GAME OVER", CANVAS_WIDTH / 2, 100);
  
  p.fill(101, 67, 33);
  p.textSize(18);
  
  if (isWin) {
    p.text("Congratulations! You built a successful burger empire!", CANVAS_WIDTH / 2, 160);
  } else {
    p.text("Your restaurant lost too many customers.", CANVAS_WIDTH / 2, 160);
  }
  
  p.textSize(16);
  p.text(`Final Revenue: $${gameState.totalRevenue}`, CANVAS_WIDTH / 2, 200);
  p.text(`Customers Served: ${gameState.totalCustomersServed}`, CANVAS_WIDTH / 2, 230);
  p.text(`Satisfaction Score: ${Math.floor(gameState.satisfactionScore)}%`, CANVAS_WIDTH / 2, 260);
  p.text(`Days Operated: ${gameState.day}`, CANVAS_WIDTH / 2, 290);
  
  p.textSize(20);
  p.fill(220, 20, 60);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 350);
}