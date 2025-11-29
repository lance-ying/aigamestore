// ui.js - UI rendering and game screens

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';

export function renderStartScreen(p) {
  // Sky gradient background
  for (let i = 0; i < CANVAS_HEIGHT; i++) {
    const inter = i / CANVAS_HEIGHT;
    const c = p.lerpColor(
      p.color(40, 80, 140),
      p.color(20, 40, 80),
      inter
    );
    p.stroke(c);
    p.line(0, i, CANVAS_WIDTH, i);
  }
  
  // Castle silhouette in background
  p.fill(20, 20, 40, 150);
  p.noStroke();
  p.rect(CANVAS_WIDTH / 2 - 80, CANVAS_HEIGHT - 150, 160, 150);
  p.triangle(CANVAS_WIDTH / 2 - 80, CANVAS_HEIGHT - 150,
             CANVAS_WIDTH / 2, CANVAS_HEIGHT - 200,
             CANVAS_WIDTH / 2 + 80, CANVAS_HEIGHT - 150);
  
  // Title with shadow
  p.textAlign(p.CENTER, p.CENTER);
  
  // Shadow
  p.fill(...COLORS.uiShadow);
  p.textSize(52);
  p.text('SHOVEL KNIGHT', CANVAS_WIDTH / 2 + 3, 80 + 3);
  
  // Title
  p.fill(70, 160, 230);
  p.textSize(52);
  p.text('SHOVEL KNIGHT', CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(200, 180, 140);
  p.textSize(20);
  p.text('Treasure Quest', CANVAS_WIDTH / 2, 120);
  
  // Instructions box
  p.fill(20, 20, 40, 200);
  p.rect(CANVAS_WIDTH / 2 - 180, 160, 360, 140, 5);
  
  p.fill(255);
  p.textSize(16);
  p.textAlign(p.LEFT, p.TOP);
  
  const instructions = [
    'Collect all gems to complete your quest!',
    '',
    'ARROW KEYS - Move left/right',
    'SPACE - Jump (double jump available)',
    'Z - Attack with Shovel Blade',
    'DOWN (in air) - Shovel Drop attack'
  ];
  
  for (let i = 0; i < instructions.length; i++) {
    p.text(instructions[i], CANVAS_WIDTH / 2 - 160, 175 + i * 20);
  }
  
  // Start prompt (pulsing)
  const pulseAlpha = (Math.sin(gameState.frameCount * 0.1) + 1) * 0.5;
  p.fill(255, 220, 0, pulseAlpha * 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 340);
  
  // Small gems decoration
  for (let i = 0; i < 5; i++) {
    const x = CANVAS_WIDTH / 2 - 100 + i * 50;
    const y = 340 + Math.sin(gameState.frameCount * 0.05 + i) * 5;
    p.push();
    p.translate(x - 150, y);
    p.rotate(gameState.frameCount * 0.02 + i);
    p.fill(255, 220, 0);
    p.noStroke();
    p.star(0, 0, 6, 3, 5);
    p.pop();
  }
}

export function renderUI(p) {
  // Semi-transparent background for HUD
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 50);
  
  // Score
  p.fill(...COLORS.ui);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(18);
  p.text(`Score: ${gameState.score}`, 15, 15);
  
  // Gems collected
  p.push();
  p.translate(150, 25);
  p.rotate(gameState.frameCount * 0.05);
  p.fill(255, 220, 0);
  p.noStroke();
  p.star(0, 0, 8, 4, 5);
  p.pop();
  
  p.fill(...COLORS.ui);
  p.textAlign(p.LEFT, p.CENTER);
  p.text(`${gameState.gemsCollected} / ${gameState.totalGems}`, 165, 25);
  
  // Health bar
  if (gameState.player) {
    const barWidth = 150;
    const barHeight = 20;
    const barX = CANVAS_WIDTH - barWidth - 15;
    const barY = 15;
    const healthRatio = gameState.player.health / gameState.player.maxHealth;
    
    // Background
    p.fill(...COLORS.healthBg);
    p.rect(barX, barY, barWidth, barHeight, 3);
    
    // Health fill (gradient effect)
    const healthColor = healthRatio > 0.5 ? 
      p.lerpColor(p.color(255, 220, 0), p.color(0, 255, 0), (healthRatio - 0.5) * 2) :
      p.lerpColor(p.color(255, 0, 0), p.color(255, 220, 0), healthRatio * 2);
    
    p.fill(healthColor);
    p.rect(barX, barY, barWidth * healthRatio, barHeight, 3);
    
    // Border
    p.noFill();
    p.stroke(255);
    p.strokeWeight(2);
    p.rect(barX, barY, barWidth, barHeight, 3);
    
    // Health text
    p.fill(...COLORS.ui);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text(`HP: ${Math.ceil(gameState.player.health)}`, barX + barWidth / 2, barY + barHeight / 2);
  }
}

export function renderPausedOverlay(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 180);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Paused box
  p.fill(20, 20, 40, 230);
  p.rect(CANVAS_WIDTH / 2 - 150, CANVAS_HEIGHT / 2 - 80, 300, 160, 10);
  
  // Paused text
  p.fill(255, 220, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  
  p.fill(255);
  p.textSize(20);
  p.text('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  p.textSize(16);
  p.text('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
}

export function renderGameOver(p) {
  // Background overlay
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  // Result box
  const boxColor = isWin ? p.color(20, 60, 20, 230) : p.color(60, 20, 20, 230);
  p.fill(boxColor);
  p.rect(CANVAS_WIDTH / 2 - 180, CANVAS_HEIGHT / 2 - 100, 360, 200, 10);
  
  // Title
  const titleColor = isWin ? p.color(100, 255, 100) : p.color(255, 100, 100);
  p.fill(titleColor);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? 'VICTORY!' : 'DEFEATED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
  
  // Message
  p.fill(255);
  p.textSize(18);
  if (isWin) {
    p.text('All treasures collected!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    p.text('Shovelry prevails!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 5);
  } else {
    p.text('The quest continues...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
  }
  
  // Stats
  p.textSize(16);
  p.fill(255, 220, 0);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 35);
  p.fill(255);
  p.textSize(14);
  p.text(`Gems: ${gameState.gemsCollected} | Enemies: ${gameState.enemiesDefeated}`, 
         CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 55);
  
  // Restart instruction (pulsing)
  const pulseAlpha = (Math.sin(gameState.frameCount * 0.1) + 1) * 0.5;
  p.fill(255, 255, 255, pulseAlpha * 255);
  p.textSize(20);
  p.text('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 85);
}

export function renderBackground(p) {
  // Sky gradient
  for (let i = 0; i < CANVAS_HEIGHT; i++) {
    const inter = i / CANVAS_HEIGHT;
    const c = p.lerpColor(
      p.color(...COLORS.sky),
      p.color(30, 60, 100),
      inter
    );
    p.stroke(c);
    p.line(0, i, CANVAS_WIDTH, i);
  }
  
  // Clouds
  p.noStroke();
  p.fill(255, 255, 255, 100);
  const cloudOffset = (gameState.frameCount * 0.2) % (CANVAS_WIDTH + 200);
  
  // Cloud 1
  p.circle(cloudOffset - 100, 60, 30);
  p.circle(cloudOffset - 80, 55, 40);
  p.circle(cloudOffset - 60, 60, 30);
  
  // Cloud 2
  p.circle(cloudOffset + 100, 100, 25);
  p.circle(cloudOffset + 120, 95, 35);
  p.circle(cloudOffset + 140, 100, 25);
  
  // Mountains in background
  p.fill(40, 60, 80, 150);
  p.triangle(0, CANVAS_HEIGHT - 100, 150, CANVAS_HEIGHT - 250, 300, CANVAS_HEIGHT - 100);
  p.triangle(200, CANVAS_HEIGHT - 100, 400, CANVAS_HEIGHT - 200, 600, CANVAS_HEIGHT - 100);
  
  // Ground
  p.fill(...COLORS.ground);
  p.rect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
  
  // Ground texture
  p.stroke(70, 50, 30);
  p.strokeWeight(1);
  for (let i = 0; i < CANVAS_WIDTH; i += 15) {
    p.line(i, GROUND_Y, i + 10, CANVAS_HEIGHT);
  }
  for (let j = GROUND_Y; j < CANVAS_HEIGHT; j += 10) {
    p.line(0, j, CANVAS_WIDTH, j);
  }
}

// Helper for star drawing (already in entities.js but needed here for decorations)
p5.prototype.star = function(x, y, radius1, radius2, npoints) {
  const angle = (Math.PI * 2) / npoints;
  const halfAngle = angle / 2.0;
  this.beginShape();
  for (let a = -Math.PI / 2; a < Math.PI * 2 - Math.PI / 2; a += angle) {
    let sx = x + Math.cos(a) * radius1;
    let sy = y + Math.sin(a) * radius1;
    this.vertex(sx, sy);
    sx = x + Math.cos(a + halfAngle) * radius2;
    sy = y + Math.sin(a + halfAngle) * radius2;
    this.vertex(sx, sy);
  }
  this.endShape(this.CLOSE);
};