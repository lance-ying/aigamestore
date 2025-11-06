// ui.js - User interface rendering

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, TOWER_TYPES, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, META_UPGRADES } from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 30, 40);
  
  // Title
  p.push();
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.text("DARK KINGDOM", CANVAS_WIDTH / 2, 60);
  p.textSize(24);
  p.fill(200, 100, 100);
  p.text("Tower Defense", CANVAS_WIDTH / 2, 95);
  p.pop();
  
  // Instructions
  p.push();
  p.fill(200, 200, 200);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  p.text("Defend your kingdom from heroic invaders!", CANVAS_WIDTH / 2, 140);
  p.text("Place towers strategically and upgrade them", CANVAS_WIDTH / 2, 160);
  p.text("Deploy your hero to turn the tide of battle", CANVAS_WIDTH / 2, 180);
  p.text("Survive " + "10" + " waves without losing " + "20" + " lives", CANVAS_WIDTH / 2, 200);
  p.pop();
  
  // Controls
  p.push();
  p.fill(150, 200, 255);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(12);
  const startX = 120;
  const startY = 240;
  const lineHeight = 18;
  
  p.text("Arrow Keys: Move hero", startX, startY);
  p.text("Space: Place/Select tower", startX, startY + lineHeight);
  p.text("Z: Upgrade tower or use hero ability", startX, startY + lineHeight * 2);
  p.text("Shift: Sell selected tower", startX, startY + lineHeight * 3);
  p.text("ESC: Pause game", startX, startY + lineHeight * 4);
  p.pop();
  
  // Meta upgrades available
  p.push();
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  p.text("Total Stars Collected: " + gameState.totalStars, CANVAS_WIDTH / 2, 345);
  p.pop();
  
  // Start prompt
  p.push();
  p.fill(100, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  const blink = Math.floor(p.frameCount / 30) % 2 === 0;
  if (blink) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 375);
  }
  p.pop();
}

export function renderGameUI(p) {
  // Top bar background
  p.push();
  p.fill(30, 30, 30, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 35);
  p.pop();
  
  // Gold
  p.push();
  p.fill(255, 215, 0);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(14);
  p.text("Gold: " + gameState.gold, 10, 18);
  p.pop();
  
  // Lives
  p.push();
  p.fill(255, 50, 50);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(14);
  p.text("Lives: " + gameState.lives, 120, 18);
  p.pop();
  
  // Wave
  p.push();
  p.fill(100, 200, 255);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(14);
  p.text("Wave: " + gameState.currentWave + "/10", 220, 18);
  p.pop();
  
  // Stars
  p.push();
  p.fill(255, 215, 0);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(14);
  p.text("★ " + gameState.stars, 340, 18);
  p.pop();
  
  // Hero info
  if (gameState.player) {
    p.push();
    p.fill(150, 200, 255);
    p.textAlign(p.RIGHT, p.CENTER);
    p.textSize(12);
    p.text("Hero Lvl:" + gameState.player.level, CANVAS_WIDTH - 10, 12);
    p.text("XP:" + gameState.player.xp + "/" + gameState.player.xpToNextLevel, CANVAS_WIDTH - 10, 24);
    p.pop();
  }
  
  // Tower selection info
  if (gameState.selectedTower) {
    renderTowerInfo(p);
  } else {
    renderTowerSelection(p);
  }
  
  // Paused indicator
  if (gameState.gamePhase === PHASE_PAUSED) {
    p.push();
    p.fill(255, 255, 0);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.text("PAUSED", CANVAS_WIDTH - 10, 45);
    p.pop();
  }
  
  // Wave countdown
  if (gameState.waveStartDelay > 0) {
    p.push();
    p.fill(255, 200, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(18);
    p.text("Next wave in " + Math.ceil(gameState.waveStartDelay / 60) + "...", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
    p.pop();
  }
}

function renderTowerSelection(p) {
  const panelX = CANVAS_WIDTH - 150;
  const panelY = 50;
  const panelWidth = 140;
  const panelHeight = 220;
  
  p.push();
  p.fill(40, 40, 40, 230);
  p.stroke(100);
  p.strokeWeight(2);
  p.rect(panelX, panelY, panelWidth, panelHeight, 5);
  p.pop();
  
  p.push();
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(12);
  p.text("Select Tower Type", panelX + panelWidth / 2, panelY + 5);
  p.pop();
  
  const types = Object.keys(TOWER_TYPES);
  for (let i = 0; i < types.length; i++) {
    const type = types[i];
    const config = TOWER_TYPES[type];
    const y = panelY + 30 + i * 45;
    const isSelected = gameState.selectedTowerType === type;
    
    p.push();
    p.fill(...(isSelected ? [100, 150, 200, 200] : [60, 60, 60, 200]));
    p.stroke(isSelected ? 200 : 100);
    p.strokeWeight(isSelected ? 2 : 1);
    p.rect(panelX + 5, y, panelWidth - 10, 40, 3);
    p.pop();
    
    // Tower color indicator
    p.push();
    p.fill(...config.color);
    p.noStroke();
    p.circle(panelX + 20, y + 20, 20);
    p.pop();
    
    // Tower info
    p.push();
    p.fill(255);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(10);
    p.text(config.name, panelX + 35, y + 8);
    p.text("$" + config.cost, panelX + 35, y + 22);
    p.pop();
  }
  
  // Instructions
  p.push();
  p.fill(200, 200, 200);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(9);
  p.text("Move hero near", panelX + panelWidth / 2, panelY + panelHeight - 20);
  p.text("valid spot & press SPACE", panelX + panelWidth / 2, panelY + panelHeight - 10);
  p.pop();
}

function renderTowerInfo(p) {
  const tower = gameState.selectedTower;
  const panelX = CANVAS_WIDTH - 150;
  const panelY = 50;
  const panelWidth = 140;
  const panelHeight = 180;
  
  p.push();
  p.fill(40, 40, 40, 230);
  p.stroke(100);
  p.strokeWeight(2);
  p.rect(panelX, panelY, panelWidth, panelHeight, 5);
  p.pop();
  
  // Tower name
  p.push();
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(12);
  p.text(tower.config.name, panelX + panelWidth / 2, panelY + 5);
  p.pop();
  
  // Tier
  p.push();
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(10);
  p.text("Tier " + tower.tier + "/" + "3", panelX + panelWidth / 2, panelY + 22);
  p.pop();
  
  // Stats
  p.push();
  p.fill(200, 200, 200);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(9);
  const statY = panelY + 45;
  p.text("Damage: " + Math.floor(tower.damage), panelX + 10, statY);
  p.text("Range: " + Math.floor(tower.range), panelX + 10, statY + 15);
  p.text("Fire Rate: " + (60 / tower.fireRate).toFixed(1) + "/s", panelX + 10, statY + 30);
  p.pop();
  
  // Upgrade button
  const upgradeCost = tower.getUpgradeCost();
  if (upgradeCost !== null) {
    p.push();
    const canAfford = gameState.gold >= upgradeCost;
    p.fill(...(canAfford ? [100, 200, 100, 200] : [100, 100, 100, 200]));
    p.stroke(canAfford ? 150 : 100);
    p.strokeWeight(2);
    p.rect(panelX + 10, panelY + 95, panelWidth - 20, 25, 3);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.text("Upgrade ($" + upgradeCost + ")", panelX + panelWidth / 2, panelY + 107);
    p.text("Press Z", panelX + panelWidth / 2, panelY + 125);
    p.pop();
  } else {
    p.push();
    p.fill(150, 150, 150);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.text("Max Tier", panelX + panelWidth / 2, panelY + 107);
    p.pop();
  }
  
  // Sell button
  const sellValue = tower.getSellValue();
  p.push();
  p.fill(200, 100, 100, 200);
  p.stroke(150);
  p.strokeWeight(2);
  p.rect(panelX + 10, panelY + 145, panelWidth - 20, 25, 3);
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(10);
  p.text("Sell ($" + sellValue + ")", panelX + panelWidth / 2, panelY + 157);
  p.text("Press SHIFT", panelX + panelWidth / 2, panelY + 168);
  p.pop();
}

export function renderGameOverScreen(p) {
  p.background(20, 30, 40);
  
  const isWin = gameState.gamePhase === PHASE_GAME_OVER_WIN;
  
  // Title
  p.push();
  p.fill(...(isWin ? [100, 255, 100] : [255, 100, 100]));
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "VICTORY!" : "DEFEATED", CANVAS_WIDTH / 2, 100);
  p.pop();
  
  // Stats
  p.push();
  p.fill(200, 200, 200);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  p.text("Waves Survived: " + gameState.currentWave + "/10", CANVAS_WIDTH / 2, 160);
  p.text("Final Gold: " + gameState.gold, CANVAS_WIDTH / 2, 190);
  p.text("Stars Earned: " + gameState.stars, CANVAS_WIDTH / 2, 220);
  
  if (gameState.player) {
    p.text("Hero Level: " + gameState.player.level, CANVAS_WIDTH / 2, 250);
  }
  p.pop();
  
  // Restart prompt
  p.push();
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  const blink = Math.floor(p.frameCount / 30) % 2 === 0;
  if (blink) {
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 320);
  }
  p.pop();
  
  // Meta upgrade hint
  if (isWin && gameState.stars > 0) {
    p.push();
    p.fill(150, 200, 255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.text("Stars can be used for permanent upgrades!", CANVAS_WIDTH / 2, 360);
    p.pop();
  }
}

export function renderPath(p, path) {
  p.push();
  p.noFill();
  p.stroke(80, 60, 40);
  p.strokeWeight(30);
  p.beginShape();
  for (const point of path) {
    p.vertex(point.x, point.y);
  }
  p.endShape();
  p.pop();
  
  // Path border
  p.push();
  p.noFill();
  p.stroke(60, 40, 20);
  p.strokeWeight(34);
  p.beginShape();
  for (const point of path) {
    p.vertex(point.x, point.y);
  }
  p.endShape();
  p.pop();
}

export function renderValidPlacementLocations(p, locations) {
  for (const loc of locations) {
    // Check if occupied
    let occupied = false;
    for (const tower of gameState.towers) {
      if (Math.hypot(tower.x - loc.x, tower.y - loc.y) < 10) {
        occupied = true;
        break;
      }
    }
    
    if (!occupied && gameState.player) {
      const dist = Math.hypot(gameState.player.x - loc.x, gameState.player.y - loc.y);
      if (dist < 35) {
        p.push();
        p.fill(100, 255, 100, 100);
        p.stroke(100, 255, 100);
        p.strokeWeight(2);
        p.circle(loc.x, loc.y, 25);
        p.pop();
      }
    }
  }
}