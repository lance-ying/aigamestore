// ui.js - UI rendering and shop menu

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, SHOP_TYPES, GAME_PHASES } from './globals.js';
import { getFloorCost, canAddFloor } from './building.js';

export function renderUI(p) {
  p.push();
  
  // Top bar - Money and stats
  p.fill(40, 40, 60);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 30);
  
  p.fill(255, 215, 0);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(14);
  p.text(`$${gameState.money}`, 10, 15);
  
  // Rating (stars)
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(12);
  const stars = '★'.repeat(gameState.rating) + '☆'.repeat(5 - gameState.rating);
  p.text(stars, CANVAS_WIDTH / 2, 15);
  
  // Satisfaction meter
  p.fill(255);
  p.textAlign(p.RIGHT, p.CENTER);
  p.textSize(11);
  p.text(`Satisfaction: ${Math.floor(gameState.satisfactionScore)}%`, CANVAS_WIDTH - 10, 15);
  
  // Shop menu
  if (gameState.shopMenuOpen) {
    renderShopMenu(p);
  }
  
  // Instructions
  if (!gameState.shopMenuOpen) {
    p.fill(255, 255, 255, 180);
    p.textAlign(p.LEFT, p.BOTTOM);
    p.textSize(10);
    p.text('SHIFT: Shop Menu | ↑↓: Floors | SPACE: Place | Z: Remove', 10, CANVAS_HEIGHT - 5);
  }
  
  // Paused indicator
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.fill(255, 255, 0);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(14);
    p.text('PAUSED', CANVAS_WIDTH - 10, 40);
  }
  
  p.pop();
}

export function renderShopMenu(p) {
  p.push();
  
  const menuX = 50;
  const menuY = 50;
  const menuWidth = CANVAS_WIDTH - 100;
  const menuHeight = 300;
  
  // Menu background
  p.fill(50, 50, 70, 240);
  p.stroke(255);
  p.strokeWeight(2);
  p.rect(menuX, menuY, menuWidth, menuHeight, 10);
  
  // Title
  p.fill(255);
  p.noStroke();
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(16);
  p.text('SELECT SHOP TYPE', menuX + menuWidth / 2, menuY + 10);
  
  // Shop options
  const shopKeys = Object.keys(SHOP_TYPES);
  const itemsPerRow = 2;
  const itemWidth = 200;
  const itemHeight = 60;
  const startX = menuX + 30;
  const startY = menuY + 40;
  const spacing = 20;
  
  shopKeys.forEach((key, index) => {
    const shop = SHOP_TYPES[key];
    const row = Math.floor(index / itemsPerRow);
    const col = index % itemsPerRow;
    const x = startX + col * (itemWidth + spacing);
    const y = startY + row * (itemHeight + spacing);
    
    const isSelected = (gameState.selectedShopType === key);
    const canAfford = (gameState.money >= shop.cost);
    
    // Shop item box
    p.fill(isSelected ? [80, 80, 120] : [60, 60, 90]);
    p.stroke(canAfford ? [255, 255, 255] : [100, 100, 100]);
    p.strokeWeight(isSelected ? 3 : 1);
    p.rect(x, y, itemWidth, itemHeight, 5);
    
    // Shop color indicator
    p.fill(...shop.color);
    p.noStroke();
    p.rect(x + 5, y + 5, 30, itemHeight - 10, 3);
    
    // Shop details
    p.fill(canAfford ? [255, 255, 255] : [150, 150, 150]);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(12);
    p.text(shop.name, x + 40, y + 5);
    p.textSize(10);
    p.text(`Cost: $${shop.cost}`, x + 40, y + 20);
    p.text(`Appeal: ${shop.appeal}`, x + 40, y + 35);
    p.text(`Revenue: $${shop.revenue}/3s`, x + 120, y + 35);
  });
  
  // Add floor option
  const addFloorY = startY + Math.ceil(shopKeys.length / itemsPerRow) * (itemHeight + spacing);
  const floorCost = getFloorCost();
  const canAffordFloor = canAddFloor();
  
  p.fill(canAffordFloor ? [70, 100, 70] : [60, 60, 60]);
  p.stroke(canAffordFloor ? [255, 255, 255] : [100, 100, 100]);
  p.strokeWeight(1);
  p.rect(startX, addFloorY, itemWidth * 2 + spacing, 40, 5);
  
  p.fill(canAffordFloor ? [255, 255, 255] : [150, 150, 150]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(12);
  p.text(`Add Floor (Cost: $${floorCost}) - Floors: ${gameState.floors.length}/${gameState.maxFloors}`, 
         startX + (itemWidth * 2 + spacing) / 2, addFloorY + 20);
  
  // Instructions
  p.fill(255);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.textSize(11);
  p.text('↑↓: Navigate | SPACE: Select | SHIFT: Close', menuX + menuWidth / 2, menuY + menuHeight - 10);
  
  p.pop();
}

export function renderStartScreen(p) {
  p.push();
  
  p.background(30, 30, 50);
  
  // Title
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text('DEPARTMENT STORE TYCOON', CANVAS_WIDTH / 2, 80);
  
  // Description
  p.fill(255);
  p.textSize(14);
  p.text('Build and manage your multi-story department store!', CANVAS_WIDTH / 2, 130);
  p.textSize(12);
  p.text('Place shops, serve customers, and grow your business', CANVAS_WIDTH / 2, 150);
  p.text('to achieve a prestigious 5-star rating!', CANVAS_WIDTH / 2, 165);
  
  // Instructions box
  p.fill(50, 50, 70);
  p.stroke(255);
  p.strokeWeight(2);
  p.rect(100, 190, 400, 140, 10);
  
  p.fill(255, 215, 0);
  p.noStroke();
  p.textSize(14);
  p.text('HOW TO PLAY', CANVAS_WIDTH / 2, 205);
  
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(11);
  const instructions = [
    '↑↓ Arrow Keys: Navigate floors and menu',
    'SHIFT: Open/Close shop selection menu',
    'SPACE: Place selected shop or confirm',
    'Z: Remove shop (when hovering)',
    'ESC: Pause game | R: Restart'
  ];
  
  instructions.forEach((text, i) => {
    p.text(text, 120, 220 + i * 20);
  });
  
  // Start prompt
  p.fill(255, 255, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  const blink = Math.floor(p.frameCount / 30) % 2 === 0;
  if (blink) {
    p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 360);
  }
  
  p.pop();
}

export function renderGameOverScreen(p) {
  p.push();
  
  // Semi-transparent overlay
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  const isWin = (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN);
  
  // Result message
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text(isWin ? 'CONGRATULATIONS!' : 'GAME OVER', CANVAS_WIDTH / 2, 120);
  
  // Rating
  p.fill(255, 215, 0);
  p.textSize(48);
  const stars = '★'.repeat(gameState.rating) + '☆'.repeat(5 - gameState.rating);
  p.text(stars, CANVAS_WIDTH / 2, 180);
  
  // Stats
  p.fill(255);
  p.textSize(16);
  p.text(`Total Revenue: $${gameState.revenue}`, CANVAS_WIDTH / 2, 230);
  p.text(`Customers Served: ${gameState.totalCustomersServed}`, CANVAS_WIDTH / 2, 255);
  p.text(`Satisfaction: ${Math.floor(gameState.satisfactionScore)}%`, CANVAS_WIDTH / 2, 280);
  p.text(`Shops Built: ${gameState.shops.length}`, CANVAS_WIDTH / 2, 305);
  
  // Restart prompt
  p.fill(255, 255, 0);
  p.textSize(18);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 350);
  
  p.pop();
}