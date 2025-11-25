// ui.js - UI rendering

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, MAX_ENERGY, DAY_LENGTH, EVENING_START, NIGHT_START, CROP_TYPES } from './globals.js';

export function renderStartScreen(p) {
  // Sky gradient
  for (let i = 0; i < CANVAS_HEIGHT; i++) {
    const c = p.lerpColor(
      p.color(135, 206, 235),
      p.color(255, 218, 185),
      i / CANVAS_HEIGHT
    );
    p.stroke(c);
    p.line(0, i, CANVAS_WIDTH, i);
  }
  
  // Title
  p.fill(80, 50, 30);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('HARVEST HAVEN', CANVAS_WIDTH / 2 + 2, CANVAS_HEIGHT / 2 - 98);
  p.fill(255, 230, 150);
  p.textSize(48);
  p.text('HARVEST HAVEN', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 100);
  
  // Subtitle
  p.fill(100, 70, 50);
  p.textSize(18);
  p.text('A Farming Adventure', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
  
  // Instructions box
  p.fill(255, 255, 240, 220);
  p.stroke(150, 120, 80);
  p.strokeWeight(3);
  p.rect(CANVAS_WIDTH / 2 - 180, CANVAS_HEIGHT / 2 - 20, 360, 140, 10);
  
  // Instructions
  p.fill(60, 40, 20);
  p.noStroke();
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    'Build your farm and grow crops!',
    '',
    'Arrow Keys - Move around the farm',
    'SPACE - Till soil to prepare for planting',
    'Z - Plant seeds (costs gold)',
    'X - Water crops (speeds up growth)',
    'C - Harvest mature crops (earn gold & XP)',
    'SHIFT - Open shop to buy seeds'
  ];
  
  let yOffset = CANVAS_HEIGHT / 2 - 10;
  instructions.forEach((line, i) => {
    p.text(line, CANVAS_WIDTH / 2 - 170, yOffset + i * 16);
  });
  
  // Press Enter prompt
  const pulseAlpha = 150 + Math.sin(p.frameCount * 0.1) * 100;
  p.fill(80, 160, 80, pulseAlpha);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  
  // Controls reminder
  p.fill(100, 100, 100);
  p.textSize(12);
  p.text('ESC - Pause | R - Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 15);
}

export function renderUI(p) {
  // Top bar background
  p.fill(40, 30, 20, 220);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 60);
  
  // Gold
  p.fill(255, 215, 0);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text(`💰 ${gameState.gold}`, 10, 10);
  
  // Energy bar
  const energyBarWidth = 150;
  const energyBarHeight = 20;
  const energyBarX = 10;
  const energyBarY = 35;
  const energyRatio = gameState.energy / MAX_ENERGY;
  
  // Background
  p.fill(60, 40, 20);
  p.rect(energyBarX, energyBarY, energyBarWidth, energyBarHeight, 5);
  
  // Energy fill
  const energyColor = energyRatio > 0.5 ? [100, 200, 100] : energyRatio > 0.25 ? [255, 200, 0] : [255, 100, 100];
  p.fill(...energyColor);
  p.rect(energyBarX, energyBarY, energyBarWidth * energyRatio, energyBarHeight, 5);
  
  // Border
  p.noFill();
  p.stroke(255);
  p.strokeWeight(2);
  p.rect(energyBarX, energyBarY, energyBarWidth, energyBarHeight, 5);
  
  // Energy text
  p.fill(255);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(12);
  p.text(`Energy: ${Math.floor(gameState.energy)}`, energyBarX + energyBarWidth / 2, energyBarY + energyBarHeight / 2);
  
  // Level and XP
  p.fill(255, 200, 100);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text(`Level ${gameState.farmingLevel}`, 180, 10);
  
  const xpBarWidth = 100;
  const xpBarHeight = 8;
  const xpBarX = 180;
  const xpBarY = 30;
  const xpRatio = gameState.farmingXP / gameState.xpToNextLevel;
  
  p.fill(60, 40, 20);
  p.noStroke();
  p.rect(xpBarX, xpBarY, xpBarWidth, xpBarHeight, 3);
  p.fill(100, 150, 255);
  p.rect(xpBarX, xpBarY, xpBarWidth * xpRatio, xpBarHeight, 3);
  
  p.fill(255);
  p.textSize(10);
  p.text(`${gameState.farmingXP}/${gameState.xpToNextLevel} XP`, xpBarX, xpBarY + 10);
  
  // Day and time
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.fill(255, 230, 150);
  p.text(`Day ${gameState.dayCount}`, CANVAS_WIDTH - 10, 10);
  
  // Time of day indicator
  const timeBarWidth = 120;
  const timeBarHeight = 15;
  const timeBarX = CANVAS_WIDTH - timeBarWidth - 10;
  const timeBarY = 35;
  const timeRatio = gameState.timeOfDay / DAY_LENGTH;
  
  p.fill(40, 40, 60);
  p.noStroke();
  p.rect(timeBarX, timeBarY, timeBarWidth, timeBarHeight, 5);
  
  // Time progress (color changes based on time of day)
  let timeColor;
  if (gameState.timeOfDay < EVENING_START) {
    timeColor = [255, 255, 150]; // Day
  } else if (gameState.timeOfDay < NIGHT_START) {
    timeColor = [255, 180, 100]; // Evening
  } else {
    timeColor = [100, 100, 150]; // Night
  }
  
  p.fill(...timeColor);
  p.rect(timeBarX, timeBarY, timeBarWidth * timeRatio, timeBarHeight, 5);
  
  p.noFill();
  p.stroke(255);
  p.strokeWeight(1);
  p.rect(timeBarX, timeBarY, timeBarWidth, timeBarHeight, 5);
  
  // Score (bottom right)
  p.fill(255, 255, 255);
  p.noStroke();
  p.textAlign(p.RIGHT, p.BOTTOM);
  p.textSize(14);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, CANVAS_HEIGHT - 10);
  
  // Message display
  if (gameState.messageTimer > 0) {
    const messageAlpha = Math.min(255, gameState.messageTimer * 4);
    p.fill(255, 255, 255, messageAlpha);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(18);
    p.text(gameState.message, CANVAS_WIDTH / 2, 80);
  }
  
  // Shop overlay
  if (gameState.shopOpen) {
    renderShop(p);
  }
  
  // Sleep prompt when at farmhouse at night
  if (gameState.farmhouse && gameState.farmhouse.isPlayerInside() && gameState.timeOfDay > EVENING_START) {
    const promptAlpha = 150 + Math.sin(p.frameCount * 0.15) * 100;
    p.fill(255, 255, 255, promptAlpha);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16);
    p.text('Stand still to sleep...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
  }
}

function renderShop(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Shop window
  p.fill(240, 220, 180);
  p.stroke(120, 80, 60);
  p.strokeWeight(4);
  p.rect(100, 80, 400, 280, 10);
  
  // Title
  p.fill(80, 50, 30);
  p.noStroke();
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(24);
  p.text('SEED SHOP', CANVAS_WIDTH / 2, 95);
  
  // Close instruction
  p.fill(100, 70, 50);
  p.textSize(14);
  p.text('Press SHIFT to close', CANVAS_WIDTH / 2, 335);
  
  // Crop selection
  const cropTypes = Object.keys(CROP_TYPES);
  const startY = 140;
  const spacing = 45;
  
  cropTypes.forEach((cropType, index) => {
    const cropData = CROP_TYPES[cropType];
    const yPos = startY + index * spacing;
    const isSelected = gameState.selectedCropType === cropType;
    const isUnlocked = gameState.farmingLevel >= cropData.unlockLevel;
    
    // Selection background
    if (isSelected) {
      p.fill(200, 255, 200);
      p.noStroke();
      p.rect(120, yPos - 5, 360, 35, 5);
    }
    
    // Crop icon
    p.fill(...cropData.color);
    p.stroke(cropData.color[0] * 0.7, cropData.color[1] * 0.7, cropData.color[2] * 0.7);
    p.strokeWeight(2);
    p.circle(140, yPos + 10, 20);
    
    // Crop info
    p.fill(isUnlocked ? 60 : 150);
    p.noStroke();
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(16);
    p.text(cropData.name, 170, yPos + 5);
    
    p.textSize(12);
    if (isUnlocked) {
      p.text(`Cost: ${cropData.seedCost} gold | Sell: ${cropData.sellPrice} gold`, 170, yPos + 20);
    } else {
      p.text(`Unlock at Level ${cropData.unlockLevel}`, 170, yPos + 20);
    }
    
    // Buy button (for unlocked crops)
    if (isUnlocked) {
      const buttonX = 420;
      const buttonY = yPos;
      const buttonW = 50;
      const buttonH = 25;
      
      const canBuy = gameState.gold >= cropData.seedCost;
      p.fill(canBuy ? 100 : 150, canBuy ? 180 : 100, canBuy ? 100 : 100);
      p.stroke(60, 100, 60);
      p.strokeWeight(2);
      p.rect(buttonX, buttonY, buttonW, buttonH, 5);
      
      p.fill(255);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(12);
      p.text('SELECT', buttonX + buttonW / 2, buttonY + buttonH / 2);
      
      // Check if clicked (mouse simulation with number keys)
      if (p.keyIsPressed && p.key === String(index + 1)) {
        gameState.selectedCropType = cropType;
      }
    }
  });
  
  // Selection instructions
  p.fill(100, 70, 50);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(12);
  p.text('Use arrow keys or number keys (1-4) to select seeds', CANVAS_WIDTH / 2, 315);
}

export function renderPausedOverlay(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Paused text
  p.fill(255, 255, 150);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  
  // Stats display
  p.fill(255);
  p.textSize(18);
  p.text(`Day ${gameState.dayCount} | Level ${gameState.farmingLevel}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  p.text(`Gold: ${gameState.gold} | Crops Harvested: ${gameState.totalCropsHarvested}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
  
  p.textSize(16);
  p.text('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
  p.textSize(14);
  p.text('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 95);
}

export function renderGameOver(p) {
  // Background overlay
  p.fill(0, 0, 0, 220);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Game over text
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  p.fill(isWin ? 255 : 255, isWin ? 255 : 200, isWin ? 150 : 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? 'FARM MASTERED!' : 'DAY COMPLETE', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
  
  // Stats
  p.fill(255);
  p.textSize(20);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  p.textSize(16);
  p.text(`Gold Earned: ${gameState.gold}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
  p.text(`Crops Harvested: ${gameState.totalCropsHarvested}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 35);
  p.text(`Farming Level: ${gameState.farmingLevel}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
  
  // Restart instruction
  const pulseAlpha = 150 + Math.sin(p.frameCount * 0.1) * 100;
  p.fill(255, 255, 255, pulseAlpha);
  p.textSize(20);
  p.text('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
}