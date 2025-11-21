// renderer.js - Render game graphics

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';
import { VIEW_STORE, VIEW_INVENTORY, VIEW_EMPLOYEES, VIEW_STATS, TILE_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y } from './globals.js';

export function renderGame(p) {
  p.background(240, 235, 220);
  
  if (gameState.gamePhase === PHASE_START) {
    renderStartScreen(p);
  } else if (gameState.gamePhase === PHASE_PLAYING) {
    renderPlaying(p);
  } else if (gameState.gamePhase === PHASE_PAUSED) {
    renderPlaying(p);
    renderPauseOverlay(p);
  } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
    renderGameOver(p);
  }
}

function renderStartScreen(p) {
  p.fill(40, 40, 60);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("CONVENIENCE STORIES", CANVAS_WIDTH / 2, 80);
  
  p.textSize(14);
  p.fill(60, 60, 80);
  p.text("Build your convenience store empire!", CANVAS_WIDTH / 2, 130);
  p.text("Stock products, hire employees, satisfy customers", CANVAS_WIDTH / 2, 150);
  p.text("Compete with rivals and reach 5-star rating!", CANVAS_WIDTH / 2, 170);
  
  p.textSize(12);
  p.fill(80, 80, 100);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    "ARROW KEYS: Navigate menus/cursor",
    "SPACE: Place shelf, buy, hire",
    "Z: Expand store, unlock products",
    "SHIFT: Switch view modes",
    "ESC: Pause/Unpause",
    "R: Restart"
  ];
  
  let y = 210;
  instructions.forEach(line => {
    p.text(line, 100, y);
    y += 20;
  });
  
  p.fill(200, 80, 80);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
}

function renderPlaying(p) {
  // Render based on view mode
  if (gameState.viewMode === VIEW_STORE) {
    renderStoreView(p);
  } else if (gameState.viewMode === VIEW_INVENTORY) {
    renderInventoryView(p);
  } else if (gameState.viewMode === VIEW_EMPLOYEES) {
    renderEmployeeView(p);
  } else if (gameState.viewMode === VIEW_STATS) {
    renderStatsView(p);
  }
  
  // Always render top bar
  renderTopBar(p);
  
  // Render messages
  renderMessages(p);
}

function renderTopBar(p) {
  p.fill(40, 40, 60);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 40);
  
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.CENTER);
  
  p.text(`$${gameState.money.toFixed(0)}`, 10, 20);
  p.text(`★${gameState.storeRating.toFixed(1)}`, 100, 20);
  p.text(`${gameState.marketShare.toFixed(0)}% Market`, 170, 20);
  p.text(`Day ${gameState.day} ${String(gameState.hour).padStart(2, '0')}:00`, 280, 20);
  
  p.fill(200, 200, 100);
  p.textAlign(p.RIGHT, p.CENTER);
  p.text(gameState.viewMode, CANVAS_WIDTH - 10, 20);
}

function renderStoreView(p) {
  // Render grid
  for (let y = 0; y < gameState.gridHeight; y++) {
    for (let x = 0; x < gameState.gridWidth; x++) {
      const tile = gameState.grid[y][x];
      const screenX = GRID_OFFSET_X + x * TILE_SIZE;
      const screenY = GRID_OFFSET_Y + y * TILE_SIZE;
      
      // Tile background
      if (tile.type === "floor") {
        p.fill(...((x === gameState.cursorX && y === gameState.cursorY) ? [200, 220, 255] : [220, 220, 220]));
      } else {
        p.fill(180, 180, 180);
      }
      p.stroke(160, 160, 160);
      p.strokeWeight(1);
      p.rect(screenX, screenY, TILE_SIZE, TILE_SIZE);
      
      // Render entity
      if (tile.occupied && tile.entity) {
        const entity = tile.entity;
        if (entity.type === "shelf") {
          renderShelf(p, screenX, screenY, entity);
        } else if (entity.type === "register") {
          renderRegister(p, screenX, screenY, entity);
        }
      }
    }
  }
  
  // Render customers
  gameState.customers.forEach(customer => {
    renderCustomer(p, customer);
  });
  
  // Instructions
  p.fill(60, 60, 80);
  p.textSize(10);
  p.textAlign(p.LEFT, p.TOP);
  p.text("SPACE: Place shelf ($30) | Z: Expand store | SHIFT: Change view", 10, CANVAS_HEIGHT - 25);
}

function renderShelf(p, x, y, shelf) {
  // Shelf body
  p.fill(120, 80, 60);
  p.noStroke();
  p.rect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
  
  // Product color based on category
  const colors = {
    "Snacks": [255, 200, 100],
    "Beverages": [100, 150, 255],
    "Prepared Foods": [255, 150, 100],
    "Household": [200, 200, 200],
    "Tobacco": [150, 100, 80],
    "Magazines": [255, 255, 100],
    "Lottery": [255, 100, 200]
  };
  
  const color = colors[shelf.product.category] || [180, 180, 180];
  p.fill(...color);
  p.rect(x + 6, y + 6, TILE_SIZE - 12, TILE_SIZE - 12);
  
  // Stock indicator
  const stockPercent = shelf.stock / shelf.capacity;
  p.fill(0, 255, 0, 150);
  p.rect(x + 6, y + TILE_SIZE - 8, (TILE_SIZE - 12) * stockPercent, 4);
}

function renderRegister(p, x, y, register) {
  p.fill(60, 60, 80);
  p.noStroke();
  p.rect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
  p.fill(100, 200, 100);
  p.rect(x + 8, y + 8, TILE_SIZE - 16, TILE_SIZE - 16);
}

function renderCustomer(p, customer) {
  const colors = [
    [255, 200, 200],
    [200, 255, 200],
    [200, 200, 255],
    [255, 255, 200],
    [255, 200, 255],
    [200, 255, 255]
  ];
  const color = colors[customer.id % colors.length];
  
  p.fill(...color);
  p.noStroke();
  p.ellipse(customer.x, customer.y, 12, 12);
  
  // Patience indicator
  p.fill(255, 0, 0);
  p.rect(customer.x - 6, customer.y - 10, 12, 2);
  p.fill(0, 255, 0);
  p.rect(customer.x - 6, customer.y - 10, 12 * (customer.patience / 100), 2);
}

function renderInventoryView(p) {
  p.fill(60, 60, 80);
  p.textSize(16);
  p.textAlign(p.CENTER, p.TOP);
  p.text("INVENTORY & PRODUCTS", CANVAS_WIDTH / 2, 50);
  
  const unlockedProducts = gameState.products.filter(prod => prod.unlocked);
  
  p.textSize(11);
  p.textAlign(p.LEFT, p.TOP);
  
  let y = 80;
  const maxVisible = 10;
  const startIndex = Math.max(0, (gameState.selectedProduct || 0) - 5);
  
  for (let i = startIndex; i < Math.min(startIndex + maxVisible, unlockedProducts.length); i++) {
    const product = unlockedProducts[i];
    const inv = gameState.inventory.find(inv => inv.product.id === product.id);
    const quantity = inv ? inv.quantity : 0;
    
    const isSelected = i === gameState.selectedProduct;
    p.fill(...(isSelected ? [255, 255, 200] : [255, 255, 255]));
    p.rect(20, y, CANVAS_WIDTH - 40, 28);
    
    p.fill(40, 40, 60);
    p.text(`${product.name}`, 30, y + 5);
    p.text(`$${product.cost.toFixed(1)} → $${product.price.toFixed(1)}`, 250, y + 5);
    p.text(`Stock: ${quantity}`, 380, y + 5);
    p.text(`${product.category}`, 30, y + 15);
    
    y += 30;
  }
  
  p.fill(60, 60, 80);
  p.textSize(10);
  p.textAlign(p.LEFT, p.TOP);
  p.text("SPACE: Buy 10 units | Z: Unlock new products ($300) | UP/DOWN: Select", 10, CANVAS_HEIGHT - 25);
}

function renderEmployeeView(p) {
  p.fill(60, 60, 80);
  p.textSize(16);
  p.textAlign(p.CENTER, p.TOP);
  p.text("EMPLOYEES", CANVAS_WIDTH / 2, 50);
  
  p.textSize(11);
  p.textAlign(p.LEFT, p.TOP);
  
  let y = 80;
  gameState.employees.forEach((emp, i) => {
    const isSelected = i === gameState.selectedEmployee;
    p.fill(...(isSelected ? [255, 255, 200] : [255, 255, 255]));
    p.rect(20, y, CANVAS_WIDTH - 40, 35);
    
    p.fill(40, 40, 60);
    p.text(`${emp.name}`, 30, y + 5);
    p.text(`Stock:${emp.stockingSkill} Reg:${emp.registerSkill}`, 180, y + 5);
    p.text(`Wage: $${emp.salary}/hr`, 320, y + 5);
    p.text(`Task: ${emp.assignment}`, 30, y + 20);
    
    y += 40;
  });
  
  const hireCost = 50 + gameState.employees.length * 20;
  
  p.fill(60, 60, 80);
  p.textSize(10);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`SPACE: Hire employee ($${hireCost}) | UP/DOWN: Select | LEFT/RIGHT: Change task`, 10, CANVAS_HEIGHT - 25);
}

function renderStatsView(p) {
  p.fill(60, 60, 80);
  p.textSize(16);
  p.textAlign(p.CENTER, p.TOP);
  p.text("STATISTICS", CANVAS_WIDTH / 2, 50);
  
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  
  const stats = [
    `Store Rating: ${gameState.storeRating.toFixed(2)} / 5.00`,
    `Market Share: ${gameState.marketShare.toFixed(1)}%`,
    `Customer Satisfaction: ${gameState.customerSatisfaction.toFixed(0)}%`,
    `Total Profit: $${gameState.totalProfit.toFixed(0)}`,
    `Store Size: ${gameState.gridWidth}x${gameState.gridHeight}`,
    `Shelves: ${gameState.shelves.length}`,
    `Employees: ${gameState.employees.length}/${gameState.maxEmployees}`,
    `Products Unlocked: ${gameState.products.filter(p => p.unlocked).length}/${gameState.products.length}`,
    "",
    "WIN CONDITIONS:",
    `★ 5.0 Rating ${gameState.storeRating >= 5.0 ? "✓" : "✗"}`,
    `★ 60% Market Share ${gameState.marketShare >= 60 ? "✓" : "✗"}`,
    `★ $10,000 Profit ${gameState.totalProfit >= 10000 ? "✓" : "✗"}`,
    "",
    "RIVAL STORES:"
  ];
  
  let y = 80;
  stats.forEach(stat => {
    p.text(stat, 50, y);
    y += 18;
  });
  
  gameState.rivalStores.forEach(rival => {
    p.text(`${rival.name}: ${rival.rating.toFixed(1)}★ ${rival.marketShare.toFixed(0)}%`, 50, y);
    y += 18;
  });
}

function renderPauseOverlay(p) {
  p.fill(255, 255, 255);
  p.textSize(12);
  p.textAlign(p.RIGHT, p.TOP);
  p.text("PAUSED", CANVAS_WIDTH - 10, 50);
}

function renderGameOver(p) {
  p.fill(40, 40, 60);
  p.textAlign(p.CENTER, p.CENTER);
  
  if (gameState.gamePhase === PHASE_GAME_OVER_WIN) {
    p.textSize(40);
    p.fill(100, 200, 100);
    p.text("VICTORY!", CANVAS_WIDTH / 2, 100);
    
    p.textSize(16);
    p.fill(60, 60, 80);
    p.text("You built a 5-star convenience store empire!", CANVAS_WIDTH / 2, 150);
  } else {
    p.textSize(40);
    p.fill(200, 100, 100);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 100);
    
    p.textSize(16);
    p.fill(60, 60, 80);
    p.text("Your store went bankrupt!", CANVAS_WIDTH / 2, 150);
  }
  
  p.textSize(14);
  p.fill(60, 60, 80);
  const finalStats = [
    `Final Rating: ${gameState.storeRating.toFixed(2)}★`,
    `Market Share: ${gameState.marketShare.toFixed(1)}%`,
    `Total Profit: $${gameState.totalProfit.toFixed(0)}`,
    `Days Operated: ${gameState.day}`,
    `Shelves: ${gameState.shelves.length}`,
    `Employees: ${gameState.employees.length}`
  ];
  
  let y = 200;
  finalStats.forEach(stat => {
    p.text(stat, CANVAS_WIDTH / 2, y);
    y += 25;
  });
  
  p.fill(200, 80, 80);
  p.textSize(18);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 360);
}

function renderMessages(p) {
  p.textSize(11);
  p.textAlign(p.LEFT, p.TOP);
  
  let y = 45;
  gameState.messageQueue.slice(-3).forEach(msg => {
    const age = gameState.gameTime - msg.time;
    const alpha = Math.max(0, 255 * (1 - age / 3));
    p.fill(80, 80, 100, alpha);
    p.text(msg.text, 10, y);
    y += 15;
  });
}