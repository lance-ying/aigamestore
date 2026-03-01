// ui.js - UI rendering for all game screens

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

// ============================================================================
// START SCREEN
// ============================================================================

export function renderStartScreen(p) {
  p.background(10, 10, 20);
  
  // Animated background
  renderAnimatedBackground(p);
  
  // Title with glow effect
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  // Title glow
  p.fill(100, 200, 255, 100);
  p.noStroke();
  p.textSize(56);
  p.text('BIT BLASTER XL', CANVAS_WIDTH / 2 + 2, CANVAS_HEIGHT / 2 - 78);
  
  // Title text
  p.fill(255, 255, 255);
  p.textSize(54);
  p.text('BIT BLASTER XL', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
  
  // Subtitle
  p.fill(150, 200, 255);
  p.textSize(16);
  p.text('RETRO ARCADE SHOOTER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  
  // Instructions
  p.fill(255);
  p.textSize(14);
  p.text('Survive as long as possible!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  p.text('Auto-fire • Dodge enemies • Collect power-ups', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  
  // Controls
  p.fill(200, 200, 200);
  p.textSize(12);
  p.text('Arrow Keys: Turn & Speed', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
  p.text('Space: Use Special Weapon', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 65);
  
  // Start prompt with pulsing effect
  const pulse = Math.sin(gameState.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(100, 255, 100, pulse * 255);
  p.textSize(20);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
  
  // High score
  if (gameState.highScore > 0) {
    p.fill(255, 200, 100);
    p.textSize(18);
    p.text(`HIGH SCORE: ${gameState.highScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
  }
  
  p.pop();
}

// ============================================================================
// PLAYING SCREEN (HUD)
// ============================================================================

export function renderHUD(p) {
  p.push();
  p.textAlign(p.LEFT, p.TOP);
  
  // Score
  p.fill(255, 255, 255);
  p.textSize(18);
  p.text(`SCORE: ${gameState.score}`, 10, 10);
  
  // Multiplier
  if (gameState.scoreMultiplier > 1) {
    const multiplierColor = p.lerpColor(
      p.color(255, 255, 255),
      p.color(255, 200, 0),
      Math.min(1, (gameState.scoreMultiplier - 1) / 5)
    );
    p.fill(multiplierColor);
    p.text(`x${gameState.scoreMultiplier.toFixed(1)}`, 10, 30);
  }
  
  // Enemies destroyed
  p.fill(200, 200, 200);
  p.textSize(12);
  p.text(`Enemies: ${gameState.enemiesDestroyed}`, 10, 50);
  
  // Health bar
  if (gameState.player) {
    const barX = 10;
    const barY = 70;
    const barWidth = 150;
    const barHeight = 16;
    const healthRatio = gameState.player.health / gameState.player.maxHealth;
    
    // Background
    p.fill(50, 0, 0);
    p.noStroke();
    p.rect(barX, barY, barWidth, barHeight);
    
    // Health fill with color gradient
    const healthColor = p.lerpColor(
      p.color(255, 50, 50),
      p.color(0, 255, 100),
      healthRatio
    );
    p.fill(healthColor);
    p.rect(barX, barY, barWidth * healthRatio, barHeight);
    
    // Border
    p.noFill();
    p.stroke(255);
    p.strokeWeight(2);
    p.rect(barX, barY, barWidth, barHeight);
    
    // Health text
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(11);
    p.text(
      `${Math.ceil(gameState.player.health)}`,
      barX + barWidth / 2,
      barY + barHeight / 2
    );
  }
  
  // Active power-ups
  p.textAlign(p.RIGHT, p.TOP);
  let powerupY = 10;
  
  if (gameState.activePowerups.rapidFire > 0) {
    p.fill(255, 200, 0);
    p.textSize(12);
    p.text(`RAPID FIRE: ${Math.ceil(gameState.activePowerups.rapidFire / 60)}s`, CANVAS_WIDTH - 10, powerupY);
    powerupY += 18;
  }
  
  if (gameState.activePowerups.spreadShot > 0) {
    p.fill(0, 200, 255);
    p.textSize(12);
    p.text(`SPREAD: ${Math.ceil(gameState.activePowerups.spreadShot / 60)}s`, CANVAS_WIDTH - 10, powerupY);
    powerupY += 18;
  }
  
  if (gameState.activePowerups.shield > 0) {
    p.fill(100, 200, 255);
    p.textSize(12);
    p.text(`SHIELD: ${Math.ceil(gameState.activePowerups.shield / 60)}s`, CANVAS_WIDTH - 10, powerupY);
    powerupY += 18;
  }
  
  if (gameState.activePowerups.bomb > 0) {
    p.fill(255, 100, 0);
    p.textSize(12);
    const pulse = Math.sin(gameState.frameCount * 0.3) * 0.3 + 0.7;
    p.fill(255, 100, 0, pulse * 255);
    p.text(`BOMB READY! (SPACE)`, CANVAS_WIDTH - 10, powerupY);
  }
  
  p.pop();
}

// ============================================================================
// PAUSED SCREEN
// ============================================================================

export function renderPausedOverlay(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Paused text
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(255);
  p.textSize(48);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  
  p.textSize(18);
  p.text('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  p.text('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 45);
  p.pop();
}

// ============================================================================
// GAME OVER SCREEN
// ============================================================================

export function renderGameOverScreen(p) {
  // Dark overlay
  p.fill(0, 0, 0, 220);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  // Game Over text
  p.fill(isWin ? 100 : 255, isWin ? 255 : 100, 100);
  p.textSize(48);
  p.text(isWin ? 'VICTORY!' : 'GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
  
  // Final score
  p.fill(255);
  p.textSize(28);
  p.text(`FINAL SCORE`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  p.textSize(36);
  p.fill(255, 200, 0);
  p.text(`${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
  
  // Stats
  p.fill(200, 200, 200);
  p.textSize(14);
  p.text(`Enemies Destroyed: ${gameState.enemiesDestroyed}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
  p.text(`Survival Time: ${Math.floor(gameState.stats.survivalTime)}s`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
  p.text(`Power-ups Collected: ${gameState.stats.powerupsCollected}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 90);
  
  // New high score
  if (gameState.score === gameState.highScore && gameState.score > 0) {
    const pulse = Math.sin(gameState.frameCount * 0.15) * 0.3 + 0.7;
    p.fill(255, 200, 0, pulse * 255);
    p.textSize(20);
    p.text('NEW HIGH SCORE!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 120);
  }
  
  // Restart prompt
  p.fill(255);
  p.textSize(18);
  p.text('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  
  p.pop();
}

// ============================================================================
// BACKGROUND EFFECTS
// ============================================================================

export function renderAnimatedBackground(p) {
  // Render stars
  for (const star of gameState.backgroundStars) {
    const twinkle = Math.sin(gameState.frameCount * star.twinkleSpeed + star.twinkleOffset);
    const brightness = star.brightness + twinkle * 50;
    p.fill(brightness);
    p.noStroke();
    p.circle(star.x, star.y, star.size);
  }
  
  // Render grid lines for retro effect
  p.stroke(30, 30, 60, 100);
  p.strokeWeight(1);
  const gridSize = 50;
  for (let x = 0; x < CANVAS_WIDTH; x += gridSize) {
    p.line(x, 0, x, CANVAS_HEIGHT);
  }
  for (let y = 0; y < CANVAS_HEIGHT; y += gridSize) {
    p.line(0, y, CANVAS_WIDTH, y);
  }
}

export function renderBackground(p) {
  // Render parallax stars based on camera position
  p.push();
  for (const star of gameState.backgroundStars) {
    // Parallax effect (stars move slower than game objects)
    const parallaxX = star.x - gameState.cameraX * 0.1;
    const parallaxY = star.y - gameState.cameraY * 0.1;
    
    const twinkle = Math.sin(gameState.frameCount * star.twinkleSpeed + star.twinkleOffset);
    const brightness = star.brightness + twinkle * 30;
    p.fill(brightness);
    p.noStroke();
    p.circle(parallaxX, parallaxY, star.size);
  }
  p.pop();
}

export function renderScreenFlash(p) {
  if (gameState.flashIntensity > 0) {
    p.fill(255, 255, 255, gameState.flashIntensity * 100);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    gameState.flashIntensity *= 0.9;
  }
}