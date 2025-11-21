// rendering.js - All rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, SCREENS } from './globals.js';

export function drawStartScreen(p) {
  p.background(20, 15, 30);
  
  // Title with glow effect
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  // Glow
  p.fill(255, 215, 0, 80);
  p.textSize(42);
  p.text("⚔️ IDLE LEGEND ⚔️", CANVAS_WIDTH / 2 + 2, 80 + 2);
  
  // Title
  p.fill(255, 215, 0);
  p.textSize(40);
  p.text("⚔️ IDLE LEGEND ⚔️", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(200, 180, 255);
  p.textSize(16);
  p.text("王者战神", CANVAS_WIDTH / 2, 115);
  
  // Description
  p.fill(220, 220, 220);
  p.textSize(14);
  const desc = [
    "Your warrior automatically battles through endless zones!",
    "Collect rewards, upgrade stats, and equip powerful gear.",
    "Progress through zones and defeat bosses to become legendary!"
  ];
  
  for (let i = 0; i < desc.length; i++) {
    p.text(desc[i], CANVAS_WIDTH / 2, 160 + i * 22);
  }
  
  // Controls
  p.fill(150, 255, 150);
  p.textSize(13);
  p.text("CONTROLS:", CANVAS_WIDTH / 2, 250);
  
  p.fill(200, 200, 200);
  p.textSize(12);
  const controls = [
    "SPACE: Collect notifications",
    "← →: Switch Combat/Upgrade screens",
    "↑ ↓: Navigate upgrade menu",
    "Z: Purchase upgrade",
    "ESC: Pause  |  R: Restart"
  ];
  
  for (let i = 0; i < controls.length; i++) {
    p.text(controls[i], CANVAS_WIDTH / 2, 275 + i * 18);
  }
  
  // Start prompt
  const pulseAlpha = 150 + Math.sin(Date.now() / 300) * 105;
  p.fill(255, 255, 100, pulseAlpha);
  p.textSize(18);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
  
  p.pop();
}

export function drawPlayingScreen(p) {
  p.background(30, 25, 40);
  
  if (gameState.currentScreen === SCREENS.COMBAT) {
    drawCombatScreen(p);
  } else if (gameState.currentScreen === SCREENS.UPGRADE) {
    drawUpgradeScreen(p);
  }
  
  // Draw HUD (always visible)
  drawHUD(p);
  
  // Draw notifications
  drawNotifications(p);
}

function drawCombatScreen(p) {
  // Screen title
  p.push();
  p.fill(255, 200, 100);
  p.textSize(18);
  p.textAlign(p.CENTER);
  p.text("⚔️ COMBAT ⚔️", CANVAS_WIDTH / 2, 25);
  p.pop();
  
  // Combat area
  const combatY = 50;
  const combatHeight = 200;
  
  // Player
  drawPlayer(p, 150, combatY + combatHeight / 2);
  
  // Enemy
  if (gameState.combat.enemy) {
    drawEnemy(p, 450, combatY + combatHeight / 2, gameState.combat.enemy);
  }
  
  // Combat log
  drawCombatLog(p, 10, 260, CANVAS_WIDTH - 20, 90);
}

function drawPlayer(p, x, y) {
  const player = gameState.player;
  
  p.push();
  
  // Shadow
  p.fill(0, 0, 0, 60);
  p.ellipse(x, y + 45, 50, 15);
  
  // Body animation (idle bounce)
  const bounce = Math.sin(Date.now() / 300) * 3;
  y += bounce;
  
  // Body (warrior)
  p.fill(100, 150, 255);
  p.rect(x - 15, y - 10, 30, 40, 5);
  
  // Head
  p.fill(255, 220, 180);
  p.circle(x, y - 25, 25);
  
  // Helmet
  p.fill(150, 150, 150);
  p.arc(x, y - 25, 28, 25, p.PI, p.TWO_PI);
  p.fill(200, 180, 50);
  p.rect(x - 2, y - 37, 4, 8);
  
  // Eyes
  p.fill(50, 50, 50);
  p.circle(x - 5, y - 26, 3);
  p.circle(x + 5, y - 26, 3);
  
  // Weapon
  p.fill(180, 180, 180);
  p.rect(x + 18, y - 5, 8, 35, 2);
  p.fill(200, 180, 50);
  p.rect(x + 18, y + 30, 8, 8);
  
  // HP Bar
  drawBar(p, x - 30, y + 50, 60, 8, player.hp, player.maxHp, [255, 50, 50], [200, 50, 50]);
  
  p.fill(255);
  p.textSize(10);
  p.textAlign(p.CENTER);
  p.text(`Lv.${player.level}`, x, y + 70);
  
  p.pop();
}

function drawEnemy(p, x, y, enemy) {
  p.push();
  
  // Shadow
  p.fill(0, 0, 0, 60);
  p.ellipse(x, y + 45, 50, 15);
  
  // Animation
  const bounce = Math.sin(Date.now() / 400) * 2;
  y += bounce;
  
  // Determine color based on type
  let bodyColor = [255, 100, 100];
  if (enemy.isBoss) {
    bodyColor = [150, 50, 200];
    // Boss crown
    p.fill(255, 215, 0);
    p.triangle(x - 15, y - 35, x, y - 45, x + 15, y - 35);
  }
  
  // Body
  p.fill(...bodyColor);
  p.rect(x - 15, y - 10, 30, 40, 5);
  
  // Head (more monster-like)
  p.fill(bodyColor[0] - 30, bodyColor[1] - 30, bodyColor[2] - 30);
  p.circle(x, y - 25, 28);
  
  // Eyes (red glowing)
  p.fill(255, 0, 0);
  p.circle(x - 6, y - 26, 6);
  p.circle(x + 6, y - 26, 6);
  
  // Fangs
  p.fill(255, 255, 255);
  p.triangle(x - 8, y - 18, x - 5, y - 12, x - 2, y - 18);
  p.triangle(x + 2, y - 18, x + 5, y - 12, x + 8, y - 18);
  
  // HP Bar
  drawBar(p, x - 30, y + 50, 60, 8, enemy.hp, enemy.maxHp, [100, 255, 100], [50, 200, 50]);
  
  // Name
  p.fill(255);
  p.textSize(10);
  p.textAlign(p.CENTER);
  p.text(enemy.name, x, y + 70);
  
  p.pop();
}

function drawBar(p, x, y, width, height, current, max, fillColor, bgColor) {
  p.push();
  
  // Background
  p.fill(...bgColor);
  p.rect(x, y, width, height, 3);
  
  // Fill
  const fillWidth = (current / max) * width;
  p.fill(...fillColor);
  p.rect(x, y, fillWidth, height, 3);
  
  // Border
  p.noFill();
  p.stroke(0);
  p.strokeWeight(1);
  p.rect(x, y, width, height, 3);
  
  p.pop();
}

function drawCombatLog(p, x, y, width, height) {
  p.push();
  
  // Background
  p.fill(20, 15, 30, 200);
  p.rect(x, y, width, height, 5);
  
  // Title
  p.fill(200, 200, 255);
  p.textSize(12);
  p.textAlign(p.LEFT);
  p.text("Combat Log:", x + 5, y + 15);
  
  // Log entries
  p.fill(220, 220, 220);
  p.textSize(10);
  
  const maxEntries = 5;
  const startIndex = Math.max(0, gameState.combatLog.length - maxEntries);
  const entries = gameState.combatLog.slice(startIndex);
  
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    p.text(entry.message, x + 5, y + 33 + i * 13);
  }
  
  p.pop();
}

function drawUpgradeScreen(p) {
  // Screen title
  p.push();
  p.fill(200, 255, 150);
  p.textSize(18);
  p.textAlign(p.CENTER);
  p.text("📈 UPGRADES 📈", CANVAS_WIDTH / 2, 25);
  p.pop();
  
  const menu = gameState.upgradeMenu;
  const startY = 50;
  const itemHeight = 50;
  const visibleItems = 6;
  
  // Draw upgrade items
  for (let i = 0; i < visibleItems; i++) {
    const index = menu.scrollOffset + i;
    if (index >= menu.upgrades.length) break;
    
    const upgrade = menu.upgrades[index];
    const y = startY + i * itemHeight;
    const isSelected = index === menu.selectedIndex;
    const canAfford = gameState.player.gold >= upgrade.cost;
    
    drawUpgradeItem(p, 20, y, CANVAS_WIDTH - 40, itemHeight - 5, upgrade, isSelected, canAfford);
  }
  
  // Instructions
  p.push();
  p.fill(200, 200, 200);
  p.textSize(11);
  p.textAlign(p.CENTER);
  p.text("↑↓: Navigate  |  Z: Purchase  |  ←→: Switch Screen", CANVAS_WIDTH / 2, 370);
  p.pop();
}

function drawUpgradeItem(p, x, y, width, height, upgrade, selected, canAfford) {
  p.push();
  
  // Background
  if (selected) {
    p.fill(100, 150, 255, 100);
  } else {
    p.fill(40, 35, 50, 150);
  }
  p.rect(x, y, width, height, 5);
  
  // Border
  if (selected) {
    p.stroke(150, 200, 255);
    p.strokeWeight(2);
    p.noFill();
    p.rect(x, y, width, height, 5);
  }
  
  // Name
  p.fill(canAfford ? 255 : 150);
  p.textSize(14);
  p.textAlign(p.LEFT);
  p.text(upgrade.name, x + 10, y + 20);
  
  // Cost
  p.fill(canAfford ? [255, 215, 0] : [150, 150, 150]);
  p.textSize(12);
  p.text(`${upgrade.cost} Gold`, x + 10, y + 38);
  
  // Effect preview
  p.fill(200, 200, 200);
  p.textSize(11);
  p.textAlign(p.RIGHT);
  const effectText = `+${upgrade.value} ${upgrade.stat.toUpperCase()}`;
  p.text(effectText, x + width - 10, y + 28);
  
  p.pop();
}

function drawHUD(p) {
  p.push();
  
  // Top bar background
  p.fill(20, 15, 30, 230);
  p.rect(0, 0, CANVAS_WIDTH, 40);
  
  // Player stats
  p.fill(255, 215, 0);
  p.textSize(13);
  p.textAlign(p.LEFT);
  p.text(`💰 ${gameState.player.gold}`, 10, 15);
  p.text(`⚔️ ${gameState.player.attack}`, 10, 30);
  
  p.text(`🛡️ ${gameState.player.defense}`, 110, 15);
  p.text(`❤️ ${gameState.player.hp}/${gameState.player.maxHp}`, 110, 30);
  
  // Level and EXP
  p.fill(200, 150, 255);
  p.textAlign(p.CENTER);
  p.text(`Lv.${gameState.player.level}`, CANVAS_WIDTH / 2, 15);
  
  // EXP bar
  const expBarWidth = 100;
  const expBarX = CANVAS_WIDTH / 2 - expBarWidth / 2;
  drawBar(p, expBarX, 20, expBarWidth, 8, gameState.player.exp, gameState.player.expToLevel, [150, 100, 255], [80, 50, 120]);
  
  // Zone info
  p.fill(255, 150, 150);
  p.textAlign(p.RIGHT);
  p.text(`Zone ${gameState.currentZone}`, CANVAS_WIDTH - 10, 15);
  p.text(`Progress: ${gameState.zoneProgress}/10`, CANVAS_WIDTH - 10, 30);
  
  p.pop();
}

function drawNotifications(p) {
  const notifications = gameState.notifications.filter(n => !n.collected);
  
  for (let i = 0; i < notifications.length; i++) {
    const notif = notifications[i];
    const x = CANVAS_WIDTH - 120;
    const y = 50 + i * 70;
    
    drawNotification(p, x, y, notif);
  }
}

function drawNotification(p, x, y, notification) {
  p.push();
  
  // Pulse animation
  const pulse = 1 + Math.sin(Date.now() / 200) * 0.1;
  const alpha = 200 + Math.sin(Date.now() / 300) * 55;
  
  // Background
  p.fill(255, 215, 0, alpha);
  p.rect(x - 2, y - 2, 104, 54, 8);
  
  p.fill(50, 40, 70, 220);
  p.rect(x, y, 100, 50, 8);
  
  // Content
  p.fill(255, 255, 255);
  p.textSize(11);
  p.textAlign(p.CENTER);
  p.text("💎 REWARD!", x + 50, y + 15);
  
  p.textSize(10);
  if (notification.rewards.gold) {
    p.fill(255, 215, 0);
    p.text(`+${notification.rewards.gold}g`, x + 50, y + 28);
  }
  if (notification.rewards.exp) {
    p.fill(200, 150, 255);
    p.text(`+${notification.rewards.exp} exp`, x + 50, y + 40);
  }
  
  // Press SPACE hint
  p.fill(150, 255, 150);
  p.textSize(9);
  p.text("SPACE", x + 50, y + 50);
  
  p.pop();
}

export function drawPausedScreen(p) {
  drawPlayingScreen(p);
  
  // Overlay
  p.push();
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 255, 255);
  p.textSize(12);
  p.textAlign(p.RIGHT, p.TOP);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  p.text("GAME PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  p.textSize(14);
  p.text("Press ESC to Resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
  
  p.pop();
}

export function drawGameOverScreen(p) {
  p.background(20, 15, 30);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  // Title
  if (isWin) {
    p.fill(255, 215, 0);
    p.textSize(48);
    p.text("🏆 VICTORY! 🏆", CANVAS_WIDTH / 2, 100);
    
    p.fill(200, 255, 200);
    p.textSize(20);
    p.text("You are the ultimate warrior!", CANVAS_WIDTH / 2, 150);
  } else {
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text("DEFEATED", CANVAS_WIDTH / 2, 100);
  }
  
  // Stats
  p.fill(220, 220, 220);
  p.textSize(16);
  p.text(`Final Level: ${gameState.player.level}`, CANVAS_WIDTH / 2, 200);
  p.text(`Zones Cleared: ${gameState.zonesCleared}`, CANVAS_WIDTH / 2, 225);
  p.text(`Enemies Defeated: ${gameState.enemiesDefeated}`, CANVAS_WIDTH / 2, 250);
  p.text(`Bosses Defeated: ${gameState.bossesDefeated}`, CANVAS_WIDTH / 2, 275);
  p.text(`Gold Collected: ${gameState.player.gold}`, CANVAS_WIDTH / 2, 300);
  
  // Restart prompt
  const pulseAlpha = 150 + Math.sin(Date.now() / 300) * 105;
  p.fill(255, 255, 100, pulseAlpha);
  p.textSize(18);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 360);
  
  p.pop();
}