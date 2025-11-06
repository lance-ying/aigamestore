// renderer.js - Rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, FIREPLACE_X, FIREPLACE_Y, FIREPLACE_WIDTH, FIREPLACE_HEIGHT, CATALOG_X, CATALOG_Y, CATALOG_WIDTH, CATALOG_HEIGHT } from './globals.js';

export function renderGame(p) {
  // Clear canvas
  p.background(40, 35, 45);
  
  if (gameState.gamePhase === PHASE_START) {
    renderStartScreen(p);
  } else if (gameState.gamePhase === PHASE_PLAYING) {
    renderPlayingScreen(p);
  } else if (gameState.gamePhase === PHASE_PAUSED) {
    renderPlayingScreen(p);
    renderPausedOverlay(p);
  } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN) {
    renderGameOverScreen(p);
  }
}

function renderStartScreen(p) {
  p.push();
  
  // Title
  p.fill(255, 100, 50);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("LITTLE INFERNO HD", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(255, 200, 150);
  p.textSize(16);
  p.text("The Fireplace Burning Experience", CANVAS_WIDTH / 2, 120);
  
  // Description
  p.fill(220);
  p.textSize(12);
  p.textAlign(p.CENTER, p.TOP);
  const desc = "Burn items to discover mysterious combos!\nEarn coins and unlock new catalogs.\nDiscover all combos to complete your journey.";
  p.text(desc, CANVAS_WIDTH / 2, 160);
  
  // Instructions
  p.fill(180, 220, 255);
  p.textSize(11);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    "Z: Open/Close Catalog",
    "Arrow Keys: Navigate Catalog",
    "SPACE: Purchase Item",
    "SHIFT: Grab/Drag Item to Fire",
    "ESC: Pause Game"
  ];
  
  let y = 230;
  instructions.forEach(instr => {
    p.text(instr, 150, y);
    y += 20;
  });
  
  // Start prompt
  p.fill(255, 255, 0);
  p.textSize(20);
  p.textAlign(p.CENTER, p.CENTER);
  const flash = Math.sin(p.frameCount * 0.1) * 0.5 + 0.5;
  p.fill(255, 255, 0, 150 + flash * 105);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
  
  p.pop();
}

function renderPlayingScreen(p) {
  // Render room background
  renderRoom(p);
  
  // Render fireplace
  renderFireplace(p);
  
  // Render burning items
  gameState.burningItems.forEach(item => item.render(p));
  
  // Render inventory items
  gameState.inventory.forEach(item => item.render(p));
  
  // Render catalog if open
  if (gameState.catalogOpen) {
    renderCatalog(p);
  }
  
  // Render UI
  renderUI(p);
  
  // Render letter if present
  if (gameState.currentLetter && !gameState.currentLetter.dismissed) {
    renderLetter(p);
  }
}

function renderRoom(p) {
  // Wall
  p.fill(60, 50, 70);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT - 100);
  
  // Floor
  p.fill(80, 70, 60);
  p.rect(0, CANVAS_HEIGHT - 100, CANVAS_WIDTH, 100);
  
  // Wall pattern
  p.stroke(50, 40, 60);
  p.strokeWeight(1);
  for (let y = 20; y < CANVAS_HEIGHT - 100; y += 40) {
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Floor boards
  p.stroke(70, 60, 50);
  for (let x = 0; x < CANVAS_WIDTH; x += 60) {
    p.line(x, CANVAS_HEIGHT - 100, x, CANVAS_HEIGHT);
  }
}

function renderFireplace(p) {
  p.push();
  
  // Fireplace frame
  p.fill(40, 30, 20);
  p.stroke(20, 15, 10);
  p.strokeWeight(2);
  p.rect(FIREPLACE_X - 10, FIREPLACE_Y - 10, FIREPLACE_WIDTH + 20, FIREPLACE_HEIGHT + 20);
  
  // Inner fireplace
  p.fill(20, 15, 10);
  p.noStroke();
  p.rect(FIREPLACE_X, FIREPLACE_Y, FIREPLACE_WIDTH, FIREPLACE_HEIGHT);
  
  // Fire glow if items burning
  if (gameState.burningItems.length > 0) {
    const glowIntensity = 30 + gameState.burningItems.length * 10;
    p.fill(255, 100, 0, glowIntensity);
    p.rect(FIREPLACE_X, FIREPLACE_Y, FIREPLACE_WIDTH, FIREPLACE_HEIGHT);
  }
  
  // Mantle
  p.fill(60, 45, 30);
  p.stroke(40, 30, 20);
  p.strokeWeight(2);
  p.rect(FIREPLACE_X - 20, FIREPLACE_Y - 30, FIREPLACE_WIDTH + 40, 20);
  
  p.pop();
}

function renderCatalog(p) {
  p.push();
  
  const catalog = gameState.catalogs[gameState.currentCatalogIndex];
  
  // Catalog background
  p.fill(50, 45, 40);
  p.stroke(30, 25, 20);
  p.strokeWeight(3);
  p.rect(CATALOG_X, CATALOG_Y, CATALOG_WIDTH, CATALOG_HEIGHT);
  
  // Catalog title
  p.fill(255, 200, 100);
  p.noStroke();
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(16);
  p.text(`Catalog ${gameState.currentCatalogIndex + 1}`, CATALOG_X + CATALOG_WIDTH / 2, CATALOG_Y + 10);
  
  // Catalog navigation hint
  p.fill(180);
  p.textSize(9);
  p.text("← →: Switch Catalog", CATALOG_X + CATALOG_WIDTH / 2, CATALOG_Y + 30);
  
  // Items list
  const itemStartY = CATALOG_Y + 55;
  const itemHeight = 35;
  
  catalog.items.forEach((template, index) => {
    const itemY = itemStartY + index * itemHeight;
    const isSelected = index === gameState.selectedItemIndex;
    
    // Item background
    p.fill(isSelected ? 80 : 60, isSelected ? 70 : 55, isSelected ? 50 : 40);
    p.noStroke();
    p.rect(CATALOG_X + 10, itemY, CATALOG_WIDTH - 20, itemHeight - 5);
    
    // Item color indicator
    p.fill(...template.color);
    p.rect(CATALOG_X + 15, itemY + 5, 20, 20);
    
    // Item name
    p.fill(255);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(10);
    p.text(template.name, CATALOG_X + 40, itemY + 5);
    
    // Item cost
    const canAfford = gameState.coins >= template.cost;
    p.fill(canAfford ? [100, 255, 100] : [255, 100, 100]);
    p.textSize(9);
    p.text(`${template.cost} coins`, CATALOG_X + 40, itemY + 18);
  });
  
  // Instructions
  p.fill(200, 200, 150);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.textSize(9);
  p.text("↑↓: Select  SPACE: Buy  Z: Close", CATALOG_X + CATALOG_WIDTH / 2, CATALOG_Y + CATALOG_HEIGHT - 10);
  
  p.pop();
}

function renderUI(p) {
  p.push();
  
  // Coins
  p.fill(255, 215, 0);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text(`💰 Coins: ${gameState.coins}`, 10, 10);
  
  // Stamps
  p.fill(255, 100, 100);
  p.text(`⭐ Stamps: ${gameState.stamps}`, 10, 30);
  
  // Score
  p.fill(150, 200, 255);
  p.text(`Score: ${gameState.score}`, 10, 50);
  
  // Combos discovered
  p.fill(200, 150, 255);
  p.textSize(12);
  p.text(`Combos: ${gameState.combosDiscovered.length}/${16}`, 10, 75);
  
  // Hint for catalog
  if (!gameState.catalogOpen) {
    p.fill(255, 255, 150);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(11);
    p.text("Press Z to open catalog", CANVAS_WIDTH - 10, 10);
  }
  
  p.pop();
}

function renderLetter(p) {
  p.push();
  
  const letter = gameState.currentLetter;
  const letterW = 400;
  const letterH = 200;
  const letterX = (CANVAS_WIDTH - letterW) / 2;
  const letterY = (CANVAS_HEIGHT - letterH) / 2;
  
  // Semi-transparent background
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Letter background
  p.fill(240, 230, 210);
  p.stroke(100, 80, 60);
  p.strokeWeight(2);
  p.rect(letterX, letterY, letterW, letterH);
  
  // Letter content
  p.fill(40, 30, 20);
  p.noStroke();
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(12);
  
  // Sender
  p.textAlign(p.RIGHT, p.TOP);
  p.fill(100, 80, 60);
  p.text(`From: ${letter.sender}`, letterX + letterW - 20, letterY + 20);
  
  // Message
  p.fill(40, 30, 20);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(11);
  const lines = letter.message.match(/.{1,45}/g) || [letter.message];
  let lineY = letterY + 60;
  lines.forEach(line => {
    p.text(line, letterX + 20, lineY);
    lineY += 18;
  });
  
  // Dismiss instruction
  p.fill(150, 100, 50);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.textSize(10);
  p.text("Press any key to continue", letterX + letterW / 2, letterY + letterH - 20);
  
  p.pop();
}

function renderPausedOverlay(p) {
  p.push();
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  p.pop();
}

function renderGameOverScreen(p) {
  p.background(20, 15, 25);
  
  p.push();
  
  // Title
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("CONGRATULATIONS!", CANVAS_WIDTH / 2, 80);
  
  // Message
  p.fill(255);
  p.textSize(18);
  p.text("You discovered all the combos!", CANVAS_WIDTH / 2, 140);
  
  // Stats
  p.fill(200, 200, 255);
  p.textSize(16);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 200);
  p.text(`Stamps Collected: ${gameState.stamps}`, CANVAS_WIDTH / 2, 230);
  p.text(`Combos Discovered: ${gameState.combosDiscovered.length}`, CANVAS_WIDTH / 2, 260);
  
  // Restart prompt
  p.fill(255, 255, 0);
  p.textSize(20);
  const flash = Math.sin(p.frameCount * 0.1) * 0.5 + 0.5;
  p.fill(255, 255, 0, 150 + flash * 105);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 340);
  
  p.pop();
}