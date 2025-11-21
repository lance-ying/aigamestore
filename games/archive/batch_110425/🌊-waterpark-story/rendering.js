// rendering.js - All rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE, GRID_COLS, GRID_ROWS, FACILITY_TYPES } from './globals.js';

export function renderGame(p) {
  p.background(150, 200, 150);

  if (gameState.gamePhase === 'START') {
    renderStartScreen(p);
  } else if (gameState.gamePhase === 'PLAYING') {
    renderPlaying(p);
  } else if (gameState.gamePhase === 'PAUSED') {
    renderPlaying(p);
    renderPauseOverlay(p);
  } else if (gameState.gamePhase === 'GAME_OVER_WIN' || gameState.gamePhase === 'GAME_OVER_LOSE') {
    renderPlaying(p);
    renderGameOver(p);
  }
}

function renderStartScreen(p) {
  p.background(100, 180, 255);
  
  // Title
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text('🌊 WATERPARK STORY 🌊', CANVAS_WIDTH / 2, 80);
  
  // Description
  p.textSize(14);
  p.fill(255, 255, 200);
  p.text('Build your dream water park!', CANVAS_WIDTH / 2, 140);
  p.text('Place pools, slides, restaurants, and gift shops', CANVAS_WIDTH / 2, 165);
  p.text('to attract happy guests and become SNS famous!', CANVAS_WIDTH / 2, 185);
  
  // Instructions
  p.textSize(12);
  p.fill(255);
  p.textAlign(p.LEFT);
  p.text('Arrow Keys: Navigate menu/grid', 50, 230);
  p.text('Z: Open/close build menu', 50, 250);
  p.text('Space: Place facility', 50, 270);
  p.text('Shift: Speed boost (hold)', 50, 290);
  
  p.textAlign(p.CENTER);
  p.textSize(16);
  p.fill(255, 255, 0);
  p.text('🎯 Goal: Reach 4+ stars and 20+ SNS friends!', CANVAS_WIDTH / 2, 330);
  
  p.textSize(20);
  p.fill(255);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 370);
}

function renderPlaying(p) {
  // Draw grid background
  p.fill(180, 220, 180);
  p.noStroke();
  p.rect(0, 0, GRID_COLS * GRID_SIZE, GRID_ROWS * GRID_SIZE);
  
  // Draw grid lines
  p.stroke(150, 200, 150);
  p.strokeWeight(1);
  for (let i = 0; i <= GRID_COLS; i++) {
    p.line(i * GRID_SIZE, 0, i * GRID_SIZE, GRID_ROWS * GRID_SIZE);
  }
  for (let i = 0; i <= GRID_ROWS; i++) {
    p.line(0, i * GRID_SIZE, GRID_COLS * GRID_SIZE, i * GRID_SIZE);
  }
  
  // Highlight selected tile
  p.fill(255, 255, 0, 100);
  p.noStroke();
  p.rect(gameState.selectedTile.x * GRID_SIZE, gameState.selectedTile.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
  
  // Draw facilities
  gameState.facilities.forEach(facility => {
    facility.render(p);
  });
  
  // Draw guests
  gameState.guests.forEach(guest => {
    guest.render(p);
  });
  
  // Draw UI
  renderUI(p);
  
  // Draw menu if open
  if (gameState.menuOpen) {
    renderMenu(p);
  }
  
  // Draw preview if facility selected
  if (gameState.selectedFacility && !gameState.menuOpen) {
    renderPlacementPreview(p);
  }
}

function renderUI(p) {
  const uiY = GRID_ROWS * GRID_SIZE;
  const uiHeight = CANVAS_HEIGHT - uiY;
  
  p.fill(40, 40, 60);
  p.noStroke();
  p.rect(0, uiY, CANVAS_WIDTH, uiHeight);
  
  p.fill(255);
  p.textAlign(p.LEFT);
  p.textSize(12);
  p.text(`💰 Money: $${gameState.money}`, 10, uiY + 20);
  p.text(`⭐ Rating: ${gameState.parkRating.toFixed(1)}`, 10, uiY + 40);
  p.text(`👥 Friends: ${gameState.snsFriends}`, 150, uiY + 20);
  p.text(`🎯 Score: ${gameState.score}`, 150, uiY + 40);
  p.text(`👤 Guests: ${gameState.guests.length}`, 280, uiY + 20);
  p.text(`🏗️ Facilities: ${gameState.facilities.length}`, 280, uiY + 40);
  
  p.textAlign(p.RIGHT);
  p.text('Press Z: Build Menu', CANVAS_WIDTH - 10, uiY + 20);
}

function renderMenu(p) {
  const menuX = 100;
  const menuY = 50;
  const menuWidth = 400;
  const itemHeight = 40;
  const menuHeight = itemHeight * gameState.unlockedFacilities.length + 40;
  
  p.fill(50, 50, 70, 240);
  p.stroke(255);
  p.strokeWeight(2);
  p.rect(menuX, menuY, menuWidth, menuHeight);
  
  p.fill(255);
  p.noStroke();
  p.textAlign(p.CENTER);
  p.textSize(16);
  p.text('BUILD MENU', menuX + menuWidth / 2, menuY + 20);
  
  gameState.unlockedFacilities.forEach((key, index) => {
    const facility = FACILITY_TYPES[key];
    const itemY = menuY + 40 + index * itemHeight;
    
    if (index === gameState.menuIndex) {
      p.fill(100, 150, 255, 150);
      p.rect(menuX + 10, itemY, menuWidth - 20, itemHeight - 5);
    }
    
    p.fill(...facility.color);
    p.rect(menuX + 20, itemY + 5, 30, 30);
    
    const canAfford = gameState.money >= facility.cost;
    p.fill(canAfford ? 255 : [150, 150, 150]);
    p.textAlign(p.LEFT);
    p.textSize(14);
    p.text(`${facility.name} - $${facility.cost}`, menuX + 60, itemY + 22);
    
    p.textAlign(p.RIGHT);
    p.textSize(11);
    p.text(`💰+${facility.income} ⭐+${facility.satisfaction}`, menuX + menuWidth - 20, itemY + 22);
  });
  
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER);
  p.textSize(11);
  p.text('Arrow Keys: Select | Space: Choose | Z: Close', menuX + menuWidth / 2, menuY + menuHeight - 10);
}

function renderPlacementPreview(p) {
  const gridX = gameState.selectedTile.x;
  const gridY = gameState.selectedTile.y;
  
  if (gameState.gridOccupied[gridY][gridX] !== null) {
    p.fill(255, 0, 0, 100);
  } else {
    p.fill(0, 255, 0, 100);
  }
  p.noStroke();
  p.rect(gridX * GRID_SIZE, gridY * GRID_SIZE, GRID_SIZE, GRID_SIZE);
}

function renderPauseOverlay(p) {
  p.fill(255);
  p.textAlign(p.RIGHT);
  p.textSize(16);
  p.text('PAUSED', CANVAS_WIDTH - 10, 20);
}

function renderGameOver(p) {
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  
  if (gameState.gamePhase === 'GAME_OVER_WIN') {
    p.textSize(36);
    p.fill(255, 255, 0);
    p.text('🎉 SUCCESS! 🎉', CANVAS_WIDTH / 2, 120);
    
    p.textSize(18);
    p.fill(255);
    p.text('Your water park is a hit!', CANVAS_WIDTH / 2, 170);
    p.text(`Final Rating: ${gameState.parkRating.toFixed(1)} ⭐`, CANVAS_WIDTH / 2, 200);
    p.text(`SNS Friends: ${gameState.snsFriends} 👥`, CANVAS_WIDTH / 2, 225);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 250);
  } else {
    p.textSize(36);
    p.fill(255, 100, 100);
    p.text('GAME OVER', CANVAS_WIDTH / 2, 120);
    
    p.textSize(18);
    p.fill(255);
    p.text('Your park ran out of funds', CANVAS_WIDTH / 2, 170);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 200);
  }
  
  p.textSize(20);
  p.fill(255, 255, 0);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 300);
}