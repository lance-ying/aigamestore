// ui.js - UI rendering and menu

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, BUILDING_TYPES, GIFT_ITEMS, GRID_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y, GRID_COLS, GRID_ROWS, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';
import { canPlaceBuilding } from './building.js';

export function renderStartScreen(p) {
  p.background(40, 120, 200);
  
  // Title with water effect
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  // Shadow
  p.fill(0, 0, 0, 100);
  p.textSize(48);
  p.text("WATERPARK STORY", CANVAS_WIDTH / 2 + 2, 80 + 2);
  
  // Main title
  p.fill(255, 255, 255);
  p.textSize(48);
  p.text("WATERPARK STORY", CANVAS_WIDTH / 2, 80);
  
  // Water splash decoration
  p.fill(100, 180, 255, 150);
  p.noStroke();
  for (let i = 0; i < 5; i++) {
    const offset = Math.sin(gameState.gameTime * 0.05 + i) * 10;
    p.ellipse(CANVAS_WIDTH / 2 - 100 + i * 50, 120 + offset, 20, 10);
  }
  
  // Description
  p.fill(255, 255, 255);
  p.textSize(14);
  p.text("Build the ultimate water park!", CANVAS_WIDTH / 2, 150);
  p.textSize(12);
  p.text("Place attractions, serve guests, and grow your SNS followers", CANVAS_WIDTH / 2, 170);
  p.text("to unlock new facilities and achieve a 5-star rating!", CANVAS_WIDTH / 2, 185);
  
  // Instructions
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(11);
  p.fill(255, 255, 200);
  
  const instructions = [
    "CONTROLS:",
    "Arrow Keys - Navigate menu and grid",
    "Space - Confirm / Place / Speed up",
    "Shift - Toggle Build/Gift/Delete modes",
    "Z - Cancel / Delete tile",
    "",
    "OBJECTIVE:",
    "Reach 1000 SNS followers with high satisfaction",
    "to achieve a 5-star rating!"
  ];
  
  let yPos = 220;
  instructions.forEach(line => {
    p.text(line, 50, yPos);
    yPos += 16;
  });
  
  // Start prompt
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  const flash = Math.sin(gameState.gameTime * 0.1) > 0;
  p.fill(flash ? [255, 255, 100] : [255, 255, 255]);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
  
  p.pop();
}

export function renderPauseOverlay(p) {
  p.push();
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  p.pop();
}

export function renderGameOverScreen(p, isWin) {
  p.background(isWin ? [50, 150, 100] : [150, 50, 50]);
  
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  // Title
  p.fill(255);
  p.textSize(48);
  p.text(isWin ? "5-STAR PARK!" : "GAME OVER", CANVAS_WIDTH / 2, 80);
  
  // Stats
  p.textSize(16);
  p.text(`Final Rating: ${gameState.parkRating} stars`, CANVAS_WIDTH / 2, 140);
  p.text(`SNS Followers: ${gameState.snsFollowers}`, CANVAS_WIDTH / 2, 165);
  p.text(`Guests Served: ${gameState.totalGuestsServed}`, CANVAS_WIDTH / 2, 190);
  p.text(`Total Income: $${gameState.totalIncome}`, CANVAS_WIDTH / 2, 215);
  p.text(`Average Satisfaction: ${Math.floor(gameState.averageSatisfaction)}%`, CANVAS_WIDTH / 2, 240);
  
  if (isWin) {
    p.textSize(14);
    p.fill(255, 255, 150);
    p.text("You've created an amazing water park!", CANVAS_WIDTH / 2, 280);
    p.text("Guests love it and are spreading the word!", CANVAS_WIDTH / 2, 300);
  } else {
    p.textSize(14);
    p.fill(255, 200, 200);
    p.text("Your park needs more attractions and better service.", CANVAS_WIDTH / 2, 280);
    p.text("Try building diverse facilities and gifting items!", CANVAS_WIDTH / 2, 300);
  }
  
  // Restart prompt
  p.textSize(20);
  const flash = Math.sin(gameState.gameTime * 0.1) > 0;
  p.fill(flash ? [255, 255, 100] : [255, 255, 255]);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  
  p.pop();
}

export function renderUI(p) {
  // Background
  p.fill(200, 230, 255);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Grid background
  p.fill(150, 200, 100);
  p.rect(GRID_OFFSET_X, GRID_OFFSET_Y, GRID_COLS * GRID_SIZE, GRID_ROWS * GRID_SIZE);
  
  // Grid lines
  p.stroke(120, 170, 80);
  p.strokeWeight(1);
  for (let x = 0; x <= GRID_COLS; x++) {
    p.line(GRID_OFFSET_X + x * GRID_SIZE, GRID_OFFSET_Y, GRID_OFFSET_X + x * GRID_SIZE, GRID_OFFSET_Y + GRID_ROWS * GRID_SIZE);
  }
  for (let y = 0; y <= GRID_ROWS; y++) {
    p.line(GRID_OFFSET_X, GRID_OFFSET_Y + y * GRID_SIZE, GRID_OFFSET_X + GRID_COLS * GRID_SIZE, GRID_OFFSET_Y + y * GRID_SIZE);
  }
  
  // Menu panel
  p.fill(60, 60, 80);
  p.noStroke();
  p.rect(0, 0, 190, CANVAS_HEIGHT);
  
  // Stats
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Money: $${gameState.money}`, 10, 10);
  p.text(`SNS: ${gameState.snsFollowers}`, 10, 25);
  p.text(`Rating: ${gameState.parkRating}★`, 10, 40);
  p.text(`Guests: ${gameState.guests.length}`, 10, 55);
  p.text(`Satisfaction: ${Math.floor(gameState.averageSatisfaction)}%`, 10, 70);
  
  // Mode indicator
  p.textSize(10);
  p.fill(255, 255, 150);
  p.text(`Mode: ${gameState.buildMode}`, 10, 90);
  p.fill(200);
  p.text("Shift: Change mode", 10, 105);
  
  // Building menu
  p.fill(255);
  p.textSize(11);
  p.text("BUILD MENU:", 10, 130);
  
  let menuY = 150;
  let menuIndex = 0;
  Object.keys(BUILDING_TYPES).forEach(key => {
    const building = BUILDING_TYPES[key];
    
    // Check if unlocked
    const unlocked = !building.unlockFollowers || gameState.snsFollowers >= building.unlockFollowers;
    
    if (unlocked) {
      const isSelected = gameState.selectedBuildingType === key;
      
      // Highlight selected
      if (isSelected && gameState.buildMode === 'BUILD') {
        p.fill(100, 150, 255, 100);
        p.noStroke();
        p.rect(5, menuY - 2, 180, 16, 3);
      }
      
      p.fill(unlocked ? (gameState.money >= building.cost ? [255] : [150]) : [100]);
      p.textSize(9);
      p.textAlign(p.LEFT, p.TOP);
      p.text(`${building.name} - $${building.cost}`, 10, menuY);
      
      menuY += 16;
      menuIndex++;
    }
  });
  
  // Gift menu
  menuY += 10;
  p.fill(255);
  p.textSize(11);
  p.text("GIFT MENU:", 10, menuY);
  menuY += 20;
  
  Object.keys(GIFT_ITEMS).forEach(key => {
    const gift = GIFT_ITEMS[key];
    const isSelected = gameState.selectedGiftType === key;
    
    if (isSelected && gameState.buildMode === 'GIFT') {
      p.fill(255, 150, 255, 100);
      p.noStroke();
      p.rect(5, menuY - 2, 180, 16, 3);
    }
    
    p.fill(gameState.money >= gift.cost ? [255] : [150]);
    p.textSize(9);
    p.textAlign(p.LEFT, p.TOP);
    p.text(`${gift.name} - $${gift.cost}`, 10, menuY);
    
    menuY += 16;
  });
  
  // Cursor preview
  if (gameState.buildMode === 'BUILD' && gameState.selectedBuildingType) {
    const building = BUILDING_TYPES[gameState.selectedBuildingType];
    const canPlace = canPlaceBuilding(gameState.cursorGridX, gameState.cursorGridY, building.width, building.height);
    
    p.fill(...(canPlace ? [...building.color, 100] : [255, 0, 0, 100]));
    p.noStroke();
    p.rect(
      GRID_OFFSET_X + gameState.cursorGridX * GRID_SIZE,
      GRID_OFFSET_Y + gameState.cursorGridY * GRID_SIZE,
      building.width * GRID_SIZE,
      building.height * GRID_SIZE,
      5
    );
  } else if (gameState.buildMode === 'DELETE') {
    // Highlight tile to delete
    p.fill(255, 0, 0, 100);
    p.stroke(255, 0, 0);
    p.strokeWeight(2);
    p.rect(
      GRID_OFFSET_X + gameState.cursorGridX * GRID_SIZE,
      GRID_OFFSET_Y + gameState.cursorGridY * GRID_SIZE,
      GRID_SIZE,
      GRID_SIZE
    );
  } else if (gameState.buildMode === 'GIFT') {
    // Highlight gift cursor
    p.fill(255, 150, 255, 100);
    p.stroke(255, 100, 255);
    p.strokeWeight(2);
    p.ellipse(
      GRID_OFFSET_X + gameState.cursorGridX * GRID_SIZE + GRID_SIZE / 2,
      GRID_OFFSET_Y + gameState.cursorGridY * GRID_SIZE + GRID_SIZE / 2,
      GRID_SIZE,
      GRID_SIZE
    );
  }
}