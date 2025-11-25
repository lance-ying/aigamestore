// ui.js - User interface rendering

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderUI(p) {
  if (gameState.gamePhase === GAME_PHASES.START) {
    renderStartScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    renderGameUI(p);
    if (gameState.showUpgradeMenu) {
      renderUpgradeMenu(p);
    }
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    renderGameUI(p);
    renderPauseOverlay(p);
  } else if (
    gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN ||
    gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE
  ) {
    renderGameOverScreen(p);
  }
}

function renderStartScreen(p) {
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  // Title
  p.fill(100, 200, 255);
  p.textSize(48);
  p.text("ALIEN SHOOTER", CANVAS_WIDTH / 2, 80);
  
  p.fill(255, 100, 100);
  p.textSize(32);
  p.text("SURVIVE", CANVAS_WIDTH / 2, 120);
  
  // Description
  p.fill(220);
  p.textSize(14);
  p.text("Battle endless waves of alien monsters!", CANVAS_WIDTH / 2, 170);
  p.text("Collect experience to level up and gain powerful upgrades.", CANVAS_WIDTH / 2, 190);
  p.text("Survive as long as possible!", CANVAS_WIDTH / 2, 210);
  
  // Controls
  p.fill(200);
  p.textSize(12);
  p.textAlign(p.LEFT, p.CENTER);
  
  const controlX = 180;
  const startY = 240;
  const lineHeight = 18;
  
  p.text("Arrow Keys: Move", controlX, startY);
  p.text("Space: Fire weapon", controlX, startY + lineHeight);
  p.text("Shift: Toggle auto-aim", controlX, startY + lineHeight * 2);
  p.text("Z: Use ability (level 2+)", controlX, startY + lineHeight * 3);
  p.text("ESC: Pause  |  R: Restart", controlX, startY + lineHeight * 4);
  
  // Start prompt
  p.fill(100, 255, 100);
  p.textSize(20);
  p.textAlign(p.CENTER, p.CENTER);
  const pulse = p.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(100, 255, 100, 255 * pulse);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 350);
  
  p.pop();
}

function renderGameUI(p) {
  p.push();
  
  // Top bar background
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 50);
  
  // Health bar
  p.fill(220);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  p.text("HP", 10, 8);
  
  const healthBarX = 10;
  const healthBarY = 25;
  const healthBarWidth = 150;
  const healthBarHeight = 15;
  
  p.fill(100, 30, 30);
  p.rect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
  
  if (gameState.player) {
    const healthPercent = gameState.player.health / gameState.player.maxHealth;
    p.fill(...(healthPercent > 0.5 ? [50, 200, 50] : healthPercent > 0.25 ? [255, 200, 50] : [255, 50, 50]));
    p.rect(healthBarX, healthBarY, healthBarWidth * healthPercent, healthBarHeight);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.text(
      `${Math.ceil(gameState.player.health)}/${gameState.player.maxHealth}`,
      healthBarX + healthBarWidth / 2,
      healthBarY + healthBarHeight / 2
    );
  }
  
  // Experience bar
  if (gameState.player) {
    p.fill(220);
    p.textSize(12);
    p.textAlign(p.LEFT, p.TOP);
    p.text(`Level ${gameState.player.level}`, 180, 8);
    
    const expBarX = 180;
    const expBarY = 25;
    const expBarWidth = 120;
    const expBarHeight = 15;
    
    p.fill(50, 50, 100);
    p.rect(expBarX, expBarY, expBarWidth, expBarHeight);
    
    const expPercent = gameState.player.experience / gameState.player.experienceToNextLevel;
    p.fill(100, 200, 255);
    p.rect(expBarX, expBarY, expBarWidth * expPercent, expBarHeight);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.text(
      `${gameState.player.experience}/${gameState.player.experienceToNextLevel}`,
      expBarX + expBarWidth / 2,
      expBarY + expBarHeight / 2
    );
  }
  
  // Score and time
  p.fill(220);
  p.textSize(14);
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
  p.text(`Time: ${gameState.survivalTime}s`, CANVAS_WIDTH - 10, 28);
  
  // Wave indicator
  p.fill(255, 100, 100);
  p.textSize(12);
  p.textAlign(p.CENTER, p.TOP);
  p.text(`Wave ${gameState.waveLevel}`, CANVAS_WIDTH / 2, 8);
  p.fill(200);
  p.text(`Enemies: ${gameState.enemies.length}`, CANVAS_WIDTH / 2, 26);
  
  // Auto-aim indicator
  if (gameState.player && gameState.player.autoAim) {
    p.fill(100, 255, 100);
    p.textSize(10);
    p.textAlign(p.LEFT, p.BOTTOM);
    p.text("AUTO-AIM", 10, CANVAS_HEIGHT - 5);
  }
  
  // Shield cooldown
  if (gameState.player && gameState.player.level >= 2) {
    const cooldownPercent = 1 - (gameState.player.shieldCooldown / 600);
    p.fill(220);
    p.textSize(10);
    p.textAlign(p.RIGHT, p.BOTTOM);
    p.text("Shield:", CANVAS_WIDTH - 60, CANVAS_HEIGHT - 5);
    
    p.fill(50, 50, 100);
    p.rect(CANVAS_WIDTH - 55, CANVAS_HEIGHT - 15, 50, 8);
    
    const shieldColor = gameState.player.hasShield ? [100, 255, 255] : cooldownPercent >= 1 ? [100, 200, 255] : [100, 100, 150];
    p.fill(...shieldColor);
    p.rect(CANVAS_WIDTH - 55, CANVAS_HEIGHT - 15, 50 * cooldownPercent, 8);
  }
  
  p.pop();
}

function renderUpgradeMenu(p) {
  p.push();
  
  // Darken background
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Menu box
  const menuWidth = 400;
  const menuHeight = 250;
  const menuX = (CANVAS_WIDTH - menuWidth) / 2;
  const menuY = (CANVAS_HEIGHT - menuHeight) / 2;
  
  p.fill(40, 40, 60);
  p.stroke(100, 200, 255);
  p.strokeWeight(3);
  p.rect(menuX, menuY, menuWidth, menuHeight);
  
  // Title
  p.fill(100, 200, 255);
  p.noStroke();
  p.textSize(24);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("LEVEL UP!", CANVAS_WIDTH / 2, menuY + 30);
  
  p.fill(220);
  p.textSize(14);
  p.text("Choose an upgrade (Press 1, 2, or 3)", CANVAS_WIDTH / 2, menuY + 60);
  
  // Upgrade options
  const upgrades = gameState.availableUpgrades;
  const optionWidth = 110;
  const optionHeight = 120;
  const spacing = 20;
  const startX = menuX + (menuWidth - (optionWidth * 3 + spacing * 2)) / 2;
  const startY = menuY + 95;
  
  for (let i = 0; i < upgrades.length; i++) {
    const upgrade = upgrades[i];
    const optionX = startX + i * (optionWidth + spacing);
    
    // Box
    p.fill(60, 60, 80);
    p.stroke(150, 150, 200);
    p.strokeWeight(2);
    p.rect(optionX, startY, optionWidth, optionHeight);
    
    // Number
    p.fill(255, 200, 100);
    p.noStroke();
    p.textSize(20);
    p.textAlign(p.CENTER, p.TOP);
    p.text(i + 1, optionX + optionWidth / 2, startY + 10);
    
    // Name
    p.fill(220);
    p.textSize(12);
    p.text(upgrade.name, optionX + optionWidth / 2, startY + 40);
    
    // Description
    p.fill(180);
    p.textSize(10);
    p.text(getUpgradeDescription(upgrade), optionX + optionWidth / 2, startY + 65);
  }
  
  p.pop();
}

function getUpgradeDescription(upgrade) {
  switch (upgrade.type) {
    case "damage":
      return "Increase\ndamage output";
    case "fireRate":
      return "Fire bullets\nfaster";
    case "speed":
      return "Move faster";
    case "health":
      return "Increase\nmax health";
    case "ability":
      return "Unlock shield\nability (Z key)";
    default:
      return "";
  }
}

function renderPauseOverlay(p) {
  p.push();
  p.fill(255, 255, 100);
  p.textSize(16);
  p.textAlign(p.RIGHT, p.TOP);
  p.text("PAUSED", CANVAS_WIDTH - 10, 60);
  p.pop();
}

function renderGameOverScreen(p) {
  p.push();
  
  // Semi-transparent overlay
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.textAlign(p.CENTER, p.CENTER);
  
  // Title
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    p.fill(100, 255, 100);
    p.textSize(48);
    p.text("VICTORY!", CANVAS_WIDTH / 2, 100);
  } else {
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 100);
  }
  
  // Stats
  p.fill(220);
  p.textSize(18);
  p.text(`Survival Time: ${gameState.survivalTime} seconds`, CANVAS_WIDTH / 2, 170);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 200);
  p.text(`Enemies Defeated: ${gameState.enemiesDefeated}`, CANVAS_WIDTH / 2, 230);
  p.text(`Waves Survived: ${gameState.waveLevel}`, CANVAS_WIDTH / 2, 260);
  
  if (gameState.player) {
    p.text(`Final Level: ${gameState.player.level}`, CANVAS_WIDTH / 2, 290);
  }
  
  // Restart prompt
  p.fill(100, 200, 255);
  p.textSize(20);
  const pulse = p.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(100, 200, 255, 255 * pulse);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 350);
  
  p.pop();
}