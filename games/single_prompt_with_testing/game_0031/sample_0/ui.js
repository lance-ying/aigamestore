// ui.js - User interface rendering

import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, gameState } from './globals.js';

export function drawStartScreen(p) {
  p.background(20, 25, 40);
  
  // Title
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(255, 220, 100);
  p.textSize(48);
  p.text("MEGABONK", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(200, 180, 255);
  p.textSize(16);
  p.text("Survive the Endless Horde", CANVAS_WIDTH / 2, 120);
  
  // Description
  p.fill(200);
  p.textSize(14);
  const desc1 = "Fight waves of enemies and grow powerful!";
  const desc2 = "Collect XP to level up and choose upgrades.";
  const desc3 = "Survive for 90 seconds to win!";
  p.text(desc1, CANVAS_WIDTH / 2, 170);
  p.text(desc2, CANVAS_WIDTH / 2, 190);
  p.text(desc3, CANVAS_WIDTH / 2, 210);
  
  // Controls
  p.fill(150, 200, 255);
  p.textSize(13);
  p.text("CONTROLS:", CANVAS_WIDTH / 2, 250);
  
  p.fill(200);
  p.textSize(12);
  p.text("Arrow Keys: Move", CANVAS_WIDTH / 2, 275);
  p.text("Space: Shoot", CANVAS_WIDTH / 2, 292);
  p.text("Shift: Dash (evade enemies)", CANVAS_WIDTH / 2, 309);
  p.text("Z: Special Attack (when charged)", CANVAS_WIDTH / 2, 326);
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textSize(18);
  const flash = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(255, 255, 100, flash * 255);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
}

export function drawPausedIndicator(p) {
  p.fill(255, 255, 100);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

export function drawGameOverScreen(p, isWin) {
  p.push();
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  p.pop();
  
  p.textAlign(p.CENTER, p.CENTER);
  
  if (isWin) {
    p.fill(100, 255, 100);
    p.textSize(48);
    p.text("VICTORY!", CANVAS_WIDTH / 2, 120);
    
    p.fill(200, 255, 200);
    p.textSize(20);
    p.text("You survived the horde!", CANVAS_WIDTH / 2, 170);
  } else {
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 120);
    
    p.fill(255, 200, 200);
    p.textSize(20);
    p.text("You were overwhelmed...", CANVAS_WIDTH / 2, 170);
  }
  
  // Stats
  p.fill(255);
  p.textSize(16);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  p.text(`Level Reached: ${gameState.level}`, CANVAS_WIDTH / 2, 245);
  p.text(`Enemies Defeated: ${gameState.enemiesDefeated}`, CANVAS_WIDTH / 2, 270);
  
  const survivalTime = Math.floor((gameState.time) / 1000);
  p.text(`Survival Time: ${survivalTime}s`, CANVAS_WIDTH / 2, 295);
  
  // Restart prompt
  p.fill(255, 255, 100);
  p.textSize(18);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 350);
}

export function drawHUD(p, player) {
  // Health bar
  const hpBarX = 10;
  const hpBarY = 10;
  const hpBarWidth = 200;
  const hpBarHeight = 20;
  
  p.fill(50);
  p.noStroke();
  p.rect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);
  
  const healthPercent = player.health / player.maxHealth;
  p.fill(100, 255, 100);
  p.rect(hpBarX, hpBarY, hpBarWidth * healthPercent, hpBarHeight);
  
  p.fill(255);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(12);
  p.text(`HP: ${Math.ceil(player.health)}/${player.maxHealth}`, hpBarX + 5, hpBarY + hpBarHeight / 2);
  
  // XP bar
  const xpBarX = 10;
  const xpBarY = 35;
  const xpBarWidth = 200;
  const xpBarHeight = 15;
  
  p.fill(30);
  p.noStroke();
  p.rect(xpBarX, xpBarY, xpBarWidth, xpBarHeight);
  
  const xpPercent = gameState.xp / gameState.xpToNextLevel;
  p.fill(150, 100, 255);
  p.rect(xpBarX, xpBarY, xpBarWidth * xpPercent, xpBarHeight);
  
  p.fill(255);
  p.textSize(10);
  p.text(`LVL ${gameState.level}: ${gameState.xp}/${gameState.xpToNextLevel}`, xpBarX + 5, xpBarY + xpBarHeight / 2);
  
  // Special charge
  const specialBarX = 10;
  const specialBarY = 55;
  const specialBarWidth = 100;
  const specialBarHeight = 10;
  
  p.fill(30);
  p.rect(specialBarX, specialBarY, specialBarWidth, specialBarHeight);
  
  const specialPercent = player.specialCharge / player.specialMaxCharge;
  p.fill(255, 255, 100);
  p.rect(specialBarX, specialBarY, specialBarWidth * specialPercent, specialBarHeight);
  
  p.fill(255);
  p.textSize(9);
  p.text("SPECIAL (Z)", specialBarX + 5, specialBarY + specialBarHeight / 2);
  
  // Dash cooldown
  const dashReady = p.frameCount - player.lastDashTime >= player.dashCooldown;
  p.fill(dashReady ? [100, 255, 255] : [100, 100, 100]);
  p.textSize(10);
  p.text(dashReady ? "DASH READY" : "DASH CD", specialBarX + specialBarWidth + 10, specialBarY + specialBarHeight / 2);
  
  // Score and time
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
  
  const survivalTime = Math.floor((Date.now() - gameState.startTime) / 1000);
  const timeToWin = Math.floor(gameState.WIN_TIME / 1000);
  p.text(`Time: ${survivalTime}s / ${timeToWin}s`, CANVAS_WIDTH - 10, 30);
  
  p.text(`Wave: ${gameState.waveNumber}`, CANVAS_WIDTH - 10, 50);
  p.text(`Enemies: ${gameState.enemies.length}`, CANVAS_WIDTH - 10, 70);
}

export function drawUpgradeScreen(p) {
  // Overlay
  p.push();
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  p.pop();
  
  // Title
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("LEVEL UP!", CANVAS_WIDTH / 2, 50);
  
  p.fill(200);
  p.textSize(16);
  p.text("Choose an upgrade:", CANVAS_WIDTH / 2, 85);
  
  // Draw upgrade options
  const upgrades = gameState.upgradesAvailable;
  const boxWidth = 160;
  const boxHeight = 120;
  const spacing = 20;
  const startX = (CANVAS_WIDTH - (boxWidth * 3 + spacing * 2)) / 2;
  const startY = 130;
  
  for (let i = 0; i < upgrades.length; i++) {
    const upgrade = upgrades[i];
    const x = startX + i * (boxWidth + spacing);
    const y = startY;
    
    // Box
    p.fill(40, 40, 60);
    p.stroke(100, 150, 255);
    p.strokeWeight(2);
    p.rect(x, y, boxWidth, boxHeight, 10);
    
    // Title
    p.fill(150, 200, 255);
    p.noStroke();
    p.textSize(16);
    p.text(upgrade.name, x + boxWidth / 2, y + 25);
    
    // Description
    p.fill(200);
    p.textSize(12);
    p.text(upgrade.description, x + boxWidth / 2, y + 55);
    
    // Key prompt
    p.fill(255, 255, 100);
    p.textSize(18);
    p.text(`Press ${i + 1}`, x + boxWidth / 2, y + 90);
  }
  
  // Instructions
  p.fill(150);
  p.textSize(12);
  p.text("Press 1, 2, or 3 to select", CANVAS_WIDTH / 2, 320);
}