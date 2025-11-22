// rendering.js - Rendering functions

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  PHASE_START, 
  PHASE_PLAYING, 
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  CAFE_OFFSET_X,
  CAFE_OFFSET_Y,
  GRID_SIZE,
  CAFE_GRID_WIDTH,
  CAFE_GRID_HEIGHT,
  FURNITURE_TYPES,
  INGREDIENTS
} from './globals.js';
import { getAvailableIngredients, getAvailableFurniture } from './cafe_management.js';

export function drawStartScreen(p) {
  p.background(40, 30, 50);
  
  // Title with animation
  p.fill(255, 220, 150);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("☕ CAFE MASTER STORY ☕", CANVAS_WIDTH / 2, 80);
  
  // Description
  p.fill(200, 200, 200);
  p.textSize(12);
  const desc = [
    "Build and manage your dream coffee shop!",
    "Place furniture to boost atmosphere and attract customers.",
    "Research recipes by combining ingredients.",
    "Serve customers to earn money and popularity.",
    "Reach 5000 popularity for Five-Star rating!"
  ];
  
  for (let i = 0; i < desc.length; i++) {
    p.text(desc[i], CANVAS_WIDTH / 2, 140 + i * 20);
  }
  
  // Controls
  p.fill(150, 200, 255);
  p.textSize(11);
  p.text("CONTROLS:", CANVAS_WIDTH / 2, 260);
  
  const controls = [
    "Arrow Keys: Navigate menus",
    "SPACE: Confirm/Place/Serve",
    "SHIFT: Open/Close menu",
    "Z: Cancel/Back",
    "ESC: Pause"
  ];
  
  p.fill(180, 180, 180);
  p.textSize(10);
  for (let i = 0; i < controls.length; i++) {
    p.text(controls[i], CANVAS_WIDTH / 2, 280 + i * 16);
  }
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textSize(16);
  const pulse = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(255, 255, 100, pulse * 255);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
}

export function drawGameOverScreen(p, won) {
  p.background(20, 20, 30);
  
  p.fill(won ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.text(won ? "★ FIVE-STAR CAFE! ★" : "GAME OVER", CANVAS_WIDTH / 2, 100);
  
  // Stats
  p.fill(255, 255, 255);
  p.textSize(16);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 160);
  p.text(`Popularity: ${gameState.popularity}`, CANVAS_WIDTH / 2, 185);
  p.text(`Money: $${gameState.money}`, CANVAS_WIDTH / 2, 210);
  p.text(`Regulars: ${gameState.regulars}`, CANVAS_WIDTH / 2, 235);
  p.text(`Menu Items: ${gameState.menu.length}`, CANVAS_WIDTH / 2, 260);
  
  if (won) {
    p.fill(255, 215, 0);
    p.textSize(14);
    p.text("Congratulations on achieving cafe excellence!", CANVAS_WIDTH / 2, 300);
  }
  
  // Restart prompt
  p.fill(255, 255, 150);
  p.textSize(18);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 360);
}

export function drawCafeGrid(p) {
  p.push();
  
  // Draw grid background
  p.fill(240, 230, 220);
  p.stroke(150);
  p.strokeWeight(1);
  p.rect(CAFE_OFFSET_X, CAFE_OFFSET_Y, CAFE_GRID_WIDTH * GRID_SIZE, CAFE_GRID_HEIGHT * GRID_SIZE);
  
  // Draw grid lines
  p.stroke(200, 190, 180);
  for (let x = 0; x <= CAFE_GRID_WIDTH; x++) {
    p.line(
      CAFE_OFFSET_X + x * GRID_SIZE,
      CAFE_OFFSET_Y,
      CAFE_OFFSET_X + x * GRID_SIZE,
      CAFE_OFFSET_Y + CAFE_GRID_HEIGHT * GRID_SIZE
    );
  }
  for (let y = 0; y <= CAFE_GRID_HEIGHT; y++) {
    p.line(
      CAFE_OFFSET_X,
      CAFE_OFFSET_Y + y * GRID_SIZE,
      CAFE_OFFSET_X + CAFE_GRID_WIDTH * GRID_SIZE,
      CAFE_OFFSET_Y + y * GRID_SIZE
    );
  }
  
  p.pop();
}

export function drawFurniture(p) {
  for (const furniture of gameState.furniture) {
    furniture.draw(p);
  }
}

export function drawCustomers(p) {
  for (const customer of gameState.customers) {
    customer.draw();
  }
}

export function drawUI(p) {
  // Top bar
  p.fill(60, 40, 30);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 50);
  
  // Stats
  p.fill(255, 255, 255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.CENTER);
  p.text(`Money: $${gameState.money}`, 10, 15);
  p.text(`Popularity: ${gameState.popularity}`, 10, 35);
  
  p.text(`Atmosphere: ${gameState.atmosphere}`, 160, 15);
  p.text(`Regulars: ${gameState.regulars}`, 160, 35);
  
  p.text(`Menu: ${gameState.menu.length}`, 310, 15);
  p.text(`Score: ${gameState.score}`, 310, 35);
  
  // Instructions
  p.textAlign(p.RIGHT, p.CENTER);
  p.fill(200, 200, 150);
  p.textSize(10);
  p.text("SHIFT: Menu", CANVAS_WIDTH - 10, 25);
  
  // Pause indicator
  if (gameState.gamePhase === PHASE_PAUSED) {
    p.fill(255, 100, 100);
    p.textSize(14);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }
}

export function drawMenu(p) {
  if (!gameState.menuOpen) return;
  
  // Menu background
  p.fill(40, 40, 60, 230);
  p.stroke(100, 100, 150);
  p.strokeWeight(3);
  p.rect(50, 70, CANVAS_WIDTH - 100, CANVAS_HEIGHT - 140, 10);
  
  // Tabs
  const tabs = ["Research", "Furniture", "Contests"];
  const tabWidth = 140;
  const tabHeight = 30;
  
  for (let i = 0; i < tabs.length; i++) {
    const selected = gameState.selectedMenuTab === i;
    p.fill(...(selected ? [80, 80, 120] : [60, 60, 90]));
    p.stroke(100, 100, 150);
    p.strokeWeight(2);
    p.rect(60 + i * tabWidth, 75, tabWidth - 10, tabHeight, 5);
    
    p.fill(255);
    p.noStroke();
    p.textSize(12);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(tabs[i], 60 + i * tabWidth + (tabWidth - 10) / 2, 75 + tabHeight / 2);
  }
  
  // Tab content
  p.push();
  p.translate(0, 110);
  
  if (gameState.selectedMenuTab === 0) {
    drawResearchTab(p);
  } else if (gameState.selectedMenuTab === 1) {
    drawFurnitureTab(p);
  } else if (gameState.selectedMenuTab === 2) {
    drawContestsTab(p);
  }
  
  p.pop();
  
  // Instructions
  p.fill(200, 200, 150);
  p.textSize(10);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("Arrow Keys: Navigate | SPACE: Select | Z: Back/Cancel | SHIFT: Close", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 25);
}

function drawResearchTab(p) {
  const available = getAvailableIngredients();
  
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  p.text("Create New Recipe", 70, 10);
  
  // Base selection
  p.textSize(11);
  p.text("Base:", 70, 35);
  
  for (let i = 0; i < available.bases.length; i++) {
    const base = available.bases[i];
    const selected = gameState.selectedRecipeBase === base;
    
    p.fill(...(selected ? [100, 200, 100] : [80, 80, 100]));
    p.stroke(150);
    p.strokeWeight(1);
    p.rect(70, 50 + i * 25, 200, 20, 3);
    
    p.fill(255);
    p.noStroke();
    p.textSize(10);
    p.textAlign(p.LEFT, p.CENTER);
    p.text(`${base.name} ($${base.cost})`, 75, 60 + i * 25);
  }
  
  // Additions selection
  p.fill(255);
  p.textSize(11);
  p.textAlign(p.LEFT, p.TOP);
  p.text("Additions (up to 3):", 300, 35);
  
  for (let i = 0; i < Math.min(6, available.additions.length); i++) {
    const addition = available.additions[i];
    const selected = gameState.selectedRecipeAdditions.includes(addition);
    
    p.fill(...(selected ? [100, 200, 100] : [80, 80, 100]));
    p.stroke(150);
    p.strokeWeight(1);
    p.rect(300, 50 + i * 25, 200, 20, 3);
    
    p.fill(255);
    p.noStroke();
    p.textSize(10);
    p.textAlign(p.LEFT, p.CENTER);
    p.text(`${addition.name} ($${addition.cost})`, 305, 60 + i * 25);
  }
  
  // Current recipe preview
  if (gameState.selectedRecipeBase) {
    p.fill(255, 255, 150);
    p.textSize(11);
    p.textAlign(p.LEFT, p.TOP);
    p.text("Current Recipe:", 70, 200);
    
    let recipeName = gameState.selectedRecipeBase.name;
    let cost = gameState.selectedRecipeBase.cost;
    
    for (const addition of gameState.selectedRecipeAdditions) {
      recipeName += " " + addition.name;
      cost += addition.cost;
    }
    
    const price = Math.floor(cost * 2.5);
    
    p.fill(200, 200, 200);
    p.textSize(10);
    p.text(recipeName, 70, 220);
    p.text(`Price: $${price}`, 70, 235);
  }
}

function drawFurnitureTab(p) {
  const available = getAvailableFurniture();
  
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  p.text("Place Furniture", 70, 10);
  
  const cols = 2;
  const itemWidth = 220;
  const itemHeight = 50;
  
  for (let i = 0; i < available.length; i++) {
    const furniture = available[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = 70 + col * (itemWidth + 20);
    const y = 40 + row * (itemHeight + 10);
    
    const selected = gameState.selectedFurniture === furniture;
    const canAfford = gameState.money >= furniture.cost;
    
    p.fill(...(selected ? [100, 200, 100] : (canAfford ? [80, 80, 100] : [60, 60, 60])));
    p.stroke(150);
    p.strokeWeight(2);
    p.rect(x, y, itemWidth, itemHeight, 5);
    
    // Preview
    p.fill(...furniture.color);
    p.noStroke();
    p.rect(x + 5, y + 5, furniture.width * 15, furniture.height * 15, 3);
    
    // Info
    p.fill(255);
    p.textSize(11);
    p.textAlign(p.LEFT, p.TOP);
    p.text(furniture.name, x + 50, y + 5);
    p.textSize(9);
    p.text(`Cost: $${furniture.cost}`, x + 50, y + 20);
    p.text(`Atmosphere: +${furniture.atmosphere}`, x + 50, y + 33);
  }
  
  if (gameState.placementMode) {
    p.fill(255, 255, 100);
    p.textSize(11);
    p.textAlign(p.CENTER, p.TOP);
    p.text("Use arrow keys to position, SPACE to place, Z to cancel", CANVAS_WIDTH / 2, 200);
  }
}

function drawContestsTab(p) {
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  p.text("Combo Meal Contest", 70, 10);
  
  p.fill(200, 200, 200);
  p.textSize(11);
  p.text("Coming Soon: Select drink and food pairings", 70, 40);
  p.text("to win Grand Prizes and boost popularity!", 70, 60);
  
  p.fill(150, 150, 150);
  p.textSize(10);
  p.text("(Feature unlocks with more recipes)", 70, 100);
}

export function drawPlacementPreview(p) {
  if (!gameState.placementMode || !gameState.selectedFurniture) return;
  
  const furniture = gameState.selectedFurniture;
  const x = CAFE_OFFSET_X + gameState.placementX * GRID_SIZE;
  const y = CAFE_OFFSET_Y + gameState.placementY * GRID_SIZE;
  
  // Check if placement is valid
  const valid = gameState.placementX >= 0 && 
                gameState.placementY >= 0 &&
                gameState.placementX + furniture.width <= CAFE_GRID_WIDTH &&
                gameState.placementY + furniture.height <= CAFE_GRID_HEIGHT;
  
  let canPlace = valid;
  if (valid) {
    for (let dy = 0; dy < furniture.height; dy++) {
      for (let dx = 0; dx < furniture.width; dx++) {
        if (gameState.cafeGrid[gameState.placementY + dy][gameState.placementX + dx] !== null) {
          canPlace = false;
          break;
        }
      }
    }
  }
  
  p.push();
  p.fill(...(canPlace ? [100, 255, 100, 100] : [255, 100, 100, 100]));
  p.stroke(...(canPlace ? [0, 255, 0] : [255, 0, 0]));
  p.strokeWeight(2);
  p.rect(x, y, furniture.width * GRID_SIZE, furniture.height * GRID_SIZE, 5);
  p.pop();
}