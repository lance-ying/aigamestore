// ui.js - UI rendering

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, SEASONS } from './globals.js';
import { getAvailableCrops } from './globals.js';
import { handleShopInteraction } from './input.js';

export function renderStartScreen(p) {
  p.background(135, 206, 235); // Sky blue
  
  // Draw farm background
  drawFarmBackground(p);
  
  // Title
  p.fill(255);
  p.stroke(50, 100, 50);
  p.strokeWeight(4);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('HARVEST HAVEN', CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.noStroke();
  p.fill(240, 240, 200);
  p.textSize(20);
  p.text('A Farming Adventure', CANVAS_WIDTH / 2, 130);
  
  // Instructions box
  p.fill(50, 100, 50, 200);
  p.stroke(100, 150, 100);
  p.strokeWeight(2);
  p.rect(CANVAS_WIDTH / 2 - 200, 170, 400, 180, 10);
  
  p.noStroke();
  p.fill(255);
  p.textSize(16);
  p.textAlign(p.LEFT, p.TOP);
  
  const instructions = [
    'Arrow Keys - Move around farm',
    'Space - Use tool (till/water/harvest)',
    'Z - Switch tools',
    'Shift - Open/Close shop',
    '',
    'Goal: Reach Farming Level 10!'
  ];
  
  instructions.forEach((text, i) => {
    p.text(text, CANVAS_WIDTH / 2 - 180, 185 + i * 25);
  });
  
  // Start prompt
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  const alpha = Math.abs(Math.sin(gameState.frameCount * 0.05)) * 255;
  p.fill(255, 255, 100, alpha);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 370);
}

export function renderPlayingScreen(p) {
  // Sky background
  const skyColor = getSkyColor();
  p.background(skyColor[0], skyColor[1], skyColor[2]);
  
  // Render farm
  renderFarm(p);
  
  // Render UI
  renderHUD(p);
  
  // Render shop if open
  if (gameState.showShop) {
    renderShop(p);
  }
}

export function renderPausedScreen(p) {
  // Dim overlay
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Paused text
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  
  p.textSize(20);
  p.text('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

export function renderGameOverScreen(p) {
  // Render game in background
  renderPlayingScreen(p);
  
  // Overlay
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  // Title
  p.fill(isWin ? 100 : 255, isWin ? 255 : 100, isWin ? 100 : 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? 'MASTER FARMER!' : 'GAME OVER', CANVAS_WIDTH / 2, 120);
  
  // Stats box
  p.fill(50, 50, 50, 230);
  p.stroke(150, 150, 150);
  p.strokeWeight(2);
  p.rect(CANVAS_WIDTH / 2 - 150, 170, 300, 140, 10);
  
  p.noStroke();
  p.fill(255);
  p.textSize(20);
  p.textAlign(p.CENTER, p.CENTER);
  
  p.text(`Farming Level: ${gameState.farmingLevel}`, CANVAS_WIDTH / 2, 200);
  p.text(`Money Earned: $${gameState.money}`, CANVAS_WIDTH / 2, 230);
  p.text(`Days Farmed: ${gameState.currentDay}`, CANVAS_WIDTH / 2, 260);
  p.text(`Season: ${SEASONS[gameState.currentSeason]}`, CANVAS_WIDTH / 2, 290);
  
  // Restart instruction
  p.textSize(24);
  p.fill(255, 255, 100);
  p.text('Press R to Restart', CANVAS_WIDTH / 2, 350);
}

function renderFarm(p) {
  // Render all farm tiles
  gameState.farmTiles.forEach(tile => {
    tile.render(p);
  });
  
  // Render player
  if (gameState.player) {
    gameState.player.render(p);
  }
}

function renderHUD(p) {
  // HUD background
  p.fill(40, 60, 40, 220);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 50);
  p.rect(0, CANVAS_HEIGHT - 40, CANVAS_WIDTH, 40);
  
  // Top bar - Stats
  p.fill(255, 220, 100);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(16);
  p.text(`$${gameState.money}`, 10, 15);
  
  p.fill(255);
  p.text(`Lvl ${gameState.farmingLevel}`, 10, 35);
  
  // Experience bar
  const expBarWidth = 120;
  const expBarHeight = 10;
  const expBarX = 70;
  const expBarY = 30;
  
  const currentLevelExp = gameState.expThresholds[gameState.farmingLevel];
  const nextLevelExp = gameState.expThresholds[Math.min(gameState.farmingLevel + 1, 9)];
  const expProgress = (gameState.farmingExp - currentLevelExp) / (nextLevelExp - currentLevelExp);
  
  p.fill(50, 50, 50);
  p.rect(expBarX, expBarY, expBarWidth, expBarHeight, 5);
  p.fill(100, 255, 100);
  p.rect(expBarX, expBarY, expBarWidth * Math.min(expProgress, 1), expBarHeight, 5);
  
  // Energy bar
  const energyBarWidth = 150;
  const energyBarHeight = 15;
  const energyBarX = 220;
  const energyBarY = 20;
  
  p.fill(80, 80, 80);
  p.rect(energyBarX, energyBarY, energyBarWidth, energyBarHeight, 7);
  
  const energyRatio = gameState.energy / gameState.maxEnergy;
  const energyColor = energyRatio > 0.5 ? [100, 255, 100] : 
                      energyRatio > 0.25 ? [255, 200, 100] : [255, 100, 100];
  p.fill(...energyColor);
  p.rect(energyBarX, energyBarY, energyBarWidth * energyRatio, energyBarHeight, 7);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(12);
  p.text(`Energy: ${Math.floor(gameState.energy)}`, energyBarX + energyBarWidth / 2, energyBarY + energyBarHeight / 2);
  
  // Day and season
  p.fill(255, 255, 200);
  p.textAlign(p.RIGHT, p.CENTER);
  p.textSize(16);
  p.text(`${SEASONS[gameState.currentSeason]} Day ${gameState.currentDay}`, CANVAS_WIDTH - 10, 25);
  
  // Bottom bar - Tool
  if (gameState.player) {
    const toolNames = {
      hoe: 'Hoe',
      wateringCan: 'Watering Can',
      scythe: 'Scythe'
    };
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(18);
    p.text(`Tool: ${toolNames[gameState.player.currentTool]}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20);
    
    p.textSize(12);
    p.text('(Press Z to switch)', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 5);
  }
  
  // Shop hint
  p.fill(255, 255, 100);
  p.textAlign(p.RIGHT, p.CENTER);
  p.textSize(14);
  p.text('Press SHIFT for Shop', CANVAS_WIDTH - 10, CANVAS_HEIGHT - 20);
}

function renderShop(p) {
  // Shop overlay
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Shop window
  const shopWidth = 400;
  const shopHeight = 320;
  const shopX = (CANVAS_WIDTH - shopWidth) / 2;
  const shopY = (CANVAS_HEIGHT - shopHeight) / 2;
  
  p.fill(80, 60, 40);
  p.stroke(150, 120, 90);
  p.strokeWeight(3);
  p.rect(shopX, shopY, shopWidth, shopHeight, 10);
  
  // Title
  p.fill(255, 220, 150);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(28);
  p.text('SEED SHOP', CANVAS_WIDTH / 2, shopY + 30);
  
  // Available crops
  const availableCrops = getAvailableCrops();
  
  p.textSize(16);
  p.textAlign(p.LEFT, p.TOP);
  
  availableCrops.forEach((crop, i) => {
    const itemY = shopY + 70 + i * 45;
    
    // Item background
    p.fill(100, 80, 60);
    p.rect(shopX + 20, itemY, shopWidth - 40, 40, 5);
    
    // Crop info
    p.fill(255);
    p.text(crop.name, shopX + 35, itemY + 10);
    p.textSize(12);
    p.fill(200, 200, 200);
    p.text(`${crop.growthTime} days | $${crop.price}`, shopX + 35, itemY + 25);
    
    // Buy button
    const canAfford = gameState.money >= crop.price;
    p.fill(canAfford ? 100 : 60, canAfford ? 180 : 80, canAfford ? 100 : 60);
    p.rect(shopX + shopWidth - 100, itemY + 5, 70, 30, 5);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.text('Buy', shopX + shopWidth - 65, itemY + 20);
    
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(16);
  });
  
  // Instructions
  p.fill(255, 255, 200);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  p.text('Seeds auto-plant on first available tilled soil', CANVAS_WIDTH / 2, shopY + shopHeight - 30);
  p.text('Press SHIFT to close', CANVAS_WIDTH / 2, shopY + shopHeight - 10);
  
  // Handle shop interactions
  if (p.mouseIsPressed) {
    handleShopClick(p, shopX, shopY, availableCrops);
  }
}

function handleShopClick(p, shopX, shopY, availableCrops) {
  const mouseX = p.mouseX;
  const mouseY = p.mouseY;
  
  availableCrops.forEach((crop, i) => {
    const itemY = shopY + 70 + i * 45;
    const buttonX = shopX + 330;
    const buttonY = itemY + 5;
    
    if (mouseX > buttonX && mouseX < buttonX + 70 &&
        mouseY > buttonY && mouseY < buttonY + 30) {
      handleShopInteraction(crop.type);
    }
  });
}

function drawFarmBackground(p) {
  // Simple grass background
  p.fill(60, 120, 40);
  p.noStroke();
  p.rect(0, 100, CANVAS_WIDTH, CANVAS_HEIGHT - 100);
  
  // Some decorative elements
  for (let i = 0; i < 10; i++) {
    p.fill(50, 110, 35);
    const x = i * 70 + 30;
    const y = 150 + Math.sin(i) * 20;
    p.circle(x, y, 20);
  }
}

function getSkyColor() {
  // Simple sky color based on time of day
  const time = gameState.timeOfDay;
  
  if (time >= 6 && time < 12) {
    // Morning - light blue
    return [135, 206, 235];
  } else if (time >= 12 && time < 18) {
    // Afternoon - bright blue
    return [100, 180, 255];
  } else if (time >= 18 && time < 20) {
    // Evening - orange/pink
    return [255, 160, 120];
  } else {
    // Night - dark blue
    return [25, 25, 80];
  }
}