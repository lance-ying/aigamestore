// input_handler.js - Handle keyboard input

import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';
import { VIEW_STORE, VIEW_INVENTORY, VIEW_EMPLOYEES, VIEW_STATS } from './globals.js';
import { startGame, togglePause, restartGame } from './game.js';
import { Shelf, Register } from './entities.js';
import { hireEmployee, assignEmployee } from './employees.js';
import { addMessage } from './products.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Global controls
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === PHASE_START) {
      startGame(p);
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === PHASE_PLAYING || gameState.gamePhase === PHASE_PAUSED) {
      togglePause(p);
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      restartGame(p);
    }
    return;
  }
  
  // Playing controls
  if (gameState.gamePhase === PHASE_PLAYING) {
    handlePlayingInput(p, keyCode);
  }
}

function handlePlayingInput(p, keyCode) {
  // View mode switching (SHIFT)
  if (keyCode === 16) {
    const views = [VIEW_STORE, VIEW_INVENTORY, VIEW_EMPLOYEES, VIEW_STATS];
    const currentIndex = views.indexOf(gameState.viewMode);
    gameState.viewMode = views[(currentIndex + 1) % views.length];
    return;
  }
  
  if (gameState.viewMode === VIEW_STORE) {
    handleStoreViewInput(p, keyCode);
  } else if (gameState.viewMode === VIEW_INVENTORY) {
    handleInventoryViewInput(p, keyCode);
  } else if (gameState.viewMode === VIEW_EMPLOYEES) {
    handleEmployeeViewInput(p, keyCode);
  }
}

function handleStoreViewInput(p, keyCode) {
  // Arrow keys - move cursor
  if (keyCode === 37) { // LEFT
    gameState.cursorX = Math.max(0, gameState.cursorX - 1);
  } else if (keyCode === 39) { // RIGHT
    gameState.cursorX = Math.min(gameState.gridWidth - 1, gameState.cursorX + 1);
  } else if (keyCode === 38) { // UP
    gameState.cursorY = Math.max(0, gameState.cursorY - 1);
  } else if (keyCode === 40) { // DOWN
    gameState.cursorY = Math.min(gameState.gridHeight - 1, gameState.cursorY + 1);
  } else if (keyCode === 32) { // SPACE - place shelf
    placeShelf(p);
  } else if (keyCode === 90) { // Z - expand grid
    expandGrid();
  }
}

function handleInventoryViewInput(p, keyCode) {
  const unlockedProducts = gameState.products.filter(p => p.unlocked);
  const maxIndex = unlockedProducts.length - 1;
  
  if (!gameState.selectedProduct && maxIndex >= 0) {
    gameState.selectedProduct = 0;
  }
  
  if (keyCode === 38) { // UP
    if (gameState.selectedProduct !== null) {
      gameState.selectedProduct = Math.max(0, gameState.selectedProduct - 1);
    }
  } else if (keyCode === 40) { // DOWN
    if (gameState.selectedProduct !== null) {
      gameState.selectedProduct = Math.min(maxIndex, gameState.selectedProduct + 1);
    }
  } else if (keyCode === 32) { // SPACE - buy product
    buyProduct(unlockedProducts[gameState.selectedProduct]);
  } else if (keyCode === 90) { // Z - unlock new category
    unlockNewProducts();
  }
}

function handleEmployeeViewInput(p, keyCode) {
  if (keyCode === 32) { // SPACE - hire employee
    hireEmployee(p);
  } else if (keyCode === 38) { // UP
    if (gameState.selectedEmployee !== null) {
      gameState.selectedEmployee = Math.max(0, gameState.selectedEmployee - 1);
    } else if (gameState.employees.length > 0) {
      gameState.selectedEmployee = 0;
    }
  } else if (keyCode === 40) { // DOWN
    if (gameState.selectedEmployee !== null && gameState.employees.length > 0) {
      gameState.selectedEmployee = Math.min(gameState.employees.length - 1, gameState.selectedEmployee + 1);
    } else if (gameState.employees.length > 0) {
      gameState.selectedEmployee = 0;
    }
  } else if (keyCode === 37 || keyCode === 39) { // LEFT/RIGHT - change assignment
    if (gameState.selectedEmployee !== null) {
      const employee = gameState.employees[gameState.selectedEmployee];
      const assignments = ["idle", "stocking", "register"];
      const currentIndex = assignments.indexOf(employee.assignment);
      const newIndex = keyCode === 39 ? (currentIndex + 1) % 3 : (currentIndex + 2) % 3;
      assignEmployee(employee, assignments[newIndex]);
    }
  }
}

function placeShelf(p) {
  const x = gameState.cursorX;
  const y = gameState.cursorY;
  
  if (gameState.grid[y][x].occupied) {
    addMessage("Tile occupied!");
    return;
  }
  
  const cost = 30;
  if (gameState.money < cost) {
    addMessage("Not enough money!");
    return;
  }
  
  // Check if we have products with inventory
  const availableProducts = gameState.inventory.filter(inv => inv.quantity > 0);
  if (availableProducts.length === 0) {
    addMessage("No products in inventory!");
    return;
  }
  
  const product = availableProducts[0].product;
  const shelf = new Shelf(x, y, product);
  gameState.shelves.push(shelf);
  gameState.grid[y][x].occupied = true;
  gameState.grid[y][x].entity = shelf;
  gameState.money -= cost;
  addMessage(`Placed shelf: ${product.name}`);
}

function expandGrid() {
  const cost = 200 + (gameState.gridWidth * gameState.gridHeight) * 10;
  if (gameState.money < cost) {
    addMessage("Not enough money to expand!");
    return;
  }
  
  if (gameState.gridWidth < 10 && gameState.gridHeight < 8) {
    gameState.money -= cost;
    
    if (gameState.gridWidth < 10) {
      gameState.gridWidth++;
      for (let y = 0; y < gameState.gridHeight; y++) {
        gameState.grid[y][gameState.gridWidth - 1].type = "floor";
      }
    }
    
    if (gameState.gridHeight < 8) {
      gameState.gridHeight++;
      for (let x = 0; x < gameState.gridWidth; x++) {
        gameState.grid[gameState.gridHeight - 1][x].type = "floor";
      }
    }
    
    addMessage(`Expanded store! Size: ${gameState.gridWidth}x${gameState.gridHeight}`);
  } else {
    addMessage("Maximum size reached!");
  }
}

function buyProduct(product) {
  if (!product) return;
  
  const bulkCost = product.cost * 10;
  if (gameState.money < bulkCost) {
    addMessage("Not enough money!");
    return;
  }
  
  const existing = gameState.inventory.find(inv => inv.product.id === product.id);
  if (existing) {
    existing.quantity += 10;
  } else {
    gameState.inventory.push({
      product: product,
      quantity: 10
    });
  }
  
  gameState.money -= bulkCost;
  addMessage(`Bought 10x ${product.name}`);
}

function unlockNewProducts() {
  const locked = gameState.products.filter(p => !p.unlocked);
  if (locked.length === 0) {
    addMessage("All products unlocked!");
    return;
  }
  
  const cost = 300;
  if (gameState.money < cost) {
    addMessage("Not enough money!");
    return;
  }
  
  gameState.money -= cost;
  
  // Unlock 5 random products
  for (let i = 0; i < 5 && locked.length > 0; i++) {
    const index = Math.floor(Math.random() * locked.length);
    locked[index].unlocked = true;
    locked.splice(index, 1);
  }
  
  addMessage("Unlocked new products!");
}