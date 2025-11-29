// game_logic.js - Core game logic and updates

import { gameState, GAME_PHASES, UI_MODES, PRODUCT_TYPES, GRID_ROWS, GRID_COLS } from './globals.js';
import { Shelf, Customer, Staff } from './entities.js';

export function initializeGame(p) {
  gameState.score = 0;
  gameState.totalRevenue = 0;
  gameState.money = 100;
  gameState.uiMode = UI_MODES.NORMAL;
  gameState.cursorX = 2;
  gameState.cursorY = 2;
  gameState.selectedShelf = null;
  gameState.selectedProductType = null;
  gameState.shelves = [];
  gameState.customers = [];
  gameState.staff = [];
  gameState.products = [];
  gameState.customerSatisfaction = 100;
  gameState.dayCounter = 0;
  gameState.frameCounter = 0;
  gameState.timeScale = 1;
  gameState.unlockedProducts = ["ONIGIRI", "BENTO"];
  gameState.expandedTiles = [];
  gameState.nextCustomerSpawn = 60;
  gameState.menuSelection = 0;
  gameState.staffHireCount = 0;

  // Reset grid
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      if (gameState.grid[y][x].type !== "entrance" && gameState.grid[y][x].type !== "cashRegister") {
        gameState.grid[y][x].type = "empty";
        gameState.grid[y][x].occupied = false;
        gameState.grid[y][x].shelf = null;
        gameState.grid[y][x].expanded = false;
      }
    }
  }
}

export function updateGame(p) {
  gameState.frameCounter += gameState.timeScale;

  // Check win condition
  if (gameState.totalRevenue >= 50000) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_WIN", revenue: gameState.totalRevenue },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }

  // Check lose condition (customer satisfaction too low)
  if (gameState.customerSatisfaction <= 0) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_LOSE", reason: "Low satisfaction" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }

  // Spawn customers
  gameState.nextCustomerSpawn -= gameState.timeScale;
  if (gameState.nextCustomerSpawn <= 0) {
    if (gameState.customers.length < 5) {
      gameState.customers.push(new Customer(p));
    }
    gameState.nextCustomerSpawn = 120 - gameState.shelves.length * 5;
  }

  // Update customers
  for (let customer of gameState.customers) {
    customer.update();
  }

  // Update staff
  for (let staff of gameState.staff) {
    staff.update();
  }

  // Unlock products based on revenue
  for (let productKey in PRODUCT_TYPES) {
    const product = PRODUCT_TYPES[productKey];
    if (gameState.totalRevenue >= product.unlockCost && !gameState.unlockedProducts.includes(productKey)) {
      gameState.unlockedProducts.push(productKey);
    }
  }

  // Natural satisfaction decay
  if (gameState.frameCounter % 120 === 0) {
    gameState.customerSatisfaction = Math.max(0, gameState.customerSatisfaction - 0.5);
  }
}

export function placeShelf(p, x, y) {
  if (x < 0 || x >= GRID_COLS || y < 0 || y >= GRID_ROWS) return false;
  
  const cell = gameState.grid[y][x];
  if (cell.occupied || cell.type !== "empty") return false;

  const cost = 20;
  if (gameState.money < cost) return false;

  gameState.money -= cost;
  const shelf = new Shelf(x, y);
  gameState.shelves.push(shelf);
  cell.occupied = true;
  cell.shelf = shelf;
  cell.type = "shelf";
  
  return true;
}

export function stockShelf(shelf, productType) {
  if (!shelf || !productType) return false;
  if (!gameState.unlockedProducts.includes(productType)) return false;

  const cost = PRODUCT_TYPES[productType].cost;
  if (gameState.money < cost) return false;

  if (shelf.addProduct(productType)) {
    gameState.money -= cost;
    return true;
  }
  return false;
}

export function hireStaff(p) {
  const cost = 50 + gameState.staffHireCount * 20;
  if (gameState.money < cost) return false;

  gameState.money -= cost;
  gameState.staff.push(new Staff(p));
  gameState.staffHireCount++;
  return true;
}

export function expandStore(p, x, y) {
  if (x < 0 || x >= GRID_COLS || y < 0 || y >= GRID_ROWS) return false;
  
  const cell = gameState.grid[y][x];
  if (cell.occupied || cell.expanded) return false;
  if (cell.type === "entrance" || cell.type === "cashRegister") return false;

  const cost = 100;
  if (gameState.money < cost) return false;

  gameState.money -= cost;
  cell.expanded = true;
  gameState.expandedTiles.push({ x, y });
  
  return true;
}