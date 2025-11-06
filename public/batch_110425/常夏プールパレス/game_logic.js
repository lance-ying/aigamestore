// game_logic.js - Game logic and progression

import { gameState, FACILITY_TYPES, GRID_COLS, GRID_ROWS } from './globals.js';
import { Facility } from './facility.js';
import { Customer } from './customer.js';

export function initializeGame() {
  gameState.facilities = [];
  gameState.customers = [];
  gameState.entities = [];
  gameState.money = 200;
  gameState.satisfaction = 70;
  gameState.snsBuzz = 0;
  gameState.researchPoints = 0;
  gameState.time = 0;
  gameState.customerSpawnTimer = 0;
  gameState.researchTimer = 0;
  gameState.selectedFacilityType = "POOL";
  gameState.cursorX = 5;
  gameState.cursorY = 3;
  gameState.menuOpen = true;
  gameState.hoveredFacility = null;
  gameState.paused = false;
  gameState.gameOverReason = "";
  gameState.unlockedFacilities = ["POOL", "RESTAURANT", "DECORATION"];
  
  // Initialize grid
  gameState.grid = [];
  for (let y = 0; y < GRID_ROWS; y++) {
    gameState.grid[y] = [];
    for (let x = 0; x < GRID_COLS; x++) {
      gameState.grid[y][x] = null;
    }
  }
}

export function updateGameLogic(p) {
  if (gameState.paused) return;
  
  gameState.time++;
  gameState.customerSpawnTimer++;
  gameState.researchTimer++;
  
  // Update facilities
  gameState.facilities.forEach(facility => facility.update());
  
  // Update customers
  const toRemove = [];
  gameState.customers.forEach((customer, idx) => {
    if (customer.update(p)) {
      toRemove.push(idx);
      
      if (customer.satisfactionContribution > 0) {
        gameState.satisfaction = Math.min(100, gameState.satisfaction + customer.satisfactionContribution);
        gameState.snsBuzz += Math.floor(customer.satisfactionContribution * 2);
      }
    }
  });
  
  toRemove.reverse().forEach(idx => {
    gameState.customers.splice(idx, 1);
  });
  
  // Spawn customers
  const spawnRate = 120 - Math.min(gameState.snsBuzz / 10, 60);
  if (gameState.customerSpawnTimer > spawnRate && gameState.facilities.length > 0) {
    gameState.customerSpawnTimer = 0;
    gameState.customers.push(new Customer(p));
  }
  
  // Research points
  if (gameState.researchTimer > 300) {
    gameState.researchTimer = 0;
    gameState.researchPoints++;
  }
  
  // Satisfaction decay
  if (gameState.time % 120 === 0 && gameState.customers.length > 0) {
    gameState.satisfaction = Math.max(0, gameState.satisfaction - 0.5);
  }
  
  // Unlock facilities
  checkUnlocks();
  
  // Check game over
  checkGameOver();
}

export function checkUnlocks() {
  if (gameState.snsBuzz >= 100 && !gameState.unlockedFacilities.includes("WATERSLIDE")) {
    gameState.unlockedFacilities.push("WATERSLIDE");
  }
  if (gameState.snsBuzz >= 300 && !gameState.unlockedFacilities.includes("CABANA")) {
    gameState.unlockedFacilities.push("CABANA");
  }
}

export function checkGameOver() {
  if (gameState.snsBuzz >= 1000) {
    gameState.gamePhase = "GAME_OVER";
    gameState.gameOverReason = "WIN";
  }
  
  if (gameState.satisfaction <= 0 && gameState.time > 600) {
    gameState.gamePhase = "GAME_OVER";
    gameState.gameOverReason = "LOSE";
  }
}

export function placeFacility(type) {
  const x = gameState.cursorX;
  const y = gameState.cursorY;
  
  if (x >= GRID_COLS - 3 || y >= GRID_ROWS) return false;
  if (gameState.grid[y][x] !== null) return false;
  
  const config = FACILITY_TYPES[type];
  if (!gameState.unlockedFacilities.includes(type)) return false;
  if (gameState.money < config.cost) return false;
  
  const facility = new Facility(type, x, y);
  gameState.facilities.push(facility);
  gameState.grid[y][x] = facility;
  gameState.money -= config.cost;
  
  return true;
}

export function upgradeFacility(facility) {
  const cost = facility.getUpgradeCost();
  if (gameState.money >= cost && facility.level < 3) {
    gameState.money -= cost;
    facility.upgrade();
    return true;
  }
  return false;
}

export function findFacilityAt(x, y) {
  return gameState.facilities.find(f => f.gridX === x && f.gridY === y);
}