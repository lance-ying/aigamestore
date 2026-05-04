// rendering.js
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, FACILITY_TYPES, SHOP_ITEMS } from './globals.js';

export function drawStartScreen(p) {
  p.background(40, 80, 60);
  
  // Title
  p.fill(255, 240, 200);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text('森丘露营地', CANVAS_WIDTH / 2, 80);
  p.textSize(20);
  p.text('Forest Hill Campsite', CANVAS_WIDTH / 2, 110);
  
  // Description
  p.textSize(12);
  p.fill(200, 220, 180);
  const desc = [
    'Manage your pixel-art camping ground!',
    'Place facilities to attract and satisfy campers.',
    'Earn currency, unlock new facilities, and expand.',
    'Goal: Achieve 5-star rating with 100 campers!'
  ];
  desc.forEach((line, i) => {
    p.text(line, CANVAS_WIDTH / 2, 150 + i * 18);
  });
  
  // Controls
  p.textSize(11);
  p.fill(150, 200, 150);
  const controls = [
    'Arrow Keys: Navigate/Select',
    'Space: Place Facility',
    'Z: Remove Facility',
    'Shift: Toggle Shop',
    'ESC: Pause'
  ];
  controls.forEach((line, i) => {
    p.text(line, CANVAS_WIDTH / 2, 250 + i * 16);
  });
  
  // Start prompt
  p.textSize(16);
  p.fill(255, 255, 100);
  const blink = Math.floor(p.frameCount / 30) % 2 === 0;
  if (blink) {
    p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 360);
  }
}

export function drawGameOverScreen(p) {
  p.background(40, 60, 80);
  
  p.fill(255, 240, 200);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    p.text('★ CONGRATULATIONS! ★', CANVAS_WIDTH / 2, 100);
    p.textSize(18);
    p.fill(100, 255, 100);
    p.text('You achieved 5-star rating!', CANVAS_WIDTH / 2, 140);
    p.text(`Maximum Campers: ${gameState.maxCampers}`, CANVAS_WIDTH / 2, 165);
  } else {
    p.text('GAME OVER', CANVAS_WIDTH / 2, 120);
  }
  
  // Stats
  p.textSize(14);
  p.fill(200, 220, 180);
  p.text(`Final Rating: ${gameState.rating.toFixed(1)} ★`, CANVAS_WIDTH / 2, 200);
  p.text(`Total Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  p.text(`Wishes Fulfilled: ${gameState.wishFulfillmentCount}`, CANVAS_WIDTH / 2, 240);
  p.text(`Currency Earned: $${gameState.currency}`, CANVAS_WIDTH / 2, 260);
  
  // Restart prompt
  p.textSize(16);
  p.fill(255, 255, 100);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 340);
}

export function drawPlayingScreen(p) {
  // Background
  p.background(60, 120, 80);
  
  // Draw grid
  drawGrid(p);
  
  // Draw facilities
  gameState.facilities.forEach(facility => {
    facility.draw(gameState.cameraX, gameState.cameraY, gameState.gridSize);
  });
  
  // Draw campers
  gameState.campers.forEach(camper => {
    camper.draw(gameState.cameraX, gameState.cameraY);
  });
  
  // Draw cursor
  if (gameState.selectedFacilityType && !gameState.shopMode) {
    drawCursor(p);
  }
  
  // Draw UI
  drawUI(p);
  
  // Draw pause indicator
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.fill(255, 255, 255);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(12);
    p.text('PAUSED', CANVAS_WIDTH - 10, 10);
  }
}

function drawGrid(p) {
  p.stroke(70, 130, 90, 100);
  p.strokeWeight(1);
  
  for (let x = 0; x <= gameState.campsiteWidth; x++) {
    const screenX = x * gameState.gridSize - gameState.cameraX;
    p.line(screenX, -gameState.cameraY, screenX, gameState.campsiteHeight * gameState.gridSize - gameState.cameraY);
  }
  
  for (let y = 0; y <= gameState.campsiteHeight; y++) {
    const screenY = y * gameState.gridSize - gameState.cameraY;
    p.line(-gameState.cameraX, screenY, gameState.campsiteWidth * gameState.gridSize - gameState.cameraX, screenY);
  }
}

function drawCursor(p) {
  const mouseGridX = Math.floor((p.mouseX + gameState.cameraX) / gameState.gridSize);
  const mouseGridY = Math.floor((p.mouseY + gameState.cameraY) / gameState.gridSize);
  
  const screenX = mouseGridX * gameState.gridSize - gameState.cameraX;
  const screenY = mouseGridY * gameState.gridSize - gameState.cameraY;
  
  p.fill(255, 255, 255, 100);
  p.stroke(255, 255, 255);
  p.strokeWeight(2);
  p.rect(screenX + 2, screenY + 2, gameState.gridSize - 4, gameState.gridSize - 4, 4);
}

function drawUI(p) {
  // Top bar background
  p.fill(40, 40, 40, 220);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 60);
  
  // Currency and stats
  p.fill(255, 220, 100);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text(`Currency: $${gameState.currency}`, 10, 10);
  p.text(`Score: ${gameState.score}`, 10, 25);
  p.text(`Rating: ${gameState.rating.toFixed(1)} ★`, 10, 40);
  
  p.text(`Campers: ${gameState.campers.length}`, 150, 10);
  p.text(`Max: ${gameState.maxCampers}`, 150, 25);
  p.text(`Satisfaction: ${gameState.satisfaction.toFixed(1)}`, 150, 40);
  
  // Facility selection or shop
  if (gameState.shopMode) {
    drawShopUI(p);
  } else {
    drawFacilityUI(p);
  }
  
  // Mode indicator
  p.fill(200, 200, 200);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(10);
  p.text(gameState.shopMode ? 'SHOP MODE' : 'BUILD MODE', CANVAS_WIDTH - 10, 10);
}

function drawFacilityUI(p) {
  p.fill(255, 255, 255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(10);
  p.text('Facilities:', 280, 10);
  
  let yOffset = 25;
  gameState.unlockedFacilities.forEach((type, index) => {
    const data = FACILITY_TYPES[type.toUpperCase()];
    const isSelected = gameState.selectedFacilityType === type;
    
    p.fill(...(isSelected ? [255, 255, 100] : [200, 200, 200]));
    p.text(`${data.icon} ${data.name} ($${data.cost})`, 280, yOffset);
    yOffset += 12;
  });
}

function drawShopUI(p) {
  p.fill(255, 255, 255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(10);
  p.text('Shop Items (Arrow keys to buy):', 280, 10);
  
  let yOffset = 25;
  SHOP_ITEMS.slice(0, 3).forEach(item => {
    const count = gameState.shopInventory[item.id] || 0;
    p.fill(200, 200, 200);
    p.text(`${item.name}: ${count} ($${item.cost})`, 280, yOffset);
    yOffset += 12;
  });
}