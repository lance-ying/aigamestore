// ui.js - UI rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 20, 40);
  
  // Animated title
  p.push();
  p.translate(CANVAS_WIDTH / 2, 80);
  const pulse = p.sin(p.frameCount * 0.05) * 5;
  p.fill(255, 50, 50);
  p.textAlign(p.CENTER);
  p.textSize(48 + pulse);
  p.textStyle(p.BOLD);
  p.text("BEAT THE BOSS", 0, 0);
  p.pop();
  
  // Description
  p.fill(200, 200, 255);
  p.textAlign(p.CENTER);
  p.textSize(14);
  p.text("Defeat 7 increasingly powerful bosses!", CANVAS_WIDTH / 2, 140);
  p.text("Earn currency to unlock and upgrade weapons!", CANVAS_WIDTH / 2, 160);
  
  // Instructions
  p.fill(255, 255, 100);
  p.textSize(12);
  p.textAlign(p.LEFT);
  const instructionX = 150;
  let instructionY = 200;
  p.text("SPACE: Attack", instructionX, instructionY);
  instructionY += 20;
  p.text("LEFT/RIGHT: Switch Weapons", instructionX, instructionY);
  instructionY += 20;
  p.text("UP: Upgrade Weapon", instructionX, instructionY);
  instructionY += 20;
  p.text("DOWN: Buy New Weapon", instructionX, instructionY);
  instructionY += 20;
  p.text("ESC: Pause", instructionX, instructionY);
  
  // Start prompt
  const startAlpha = 200 + p.sin(p.frameCount * 0.1) * 55;
  p.fill(100, 255, 100, startAlpha);
  p.textAlign(p.CENTER);
  p.textSize(20);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 350);
}

export function renderPausedOverlay(p) {
  p.push();
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 255, 255);
  p.textAlign(p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  p.textSize(16);
  p.textStyle(p.NORMAL);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  p.pop();
}

export function renderGameOver(p) {
  p.background(20, 20, 40);
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  // Title
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text(isWin ? "VICTORY!" : "GAME OVER", CANVAS_WIDTH / 2, 100);
  
  // Stats
  p.fill(255);
  p.textSize(18);
  p.textStyle(p.NORMAL);
  let statsY = 160;
  p.text(`Stages Completed: ${gameState.currentStage - 1}/${gameState.maxStages}`, CANVAS_WIDTH / 2, statsY);
  statsY += 30;
  p.text(`Total Damage: ${gameState.totalDamage}`, CANVAS_WIDTH / 2, statsY);
  statsY += 30;
  p.text(`Total Hits: ${gameState.totalHits}`, CANVAS_WIDTH / 2, statsY);
  statsY += 30;
  p.text(`Currency Earned: ${gameState.currency}`, CANVAS_WIDTH / 2, statsY);
  
  // Restart prompt
  const restartAlpha = 200 + p.sin(p.frameCount * 0.1) * 55;
  p.fill(100, 200, 255, restartAlpha);
  p.textSize(20);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 340);
}

export function renderHUD(p) {
  const weapon = gameState.weapons[gameState.currentWeaponIndex];
  
  // Currency display
  p.fill(255, 215, 0);
  p.textAlign(p.LEFT);
  p.textSize(16);
  p.textStyle(p.BOLD);
  p.text(`💰 ${gameState.currency}`, 10, 25);
  
  // Current weapon display
  p.fill(255);
  p.textSize(14);
  p.text(`Weapon: ${weapon.name} (Lv.${weapon.level || 1})`, 10, 50);
  p.text(`Damage: ${Math.floor(weapon.damage * Math.pow(1.1, (weapon.level || 1) - 1))}`, 10, 70);
  
  // Stage display
  p.textAlign(p.RIGHT);
  p.textSize(16);
  p.text(`Stage ${gameState.currentStage}/${gameState.maxStages}`, CANVAS_WIDTH - 10, 25);
  
  // Attack cooldown bar
  if (gameState.attackCooldown > 0) {
    p.fill(50);
    p.rect(10, CANVAS_HEIGHT - 30, 150, 15, 2);
    p.fill(100, 200, 255);
    const cooldownPercent = 1 - (gameState.attackCooldown / weapon.attackSpeed);
    p.rect(10, CANVAS_HEIGHT - 30, 150 * cooldownPercent, 15, 2);
  }
  
  // Shop hint
  p.fill(200, 200, 200);
  p.textAlign(p.CENTER);
  p.textSize(10);
  p.text("↑ Upgrade  ↓ Buy Weapon  ←→ Switch", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 10);
}

export function renderShopOverlay(p) {
  // Semi-transparent background
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER);
  p.textSize(24);
  p.text("WEAPON SHOP", CANVAS_WIDTH / 2, 40);
  
  // List available weapons
  p.textSize(12);
  p.textAlign(p.LEFT);
  let yPos = 70;
  
  gameState.weapons.forEach((weapon, idx) => {
    if (!weapon.unlocked) {
      p.fill(weapon.color);
      p.text(`${weapon.name} - Cost: ${weapon.cost} (DOWN to buy)`, 50, yPos);
      yPos += 20;
    }
  });
  
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER);
  p.textSize(14);
  p.text("Press SPACE to close", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
}