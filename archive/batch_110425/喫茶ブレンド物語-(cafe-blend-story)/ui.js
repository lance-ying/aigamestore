// ui.js - UI rendering and menu handling

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE, GRID_COLS, GRID_ROWS, FURNITURE_TYPES } from './globals.js';
import { createRecipe, addRecipe, unlockIngredient } from './recipe.js';
import { placeFurniture, canPlaceFurniture, unlockFurniture } from './furniture.js';

export function renderUI(p) {
  // Top bar - Money and stats
  p.push();
  p.fill(40, 40, 40, 220);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 30);
  
  p.fill(255, 220, 100);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(14);
  p.text(`💰 $${gameState.money}`, 10, 15);
  
  p.fill(255, 200, 150);
  p.text(`⭐ ${gameState.cafeRating}/5`, 120, 15);
  
  p.fill(200, 200, 255);
  p.text(`Rep: ${gameState.reputation}`, 220, 15);
  
  p.fill(150, 255, 150);
  p.text(`Day ${gameState.day}`, 320, 15);
  
  p.fill(255, 255, 255);
  p.text(`Tier ${gameState.upgradeTier}`, 400, 15);
  
  p.fill(200, 200, 200);
  p.textSize(10);
  p.textAlign(p.RIGHT, p.CENTER);
  p.text(`Shift: Menu`, CANVAS_WIDTH - 10, 15);
  
  p.pop();
  
  // Menu overlay
  if (gameState.menuOpen) {
    renderMenu(p);
  }
  
  // Instructions at bottom if no menu
  if (!gameState.menuOpen) {
    p.push();
    p.fill(0, 0, 0, 150);
    p.rect(0, CANVAS_HEIGHT - 25, CANVAS_WIDTH, 25);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(11);
    p.text('Shift: Menu | Space: Serve Customer | Arrows: Navigate', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 12);
    p.pop();
  }
}

export function renderMenu(p) {
  p.push();
  
  // Semi-transparent background
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  const menuX = 50;
  const menuY = 50;
  const menuW = CANVAS_WIDTH - 100;
  const menuH = CANVAS_HEIGHT - 100;
  
  // Menu background
  p.fill(60, 50, 40);
  p.stroke(200, 180, 140);
  p.strokeWeight(3);
  p.rect(menuX, menuY, menuW, menuH, 10);
  
  // Menu title
  p.fill(255, 220, 150);
  p.noStroke();
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(20);
  
  if (gameState.menuType === 'RECIPE') {
    p.text('Recipe Creation', CANVAS_WIDTH / 2, menuY + 15);
    renderRecipeMenu(p, menuX, menuY, menuW, menuH);
  } else if (gameState.menuType === 'FURNITURE') {
    p.text('Furniture Placement', CANVAS_WIDTH / 2, menuY + 15);
    renderFurnitureMenu(p, menuX, menuY, menuW, menuH);
  } else if (gameState.menuType === 'STATS') {
    p.text('Cafe Statistics', CANVAS_WIDTH / 2, menuY + 15);
    renderStatsMenu(p, menuX, menuY, menuW, menuH);
  } else {
    // Main menu
    p.text('Cafe Menu', CANVAS_WIDTH / 2, menuY + 15);
    renderMainMenu(p, menuX, menuY, menuW, menuH);
  }
  
  // Instructions
  p.fill(200, 200, 200);
  p.textSize(12);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.text('Z: Back | Arrows: Navigate | Space: Select', CANVAS_WIDTH / 2, menuY + menuH - 10);
  
  p.pop();
}

function renderMainMenu(p, menuX, menuY, menuW, menuH) {
  const options = ['Create Recipe', 'Place Furniture', 'View Stats'];
  const startY = menuY + 60;
  const spacing = 50;
  
  for (let i = 0; i < options.length; i++) {
    const isSelected = gameState.cursorY === i;
    
    p.push();
    p.fill(isSelected ? [100, 80, 60] : [80, 70, 60]);
    p.stroke(isSelected ? [255, 220, 150] : [150, 130, 100]);
    p.strokeWeight(2);
    p.rect(menuX + 50, startY + i * spacing, menuW - 100, 40, 5);
    
    p.fill(isSelected ? [255, 240, 200] : [220, 200, 170]);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16);
    p.text(options[i], CANVAS_WIDTH / 2, startY + i * spacing + 20);
    p.pop();
  }
}

function renderRecipeMenu(p, menuX, menuY, menuW, menuH) {
  const startY = menuY + 50;
  
  // Ingredient selection
  p.fill(220, 200, 170);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text('Select ingredients (up to 3):', menuX + 20, startY);
  
  const ingredients = gameState.ingredients.filter(ing => ing.unlocked);
  const spacing = 30;
  
  for (let i = 0; i < ingredients.length; i++) {
    const ing = ingredients[i];
    const isSelected = gameState.selectedIngredients.includes(ing.id);
    const isCursor = gameState.cursorY === i;
    
    p.push();
    p.fill(isCursor ? [100, 80, 60] : [80, 70, 60]);
    if (isSelected) {
      p.fill(60, 100, 80);
    }
    p.stroke(isCursor ? [255, 220, 150] : [150, 130, 100]);
    p.strokeWeight(2);
    p.rect(menuX + 20, startY + 30 + i * spacing, menuW - 40, 25, 3);
    
    p.fill(255);
    p.noStroke();
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(12);
    p.text(`${ing.name} (Q:${ing.quality}, $${ing.cost})`, menuX + 30, startY + 42 + i * spacing);
    
    if (isSelected) {
      p.fill(100, 255, 100);
      p.text('✓', menuX + menuW - 60, startY + 42 + i * spacing);
    }
    p.pop();
  }
  
  // Create button
  const createY = startY + 30 + ingredients.length * spacing + 20;
  const canCreate = gameState.selectedIngredients.length > 0;
  
  p.push();
  p.fill(canCreate ? [80, 120, 80] : [60, 60, 60]);
  p.stroke(canCreate ? [150, 255, 150] : [100, 100, 100]);
  p.strokeWeight(2);
  p.rect(menuX + 50, createY, menuW - 100, 40, 5);
  
  p.fill(canCreate ? [200, 255, 200] : [150, 150, 150]);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  p.text('Create Recipe', CANVAS_WIDTH / 2, createY + 20);
  p.pop();
  
  // Show unlockable ingredients
  const lockedIngredients = gameState.ingredients.filter(ing => !ing.unlocked);
  if (lockedIngredients.length > 0) {
    const unlockY = createY + 60;
    p.fill(220, 200, 170);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(12);
    p.text('Unlock new ingredients:', menuX + 20, unlockY);
  }
}

function renderFurnitureMenu(p, menuX, menuY, menuW, menuH) {
  const startY = menuY + 50;
  
  p.fill(220, 200, 170);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text('Select furniture to place:', menuX + 20, startY);
  
  const furniture = FURNITURE_TYPES.filter(f => f.unlocked);
  const spacing = 35;
  
  for (let i = 0; i < furniture.length; i++) {
    const furn = furniture[i];
    const isCursor = gameState.cursorY === i;
    const isSelected = gameState.selectedFurnitureType === furn.id;
    
    p.push();
    p.fill(isCursor ? [100, 80, 60] : [80, 70, 60]);
    if (isSelected) {
      p.fill(60, 80, 100);
    }
    p.stroke(isCursor ? [255, 220, 150] : [150, 130, 100]);
    p.strokeWeight(2);
    p.rect(menuX + 20, startY + 30 + i * spacing, menuW - 40, 30, 3);
    
    p.fill(255);
    p.noStroke();
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(12);
    p.text(`${furn.name} ($${furn.cost}) ${furn.width}x${furn.height}`, menuX + 30, startY + 45 + i * spacing);
    
    // Preview color
    p.fill(...furn.color);
    p.rect(menuX + menuW - 60, startY + 35 + i * spacing, 20, 20);
    
    if (isSelected) {
      p.fill(100, 100, 255);
      p.textAlign(p.RIGHT, p.CENTER);
      p.text('Selected', menuX + menuW - 70, startY + 45 + i * spacing);
    }
    p.pop();
  }
  
  // Instructions
  const instructY = startY + 30 + furniture.length * spacing + 20;
  p.fill(200, 200, 200);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(12);
  p.text('Select furniture, then close menu to place on grid', CANVAS_WIDTH / 2, instructY);
}

function renderStatsMenu(p, menuX, menuY, menuW, menuH) {
  const startY = menuY + 60;
  const lineHeight = 25;
  
  p.fill(220, 200, 170);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  
  let line = 0;
  p.text(`Total Revenue: $${gameState.totalRevenue}`, menuX + 30, startY + line++ * lineHeight);
  p.text(`Customers Served: ${gameState.totalCustomersServed}`, menuX + 30, startY + line++ * lineHeight);
  p.text(`Current Money: $${gameState.money}`, menuX + 30, startY + line++ * lineHeight);
  p.text(`Reputation: ${gameState.reputation}`, menuX + 30, startY + line++ * lineHeight);
  p.text(`Cafe Rating: ${gameState.cafeRating} / 5 stars`, menuX + 30, startY + line++ * lineHeight);
  p.text(`Upgrade Tier: ${gameState.upgradeTier} / 5`, menuX + 30, startY + line++ * lineHeight);
  p.text(`Recipes Created: ${gameState.recipes.length}`, menuX + 30, startY + line++ * lineHeight);
  p.text(`Furniture Placed: ${gameState.furniture.length}`, menuX + 30, startY + line++ * lineHeight);
  
  line++;
  p.textSize(12);
  p.fill(255, 220, 150);
  p.text('Next Star Requirements:', menuX + 30, startY + line++ * lineHeight);
  
  const nextStarRep = [50, 150, 300, 500, 1000];
  if (gameState.cafeRating < 5) {
    const needed = nextStarRep[gameState.cafeRating] - gameState.reputation;
    p.fill(200, 200, 200);
    p.text(`  Reputation needed: ${needed > 0 ? needed : 0}`, menuX + 30, startY + line++ * lineHeight);
  } else {
    p.fill(100, 255, 100);
    p.text('  Maximum rating achieved!', menuX + 30, startY + line++ * lineHeight);
  }
  
  line++;
  if (gameState.cafeRating >= 5 && gameState.totalRevenue >= 1000) {
    p.fill(255, 255, 100);
    p.textSize(16);
    p.text('🎉 Victory Conditions Met! 🎉', menuX + 30, startY + line++ * lineHeight);
  } else if (gameState.cafeRating >= 5) {
    p.fill(255, 200, 100);
    p.text(`Revenue needed: $${1000 - gameState.totalRevenue}`, menuX + 30, startY + line++ * lineHeight);
  }
}

export function renderGrid(p) {
  const gridStartX = 250;
  const gridStartY = 50;
  
  p.push();
  
  // Draw grid background
  p.fill(240, 230, 220);
  p.stroke(200, 190, 180);
  p.strokeWeight(1);
  p.rect(gridStartX, gridStartY, GRID_COLS * GRID_SIZE, GRID_ROWS * GRID_SIZE);
  
  // Draw grid lines
  p.stroke(220, 210, 200);
  for (let i = 0; i <= GRID_COLS; i++) {
    p.line(gridStartX + i * GRID_SIZE, gridStartY, gridStartX + i * GRID_SIZE, gridStartY + GRID_ROWS * GRID_SIZE);
  }
  for (let j = 0; j <= GRID_ROWS; j++) {
    p.line(gridStartX, gridStartY + j * GRID_SIZE, gridStartX + GRID_COLS * GRID_SIZE, gridStartY + j * GRID_SIZE);
  }
  
  // Draw furniture
  for (const furniture of gameState.furniture) {
    p.fill(...furniture.color);
    p.stroke(0);
    p.strokeWeight(1);
    p.rect(
      gridStartX + furniture.gridX * GRID_SIZE,
      gridStartY + furniture.gridY * GRID_SIZE,
      furniture.width * GRID_SIZE,
      furniture.height * GRID_SIZE
    );
  }
  
  // Draw placement cursor if furniture selected
  if (gameState.selectedFurnitureType && !gameState.menuOpen) {
    const furn = FURNITURE_TYPES.find(f => f.id === gameState.selectedFurnitureType);
    if (furn) {
      const canPlace = canPlaceFurniture(furn, gameState.cursorX, gameState.cursorY);
      p.fill(...(canPlace ? [100, 255, 100, 100] : [255, 100, 100, 100]));
      p.stroke(canPlace ? [0, 200, 0] : [200, 0, 0]);
      p.strokeWeight(2);
      p.rect(
        gridStartX + gameState.cursorX * GRID_SIZE,
        gridStartY + gameState.cursorY * GRID_SIZE,
        furn.width * GRID_SIZE,
        furn.height * GRID_SIZE
      );
    }
  }
  
  p.pop();
}