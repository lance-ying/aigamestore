// rendering.js - All rendering functions
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { UPGRADE_TYPES } from './upgrades.js';

export function renderGame(p) {
  // Clear background
  p.background(40, 35, 30);
  
  switch (gameState.gamePhase) {
    case GAME_PHASES.START:
      renderStartScreen(p);
      break;
    case GAME_PHASES.PLAYING:
      renderPlayingScreen(p);
      break;
    case GAME_PHASES.PAUSED:
      renderPlayingScreen(p);
      renderPausedOverlay(p);
      break;
    case GAME_PHASES.LEVEL_UP_MENU:
      renderPlayingScreen(p);
      renderLevelUpMenu(p);
      break;
    case GAME_PHASES.WAVE_COMPLETE:
      renderPlayingScreen(p);
      renderWaveComplete(p);
      break;
    case GAME_PHASES.GAME_OVER_WIN:
      renderGameOver(p, true);
      break;
    case GAME_PHASES.GAME_OVER_LOSE:
      renderGameOver(p, false);
      break;
  }
}

function renderStartScreen(p) {
  // New main title: "press enter to begin"
  p.fill(255, 255, 100); // Prominent color
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36); // Prominent size
  const flash = Math.sin(p.frameCount * 0.1) > 0;
  if (flash) {
    p.text('press enter to begin', CANVAS_WIDTH / 2, 120); // Centered, in place of old title/graphic
  }
  
  // Instructions (preserved as they do not contain game name)
  p.fill(200);
  p.textSize(14);
  p.text('Survive waves of enemies!', CANVAS_WIDTH / 2, 230);
  p.text('Collect experience to level up', CANVAS_WIDTH / 2, 250);
  p.text('Gather materials for upgrades', CANVAS_WIDTH / 2, 270);
  
  // Controls (preserved as they do not contain game name)
  p.fill(150, 200, 255);
  p.textSize(12);
  p.text('WASD: Move', CANVAS_WIDTH / 2, 300);
  p.text('SHIFT: Dash', CANVAS_WIDTH / 2, 318);
  p.text('ESC: Pause', CANVAS_WIDTH / 2, 336);
  
  // Removed old "PRESS ENTER TO START" prompt as new title serves this purpose
}

function renderPlayingScreen(p) {
  // Render entities
  for (const item of gameState.items) {
    item.render(p);
  }
  
  for (const projectile of gameState.projectiles) {
    projectile.render(p);
  }
  
  for (const enemy of gameState.enemies) {
    enemy.render(p);
  }
  
  if (gameState.player) {
    gameState.player.render(p);
  }
  
  // UI
  renderUI(p);
  
  // Notification
  if (gameState.notification) {
    renderNotification(p);
  }
}

function renderUI(p) {
  const player = gameState.player;
  
  // Level and Wave indicator (top-left)
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text(`LEVEL ${gameState.currentLevel} - WAVE ${gameState.currentWave}`, 10, 10);
  
  // Score (top-right)
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`SCORE: ${String(gameState.score).padStart(6, '0')}`, CANVAS_WIDTH - 10, 10);
  
  // Weapon Display (Top Center)
  p.textAlign(p.CENTER, p.TOP);
  p.fill(255, 220, 150);
  p.textSize(12);
  p.text(`WEAPON: ${player.getCurrentWeaponName()}`, CANVAS_WIDTH / 2, 10);
  
  // Health bar
  const hpBarWidth = 200;
  const hpBarHeight = 20;
  const hpBarX = 10;
  const hpBarY = 35;
  
  p.fill(50);
  p.noStroke();
  p.rect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);
  
  const hpPercent = player.currentHP / player.maxHP;
  const hpColor = hpPercent > 0.5 ? [100, 255, 100] : hpPercent > 0.25 ? [255, 200, 50] : [255, 50, 50];
  p.fill(...hpColor);
  p.rect(hpBarX, hpBarY, hpBarWidth * hpPercent, hpBarHeight);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(12);
  p.text(`${Math.ceil(player.currentHP)} / ${player.maxHP}`, hpBarX + hpBarWidth / 2, hpBarY + hpBarHeight / 2);
  
  // Experience bar (bottom)
  const expBarWidth = CANVAS_WIDTH - 20;
  const expBarHeight = 15;
  const expBarX = 10;
  const expBarY = CANVAS_HEIGHT - 25;
  
  p.fill(50);
  p.noStroke();
  p.rect(expBarX, expBarY, expBarWidth, expBarHeight);
  
  const expPercent = player.currentExp / player.expToNextLevel;
  p.fill(255, 255, 100);
  p.rect(expBarX, expBarY, expBarWidth * expPercent, expBarHeight);
  
  p.fill(255);
  p.textSize(10);
  p.text(`LVL ${player.playerLevel}  ${Math.floor(player.currentExp)}/${player.expToNextLevel} XP`, expBarX + expBarWidth / 2, expBarY + expBarHeight / 2);
  
  // Materials display
  p.fill(180, 100, 255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text(`💎 ${gameState.materials}`, 10, 60);
  
  // Dash cooldown indicator
  if (player.dashCooldown > 0) {
    p.fill(100, 150, 255);
    p.textAlign(p.RIGHT, p.BOTTOM);
    p.textSize(10);
    p.text(`DASH: ${Math.ceil(player.dashCooldown / 60)}s`, CANVAS_WIDTH - 10, CANVAS_HEIGHT - 30);
  }
}

function renderNotification(p) {
  p.push();
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 100, CANVAS_WIDTH, 50);
  
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  p.text(gameState.notification, CANVAS_WIDTH / 2, 125);
  p.pop();
}

function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 255, 100);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text('PAUSED', CANVAS_WIDTH - 10, 10);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  p.text('ESC - Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  p.text('R - Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 25);
}

function renderLevelUpMenu(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Panel
  const panelWidth = 400;
  const panelHeight = 280;
  const panelX = (CANVAS_WIDTH - panelWidth) / 2;
  const panelY = (CANVAS_HEIGHT - panelHeight) / 2;
  
  p.fill(60, 50, 40);
  p.stroke(150, 120, 80);
  p.strokeWeight(3);
  p.rect(panelX, panelY, panelWidth, panelHeight, 10);
  
  // Title
  p.fill(255, 220, 150);
  p.noStroke();
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(24);
  p.text('LEVEL UP!', CANVAS_WIDTH / 2, panelY + 20);
  
  // Upgrade options
  const optionHeight = 60;
  const optionY = panelY + 70;
  
  for (let i = 0; i < gameState.availableUpgrades.length; i++) {
    const upgradeKey = gameState.availableUpgrades[i];
    const upgrade = UPGRADE_TYPES[upgradeKey];
    const y = optionY + i * (optionHeight + 10);
    const isSelected = i === gameState.selectedUpgradeIndex;
    
    // Option background
    p.fill(...(isSelected ? [100, 80, 60] : [50, 40, 30]));
    p.stroke(...(isSelected ? [255, 220, 150] : [100, 80, 60]));
    p.strokeWeight(isSelected ? 3 : 1);
    p.rect(panelX + 20, y, panelWidth - 40, optionHeight, 5);
    
    // Icon
    p.fill(255);
    p.noStroke();
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(32);
    p.text(upgrade.icon, panelX + 40, y + optionHeight / 2);
    
    // Name and description
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(18);
    p.text(upgrade.name, panelX + 90, y + 12);
    p.textSize(12);
    p.fill(200);
    p.text(upgrade.desc, panelX + 90, y + 35);
  }
  
  // Instructions
  p.fill(150, 200, 255);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.textSize(12);
  p.text('W/S: Select   SPACE: Confirm', CANVAS_WIDTH / 2, panelY + panelHeight - 15);
}

function renderWaveComplete(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Panel
  const panelWidth = 450;
  const panelHeight = 320;
  const panelX = (CANVAS_WIDTH - panelWidth) / 2;
  const panelY = (CANVAS_HEIGHT - panelHeight) / 2;
  
  p.fill(60, 50, 40);
  p.stroke(150, 120, 80);
  p.strokeWeight(3);
  p.rect(panelX, panelY, panelWidth, panelHeight, 10);
  
  // Title
  p.fill(255, 220, 150);
  p.noStroke();
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(28);
  
  const isLevelComplete = gameState.currentWave >= getMaxWaveForLevel(gameState.currentLevel);
  if (isLevelComplete) {
    p.text(`LEVEL ${gameState.currentLevel} COMPLETE!`, CANVAS_WIDTH / 2, panelY + 20);
  } else {
    p.text(`WAVE ${gameState.currentWave} COMPLETE!`, CANVAS_WIDTH / 2, panelY + 20);
  }
  
  // Stats
  p.fill(200);
  p.textSize(14);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, panelY + 65);
  p.text(`Materials: ${gameState.materials}`, CANVAS_WIDTH / 2, panelY + 85);
  
  // Shop (only on level complete)
  if (isLevelComplete && gameState.shopItems) {
    p.fill(255, 220, 150);
    p.textSize(18);
    p.text('SHOP', CANVAS_WIDTH / 2, panelY + 115);
    
    const optionHeight = 45;
    const optionY = panelY + 145;
    
    for (let i = 0; i < gameState.shopItems.length; i++) {
      const item = gameState.shopItems[i];
      const y = optionY + i * (optionHeight + 5);
      const isSelected = i === gameState.selectedUpgradeIndex;
      const canAfford = gameState.materials >= item.cost;
      
      p.fill(...(isSelected ? [100, 80, 60] : [50, 40, 30]));
      p.stroke(...(isSelected ? [255, 220, 150] : [100, 80, 60]));
      p.strokeWeight(isSelected ? 3 : 1);
      p.rect(panelX + 20, y, panelWidth - 40, optionHeight, 5);
      
      p.fill(...(canAfford ? [255, 255, 255] : [150, 150, 150]));
      p.noStroke();
      p.textAlign(p.LEFT, p.CENTER);
      p.textSize(14);
      p.text(item.name, panelX + 40, y + optionHeight / 2);
      
      p.fill(...(canAfford ? [180, 100, 255] : [100, 60, 150]));
      p.textAlign(p.RIGHT, p.CENTER);
      p.text(`💎 ${item.cost}`, panelX + panelWidth - 40, y + optionHeight / 2);
    }
    
    p.fill(150, 200, 255);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.textSize(11);
    p.text('W/S: Select   SPACE: Buy/Continue', CANVAS_WIDTH / 2, panelY + panelHeight - 12);
  } else {
    p.fill(150, 200, 255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16);
    const flash = Math.sin(p.frameCount * 0.1) > 0;
    if (flash) {
      p.text('PRESS SPACE TO CONTINUE', CANVAS_WIDTH / 2, panelY + panelHeight - 60);
    }
  }
}

function getMaxWaveForLevel(level) {
  const waveConfig = {
    1: 3,
    2: 4,
    3: 5
  };
  return waveConfig[level] || 3;
}