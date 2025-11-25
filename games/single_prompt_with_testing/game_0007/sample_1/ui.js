// UI rendering for all game screens

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, PHASE_START, PHASE_PLAYING, PHASE_PAUSED } from './globals.js';

export function renderStartScreen(p) {
  // Animated background
  renderAnimatedBackground(p);
  
  // Title with vintage cartoon style
  p.push();
  
  // Title shadow
  p.fill(...COLORS.UI_SHADOW);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(60);
  p.textStyle(p.BOLD);
  p.text('CUPHEAD', CANVAS_WIDTH / 2 + 3, 80 + 3);
  
  // Title
  p.fill(...COLORS.CUP_RED);
  p.stroke(...COLORS.CUP_WHITE);
  p.strokeWeight(4);
  p.text('CUPHEAD', CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.noStroke();
  p.fill(...COLORS.UI_TEXT);
  p.textSize(20);
  p.textStyle(p.NORMAL);
  p.text('RUN & GUN', CANVAS_WIDTH / 2, 120);
  
  // Description box
  p.fill(0, 0, 0, 150);
  p.rect(50, 150, CANVAS_WIDTH - 100, 140, 10);
  
  // Game description
  p.fill(...COLORS.UI_TEXT);
  p.textSize(14);
  p.textAlign(p.CENTER, p.TOP);
  const desc = "Battle through intense boss fights!\n\nDodge projectiles, dash to avoid danger,\nand shoot your way to victory.\n\nCollect power-ups and master the parry\nto overcome challenging attack patterns!";
  p.text(desc, CANVAS_WIDTH / 2, 160);
  
  // Start prompt (blinking)
  if (Math.floor(gameState.frameCount / 30) % 2 === 0) {
    p.fill(...COLORS.PARTICLE_YELLOW);
    p.textSize(24);
    p.textStyle(p.BOLD);
    p.textAlign(p.CENTER, p.CENTER);
    p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 330);
  }
  
  // Controls hint
  p.fill(200, 200, 200);
  p.textSize(11);
  p.textStyle(p.NORMAL);
  p.text('←→ Move | SPACE Shoot | SHIFT Dash | Z Parry', CANVAS_WIDTH / 2, 370);
  
  p.pop();
}

export function renderGameUI(p) {
  p.push();
  
  // Score
  p.fill(...COLORS.UI_SHADOW);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(22);
  p.textStyle(p.BOLD);
  p.text(`SCORE: ${gameState.score}`, 12, 12);
  
  p.fill(...COLORS.PARTICLE_YELLOW);
  p.text(`SCORE: ${gameState.score}`, 10, 10);
  
  // Lives
  p.fill(...COLORS.UI_SHADOW);
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`LIVES: ${gameState.lives}`, CANVAS_WIDTH - 8, 12);
  
  p.fill(...COLORS.CUP_RED);
  p.text(`LIVES: ${gameState.lives}`, CANVAS_WIDTH - 10, 10);
  
  // Player health bar
  if (gameState.player && !gameState.player.isDead) {
    const barWidth = 200;
    const barHeight = 20;
    const barX = 10;
    const barY = 40;
    const healthPercent = gameState.player.health / gameState.player.maxHealth;
    
    // Background
    p.fill(80, 0, 0);
    p.noStroke();
    p.rect(barX, barY, barWidth, barHeight, 5);
    
    // Health fill
    const healthColor = healthPercent > 0.5 ? COLORS.HEALTH_GREEN : 
                       healthPercent > 0.25 ? COLORS.PARTICLE_YELLOW : COLORS.HEALTH_RED;
    p.fill(...healthColor);
    p.rect(barX, barY, barWidth * healthPercent, barHeight, 5);
    
    // Border
    p.noFill();
    p.stroke(...COLORS.UI_TEXT);
    p.strokeWeight(2);
    p.rect(barX, barY, barWidth, barHeight, 5);
    
    // HP text
    p.fill(...COLORS.UI_TEXT);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text(`HP ${Math.ceil(gameState.player.health)}/${gameState.player.maxHealth}`, 
           barX + barWidth / 2, barY + barHeight / 2);
  }
  
  // Cooldown indicators
  const cooldownY = 70;
  
  // Dash cooldown
  if (gameState.dashCooldown > 0) {
    const cooldownPercent = gameState.dashCooldown / 60;
    p.fill(100, 100, 100, 150);
    p.rect(10, cooldownY, 60, 8);
    p.fill(...COLORS.CUP_BLUE);
    p.rect(10, cooldownY, 60 * (1 - cooldownPercent), 8);
    
    p.fill(...COLORS.UI_TEXT);
    p.textSize(10);
    p.textAlign(p.LEFT, p.TOP);
    p.text('DASH', 10, cooldownY - 12);
  }
  
  // Parry cooldown
  if (gameState.parryCooldown > 0) {
    const cooldownPercent = gameState.parryCooldown / 30;
    p.fill(100, 100, 100, 150);
    p.rect(80, cooldownY, 60, 8);
    p.fill(...COLORS.PARTICLE_YELLOW);
    p.rect(80, cooldownY, 60 * (1 - cooldownPercent), 8);
    
    p.fill(...COLORS.UI_TEXT);
    p.textSize(10);
    p.textAlign(p.LEFT, p.TOP);
    p.text('PARRY', 80, cooldownY - 12);
  }
  
  // Boss phase indicator
  if (gameState.boss && !gameState.boss.isDead) {
    p.fill(...COLORS.UI_SHADOW);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(18);
    p.text(`BOSS PHASE ${gameState.bossPhase}/${gameState.boss.maxPhases}`, 
           CANVAS_WIDTH / 2 + 1, 11);
    
    p.fill(...COLORS.BOSS_PINK);
    p.text(`BOSS PHASE ${gameState.bossPhase}/${gameState.boss.maxPhases}`, 
           CANVAS_WIDTH / 2, 10);
  }
  
  p.pop();
}

export function renderPausedOverlay(p) {
  p.push();
  
  // Semi-transparent overlay
  p.fill(0, 0, 0, 180);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Paused text
  p.fill(...COLORS.UI_SHADOW);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(60);
  p.textStyle(p.BOLD);
  p.text('PAUSED', CANVAS_WIDTH / 2 + 2, CANVAS_HEIGHT / 2 - 18);
  
  p.fill(...COLORS.PARTICLE_YELLOW);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  
  // Resume instruction
  p.fill(...COLORS.UI_TEXT);
  p.textSize(20);
  p.textStyle(p.NORMAL);
  p.text('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
  
  // Stats
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  const statsX = 150;
  const statsY = CANVAS_HEIGHT / 2 + 70;
  
  p.text(`Score: ${gameState.score}`, statsX, statsY);
  p.text(`Lives: ${gameState.lives}`, statsX, statsY + 20);
  p.text(`Damage Dealt: ${Math.round(gameState.damageDealt)}`, statsX, statsY + 40);
  p.text(`Shots Fired: ${gameState.projectilesShot}`, statsX, statsY + 60);
  p.text(`Successful Parries: ${gameState.successfulParries}`, statsX, statsY + 80);
  
  p.pop();
}

export function renderGameOverScreen(p, isWin) {
  p.push();
  
  // Dark overlay
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  if (isWin) {
    // Victory screen
    p.fill(...COLORS.UI_SHADOW);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(60);
    p.textStyle(p.BOLD);
    p.text('KNOCKOUT!', CANVAS_WIDTH / 2 + 2, 80 + 2);
    
    p.fill(...COLORS.PARTICLE_YELLOW);
    p.text('KNOCKOUT!', CANVAS_WIDTH / 2, 80);
    
    p.fill(...COLORS.HEALTH_GREEN);
    p.textSize(28);
    p.text('YOU WIN!', CANVAS_WIDTH / 2, 130);
    
    // Victory stats
    p.fill(...COLORS.UI_TEXT);
    p.textSize(18);
    p.textAlign(p.CENTER, p.TOP);
    
    const statsY = 180;
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, statsY);
    p.text(`Lives Remaining: ${gameState.lives}`, CANVAS_WIDTH / 2, statsY + 30);
    p.text(`Total Damage: ${Math.round(gameState.damageDealt)}`, CANVAS_WIDTH / 2, statsY + 60);
    p.text(`Successful Parries: ${gameState.successfulParries}`, CANVAS_WIDTH / 2, statsY + 90);
    
    // Rank
    let rank = 'C';
    if (gameState.score > 2000 && gameState.successfulParries > 5) rank = 'S';
    else if (gameState.score > 1500) rank = 'A';
    else if (gameState.score > 1000) rank = 'B';
    
    p.textSize(80);
    p.fill(...COLORS.PARTICLE_YELLOW);
    p.text(`RANK: ${rank}`, CANVAS_WIDTH / 2, statsY + 130);
    
  } else {
    // Game over screen
    p.fill(...COLORS.UI_SHADOW);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(60);
    p.textStyle(p.BOLD);
    p.text('GAME OVER', CANVAS_WIDTH / 2 + 2, 100 + 2);
    
    p.fill(...COLORS.HEALTH_RED);
    p.text('GAME OVER', CANVAS_WIDTH / 2, 100);
    
    p.fill(...COLORS.UI_TEXT);
    p.textSize(20);
    p.textAlign(p.CENTER, p.TOP);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);
    
    if (gameState.boss) {
      const bossHealthPercent = Math.round((gameState.boss.health / gameState.boss.maxHealth) * 100);
      p.text(`Boss Health Remaining: ${bossHealthPercent}%`, CANVAS_WIDTH / 2, 210);
    }
  }
  
  // Restart instruction (blinking)
  if (Math.floor(gameState.frameCount / 30) % 2 === 0) {
    p.fill(...COLORS.PARTICLE_YELLOW);
    p.textSize(24);
    p.textStyle(p.BOLD);
    p.textAlign(p.CENTER, p.CENTER);
    p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
  }
  
  p.pop();
}

function renderAnimatedBackground(p) {
  // Gradient background
  for (let i = 0; i < CANVAS_HEIGHT; i++) {
    const inter = i / CANVAS_HEIGHT;
    const r = p.lerp(COLORS.SKY_TOP[0], COLORS.SKY_BOTTOM[0], inter);
    const g = p.lerp(COLORS.SKY_TOP[1], COLORS.SKY_BOTTOM[1], inter);
    const b = p.lerp(COLORS.SKY_TOP[2], COLORS.SKY_BOTTOM[2], inter);
    
    p.stroke(r, g, b);
    p.line(0, i, CANVAS_WIDTH, i);
  }
  
  // Animated clouds
  for (let i = 0; i < 5; i++) {
    const x = ((gameState.frameCount * 0.5 + i * 150) % (CANVAS_WIDTH + 100)) - 50;
    const y = 50 + i * 30;
    
    p.fill(255, 255, 255, 150);
    p.noStroke();
    p.ellipse(x, y, 60, 30);
    p.ellipse(x + 20, y, 50, 25);
    p.ellipse(x - 20, y, 50, 25);
  }
  
  // Ground
  p.fill(...COLORS.GROUND);
  p.rect(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 50);
  
  // Ground pattern
  p.fill(...COLORS.GROUND_HIGHLIGHT);
  for (let i = 0; i < CANVAS_WIDTH; i += 20) {
    p.rect(i, CANVAS_HEIGHT - 50, 10, 50);
  }
}

export function renderBackground(p) {
  // Gradient background
  for (let i = 0; i < CANVAS_HEIGHT; i++) {
    const inter = i / CANVAS_HEIGHT;
    const r = p.lerp(COLORS.SKY_TOP[0], COLORS.SKY_BOTTOM[0], inter);
    const g = p.lerp(COLORS.SKY_TOP[1], COLORS.SKY_BOTTOM[1], inter);
    const b = p.lerp(COLORS.SKY_TOP[2], COLORS.SKY_BOTTOM[2], inter);
    
    p.stroke(r, g, b);
    p.line(0, i, CANVAS_WIDTH, i);
  }
  
  // Scrolling clouds
  gameState.bgOffset = (gameState.bgOffset + 0.3) % (CANVAS_WIDTH + 100);
  
  for (let i = 0; i < 5; i++) {
    const x = ((gameState.bgOffset + i * 150) % (CANVAS_WIDTH + 100)) - 50;
    const y = 50 + i * 30;
    
    p.fill(255, 255, 255, 150);
    p.noStroke();
    p.ellipse(x, y, 60, 30);
    p.ellipse(x + 20, y, 50, 25);
    p.ellipse(x - 20, y, 50, 25);
  }
  
  // Ground
  p.fill(...COLORS.GROUND);
  p.rect(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 50);
  
  // Ground pattern
  p.fill(...COLORS.GROUND_HIGHLIGHT);
  for (let i = 0; i < CANVAS_WIDTH; i += 20) {
    p.rect(i, CANVAS_HEIGHT - 50, 10, 50);
  }
}