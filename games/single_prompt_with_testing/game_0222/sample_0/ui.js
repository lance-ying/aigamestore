// ui.js - UI rendering

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, NEON_CYAN, NEON_PINK, NEON_PURPLE, NEON_ORANGE } from './globals.js';

export function renderStartScreen(p) {
  p.background(10, 5, 20);
  
  // Animated background
  for (let i = 0; i < 50; i++) {
    const x = (i * 50 + p.frameCount) % CANVAS_WIDTH;
    const y = Math.sin(i + p.frameCount * 0.01) * 100 + CANVAS_HEIGHT / 2;
    p.fill(...NEON_CYAN, 30);
    p.noStroke();
    p.circle(x, y, 20);
  }
  
  // Title with glow
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.fill(...NEON_PINK);
  p.text('TURBO OVERKILL', CANVAS_WIDTH / 2 + 2, 60 + 2);
  p.fill(...NEON_CYAN);
  p.text('TURBO OVERKILL', CANVAS_WIDTH / 2, 60);
  
  // Subtitle
  p.textSize(16);
  p.fill(...NEON_PURPLE);
  p.text('PARADISE PROTOCOL', CANVAS_WIDTH / 2, 95);
  
  // Instructions
  p.textSize(14);
  p.fill(200);
  p.text('Johnny Turbo is back!', CANVAS_WIDTH / 2, 140);
  p.text('The AI Syn has corrupted Paradise', CANVAS_WIDTH / 2, 160);
  p.text('Use your chainsaw leg and arm rockets', CANVAS_WIDTH / 2, 180);
  p.text('to eliminate all hostiles!', CANVAS_WIDTH / 2, 195);
  
  // Controls
  p.textSize(12);
  p.fill(...NEON_CYAN);
  p.text('← → : Move', CANVAS_WIDTH / 2 - 100, 240);
  p.text('SPACE: Jump', CANVAS_WIDTH / 2 - 100, 255);
  p.text('SHIFT: Dash', CANVAS_WIDTH / 2 - 100, 270);
  
  p.text('↓ + ← →: Chainsaw Slide', CANVAS_WIDTH / 2 + 100, 240);
  p.text('Z: Fire Rockets', CANVAS_WIDTH / 2 + 100, 255);
  p.text('ESC: Pause', CANVAS_WIDTH / 2 + 100, 270);
  
  // Start prompt (pulsing)
  const alpha = 128 + Math.sin(p.frameCount * 0.1) * 127;
  p.textSize(20);
  p.fill(...NEON_ORANGE, alpha);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 330);
  
  // Version info
  p.textSize(10);
  p.fill(100);
  p.text('APOGEE SOFTWARE - CYBERPUNK EDITION', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20);
}

export function renderUI(p) {
  if (!gameState.player) return;
  
  // HUD Background
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 60);
  
  // Health bar
  const healthBarX = 10;
  const healthBarY = 10;
  const healthBarWidth = 200;
  const healthBarHeight = 20;
  const healthRatio = gameState.player.health / gameState.player.maxHealth;
  
  p.fill(50, 0, 0);
  p.rect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
  
  p.fill(...NEON_PINK);
  p.rect(healthBarX, healthBarY, healthBarWidth * healthRatio, healthBarHeight);
  
  p.stroke(...NEON_CYAN);
  p.strokeWeight(2);
  p.noFill();
  p.rect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
  
  p.fill(255);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(12);
  p.text(`HP: ${Math.ceil(gameState.player.health)}`, healthBarX + healthBarWidth / 2, healthBarY + healthBarHeight / 2);
  
  // Score and cash
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.fill(...NEON_CYAN);
  p.text(`SCORE: ${gameState.score}`, healthBarX, healthBarY + 30);
  p.fill(...NEON_ORANGE);
  p.text(`CASH: $${gameState.cash}`, healthBarX + 120, healthBarY + 30);
  
  // Wave info
  p.textAlign(p.RIGHT, p.TOP);
  p.fill(...NEON_PURPLE);
  p.textSize(16);
  if (gameState.bossSpawned) {
    p.text('BOSS FIGHT!', CANVAS_WIDTH - 10, 10);
  } else {
    p.text(`WAVE ${gameState.currentWave}/3`, CANVAS_WIDTH - 10, 10);
  }
  
  // Kills
  p.textSize(12);
  p.fill(200);
  p.text(`Kills: ${gameState.kills}`, CANVAS_WIDTH - 10, 30);
  
  // Cooldown indicators
  const cooldownY = healthBarY + 55;
  
  // Dash cooldown
  if (gameState.player.dashCooldown > 0) {
    const dashRatio = 1 - (gameState.player.dashCooldown / 30);
    p.fill(100);
    p.rect(healthBarX, cooldownY, 60, 8);
    p.fill(...NEON_PURPLE);
    p.rect(healthBarX, cooldownY, 60 * dashRatio, 8);
    p.fill(150);
    p.textSize(10);
    p.textAlign(p.LEFT, p.TOP);
    p.text('DASH', healthBarX + 2, cooldownY + 10);
  }
  
  // Rocket cooldown
  if (gameState.player.rocketCooldown > 0) {
    const rocketRatio = 1 - (gameState.player.rocketCooldown / 20);
    p.fill(100);
    p.rect(healthBarX + 70, cooldownY, 60, 8);
    p.fill(...NEON_ORANGE);
    p.rect(healthBarX + 70, cooldownY, 60 * rocketRatio, 8);
    p.fill(150);
    p.textSize(10);
    p.textAlign(p.LEFT, p.TOP);
    p.text('ROCKET', healthBarX + 72, cooldownY + 10);
  }
}

export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.fill(...NEON_CYAN);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  
  p.textSize(20);
  p.fill(200);
  p.text('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  
  p.textSize(14);
  p.fill(150);
  p.text('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
}

export function renderGameOver(p) {
  p.fill(0, 0, 0, 220);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  
  if (isWin) {
    p.fill(...NEON_CYAN);
    p.text('MISSION', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
    p.fill(...NEON_ORANGE);
    p.text('COMPLETE!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    
    p.textSize(16);
    p.fill(200);
    p.text('Paradise has been saved!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    p.text('Syn has been eliminated.', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  } else {
    p.fill(...NEON_PINK);
    p.text('SYSTEM', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
    p.fill(255, 0, 0);
    p.text('FAILURE', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    
    p.textSize(16);
    p.fill(200);
    p.text('Johnny Turbo has fallen...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  }
  
  // Final stats
  p.textSize(20);
  p.fill(...NEON_CYAN);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
  p.fill(...NEON_ORANGE);
  p.text(`Total Kills: ${gameState.kills}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 95);
  p.fill(...NEON_PURPLE);
  p.text(`Cash Earned: $${gameState.cash}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 120);
  
  // Restart prompt
  const alpha = 128 + Math.sin(p.frameCount * 0.1) * 127;
  p.textSize(18);
  p.fill(255, 255, 255, alpha);
  p.text('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}

export function renderBackground(p) {
  // Cyberpunk gradient background
  for (let i = 0; i < CANVAS_HEIGHT; i++) {
    const inter = i / CANVAS_HEIGHT;
    const r = p.lerp(10, 40, inter);
    const g = p.lerp(5, 15, inter);
    const b = p.lerp(20, 50, inter);
    p.stroke(r, g, b);
    p.line(0, i, CANVAS_WIDTH, i);
  }
  
  // Render background buildings
  for (const building of gameState.buildings) {
    building.render(p);
  }
  
  // Grid floor effect
  p.stroke(...NEON_CYAN, 50);
  p.strokeWeight(1);
  for (let i = 0; i < CANVAS_WIDTH; i += 30) {
    const offset = (p.frameCount * 2 + i) % 30;
    p.line(i, CANVAS_HEIGHT - 50, i + offset, CANVAS_HEIGHT);
  }
  
  // Ground
  p.fill(20, 10, 30);
  p.noStroke();
  p.rect(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 50);
  
  // Ground neon line
  p.stroke(...NEON_PINK);
  p.strokeWeight(2);
  p.line(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, CANVAS_HEIGHT - 50);
}