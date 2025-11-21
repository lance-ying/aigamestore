// game_logic.js - Core game logic

import { gameState, GAME_PHASES, INGREDIENT_DATA, COMBO_BONUSES } from './globals.js';
import { Customer } from './customer.js';
import { Ingredient } from './ingredient.js';
import { Rival } from './rival.js';

export function initializeGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  gameState.money = 100;
  gameState.reputation = 50;
  gameState.branches = 1;
  gameState.currentDay = 1;
  gameState.currentTime = 0;
  gameState.customersSatisfied = 0;
  gameState.customersAngry = 0;
  gameState.menuState = "MAIN";
  gameState.selectedIndex = 0;
  gameState.frameCount = 0;
  gameState.lastActionFrame = 0;
  
  // Initialize ingredients
  gameState.ingredients = [];
  gameState.unlockedIngredients = ["BUN", "PATTY", "CHEESE", "LETTUCE", "TOMATO", "KETCHUP", "MAYO"];
  
  for (const key of gameState.unlockedIngredients) {
    gameState.ingredients.push(new Ingredient(key, 10));
  }
  
  // Initialize current burger
  gameState.currentBurger = {
    ingredients: [],
    quality: 0
  };
  
  // Initialize customers
  gameState.customers = [];
  spawnCustomer(p);
  
  // Initialize rivals
  gameState.rivals = [
    new Rival(p, "QuickBite", 1, 0.5),
    new Rival(p, "MegaBurger", 2, 0.7),
    new Rival(p, "Gourmet's", 3, 0.9)
  ];
  
  // Initialize staff
  gameState.staff = [];
  
  // Log game start
  p.logs.game_info.push({
    data: { phase: "PLAYING", event: "game_started" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function updateGame(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  gameState.frameCount++;
  gameState.currentTime += 1 / 60;
  
  // Day cycle
  if (gameState.currentTime >= gameState.maxTime) {
    endDay(p);
  }
  
  // Update customers
  for (let i = gameState.customers.length - 1; i >= 0; i--) {
    const customer = gameState.customers[i];
    customer.update();
    
    if (customer.angry && !customer.served) {
      gameState.customers.splice(i, 1);
      gameState.customersAngry++;
      gameState.reputation -= 3;
      
      p.logs.player_info.push({
        screen_x: 0,
        screen_y: 0,
        game_x: 0,
        game_y: 0,
        event: "customer_angry",
        framecount: p.frameCount
      });
    } else if (customer.served) {
      // Remove served customers after delay
      if (customer.waitTime > 60) {
        gameState.customers.splice(i, 1);
      }
    }
  }
  
  // Spawn new customers periodically
  if (p.frameCount % 180 === 0 && gameState.customers.length < 5) {
    spawnCustomer(p);
  }
  
  // Update rivals
  for (const rival of gameState.rivals) {
    rival.update(gameState.reputation);
  }
  
  // Check win condition
  if (gameState.branches >= 3 && gameState.reputation >= 70) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_WIN", event: "game_won" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Check lose condition
  if (gameState.reputation <= 0) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_LOSE", event: "game_lost" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function spawnCustomer(p) {
  const desiredQuality = 30 + Math.floor(p.random(0, 50 + gameState.branches * 20));
  const customer = new Customer(p, 0, 0, desiredQuality);
  gameState.customers.push(customer);
}

function endDay(p) {
  gameState.currentDay++;
  gameState.currentTime = 0;
  
  // Daily costs
  const dailyCost = 10 + gameState.branches * 5;
  gameState.money -= dailyCost;
  
  // Unlock new ingredients based on reputation
  if (gameState.reputation >= 60 && !gameState.unlockedIngredients.includes("BACON")) {
    gameState.unlockedIngredients.push("BACON", "EGG", "PICKLE");
    gameState.ingredients.push(new Ingredient("BACON", 5));
    gameState.ingredients.push(new Ingredient("EGG", 5));
    gameState.ingredients.push(new Ingredient("PICKLE", 5));
  }
  
  if (gameState.reputation >= 80 && !gameState.unlockedIngredients.includes("FISH")) {
    gameState.unlockedIngredients.push("FISH", "TARTAR", "ONION", "MUSHROOM");
    gameState.ingredients.push(new Ingredient("FISH", 5));
    gameState.ingredients.push(new Ingredient("TARTAR", 5));
    gameState.ingredients.push(new Ingredient("ONION", 5));
    gameState.ingredients.push(new Ingredient("MUSHROOM", 5));
  }
  
  if (gameState.reputation >= 100 && !gameState.unlockedIngredients.includes("AVOCADO")) {
    gameState.unlockedIngredients.push("AVOCADO");
    gameState.ingredients.push(new Ingredient("AVOCADO", 5));
  }
  
  p.logs.game_info.push({
    data: { phase: "PLAYING", event: "day_ended", day: gameState.currentDay },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function addIngredientToBurger(ingredientType) {
  const ingredient = gameState.ingredients.find(ing => ing.type === ingredientType);
  
  if (ingredient && ingredient.quantity > 0) {
    gameState.currentBurger.ingredients.push(ingredientType);
    ingredient.use(1);
    calculateBurgerQuality();
    return true;
  }
  
  return false;
}

export function removeLastIngredient() {
  if (gameState.currentBurger.ingredients.length > 0) {
    const removed = gameState.currentBurger.ingredients.pop();
    const ingredient = gameState.ingredients.find(ing => ing.type === removed);
    if (ingredient) {
      ingredient.add(1);
    }
    calculateBurgerQuality();
    return true;
  }
  return false;
}

export function calculateBurgerQuality() {
  let quality = 0;
  
  for (const ingType of gameState.currentBurger.ingredients) {
    const ingData = INGREDIENT_DATA[ingType];
    quality += ingData.quality;
  }
  
  // Check for combos
  for (const combo of COMBO_BONUSES) {
    const hasAll = combo.ingredients.every(ing => 
      gameState.currentBurger.ingredients.includes(ing)
    );
    if (hasAll) {
      quality += combo.bonus;
    }
  }
  
  gameState.currentBurger.quality = quality;
}

export function serveBurgerToCustomer(customerIndex) {
  if (customerIndex >= 0 && customerIndex < gameState.customers.length) {
    const customer = gameState.customers[customerIndex];
    
    if (!customer.served && gameState.currentBurger.ingredients.length > 0) {
      const result = customer.serve(gameState.currentBurger.quality);
      
      gameState.money += result.money;
      gameState.reputation += result.reputation;
      
      if (customer.satisfied) {
        gameState.customersSatisfied++;
      }
      
      // Reset burger
      gameState.currentBurger = {
        ingredients: [],
        quality: 0
      };
      
      return true;
    }
  }
  
  return false;
}

export function buyIngredient(ingredientType, quantity = 5) {
  const ingData = INGREDIENT_DATA[ingredientType];
  const totalCost = ingData.cost * quantity;
  
  if (gameState.money >= totalCost) {
    gameState.money -= totalCost;
    
    const ingredient = gameState.ingredients.find(ing => ing.type === ingredientType);
    if (ingredient) {
      ingredient.add(quantity);
    } else {
      gameState.ingredients.push(new Ingredient(ingredientType, quantity));
    }
    
    return true;
  }
  
  return false;
}

export function expandBusiness() {
  const cost = 200 + (gameState.branches - 1) * 150;
  const reputationRequired = 60 + (gameState.branches - 1) * 20;
  
  if (gameState.money >= cost && gameState.reputation >= reputationRequired) {
    gameState.money -= cost;
    gameState.branches++;
    gameState.maxTime += 30; // More time per day
    
    return true;
  }
  
  return false;
}