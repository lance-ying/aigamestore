// rendering.js - All rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, UI_MODES, GRID_SIZE, GRID_COLS, GRID_ROWS, PRODUCT_TYPES } from './globals.js';

export function renderStartScreen(p) {
  p.background(40, 80, 120);
  
  // Title
  p.fill(255, 255, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("開店コンビニ日記", CANVAS_WIDTH / 2, 80);
  p.textSize(24);
  p.text("Convenience Store Story", CANVAS_WIDTH / 2, 115);
  
  // Instructions
  p.textSize(14);
  p.fill(200, 220, 255);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    "Build and manage your convenience store!",
    "",
    "• Use ARROW KEYS to navigate",
    "• Press SPACE to confirm actions",
    "• Press Z to cancel/go back",
    "• Hold SHIFT to speed up time",
    "",
    "Goal: Reach $50,000 in revenue!",
    "Keep customer satisfaction high!"
  ];
  
  let yPos = 150;
  for (let line of instructions) {
    p.text(line, 80, yPos);
    yPos += 20;
  }
  
  // Start prompt
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.fill(255, 255, 100);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 350);
}

export function renderGameOverScreen(p) {
  p.background(40, 40, 60);
  
  p.fill(255, 255, 255);
  p.textAlign(p.CENTER, p.CENTER);
  
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    p.textSize(32);
    p.fill(100, 255, 100);
    p.text("SUCCESS!", CANVAS_WIDTH / 2, 120);
    
    p.textSize(20);
    p.fill(255, 255, 255);
    p.text("You built a thriving convenience store!", CANVAS_WIDTH / 2, 160);
  } else {
    p.textSize(32);
    p.fill(255, 100, 100);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 120);
    
    p.textSize(20);
    p.fill(255, 255, 255);
    p.text("Customer satisfaction dropped too low", CANVAS_WIDTH / 2, 160);
  }
  
  p.textSize(18);
  p.text(`Final Revenue: $${gameState.totalRevenue.toFixed(0)}`, CANVAS_WIDTH / 2, 200);
  p.text(`Final Satisfaction: ${gameState.customerSatisfaction.toFixed(0)}%`, CANVAS_WIDTH / 2, 230);
  p.text(`Shelves Placed: ${gameState.shelves.length}`, CANVAS_WIDTH / 2, 260);
  p.text(`Staff Hired: ${gameState.staff.length}`, CANVAS_WIDTH / 2, 290);
  
  p.textSize(20);
  p.fill(255, 255, 100);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 350);
}

export function renderGame(p) {
  p.background(200, 200, 200);
  
  renderGrid(p);
  renderShelves(p);
  renderCustomers(p);
  renderStaff(p);
  renderUI(p);
  renderCursor(p);
  
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.fill(255, 255, 255);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }
}

function renderGrid(p) {
  const offsetX = 80;
  const offsetY = 50;
  
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      const cell = gameState.grid[y][x];
      const px = offsetX + x * GRID_SIZE;
      const py = offsetY + y * GRID_SIZE;
      
      // Cell background
      if (cell.type === "entrance") {
        p.fill(100, 255, 100);
      } else if (cell.type === "cashRegister") {
        p.fill(255, 200, 100);
      } else if (cell.expanded) {
        p.fill(220, 220, 240);
      } else {
        p.fill(240, 240, 240);
      }
      
      p.stroke(180, 180, 180);
      p.strokeWeight(1);
      p.rect(px, py, GRID_SIZE, GRID_SIZE);
    }
  }
  
  // Draw entrance label
  p.fill(0);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(8);
  p.text("IN", offsetX + gameState.entrancePos.x * GRID_SIZE + GRID_SIZE / 2, 
              offsetY + gameState.entrancePos.y * GRID_SIZE + GRID_SIZE / 2);
  
  // Draw cash register
  p.fill(255, 150, 0);
  p.rect(offsetX + gameState.cashRegisterPos.x * GRID_SIZE + 2, 
         offsetY + gameState.cashRegisterPos.y * GRID_SIZE + 2, 
         GRID_SIZE - 4, GRID_SIZE - 4);
  p.fill(0);
  p.textSize(7);
  p.text("$", offsetX + gameState.cashRegisterPos.x * GRID_SIZE + GRID_SIZE / 2,
             offsetY + gameState.cashRegisterPos.y * GRID_SIZE + GRID_SIZE / 2);
}

function renderShelves(p) {
  const offsetX = 80;
  const offsetY = 50;
  
  for (let shelf of gameState.shelves) {
    const px = offsetX + shelf.x * GRID_SIZE;
    const py = offsetY + shelf.y * GRID_SIZE;
    
    // Shelf structure
    p.fill(139, 90, 43);
    p.noStroke();
    p.rect(px + 2, py + 2, GRID_SIZE - 4, GRID_SIZE - 4);
    
    // Products on shelf
    if (shelf.productType && shelf.products.length > 0) {
      const productColor = PRODUCT_TYPES[shelf.productType].color;
      p.fill(...productColor);
      
      const rows = Math.ceil(shelf.products.length / 3);
      for (let i = 0; i < shelf.products.length; i++) {
        const col = i % 3;
        const row = Math.floor(i / 3);
        p.rect(px + 3 + col * 5, py + 3 + row * 6, 4, 5);
      }
    }
    
    // Empty shelf indicator
    if (shelf.products.length === 0 && shelf.productType) {
      p.fill(255, 0, 0, 100);
      p.rect(px + 2, py + 2, GRID_SIZE - 4, GRID_SIZE - 4);
    }
  }
}

function renderCustomers(p) {
  for (let customer of gameState.customers) {
    customer.render(p);
  }
}

function renderStaff(p) {
  for (let staff of gameState.staff) {
    staff.render(p);
  }
}

function renderUI(p) {
  // Top bar
  p.fill(60, 60, 80);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 40);
  
  p.fill(255, 255, 255);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(14);
  p.text(`Money: $${gameState.money.toFixed(0)}`, 10, 12);
  p.text(`Revenue: $${gameState.totalRevenue.toFixed(0)} / $50000`, 10, 28);
  
  p.text(`Satisfaction: ${gameState.customerSatisfaction.toFixed(0)}%`, 250, 12);
  p.text(`Staff: ${gameState.staff.length}`, 250, 28);
  
  p.text(`Speed: ${gameState.timeScale}x`, 400, 20);
  
  // Side panel
  p.fill(80, 80, 100);
  p.rect(0, 40, 75, CANVAS_HEIGHT - 40);
  
  p.fill(255, 255, 255);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(10);
  
  const menuItems = ["[1] Shelf", "[2] Stock", "[3] Staff", "[4] Expand"];
  for (let i = 0; i < menuItems.length; i++) {
    const isSelected = gameState.uiMode === Object.values(UI_MODES)[i + 1];
    p.fill(isSelected ? [255, 255, 100] : [255, 255, 255]);
    p.text(menuItems[i], 37, 50 + i * 30);
  }
  
  // Mode-specific UI
  if (gameState.uiMode === UI_MODES.PLACE_SHELF) {
    renderPlaceShelfUI(p);
  } else if (gameState.uiMode === UI_MODES.STOCK_PRODUCT) {
    renderStockProductUI(p);
  } else if (gameState.uiMode === UI_MODES.HIRE_STAFF) {
    renderHireStaffUI(p);
  } else if (gameState.uiMode === UI_MODES.EXPAND_STORE) {
    renderExpandStoreUI(p);
  }
}

function renderPlaceShelfUI(p) {
  p.fill(100, 100, 120, 230);
  p.rect(85, 280, 200, 80);
  p.fill(255, 255, 255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text("Place Shelf Mode", 90, 285);
  p.textSize(10);
  p.text("Cost: $20", 90, 305);
  p.text("Navigate with arrows", 90, 320);
  p.text("Press SPACE to place", 90, 335);
  p.text("Press Z to cancel", 90, 350);
}

function renderStockProductUI(p) {
  p.fill(100, 100, 120, 230);
  p.rect(85, 260, 220, 120);
  p.fill(255, 255, 255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text("Stock Product Mode", 90, 265);
  p.textSize(10);
  
  if (!gameState.selectedShelf) {
    p.text("Select a shelf first", 90, 285);
    p.text("Navigate with arrows", 90, 300);
    p.text("Press SPACE to select", 90, 315);
  } else {
    p.text(`Shelf: (${gameState.selectedShelf.x}, ${gameState.selectedShelf.y})`, 90, 285);
    p.text("Select product:", 90, 305);
    
    let yPos = 320;
    for (let i = 0; i < gameState.unlockedProducts.length && i < 3; i++) {
      const productKey = gameState.unlockedProducts[i];
      const product = PRODUCT_TYPES[productKey];
      const isSelected = gameState.menuSelection === i;
      p.fill(isSelected ? [255, 255, 100] : [255, 255, 255]);
      p.text(`[${i + 1}] ${product.name} ($${product.cost})`, 90, yPos);
      yPos += 15;
    }
  }
  
  p.fill(255, 255, 255);
  p.text("Press Z to cancel", 90, 365);
}

function renderHireStaffUI(p) {
  const cost = 50 + gameState.staffHireCount * 20;
  p.fill(100, 100, 120, 230);
  p.rect(85, 280, 200, 80);
  p.fill(255, 255, 255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text("Hire Staff", 90, 285);
  p.textSize(10);
  p.text(`Cost: $${cost}`, 90, 305);
  p.text(`Current staff: ${gameState.staff.length}`, 90, 320);
  p.text("Press SPACE to hire", 90, 335);
  p.text("Press Z to cancel", 90, 350);
}

function renderExpandStoreUI(p) {
  p.fill(100, 100, 120, 230);
  p.rect(85, 280, 200, 80);
  p.fill(255, 255, 255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text("Expand Store", 90, 285);
  p.textSize(10);
  p.text("Cost: $100", 90, 305);
  p.text("Navigate with arrows", 90, 320);
  p.text("Press SPACE to expand", 90, 335);
  p.text("Press Z to cancel", 90, 350);
}

function renderCursor(p) {
  if (gameState.uiMode === UI_MODES.NORMAL) return;
  
  const offsetX = 80;
  const offsetY = 50;
  const px = offsetX + gameState.cursorX * GRID_SIZE;
  const py = offsetY + gameState.cursorY * GRID_SIZE;
  
  p.noFill();
  p.stroke(255, 255, 0);
  p.strokeWeight(3);
  p.rect(px, py, GRID_SIZE, GRID_SIZE);
}