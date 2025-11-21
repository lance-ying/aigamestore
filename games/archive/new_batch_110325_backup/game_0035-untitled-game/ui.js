// ui.js - User interface rendering

import { gameState, GAME_PHASES, TOWER_TYPES } from './globals.js';

export function drawUI(p) {
  // Top bar with game stats
  p.fill(40, 40, 40, 200);
  p.noStroke();
  p.rect(0, 0, 600, 35);
  
  // Gold
  p.fill(255, 215, 0);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(14);
  p.text(`💰 ${gameState.gold}`, 10, 18);
  
  // Lives
  p.fill(255, 100, 100);
  p.text(`❤ ${gameState.lives}`, 120, 18);
  
  // Wave
  p.fill(150, 200, 255);
  p.text(`Wave ${gameState.wave + 1}/${gameState.maxWaves}`, 220, 18);
  
  // Score
  p.fill(200, 200, 200);
  p.text(`Score: ${gameState.score}`, 380, 18);
  
  // Paused indicator
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.fill(255);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(12);
    p.text("PAUSED", 590, 5);
  }
}

export function drawCursor(p) {
  const slot = gameState.towerSlots[gameState.cursorY * 6 + gameState.cursorX];
  if (!slot) return;
  
  p.noFill();
  p.stroke(255, 255, 100);
  p.strokeWeight(3);
  p.rect(slot.x - 18, slot.y - 18, 36, 36, 4);
}

export function drawTowerMenu(p) {
  if (!gameState.showTowerMenu) return;
  
  const menuX = 200;
  const menuY = 150;
  const menuW = 200;
  const menuH = 180;
  
  // Background
  p.fill(40, 40, 50, 240);
  p.stroke(100, 100, 120);
  p.strokeWeight(2);
  p.rect(menuX, menuY, menuW, menuH, 8);
  
  // Title
  p.fill(255);
  p.noStroke();
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(14);
  p.text("Select Tower", menuX + menuW / 2, menuY + 10);
  
  // Tower options
  const types = Object.keys(TOWER_TYPES);
  let yPos = menuY + 40;
  
  types.forEach((type, index) => {
    const config = TOWER_TYPES[type];
    const canAfford = gameState.gold >= config.cost;
    
    // Button background
    p.fill(...(canAfford ? [60, 80, 60] : [60, 60, 60]));
    p.stroke(100);
    p.strokeWeight(1);
    p.rect(menuX + 10, yPos, menuW - 20, 28, 4);
    
    // Tower color indicator
    p.fill(...config.color);
    p.noStroke();
    p.circle(menuX + 25, yPos + 14, 12);
    
    // Tower name and cost
    p.fill(...(canAfford ? [255, 255, 255] : [150, 150, 150]));
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(11);
    p.text(`${config.name}`, menuX + 40, yPos + 14);
    
    p.fill(...(canAfford ? [255, 215, 0] : [150, 120, 0]));
    p.textAlign(p.RIGHT, p.CENTER);
    p.text(`${config.cost}g`, menuX + menuW - 15, yPos + 14);
    
    yPos += 33;
  });
  
  // Instructions
  p.fill(200, 200, 200);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.textSize(10);
  p.text("Arrow Keys to select | Space to confirm | Z to cancel", menuX + menuW / 2, menuY + menuH - 8);
}

export function drawTowerInfo(p) {
  if (!gameState.selectedTower) return;
  
  const tower = gameState.selectedTower;
  const infoX = 420;
  const infoY = 80;
  const infoW = 160;
  const infoH = 120;
  
  // Background
  p.fill(40, 40, 50, 240);
  p.stroke(100, 100, 120);
  p.strokeWeight(2);
  p.rect(infoX, infoY, infoW, infoH, 8);
  
  // Tower name
  p.fill(255);
  p.noStroke();
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(12);
  p.text(`${tower.config.name} (Lv${tower.level})`, infoX + infoW / 2, infoY + 8);
  
  // Stats
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(10);
  p.fill(200);
  let yPos = infoY + 28;
  p.text(`Damage: ${tower.config.damage}`, infoX + 10, yPos);
  yPos += 15;
  p.text(`Range: ${tower.config.range}`, infoX + 10, yPos);
  yPos += 15;
  p.text(`Fire Rate: ${Math.floor(60 / tower.config.fireRate)}/s`, infoX + 10, yPos);
  yPos += 15;
  p.text(`Kills: ${tower.kills}`, infoX + 10, yPos);
  
  // Actions
  yPos += 20;
  if (tower.level < 3) {
    const upgradeCost = tower.getUpgradeCost();
    const canUpgrade = gameState.gold >= upgradeCost;
    p.fill(...(canUpgrade ? [100, 200, 100] : [100, 100, 100]));
    p.text(`[Shift] Upgrade (${upgradeCost}g)`, infoX + 10, yPos);
  }
  yPos += 15;
  p.fill(200, 100, 100);
  p.text(`[Z] Sell (${tower.getSellValue()}g)`, infoX + 10, yPos);
}

export function drawStartScreen(p) {
  p.background(20, 30, 40);
  
  // Title
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("KINGDOM DEFENSE", 300, 80);
  
  // Description
  p.fill(200);
  p.textSize(14);
  p.text("Defend your kingdom from waves of enemies!", 300, 130);
  p.text("Place towers strategically to stop them from reaching the portal.", 300, 150);
  
  // Instructions
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.fill(255);
  let yPos = 190;
  p.text("HOW TO PLAY:", 120, yPos);
  
  yPos += 25;
  p.fill(200);
  p.text("• Arrow Keys - Navigate tower slots", 130, yPos);
  yPos += 20;
  p.text("• Space - Open tower menu / Confirm", 130, yPos);
  yPos += 20;
  p.text("• Shift - Upgrade selected tower", 130, yPos);
  yPos += 20;
  p.text("• Z - Close menu / Sell tower", 130, yPos);
  yPos += 20;
  p.text("• ESC - Pause game", 130, yPos);
  yPos += 20;
  p.text("• R - Restart", 130, yPos);
  
  // Tips
  yPos += 35;
  p.fill(150, 200, 255);
  p.textSize(11);
  p.text("TIPS:", 120, yPos);
  yPos += 20;
  p.fill(180);
  p.text("• Defeat enemies to earn gold for towers and upgrades", 130, yPos);
  yPos += 18;
  p.text("• Place towers early in the path for maximum damage", 130, yPos);
  yPos += 18;
  p.text("• Upgrade towers to handle tougher waves", 130, yPos);
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(16);
  const blink = Math.floor(p.frameCount / 30) % 2 === 0;
  if (blink) {
    p.text("PRESS ENTER TO START", 300, 360);
  }
}

export function drawGameOverScreen(p) {
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, 600, 400);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Title
  p.fill(...(isWin ? [100, 255, 100] : [255, 100, 100]));
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.text(isWin ? "VICTORY!" : "DEFEAT", 300, 140);
  
  // Stats
  p.fill(255);
  p.textSize(16);
  p.text(`Final Score: ${gameState.score}`, 300, 200);
  p.text(`Waves Completed: ${gameState.wave}/${gameState.maxWaves}`, 300, 230);
  p.text(`Gold Earned: ${gameState.score}`, 300, 260);
  
  // Restart prompt
  p.fill(200);
  p.textSize(14);
  p.text("PRESS R TO RESTART", 300, 320);
}