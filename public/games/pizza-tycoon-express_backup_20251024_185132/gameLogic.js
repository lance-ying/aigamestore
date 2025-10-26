// gameLogic.js - Core game logic functions
import { gameState, PHASE_PLAYING, PHASE_GAME_OVER_LOSE, PHASE_GAME_OVER_WIN, PHASE_LEVEL_COMPLETE, 
         PIZZA_DOUGH, PIZZA_SAUCED, PIZZA_CHEESED, PIZZA_TOPPED, PIZZA_BAKED, PIZZA_SLICED,
         DOUGH_PREP_TIME, SAUCE_TIME, CHEESE_TIME, TOPPING_TIME, BAKE_TIME, SLICE_TIME, LEVELS } from './globals.js';
import { Customer, Pizza } from './entities.js';

let pizzaIdCounter = 0;
let customerIdCounter = 0;

export function initLevel(level) {
  gameState.level = level;
  gameState.levelData = LEVELS[level - 1];
  gameState.levelTimeRemaining = gameState.levelData.timeLimit * 60;
  gameState.unhappyCustomerCount = 0;
  gameState.pizzasServedThisLevel = 0;
  gameState.customerQueueCounter = [];
  gameState.customerQueueDriveThru = [];
  gameState.pizzasInPrep = [];
  gameState.activeOrders = [];
  gameState.selectedPizza = null;
  gameState.activeWorkstation = null;
  gameState.actionProgress = 0;
  gameState.actionDuration = 0;
  gameState.nextCustomerSpawnCounter = 60;
  gameState.nextCustomerSpawnDriveThru = level >= 2 ? 120 : 999999;
  gameState.streakCount = 0;
  gameState.multiplierActive = false;
  
  // Refill ingredients
  gameState.ingredientsStock = {
    dough: 100,
    sauce: 100,
    cheese: 100,
    pepperoni: 50,
    mushroom: 50,
    olive: 50,
    onion: 50,
    pepper: 50
  };
}

export function updateGame(p) {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  // Update timer
  gameState.levelTimeRemaining -= 1;
  
  // Turbo mode
  if (gameState.turboActive) {
    gameState.turboTimeRemaining -= 1;
    if (gameState.turboTimeRemaining <= 0) {
      gameState.turboActive = false;
    }
  }
  if (gameState.turboCooldown > 0) {
    gameState.turboCooldown -= 1;
  }
  
  // Spawn customers
  gameState.nextCustomerSpawnCounter -= 1;
  if (gameState.nextCustomerSpawnCounter <= 0) {
    spawnCustomer(false);
    gameState.nextCustomerSpawnCounter = gameState.levelData.customerSpawnRate;
  }
  
  if (gameState.level >= 2) {
    gameState.nextCustomerSpawnDriveThru -= 1;
    if (gameState.nextCustomerSpawnDriveThru <= 0) {
      spawnCustomer(true);
      gameState.nextCustomerSpawnDriveThru = gameState.levelData.customerSpawnRate * 1.5;
    }
  }
  
  // Update customers
  updateCustomers();
  
  // Update action progress
  if (gameState.actionDuration > 0) {
    const speedMult = gameState.turboActive ? 2 : 1;
    gameState.actionProgress += speedMult / gameState.upgrades.playerSpeed;
    if (gameState.actionProgress >= gameState.actionDuration) {
      completeAction();
    }
  }
  
  // Update pizzas in oven
  updateOven();
  
  // Check win/lose conditions
  checkGameConditions();
  
  // Log player info every 60 frames
  if (p.frameCount % 60 === 0 && gameState.player) {
    p.logs.player_info.push({
      screen_x: gameState.player.x,
      screen_y: gameState.player.y,
      game_x: gameState.player.x,
      game_y: gameState.player.y,
      framecount: p.frameCount
    });
  }
}

function spawnCustomer(isDriveThru) {
  const maxQueue = isDriveThru ? 3 : 3;
  const queue = isDriveThru ? gameState.customerQueueDriveThru : gameState.customerQueueCounter;
  
  if (queue.length >= maxQueue) return;
  
  // Generate random order
  const toppings = [];
  const availableToppings = gameState.levelData.availableToppings;
  const numToppings = Math.floor(Math.random() * Math.min(availableToppings.length, 3));
  
  for (let i = 0; i < numToppings; i++) {
    const topping = availableToppings[Math.floor(Math.random() * availableToppings.length)];
    if (!toppings.includes(topping)) {
      toppings.push(topping);
    }
  }
  
  const order = { toppings };
  const patience = gameState.levelData.customerPatienceBase * gameState.upgrades.customerPatienceBoost;
  
  const x = isDriveThru ? 550 : 100 + queue.length * 40;
  const y = isDriveThru ? 100 : 350;
  
  const customer = new Customer(customerIdCounter++, x, y, isDriveThru, order, patience);
  queue.push(customer);
  gameState.activeOrders.push(order);
}

function updateCustomers() {
  // Counter queue
  for (let i = gameState.customerQueueCounter.length - 1; i >= 0; i--) {
    const customer = gameState.customerQueueCounter[i];
    const left = customer.update();
    if (left) {
      gameState.customerQueueCounter.splice(i, 1);
      gameState.unhappyCustomerCount += 1;
      gameState.streakCount = 0;
      gameState.multiplierActive = false;
      removeOrder(customer.order);
    }
  }
  
  // Drive-thru queue
  for (let i = gameState.customerQueueDriveThru.length - 1; i >= 0; i--) {
    const customer = gameState.customerQueueDriveThru[i];
    const left = customer.update();
    if (left) {
      gameState.customerQueueDriveThru.splice(i, 1);
      gameState.unhappyCustomerCount += 1;
      gameState.streakCount = 0;
      gameState.multiplierActive = false;
      removeOrder(customer.order);
    }
  }
}

function removeOrder(order) {
  const idx = gameState.activeOrders.indexOf(order);
  if (idx !== -1) {
    gameState.activeOrders.splice(idx, 1);
  }
}

function updateOven() {
  for (let pizza of gameState.pizzasInPrep) {
    if (pizza.inOven && pizza.state === PIZZA_TOPPED) {
      const speedMult = gameState.turboActive ? 2 : 1;
      pizza.bakeProgress += speedMult;
      if (pizza.bakeProgress >= BAKE_TIME) {
        pizza.state = PIZZA_BAKED;
        pizza.bakeProgress = 0;
        addScore(50);
      }
    }
  }
}

export function startDoughPrep() {
  if (gameState.ingredientsStock.dough < 1) return;
  if (gameState.actionDuration > 0) return;
  
  gameState.ingredientsStock.dough -= 1;
  gameState.actionDuration = DOUGH_PREP_TIME;
  gameState.actionProgress = 0;
  gameState.activeWorkstation = "dough";
}

export function completeAction() {
  if (gameState.activeWorkstation === "dough") {
    const pizza = new Pizza(pizzaIdCounter++, 300, 200);
    pizza.state = PIZZA_DOUGH;
    gameState.pizzasInPrep.push(pizza);
    addScore(10);
  } else if (gameState.activeWorkstation === "sauce") {
    if (gameState.selectedPizza && gameState.selectedPizza.state === PIZZA_DOUGH) {
      gameState.selectedPizza.state = PIZZA_SAUCED;
      addScore(10);
    }
  } else if (gameState.activeWorkstation === "cheese") {
    if (gameState.selectedPizza && gameState.selectedPizza.state === PIZZA_SAUCED) {
      gameState.selectedPizza.state = PIZZA_CHEESED;
      addScore(10);
    }
  } else if (gameState.activeWorkstation && gameState.activeWorkstation.startsWith("topping_")) {
    if (gameState.selectedPizza && gameState.selectedPizza.state === PIZZA_CHEESED) {
      gameState.selectedPizza.state = PIZZA_TOPPED;
      addScore(20);
    }
  } else if (gameState.activeWorkstation === "slice") {
    if (gameState.selectedPizza && gameState.selectedPizza.state === PIZZA_BAKED) {
      gameState.selectedPizza.state = PIZZA_SLICED;
      addScore(50);
    }
  }
  
  gameState.actionDuration = 0;
  gameState.actionProgress = 0;
  gameState.activeWorkstation = null;
}

export function applyIngredient(ingredientType) {
  if (!gameState.selectedPizza) return;
  if (gameState.actionDuration > 0) return;
  
  const pizza = gameState.selectedPizza;
  
  if (ingredientType === "sauce") {
    if (pizza.state === PIZZA_DOUGH && gameState.ingredientsStock.sauce >= 1) {
      gameState.ingredientsStock.sauce -= 1;
      gameState.actionDuration = SAUCE_TIME;
      gameState.actionProgress = 0;
      gameState.activeWorkstation = "sauce";
    }
  } else if (ingredientType === "cheese") {
    if (pizza.state === PIZZA_SAUCED && gameState.ingredientsStock.cheese >= 1) {
      gameState.ingredientsStock.cheese -= 1;
      gameState.actionDuration = CHEESE_TIME;
      gameState.actionProgress = 0;
      gameState.activeWorkstation = "cheese";
    }
  } else {
    // Toppings
    if (pizza.state === PIZZA_CHEESED && gameState.ingredientsStock[ingredientType] >= 1) {
      gameState.ingredientsStock[ingredientType] -= 1;
      pizza.addTopping(ingredientType);
      gameState.actionDuration = TOPPING_TIME;
      gameState.actionProgress = 0;
      gameState.activeWorkstation = "topping_" + ingredientType;
    }
  }
}

export function placeInOven(pizza) {
  if (!pizza || pizza.state !== PIZZA_TOPPED || pizza.inOven) return;
  
  // Find empty oven slot
  const maxSlots = gameState.levelData.ovenSlots;
  const occupiedSlots = gameState.pizzasInPrep.filter(p => p.inOven).map(p => p.ovenSlot);
  
  for (let i = 0; i < maxSlots; i++) {
    if (!occupiedSlots.includes(i)) {
      pizza.inOven = true;
      pizza.ovenSlot = i;
      pizza.bakeProgress = 0;
      return;
    }
  }
}

export function removeFromOven(pizza) {
  if (!pizza || !pizza.inOven) return;
  pizza.inOven = false;
  pizza.ovenSlot = -1;
}

export function slicePizza(pizza) {
  if (!pizza || pizza.state !== PIZZA_BAKED) return;
  if (gameState.actionDuration > 0) return;
  
  gameState.selectedPizza = pizza;
  gameState.actionDuration = SLICE_TIME;
  gameState.actionProgress = 0;
  gameState.activeWorkstation = "slice";
}

export function serveCustomer(pizza, customer) {
  if (!pizza || pizza.state !== PIZZA_SLICED) return;
  if (!customer) return;
  
  if (pizza.matchesOrder(customer.order)) {
    // Correct pizza
    const baseReward = 50 + customer.order.toppings.length * 20;
    const patienceBonus = Math.floor(customer.patience / 60) * 5;
    const totalReward = baseReward + patienceBonus;
    
    gameState.money += totalReward;
    addScore(100 + patienceBonus);
    
    gameState.pizzasServedThisLevel += 1;
    gameState.streakCount += 1;
    
    if (gameState.streakCount >= 5) {
      gameState.multiplierActive = true;
    }
    
    // Remove customer and pizza
    removeCustomer(customer);
    removePizza(pizza);
    removeOrder(customer.order);
  } else {
    // Wrong pizza
    gameState.streakCount = 0;
    gameState.multiplierActive = false;
  }
}

function removeCustomer(customer) {
  let idx = gameState.customerQueueCounter.indexOf(customer);
  if (idx !== -1) {
    gameState.customerQueueCounter.splice(idx, 1);
    return;
  }
  idx = gameState.customerQueueDriveThru.indexOf(customer);
  if (idx !== -1) {
    gameState.customerQueueDriveThru.splice(idx, 1);
  }
}

function removePizza(pizza) {
  const idx = gameState.pizzasInPrep.indexOf(pizza);
  if (idx !== -1) {
    gameState.pizzasInPrep.splice(idx, 1);
  }
  if (gameState.selectedPizza === pizza) {
    gameState.selectedPizza = null;
  }
}

function addScore(points) {
  const multiplier = gameState.multiplierActive ? 2 : 1;
  gameState.score += points * multiplier;
}

function checkGameConditions() {
  const ld = gameState.levelData;
  
  // Lose conditions
  if (gameState.unhappyCustomerCount > ld.maxUnhappyCustomers) {
    gameState.gamePhase = PHASE_GAME_OVER_LOSE;
    return;
  }
  
  if (gameState.levelTimeRemaining <= 0 && gameState.money < ld.moneyTarget) {
    gameState.gamePhase = PHASE_GAME_OVER_LOSE;
    return;
  }
  
  // Win conditions
  if (gameState.money >= ld.moneyTarget && gameState.unhappyCustomerCount <= ld.maxUnhappyCustomers) {
    if (gameState.level >= 5) {
      gameState.gamePhase = PHASE_GAME_OVER_WIN;
      gameState.score += 200;
    } else {
      gameState.gamePhase = PHASE_LEVEL_COMPLETE;
      gameState.score += 200;
    }
  }
}

export function purchaseUpgrade(upgradeType) {
  let cost = 0;
  
  switch(upgradeType) {
    case "playerSpeed":
      cost = 200 * gameState.upgrades.playerSpeed;
      if (gameState.money >= cost) {
        gameState.money -= cost;
        gameState.upgrades.playerSpeed += 0.2;
      }
      break;
    case "ovenCapacity":
      cost = 300;
      if (gameState.money >= cost && gameState.levelData.ovenSlots < 4) {
        gameState.money -= cost;
        gameState.levelData.ovenSlots += 1;
      }
      break;
    case "customerPatience":
      cost = 250 * gameState.upgrades.customerPatienceBoost;
      if (gameState.money >= cost) {
        gameState.money -= cost;
        gameState.upgrades.customerPatienceBoost += 0.2;
      }
      break;
  }
}

export function activateTurbo() {
  if (gameState.turboCooldown <= 0) {
    gameState.turboActive = true;
    gameState.turboTimeRemaining = 300;
    gameState.turboCooldown = 600;
  }
}