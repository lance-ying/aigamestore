// game_logic.js - Core game logic

import { gameState, GAME_PHASES, INGREDIENT_DATA, STAR_REPUTATION_THRESHOLDS, WIN_STARS_REQUIRED } from './globals.js';
import { Recipe, Customer } from './entities.js';

let p5Instance = null;
let nextCustomerId = 0;
let customerSpawnTimer = 0;
const CUSTOMER_SPAWN_INTERVAL = 180; // frames

export function initGameLogic(p) {
  p5Instance = p;
}

export function resetGame() {
  gameState.money = 100;
  gameState.reputation = 0;
  gameState.stars = 1;
  gameState.recipes = [];
  gameState.menuSlots = [null, null, null, null];
  gameState.customers = [];
  gameState.customersServed = 0;
  gameState.satisfactionHistory = [];
  gameState.currentView = "CAFE";
  gameState.selectedMenuIndex = 0;
  gameState.recipeInProgress = {ingredients: [], active: false};
  gameState.totalEarnings = 0;
  gameState.unlockedIngredients = ["coffee", "milk", "sugar", "water", "tea"];
  gameState.availableIngredients = [
    {name: "chocolate", cost: 50, unlocked: false},
    {name: "vanilla", cost: 50, unlocked: false},
    {name: "cream", cost: 60, unlocked: false},
    {name: "honey", cost: 40, unlocked: false},
    {name: "cinnamon", cost: 45, unlocked: false},
    {name: "lemon", cost: 35, unlocked: false},
    {name: "strawberry", cost: 70, unlocked: false},
    {name: "caramel", cost: 65, unlocked: false}
  ];
  gameState.testingData = {recipesCreated: 0, customersServedCount: 0, timeElapsed: 0};
  
  nextCustomerId = 0;
  customerSpawnTimer = 0;
}

export function updateGame(p) {
  if (!p5Instance) p5Instance = p;
  
  gameState.testingData.timeElapsed++;
  
  // Spawn customers
  customerSpawnTimer++;
  if (customerSpawnTimer >= CUSTOMER_SPAWN_INTERVAL && gameState.customers.length < 4) {
    spawnCustomer(p);
    customerSpawnTimer = 0;
  }
  
  // Update customers
  for (let i = gameState.customers.length - 1; i >= 0; i--) {
    const customer = gameState.customers[i];
    customer.update();
    
    // Remove impatient customers (lose reputation)
    if (customer.isImpatient() && !customer.served) {
      gameState.reputation = Math.max(0, gameState.reputation - 5);
      gameState.customers.splice(i, 1);
      continue;
    }
    
    // Remove served customers after delay
    if (customer.served && customer.waitTime > customer.patience + 60) {
      gameState.customers.splice(i, 1);
    }
  }
  
  // Check for auto-purchase of ingredients (testing helper)
  if (gameState.controlMode !== "HUMAN" && gameState.money >= 100) {
    for (const ing of gameState.availableIngredients) {
      if (!ing.unlocked && gameState.money >= ing.cost) {
        purchaseIngredient(ing);
        break;
      }
    }
  }
  
  // Update star rating
  updateStarRating();
  
  // Check win condition
  if (gameState.stars >= WIN_STARS_REQUIRED) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
  }
}

export function spawnCustomer(p) {
  const customer = new Customer(nextCustomerId++, p);
  gameState.customers.push(customer);
}

export function createRecipe() {
  if (gameState.recipeInProgress.ingredients.length === 0) return null;
  
  const recipe = new Recipe(gameState.recipeInProgress.ingredients);
  gameState.recipes.push(recipe);
  gameState.testingData.recipesCreated++;
  
  // Reset recipe in progress
  gameState.recipeInProgress = {ingredients: [], active: false};
  
  return recipe;
}

export function addIngredientToRecipe(ingredient) {
  if (gameState.recipeInProgress.ingredients.length >= 3) return false;
  
  gameState.recipeInProgress.ingredients.push(ingredient);
  gameState.recipeInProgress.active = true;
  return true;
}

export function cancelRecipeInProgress() {
  gameState.recipeInProgress = {ingredients: [], active: false};
}

export function assignRecipeToMenu(recipe, slotIndex) {
  if (slotIndex < 0 || slotIndex >= gameState.menuSlots.length) return false;
  
  gameState.menuSlots[slotIndex] = recipe;
  return true;
}

export function serveCustomer(customerIndex, menuSlotIndex) {
  if (customerIndex < 0 || customerIndex >= gameState.customers.length) return false;
  if (menuSlotIndex < 0 || menuSlotIndex >= gameState.menuSlots.length) return false;
  
  const customer = gameState.customers[customerIndex];
  const recipe = gameState.menuSlots[menuSlotIndex];
  
  if (!recipe || customer.served) return false;
  
  const satisfaction = customer.serve(recipe);
  
  // Calculate earnings
  const earnings = recipe.price + Math.floor(satisfaction / 10);
  gameState.money += earnings;
  gameState.totalEarnings += earnings;
  
  // Update reputation
  gameState.reputation += Math.floor(satisfaction / 10);
  gameState.satisfactionHistory.push(satisfaction);
  
  gameState.customersServed++;
  gameState.testingData.customersServedCount++;
  
  return true;
}

export function purchaseIngredient(ingredient) {
  if (ingredient.unlocked) return false;
  if (gameState.money < ingredient.cost) return false;
  
  gameState.money -= ingredient.cost;
  ingredient.unlocked = true;
  gameState.unlockedIngredients.push(ingredient.name);
  
  return true;
}

export function updateStarRating() {
  for (let star = 5; star >= 1; star--) {
    if (gameState.reputation >= STAR_REPUTATION_THRESHOLDS[star]) {
      gameState.stars = star;
      return;
    }
  }
  gameState.stars = 1;
}

export function serveNextWaitingCustomer() {
  // Find first unserved customer
  for (let i = 0; i < gameState.customers.length; i++) {
    const customer = gameState.customers[i];
    if (!customer.served) {
      // Try to find best menu item for this customer
      let bestSlot = -1;
      let bestScore = -1;
      
      for (let j = 0; j < gameState.menuSlots.length; j++) {
        const recipe = gameState.menuSlots[j];
        if (recipe) {
          const warmthDiff = Math.abs(recipe.warmth - customer.preferredWarmth);
          const comfortDiff = Math.abs(recipe.comfort - customer.preferredComfort);
          const score = 10 - warmthDiff - comfortDiff;
          
          if (score > bestScore) {
            bestScore = score;
            bestSlot = j;
          }
        }
      }
      
      if (bestSlot >= 0) {
        return serveCustomer(i, bestSlot);
      }
      
      return false;
    }
  }
  
  return false;
}