// gameLogic.js - Core game logic functions

import { gameState, GAME_PHASES, LEVEL_CONFIGS, RECIPES } from './globals.js';
import { Customer, Table, KitchenStation } from './entities.js';

export function initializeLevel(levelNum) {
  const config = LEVEL_CONFIGS[levelNum] || LEVEL_CONFIGS[1];
  
  gameState.currentLevel = levelNum;
  gameState.gold = config.startingGold;
  gameState.reputation = 100;
  gameState.score = 0;
  gameState.gameTime = 0;
  gameState.gameDay = 1;
  gameState.maxGameDays = config.maxDays;
  gameState.customersServed = 0;
  gameState.customersLeft = 0;
  gameState.consecutiveServicesCombo = 0;
  gameState.dailySatisfactionTotal = 0;
  gameState.dailyCustomersServed = 0;
  
  gameState.levelObjectives = {
    goldTarget: config.goldTarget,
    customersTarget: config.customersTarget,
    reputationTarget: config.reputationTarget
  };
  
  // Reset inventory with starting amounts
  gameState.ingredients = {
    rice: 50,
    tuna: 30,
    cucumber: 20,
    salmon: levelNum >= 2 ? 15 : 0,
    avocado: levelNum >= 2 ? 10 : 0,
    crabStick: levelNum >= 2 ? 10 : 0,
    shrimp: levelNum >= 2 ? 15 : 0,
    nori: 30
  };
  
  gameState.unlockedRecipes = [...config.unlockedRecipes];
  
  // Clear entities
  gameState.customers = [];
  gameState.tables = [];
  gameState.kitchenStations = [];
  gameState.entities = [];
  
  // Create tables
  const tablePositions = [
    [150, 150], [250, 150], [350, 150],
    [150, 280], [250, 280], [350, 280]
  ];
  
  if (levelNum >= 2) {
    tablePositions.push([450, 150], [450, 280]);
  }
  
  if (levelNum >= 3) {
    tablePositions.push([150, 350], [350, 350]);
  }
  
  for (let i = 0; i < tablePositions.length; i++) {
    const [x, y] = tablePositions[i];
    const table = new Table(x, y, i);
    gameState.tables.push(table);
    gameState.entities.push(table);
  }
  
  // Create kitchen stations
  const station1 = new KitchenStation(500, 80, 0, "sushiBar");
  const station2 = new KitchenStation(550, 80, 1, "riceCooker");
  gameState.kitchenStations.push(station1, station2);
  gameState.entities.push(station1, station2);
  
  if (levelNum >= 3) {
    const station3 = new KitchenStation(500, 150, 2, "sushiBar");
    gameState.kitchenStations.push(station3);
    gameState.entities.push(station3);
  }
  
  gameState.levelComplete = false;
  gameState.levelFailed = false;
  gameState.failureReason = "";
  gameState.customerSpawnTimer = 0;
  
  // Get level-specific patience multiplier
  gameState.customerPatienceMultiplier = config.customerPatienceMultiplier;
}

export function spawnCustomer(p) {
  const id = gameState.customers.length;
  const customer = new Customer(50, 200, id, gameState.customerPatienceMultiplier);
  gameState.customers.push(customer);
  gameState.entities.push(customer);
  
  // Try to assign table immediately if available
  const availableTable = gameState.tables.find(t => !t.occupied && !t.dirty);
  if (availableTable) {
    customer.assignTable(availableTable);
  }
}

export function updateGameLogic(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  // Update game time (60 frames = 1 game second)
  gameState.gameTime += 1 / 60;
  
  // Day progression (300 game seconds = 1 day)
  if (Math.floor(gameState.gameTime / 300) + 1 > gameState.gameDay) {
    gameState.gameDay = Math.floor(gameState.gameTime / 300) + 1;
    
    // Check for perfect day bonus
    if (gameState.dailyCustomersServed > 0) {
      const avgSatisfaction = gameState.dailySatisfactionTotal / gameState.dailyCustomersServed;
      if (avgSatisfaction >= 80) {
        gameState.score += 200;
      }
    }
    
    // Reset daily stats
    gameState.dailySatisfactionTotal = 0;
    gameState.dailyCustomersServed = 0;
    gameState.customersLeft = 0;
  }
  
  // Customer spawning
  gameState.customerSpawnTimer++;
  if (gameState.customerSpawnTimer >= gameState.customerSpawnInterval) {
    gameState.customerSpawnTimer = 0;
    // Spawn more customers in higher levels
    const spawnChance = 0.7 + (gameState.currentLevel * 0.1);
    if (p.random() < spawnChance) {
      spawnCustomer(p);
    }
  }
  
  // Update customers
  for (let i = gameState.customers.length - 1; i >= 0; i--) {
    const customer = gameState.customers[i];
    customer.update(p);
    
    // Remove left customers
    if (customer.state === "left") {
      const index = gameState.entities.indexOf(customer);
      if (index > -1) gameState.entities.splice(index, 1);
      gameState.customers.splice(i, 1);
    }
    
    // Auto-assign tables to waiting customers
    if (customer.state === "waitingForTable") {
      const availableTable = gameState.tables.find(t => !t.occupied && !t.dirty);
      if (availableTable) {
        customer.assignTable(availableTable);
      }
    }
  }
  
  // Update kitchen stations
  for (const station of gameState.kitchenStations) {
    station.update();
  }
  
  // Check win conditions
  checkWinConditions();
  
  // Check lose conditions
  checkLoseConditions();
}

export function checkWinConditions() {
  if (gameState.levelComplete || gameState.levelFailed) return;
  
  const obj = gameState.levelObjectives;
  
  if (gameState.gold >= obj.goldTarget &&
      gameState.customersServed >= obj.customersTarget &&
      gameState.reputation >= obj.reputationTarget) {
    gameState.levelComplete = true;
    gameState.score += 500; // Level completion bonus
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
  }
}

export function checkLoseConditions() {
  if (gameState.levelComplete || gameState.levelFailed) return;
  
  // Time limit exceeded
  if (gameState.gameDay > gameState.maxGameDays) {
    gameState.levelFailed = true;
    gameState.failureReason = "Time limit exceeded!";
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    return;
  }
  
  // Reputation collapse
  if (gameState.reputation <= 0) {
    gameState.levelFailed = true;
    gameState.failureReason = "Reputation collapsed!";
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    return;
  }
  
  // Too many customers left unhappy in a day
  if (gameState.customersLeft >= 10) {
    gameState.levelFailed = true;
    gameState.failureReason = "Too many unhappy customers!";
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    return;
  }
  
  // Bankruptcy (gold below -100 for safety)
  if (gameState.gold < -100) {
    gameState.levelFailed = true;
    gameState.failureReason = "Bankruptcy!";
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    return;
  }
}

export function handleClick(p, mouseX, mouseY) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  const worldX = mouseX + gameState.cameraX;
  const worldY = mouseY + gameState.cameraY;
  
  // Check if clicked on customer for ordering or payment
  for (const customer of gameState.customers) {
    const dist = p.dist(worldX, worldY, customer.x, customer.y);
    if (dist < 25) {
      if (customer.state === "ordering") {
        // Prepare food automatically at available station
        const availableStation = gameState.kitchenStations.find(s => s.state === "idle");
        if (availableStation) {
          const success = availableStation.startPreparation(customer.order, customer);
          if (success) {
            customer.state = "waitingForFood";
          }
        }
        return;
      } else if (customer.state === "waitingToPay") {
        customer.collectPayment();
        return;
      }
    }
  }
  
  // Check if clicked on ready station to serve
  for (const station of gameState.kitchenStations) {
    const dist = p.dist(worldX, worldY, station.x, station.y);
    if (dist < 30 && station.state === "ready") {
      station.serveDish();
      return;
    }
  }
  
  // Check if clicked on dirty table to clean
  for (const table of gameState.tables) {
    const dist = p.dist(worldX, worldY, table.x, table.y);
    if (dist < 25 && table.dirty) {
      table.clean();
      gameState.score += 15;
      return;
    }
  }
  
  // Check shop button (bottom UI)
  if (mouseY > 360 && mouseX > 10 && mouseX < 100) {
    buyIngredients();
  }
  
  // Check unlock recipe button
  if (mouseY > 360 && mouseX > 110 && mouseX < 220) {
    unlockNextRecipe();
  }
}

export function buyIngredients() {
  const cost = 50;
  if (gameState.gold >= cost) {
    gameState.gold -= cost;
    gameState.ingredients.rice += 20;
    gameState.ingredients.tuna += 10;
    gameState.ingredients.cucumber += 10;
    gameState.ingredients.salmon += 8;
    gameState.ingredients.avocado += 5;
    gameState.ingredients.crabStick += 5;
    gameState.ingredients.shrimp += 8;
    gameState.ingredients.nori += 10;
    gameState.score += 5;
  }
}

export function unlockNextRecipe() {
  const config = LEVEL_CONFIGS[gameState.currentLevel];
  const available = config.availableRecipes.filter(r => !gameState.unlockedRecipes.includes(r));
  
  if (available.length > 0) {
    const recipeId = available[0];
    const recipe = RECIPES[recipeId];
    
    if (gameState.gold >= recipe.unlockCost) {
      gameState.gold -= recipe.unlockCost;
      gameState.unlockedRecipes.push(recipeId);
      gameState.score += 100;
    }
  }
}

export function cleanNearestDirtyTable() {
  const dirtyTable = gameState.tables.find(t => t.dirty);
  if (dirtyTable) {
    dirtyTable.clean();
    gameState.score += 15;
  }
}