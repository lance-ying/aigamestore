// rendering.js - Rendering functions for game screens

import { gameState, GAME_PHASE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
  p.push();
  
  // Title
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('WILD ARENA', CANVAS_WIDTH / 2, 80);
  
  // Description
  p.fill(200);
  p.textSize(14);
  p.text('Survive 5 levels of intense animal combat!', CANVAS_WIDTH / 2, 140);
  p.text('Defeat all enemies and avoid the shrinking zone.', CANVAS_WIDTH / 2, 160);
  
  // Controls
  p.textSize(12);
  p.textAlign(p.LEFT, p.CENTER);
  p.fill(180);
  p.text('ARROW KEYS: Move', 150, 200);
  p.text('SPACE: Fire weapon', 150, 220);
  p.text('SHIFT: Dash ability', 150, 240);
  p.text('ESC: Pause', 150, 260);
  p.text('R: Restart', 150, 280);
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  const flash = Math.floor(p.frameCount / 30) % 2 === 0;
  if (flash) {
    p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 340);
  }
  
  // High score
  if (gameState.highScore > 0) {
    p.fill(255, 200, 50);
    p.textSize(16);
    p.text(`HIGH SCORE: ${gameState.highScore}`, CANVAS_WIDTH / 2, 370);
  }
  
  p.pop();
}

export function renderPausedOverlay(p) {
  p.push();
  
  // Semi-transparent overlay
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Paused text
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text('PAUSED', CANVAS_WIDTH - 10, 10);
  
  p.pop();
}

export function renderGameOverScreen(p, isWin) {
  p.push();
  
  // Semi-transparent overlay
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  if (isWin) {
    p.fill(100, 255, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text('VICTORY!', CANVAS_WIDTH / 2, 100);
    
    p.fill(255);
    p.textSize(20);
    p.text('You survived the Wild Arena!', CANVAS_WIDTH / 2, 150);
  } else {
    p.fill(255, 100, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text('GAME OVER', CANVAS_WIDTH / 2, 100);
  }
  
  // Score
  p.fill(255, 220, 100);
  p.textSize(24);
  p.text(`FINAL SCORE: ${gameState.score}`, CANVAS_WIDTH / 2, 200);
  
  // High score
  if (gameState.score > gameState.highScore) {
    p.fill(255, 200, 50);
    p.textSize(18);
    p.text('NEW HIGH SCORE!', CANVAS_WIDTH / 2, 230);
  } else if (gameState.highScore > 0) {
    p.fill(200);
    p.textSize(16);
    p.text(`High Score: ${gameState.highScore}`, CANVAS_WIDTH / 2, 230);
  }
  
  // Instructions
  p.fill(255);
  p.textSize(18);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 300);
  
  p.pop();
}

export function renderUI(p) {
  if (!gameState.player) return;
  
  p.push();
  
  // Score (top right)
  p.fill(255, 220, 100);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(18);
  p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
  
  // Level (top left)
  p.fill(100, 200, 255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(18);
  p.text(`LEVEL: ${gameState.currentLevel}`, 10, 10);
  
  // Timer
  const timeRemaining = Math.ceil((gameState.levelDuration - gameState.levelTimer) / 60);
  p.fill(255);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(16);
  p.text(`TIME: ${timeRemaining}s`, CANVAS_WIDTH / 2, 10);
  
  // Enemies remaining
  const enemiesRemaining = gameState.enemiesRequired - gameState.enemiesDefeated;
  p.fill(255, 150, 150);
  p.textSize(14);
  p.text(`ENEMIES: ${enemiesRemaining}`, CANVAS_WIDTH / 2, 30);
  
  // Player health bar (bottom left)
  const healthBarWidth = 200;
  const healthBarHeight = 20;
  const healthPercent = gameState.player.health / gameState.player.maxHealth;
  
  p.fill(60, 60, 60);
  p.rect(10, CANVAS_HEIGHT - 30, healthBarWidth, healthBarHeight);
  
  p.fill(healthPercent > 0.5 ? 100 : healthPercent > 0.25 ? 200 : 255, healthPercent > 0.5 ? 200 : healthPercent > 0.25 ? 200 : 100, 50);
  p.rect(10, CANVAS_HEIGHT - 30, healthBarWidth * healthPercent, healthBarHeight);
  
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text(`HP: ${Math.ceil(gameState.player.health)}`, 15, CANVAS_HEIGHT - 28);
  
  // Ability cooldown (bottom center)
  const abilityCooldownPercent = 1 - (gameState.player.ability.cooldown / gameState.player.ability.maxCooldown);
  const abilitySize = 40;
  const abilityX = CANVAS_WIDTH / 2;
  const abilityY = CANVAS_HEIGHT - 50;
  
  p.fill(60, 60, 60);
  p.circle(abilityX, abilityY, abilitySize);
  
  if (abilityCooldownPercent < 1) {
    p.fill(100, 100, 100, 150);
    p.arc(abilityX, abilityY, abilitySize, abilitySize, -p.HALF_PI, -p.HALF_PI + p.TWO_PI * abilityCooldownPercent);
  }
  
  p.fill(abilityCooldownPercent === 1 ? 100 : 50, abilityCooldownPercent === 1 ? 200 : 100, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  p.text('DASH', abilityX, abilityY);
  
  p.pop();
}

export function renderZone(p) {
  p.push();
  
  // Dark overlay outside zone
  p.fill(0, 0, 0, 80);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Clear inside zone
  p.erase();
  p.circle(gameState.zoneCenterX, gameState.zoneCenterY, gameState.zoneRadius * 2);
  p.noErase();
  
  // Zone border
  p.noFill();
  p.stroke(150, 100, 255, 200);
  p.strokeWeight(3);
  p.circle(gameState.zoneCenterX, gameState.zoneCenterY, gameState.zoneRadius * 2);
  
  p.pop();
}