// ui_manager.js - Manages UI rendering and navigation
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { getUnlockedPlants, getTotalPages, drawPlantVisual, getPlantById } from './plant_manager.js';
import { drawCustomer } from './customer_manager.js';

export function drawUI(p) {
  // Draw top bar with stats
  drawTopBar(p);
  
  // Draw main content area based on current view
  const contentY = 60;
  const contentHeight = CANVAS_HEIGHT - contentY - 40;
  
  if (gameState.currentView === "ENCYCLOPEDIA") {
    drawEncyclopedia(p, 10, contentY, CANVAS_WIDTH - 20, contentHeight);
  } else if (gameState.currentView === "INVENTORY") {
    drawInventory(p, 10, contentY, CANVAS_WIDTH - 20, contentHeight);
  } else if (gameState.currentView === "CUSTOMER") {
    drawCustomerView(p, 10, contentY, CANVAS_WIDTH - 20, contentHeight);
  }
  
  // Draw bottom bar with navigation hints
  drawBottomBar(p);
}

function drawTopBar(p) {
  // Background
  p.fill(30, 40, 50);
  p.rect(0, 0, CANVAS_WIDTH, 50);
  
  // Title
  p.fill(220, 200, 180);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(18);
  p.text("Botanical Mysteries", 15, 25);
  
  // Stats
  p.textSize(12);
  p.fill(180, 220, 180);
  p.text(`Day ${gameState.currentDay}/${gameState.maxDays}`, CANVAS_WIDTH - 280, 15);
  p.fill(220, 180, 180);
  p.text(`Reputation: ${Math.floor(gameState.reputation)}%`, CANVAS_WIDTH - 280, 35);
  p.fill(200, 200, 220);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 140, 25);
  
  // View indicator
  p.fill(255, 220, 150);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  let viewText = gameState.currentView;
  if (gameState.currentView === "CUSTOMER" && gameState.currentCustomer) {
    viewText += ` (${gameState.customersServedToday + 1}/${gameState.customersPerDay})`;
  }
  p.text(viewText, CANVAS_WIDTH / 2, 25);
}

function drawBottomBar(p) {
  const y = CANVAS_HEIGHT - 35;
  p.fill(30, 40, 50);
  p.rect(0, y, CANVAS_WIDTH, 35);
  
  p.fill(180, 180, 200);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(10);
  
  let hints = "← → : Navigate | SHIFT: Change View";
  if (gameState.currentView === "INVENTORY") {
    hints = "← → : Browse Plants | SPACE: Select | Z: Cancel | SHIFT: Change View";
  } else if (gameState.currentView === "CUSTOMER" && gameState.selectedPlantId) {
    hints = "SPACE: Give Plant | Z: Cancel | SHIFT: Change View";
  }
  
  p.text(hints, CANVAS_WIDTH / 2, y + 17);
}

function drawEncyclopedia(p, x, y, width, height) {
  const plants = getUnlockedPlants();
  if (plants.length === 0) return;
  
  // Clamp page
  gameState.encyclopediaPage = Math.max(0, Math.min(gameState.encyclopediaPage, plants.length - 1));
  const currentPlant = plants[gameState.encyclopediaPage];
  
  // Book background
  p.fill(240, 230, 210);
  p.stroke(100, 80, 60);
  p.strokeWeight(3);
  p.rect(x, y, width, height, 5);
  p.noStroke();
  
  // Page number
  p.fill(100, 80, 60);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(11);
  p.text(`Page ${gameState.encyclopediaPage + 1} of ${plants.length}`, x + width / 2, y + 10);
  
  // Plant illustration
  const illustrationSize = 120;
  p.push();
  p.translate(x + width / 2, y + 80);
  drawPlantVisual(p, currentPlant, 0, 0, illustrationSize);
  p.pop();
  
  // Plant name
  p.fill(60, 40, 30);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(16);
  p.text(currentPlant.name, x + width / 2, y + 160);
  
  // Rarity
  p.textSize(11);
  const rarityColor = currentPlant.rarity === "common" ? [100, 140, 100] : 
                      currentPlant.rarity === "uncommon" ? [100, 120, 180] : [180, 100, 180];
  p.fill(...rarityColor);
  p.text(`[${currentPlant.rarity.toUpperCase()}]`, x + width / 2, y + 180);
  
  // Description
  p.fill(50, 40, 30);
  p.textSize(11);
  p.textAlign(p.LEFT, p.TOP);
  const descLines = wrapText(p, currentPlant.description, width - 40);
  let descY = y + 205;
  for (let line of descLines) {
    p.text(line, x + 20, descY);
    descY += 14;
  }
  
  // Properties
  p.fill(80, 60, 50);
  p.textSize(10);
  p.text("Properties:", x + 20, descY + 10);
  p.fill(100, 80, 70);
  p.text(currentPlant.properties.join(", "), x + 20, descY + 25);
  
  // Navigation arrows
  if (gameState.encyclopediaPage > 0) {
    p.fill(100, 80, 60);
    p.triangle(x + 15, y + height / 2, x + 30, y + height / 2 - 15, x + 30, y + height / 2 + 15);
  }
  if (gameState.encyclopediaPage < plants.length - 1) {
    p.fill(100, 80, 60);
    p.triangle(x + width - 15, y + height / 2, x + width - 30, y + height / 2 - 15, x + width - 30, y + height / 2 + 15);
  }
}

function drawInventory(p, x, y, width, height) {
  const plants = getUnlockedPlants();
  if (plants.length === 0) return;
  
  // Shelf background
  p.fill(80, 70, 60);
  p.rect(x, y, width, height, 5);
  
  // Draw shelves
  const cols = 4;
  const rows = Math.ceil(plants.length / cols);
  const cellWidth = width / cols;
  const cellHeight = 100;
  
  let index = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (index >= plants.length) break;
      
      const plant = plants[index];
      const cellX = x + col * cellWidth;
      const cellY = y + row * cellHeight + 10;
      
      // Highlight if selected
      const isSelected = gameState.selectedPlantId === plant.id;
      if (isSelected) {
        p.fill(150, 200, 150, 100);
        p.rect(cellX + 5, cellY, cellWidth - 10, cellHeight - 10, 5);
      }
      
      // Plant visual
      p.push();
      p.translate(cellX + cellWidth / 2, cellY + 40);
      drawPlantVisual(p, plant, 0, 0, 50);
      p.pop();
      
      // Plant name
      p.fill(220, 220, 200);
      p.textAlign(p.CENTER, p.TOP);
      p.textSize(9);
      p.text(plant.name, cellX + cellWidth / 2, cellY + 70);
      
      index++;
    }
  }
  
  // Selection instructions
  if (!gameState.selectedPlantId) {
    p.fill(255, 255, 200, 200);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(11);
    p.text("Use ← → to browse, SPACE to select", x + width / 2, y + height - 25);
  } else {
    const selectedPlant = getPlantById(gameState.selectedPlantId);
    p.fill(150, 255, 150);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(12);
    p.text(`Selected: ${selectedPlant.name}`, x + width / 2, y + height - 25);
  }
}

function drawCustomerView(p, x, y, width, height) {
  if (!gameState.currentCustomer) {
    // No more customers today
    p.fill(60, 50, 70);
    p.rect(x, y, width, height, 5);
    p.fill(200, 180, 220);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.text("Day Complete!\nPreparing for next day...", x + width / 2, y + height / 2);
    return;
  }
  
  // Draw customer on left
  drawCustomer(p, x + 10, y + 10, width - 20, height - 20);
}

function wrapText(p, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  
  for (let word of words) {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    if (p.textWidth(testLine) < maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  
  return lines;
}

export function navigateEncyclopedia(p, direction) {
  const plants = getUnlockedPlants();
  if (direction > 0) {
    gameState.encyclopediaPage = Math.min(gameState.encyclopediaPage + 1, plants.length - 1);
  } else {
    gameState.encyclopediaPage = Math.max(gameState.encyclopediaPage - 1, 0);
  }
}

export function navigateInventory(p, direction) {
  const plants = getUnlockedPlants();
  if (plants.length === 0) return;
  
  // Calculate current index
  let currentIndex = -1;
  if (gameState.selectedPlantId) {
    currentIndex = plants.findIndex(p => p.id === gameState.selectedPlantId);
  }
  
  if (direction > 0) {
    currentIndex = (currentIndex + 1) % plants.length;
  } else {
    currentIndex = currentIndex <= 0 ? plants.length - 1 : currentIndex - 1;
  }
  
  gameState.selectedPlantId = plants[currentIndex].id;
}

export function toggleView(p) {
  const views = ["ENCYCLOPEDIA", "INVENTORY", "CUSTOMER"];
  const currentIndex = views.indexOf(gameState.currentView);
  const nextIndex = (currentIndex + 1) % views.length;
  gameState.currentView = views[nextIndex];
  
  // Log view change
  if (window.gameInstance && window.gameInstance.logs) {
    window.gameInstance.logs.game_info.push({
      data: `View changed to ${gameState.currentView}`,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}