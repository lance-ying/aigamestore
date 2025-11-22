// ui.js - UI rendering functions
import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, LEVELS, gameState } from './globals.js';

export function renderUI(p, player) {
  p.push();
  p.textFont('Arial');
  
  // HUD during gameplay
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    // Score
    p.fill(255);
    p.textSize(16);
    p.textAlign(p.LEFT, p.TOP);
    p.text(`SCORE: ${gameState.score.toString().padStart(6, '0')}`, 10, 10);
    
    // Coins
    p.fill(255, 215, 0);
    p.text(`COINS: ${gameState.coinsCollected.toString().padStart(3, '0')}`, 10, 30);
    
    // Distance
    p.fill(255);
    p.textAlign(p.RIGHT, p.TOP);
    p.text(`DIST: ${Math.floor(gameState.distanceRun).toString().padStart(5, '0')}m`, CANVAS_WIDTH - 10, 10);
    
    // Level
    p.textAlign(p.CENTER, p.TOP);
    const level = LEVELS[gameState.currentLevel];
    p.text(`LEVEL ${level.level}: ${level.name}`, CANVAS_WIDTH / 2, 10);
    
    // Progress bar
    const progressWidth = 200;
    const progressHeight = 10;
    const progressX = (CANVAS_WIDTH - progressWidth) / 2;
    const progressY = 35;
    const progress = Math.min(1, gameState.distanceRun / level.distanceGoal);
    
    p.fill(50);
    p.stroke(255);
    p.strokeWeight(1);
    p.rect(progressX, progressY, progressWidth, progressHeight);
    
    p.fill(100, 200, 100);
    p.noStroke();
    p.rect(progressX, progressY, progressWidth * progress, progressHeight);
    
    // Powerup indicators
    let powerupY = 55;
    
    if (player.jetpackActive) {
      renderPowerupIndicator(p, 'JETPACK', player.jetpackTimer, 180, 50, 200, 50, 10, powerupY);
      powerupY += 25;
    }
    
    if (player.hoverboardActive) {
      p.fill(255, 150, 0);
      p.textAlign(p.LEFT, p.TOP);
      p.textSize(14);
      p.text('HOVERBOARD', 10, powerupY);
      powerupY += 20;
    }
    
    if (player.magnetActive) {
      renderPowerupIndicator(p, 'MAGNET', player.magnetTimer, 300, 150, 50, 200, 10, powerupY);
      powerupY += 25;
    }
  }
  
  // Paused indicator
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.fill(255);
    p.textSize(18);
    p.textAlign(p.RIGHT, p.TOP);
    p.text('PAUSED', CANVAS_WIDTH - 10, 10);
  }
  
  p.pop();
}

function renderPowerupIndicator(p, label, current, max, r, g, b, x, y) {
  p.textAlign(p.LEFT, p.TOP);
  p.fill(255);
  p.textSize(12);
  p.text(label, x, y);
  
  const barWidth = 100;
  const barHeight = 8;
  const barX = x + 80;
  
  p.fill(50);
  p.stroke(255);
  p.strokeWeight(1);
  p.rect(barX, y, barWidth, barHeight);
  
  p.fill(r, g, b);
  p.noStroke();
  const progress = current / max;
  p.rect(barX, y, barWidth * progress, barHeight);
}

export function renderStartScreen(p) {
  p.push();
  p.background(20, 30, 50);
  
  // Title
  p.fill(255, 215, 0);
  p.textSize(48);
  p.textAlign(p.CENTER, p.CENTER);
  p.textFont('Arial');
  p.text('SUBWAY SURFERS', CANVAS_WIDTH / 2, 80);
  
  // Description
  p.fill(200, 220, 255);
  p.textSize(14);
  p.text('Navigate three parallel tracks and dodge obstacles!', CANVAS_WIDTH / 2, 140);
  p.text('Collect coins and power-ups to boost your score.', CANVAS_WIDTH / 2, 160);
  p.text('Complete all 5 levels to win!', CANVAS_WIDTH / 2, 180);
  
  // Controls
  p.fill(150, 200, 255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  const controlX = 80;
  let controlY = 220;
  
  p.text('← / A: Move Left', controlX, controlY);
  controlY += 20;
  p.text('→ / D: Move Right', controlX, controlY);
  controlY += 20;
  p.text('↑ / W: Jump', controlX, controlY);
  controlY += 20;
  p.text('↓ / S: Slide', controlX, controlY);
  
  p.textAlign(p.RIGHT, p.TOP);
  controlY = 220;
  const controlX2 = CANVAS_WIDTH - 80;
  p.text('ESC: Pause', controlX2, controlY);
  controlY += 20;
  p.text('R: Restart', controlX2, controlY);
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textSize(20);
  p.textAlign(p.CENTER, p.CENTER);
  
  // Blinking effect
  if (p.frameCount % 60 < 40) {
    p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 350);
  }
  
  p.pop();
}

export function renderGameOverScreen(p) {
  p.push();
  p.background(40, 20, 20, 200);
  
  p.fill(255, 100, 100);
  p.textSize(48);
  p.textAlign(p.CENTER, p.CENTER);
  p.text('GAME OVER', CANVAS_WIDTH / 2, 120);
  
  p.fill(255);
  p.textSize(20);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);
  p.text(`Distance: ${Math.floor(gameState.distanceRun)}m`, CANVAS_WIDTH / 2, 210);
  p.text(`Coins: ${gameState.coinsCollected}`, CANVAS_WIDTH / 2, 240);
  p.text(`Level: ${LEVELS[gameState.currentLevel].level}`, CANVAS_WIDTH / 2, 270);
  
  p.fill(255, 255, 100);
  p.textSize(18);
  
  if (p.frameCount % 60 < 40) {
    p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 330);
  }
  
  p.pop();
}

export function renderWinScreen(p) {
  p.push();
  p.background(20, 50, 20, 200);
  
  p.fill(100, 255, 100);
  p.textSize(40);
  p.textAlign(p.CENTER, p.CENTER);
  p.text('CONGRATULATIONS!', CANVAS_WIDTH / 2, 100);
  
  p.fill(255, 255, 100);
  p.textSize(24);
  p.text('You completed all levels!', CANVAS_WIDTH / 2, 150);
  
  p.fill(255);
  p.textSize(20);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 200);
  p.text(`Total Distance: ${Math.floor(gameState.distanceRun)}m`, CANVAS_WIDTH / 2, 230);
  p.text(`Total Coins: ${gameState.coinsCollected}`, CANVAS_WIDTH / 2, 260);
  
  p.fill(255, 255, 100);
  p.textSize(18);
  
  if (p.frameCount % 60 < 40) {
    p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 330);
  }
  
  p.pop();
}