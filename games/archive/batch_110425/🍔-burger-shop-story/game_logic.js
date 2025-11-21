// game_logic.js
import { gameState, GAME_PHASES, INGREDIENT_DATABASE, WIN_REVENUE_TARGET, MIN_SATISFACTION } from './globals.js';
import { Recipe, generateStaffApplicant, spawnCustomer } from './entities.js';

export function initializeGame() {
  gameState.money = 100;
  gameState.totalRevenue = 0;
  gameState.availableIngredients = INGREDIENT_DATABASE.filter(ing => ing.tier === 1);
  gameState.ownedIngredients = [];
  gameState.recipes = [];
  gameState.staff = [];
  gameState.availableApplicants = [];
  gameState.customers = [];
  gameState.customerSpawnTimer = 0;
  gameState.totalCustomersServed = 0;
  gameState.satisfactionScore = 100;
  gameState.currentMenu = "MAIN";
  gameState.selectedIndex = 0;
  gameState.subMenu = null;
  gameState.selectedIngredients = [];
  gameState.gameTime = 0;
  gameState.day = 1;
  
  // Generate initial applicants
  for (let i = 0; i < 3; i++) {
    gameState.availableApplicants.push(generateStaffApplicant());
  }
}

export function updateGame() {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  gameState.gameTime++;
  
  // Update day counter
  if (gameState.gameTime % 600 === 0) {
    gameState.day++;
  }
  
  // Customer spawning
  if (gameState.recipes.length > 0) {
    gameState.customerSpawnTimer++;
    if (gameState.customerSpawnTimer >= gameState.customerSpawnRate) {
      gameState.customerSpawnTimer = 0;
      if (gameState.customers.length < 5) {
        gameState.customers.push(spawnCustomer());
      }
    }
  }
  
  // Update customers
  for (let i = gameState.customers.length - 1; i >= 0; i--) {
    const customer = gameState.customers[i];
    const status = customer.update();
    
    if (status === "timeout") {
      gameState.customers.splice(i, 1);
      gameState.satisfactionScore = Math.max(0, gameState.satisfactionScore - 5);
    } else if (customer.served) {
      // Move customer off screen
      customer.x += 3;
      if (customer.x > 650) {
        gameState.customers.splice(i, 1);
        gameState.totalCustomersServed++;
        
        if (customer.satisfied) {
          gameState.satisfactionScore = Math.min(100, gameState.satisfactionScore + 2);
        }
      }
    }
  }
  
  // Update staff
  for (const staff of gameState.staff) {
    staff.work(1);
  }
  
  // Unlock new ingredients based on money
  if (gameState.money >= 200) {
    const tier2 = INGREDIENT_DATABASE.filter(ing => ing.tier === 2);
    for (const ing of tier2) {
      if (!gameState.availableIngredients.find(a => a.id === ing.id)) {
        gameState.availableIngredients.push(ing);
      }
    }
  }
  
  if (gameState.money >= 500) {
    const tier3 = INGREDIENT_DATABASE.filter(ing => ing.tier === 3);
    for (const ing of tier3) {
      if (!gameState.availableIngredients.find(a => a.id === ing.id)) {
        gameState.availableIngredients.push(ing);
      }
    }
  }
  
  // Check win condition
  if (gameState.totalRevenue >= WIN_REVENUE_TARGET) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
  }
  
  // Check lose condition
  if (gameState.satisfactionScore <= MIN_SATISFACTION && gameState.totalCustomersServed > 10) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
  }
}

export function purchaseIngredient(ingredient) {
  if (gameState.money >= ingredient.cost) {
    gameState.money -= ingredient.cost;
    
    const existing = gameState.ownedIngredients.find(ing => ing.id === ingredient.id);
    if (existing) {
      existing.quantity = (existing.quantity || 1) + 1;
    } else {
      gameState.ownedIngredients.push({ ...ingredient, quantity: 1 });
    }
    return true;
  }
  return false;
}

export function createRecipe(ingredients) {
  if (ingredients.length === 0 || ingredients.length > 3) return false;
  
  // Check if we have these ingredients
  for (const ing of ingredients) {
    const owned = gameState.ownedIngredients.find(o => o.id === ing.id);
    if (!owned || owned.quantity < 1) return false;
  }
  
  // Consume ingredients
  for (const ing of ingredients) {
    const owned = gameState.ownedIngredients.find(o => o.id === ing.id);
    owned.quantity--;
  }
  
  const recipe = new Recipe(ingredients);
  gameState.recipes.push(recipe);
  return true;
}

export function hireStaff(applicant) {
  const hiringCost = 20;
  if (gameState.money >= hiringCost) {
    gameState.money -= hiringCost;
    gameState.staff.push(applicant);
    
    const index = gameState.availableApplicants.indexOf(applicant);
    if (index !== -1) {
      gameState.availableApplicants.splice(index, 1);
    }
    
    // Generate new applicant
    if (gameState.availableApplicants.length < 3) {
      gameState.availableApplicants.push(generateStaffApplicant());
    }
    
    return true;
  }
  return false;
}

export function serveCustomer(customer, recipe) {
  if (!customer || customer.served) return false;
  
  const payment = customer.serve(recipe);
  gameState.money += payment;
  gameState.totalRevenue += payment;
  
  // Staff gains experience
  if (gameState.staff.length > 0) {
    const randomStaff = gameState.staff[Math.floor(Math.random() * gameState.staff.length)];
    randomStaff.gainExperience(10);
  }
  
  return true;
}