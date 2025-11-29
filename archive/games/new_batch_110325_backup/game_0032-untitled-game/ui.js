// ui.js - UI rendering functions

import { gameState, GAME_PHASES, TOWER_TYPES, TOWER_TYPE_ARRAY, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function drawStartScreen(p) {
  p.background(20, 30, 50);

  // Title
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("KINGDOM DEFENSE", CANVAS_WIDTH / 2, 80);

  // Instructions
  p.fill(200, 200, 220);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  
  const instructions = [
    "OBJECTIVE:",
    "Defend your kingdom from waves of enemies!",
    "Prevent enemies from reaching your base.",
    "",
    "HOW TO PLAY:",
    "• Arrow Keys ←→: Select tower type",
    "• Number Keys 1-4: Quick select tower",
    "• Space: Place tower on highlighted plot",
    "• Click plots to select towers",
    "• Z: Upgrade selected tower",
    "• Shift: Move hero / Use when near plot",
    "• Space (on hero): Activate ability",
    "",
    "TOWERS:",
    "Archer (70g) - Balanced range & damage",
    "Mage (120g) - Area damage, slower",
    "Cannon (160g) - High damage, slow fire",
    "Barracks (100g) - Spawns soldiers",
  ];

  let y = 140;
  for (let line of instructions) {
    if (line.startsWith("•")) {
      p.fill(180, 200, 255);
    } else if (line === "") {
      y += 5;
      continue;
    } else {
      p.fill(255, 240, 150);
    }
    p.text(line, 80, y);
    y += 16;
  }

  // Start prompt
  p.fill(100, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  const pulseAlpha = 200 + Math.sin(p.frameCount * 0.1) * 55;
  p.fill(100, 255, 100, pulseAlpha);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}

export function drawGameOverScreen(p) {
  p.push();
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  p.fill(...(isWin ? [100, 255, 100] : [255, 100, 100]));
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(42);
  p.text(isWin ? "VICTORY!" : "DEFEATED", CANVAS_WIDTH / 2, 140);

  p.fill(255);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 200);
  p.text(`Waves Completed: ${gameState.currentWave}/${gameState.maxWaves}`, CANVAS_WIDTH / 2, 240);

  p.fill(200, 200, 255);
  p.textSize(18);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 60);

  p.pop();
}

export function drawUI(p) {
  // Top bar background
  p.push();
  p.fill(20, 20, 30, 220);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 35);

  // Health
  p.fill(255, 100, 100);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(14);
  p.text(`❤ ${gameState.health}/${gameState.maxHealth}`, 10, 18);

  // Gold
  p.fill(255, 215, 0);
  p.text(`⚜ ${gameState.gold}`, 120, 18);

  // Score
  p.fill(150, 200, 255);
  p.text(`Score: ${gameState.score}`, 240, 18);

  // Wave
  p.fill(200, 150, 255);
  p.textAlign(p.RIGHT, p.CENTER);
  p.text(`Wave ${gameState.currentWave}/${gameState.maxWaves}`, CANVAS_WIDTH - 10, 18);

  // Paused indicator
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.fill(255, 255, 100);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(12);
    p.text("PAUSED", CANVAS_WIDTH - 10, 40);
  }

  p.pop();

  // Tower selection panel
  drawTowerPanel(p);

  // Hero ability cooldown
  if (gameState.heroes.length > 0) {
    drawHeroAbility(p);
  }

  // Selected tower info
  if (gameState.selectedTower) {
    drawSelectedTowerInfo(p);
  }
}

export function drawTowerPanel(p) {
  const panelX = 10;
  const panelY = CANVAS_HEIGHT - 80;
  const slotSize = 50;
  const gap = 10;

  p.push();
  
  for (let i = 0; i < TOWER_TYPE_ARRAY.length; i++) {
    const towerType = TOWER_TYPE_ARRAY[i];
    const towerData = TOWER_TYPES[towerType];
    const x = panelX + i * (slotSize + gap);
    const y = panelY;

    // Slot background
    const isSelected = gameState.selectedTowerType === i;
    const canAfford = gameState.gold >= towerData.cost;
    
    p.fill(...(isSelected ? [80, 120, 200, 200] : [40, 40, 50, 200]));
    p.stroke(...(canAfford ? [255, 255, 255] : [100, 100, 100]));
    p.strokeWeight(isSelected ? 3 : 2);
    p.rect(x, y, slotSize, slotSize);

    // Tower icon
    p.fill(...towerData.color);
    p.noStroke();
    p.rect(x + 10, y + 10, 30, 20);

    // Cost
    p.fill(...(canAfford ? [255, 215, 0] : [150, 150, 150]));
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.text(towerData.cost, x + slotSize / 2, y + slotSize - 12);

    // Number key hint
    p.fill(200);
    p.textSize(10);
    p.text(i + 1, x + slotSize / 2, y - 8);
  }

  p.pop();
}

export function drawHeroAbility(p) {
  const x = CANVAS_WIDTH - 70;
  const y = CANVAS_HEIGHT - 70;
  const size = 50;

  p.push();

  const cooldownPercent = 1 - (gameState.heroAbilityCooldown / gameState.heroAbilityMaxCooldown);
  const ready = gameState.heroAbilityCooldown === 0;

  // Background
  p.fill(...(ready ? [100, 200, 100, 200] : [60, 60, 70, 200]));
  p.stroke(255);
  p.strokeWeight(2);
  p.rect(x, y, size, size);

  // Icon
  p.fill(255, 255, 100);
  p.noStroke();
  p.circle(x + size / 2, y + size / 2, 20);

  // Cooldown overlay
  if (!ready) {
    p.fill(20, 20, 30, 180);
    const h = size * (1 - cooldownPercent);
    p.rect(x, y, size, h);

    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text(Math.ceil(gameState.heroAbilityCooldown / 60), x + size / 2, y + size / 2);
  }

  // Label
  p.fill(255);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(10);
  p.text("SPACE", x + size / 2, y + size + 4);

  p.pop();
}

export function drawSelectedTowerInfo(p) {
  const tower = gameState.selectedTower;
  if (!tower) return;

  const x = CANVAS_WIDTH / 2;
  const y = 60;

  p.push();
  p.fill(20, 20, 30, 230);
  p.noStroke();
  p.rect(x - 100, y, 200, 60);

  p.fill(255);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(14);
  p.text(`${tower.typeData.name} Tower (Lv ${tower.level})`, x, y + 8);

  p.textSize(11);
  p.fill(200);
  p.text(`Damage: ${tower.damage} | Range: ${Math.floor(tower.range)}`, x, y + 28);

  const upgradeCost = tower.getUpgradeCost();
  if (upgradeCost !== null) {
    const canAfford = gameState.gold >= upgradeCost;
    p.fill(...(canAfford ? [100, 255, 100] : [150, 150, 150]));
    p.text(`Press Z to Upgrade (${upgradeCost}g)`, x, y + 44);
  } else {
    p.fill(255, 215, 0);
    p.text("Max Level", x, y + 44);
  }

  p.pop();
}