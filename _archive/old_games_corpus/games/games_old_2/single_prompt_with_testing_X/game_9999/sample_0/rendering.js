// rendering.js - Rendering functions for UI and game objects

import { GAME_PHASES, gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function drawStartScreen(p) {
  p.background(20, 20, 40);
  
  // Title
  p.fill(100, 200, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("MOB CONTROL", CANVAS_WIDTH / 2, 80);
  
  // Description
  p.fill(200, 200, 220);
  p.textSize(14);
  p.text("Tower Defense Shooter: Defend your base from enemy waves!", CANVAS_WIDTH / 2, 140);
  p.text("Fire units through blue gates to multiply and destroy the enemy base!", CANVAS_WIDTH / 2, 160);
  
  // Instructions
  p.fill(180, 180, 200);
  p.textSize(12);
  p.textAlign(p.LEFT, p.CENTER);
  const startX = 120;
  let y = 210;
  
  p.text("↑ / ↓ : Aim cannon up/down", startX, y);
  y += 20;
  p.text("SPACE : Fire units (hold for stream)", startX, y);
  y += 20;
  p.text("SHIFT : Slow-motion aim assist", startX, y);
  y += 20;
  p.text("Z : Use Champion ability (clears area)", startX, y);
  y += 20;
  p.text("R : Restart level", startX, y);
  y += 20;
  p.text("ESC : Pause", startX, y);
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  const pulse = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(255 * pulse, 255 * pulse, 100);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
}

export function drawGameUI(p) {
  // Score
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text(`Score: ${gameState.score}`, 10, 10);
  
  // Level
  p.text(`Level: ${gameState.currentLevel}`, 10, 30);
  
  // Unit count
  p.text(`Units: ${gameState.units.length}`, 10, 50);
  
  // Player health
  if (gameState.cannon) {
    const healthPercent = (gameState.cannon.health / gameState.cannon.maxHealth * 100).toFixed(0);
    const healthColor = gameState.cannon.health > 50 ? [100, 255, 100] : [255, 100, 100];
    p.fill(healthColor[0], healthColor[1], healthColor[2]);
    p.text(`HP: ${gameState.cannon.health}/${gameState.cannon.maxHealth}`, 10, 70);
  }
  
  // Champion ability indicator
  const abilityY = 90;
  p.textSize(14);
  if (gameState.championAbilityReady) {
    p.fill(100, 255, 100);
    p.text("Champion: READY (Z)", 10, abilityY);
  } else {
    p.fill(255, 100, 100);
    const cooldownSec = Math.ceil(gameState.championAbilityCooldown / 60);
    p.text(`Champion: ${cooldownSec}s`, 10, abilityY);
  }
  
  // Enemy info
  p.textAlign(p.RIGHT, p.TOP);
  p.fill(255, 100, 100);
  p.textSize(14);
  p.text(`Enemies: ${gameState.enemyUnits.length}`, CANVAS_WIDTH - 10, 10);
  p.text(`Killed: ${gameState.enemiesKilled}`, CANVAS_WIDTH - 10, 30);
  
  // Enemy base health
  if (gameState.enemyBase) {
    p.fill(255, 100, 100);
    p.textSize(14);
    p.text(`Base HP: ${gameState.enemyBase.health}`, CANVAS_WIDTH - 10, 50);
  }
  
  // Slow-mo indicator
  if (gameState.slowMotionActive) {
    p.fill(255, 255, 100);
    p.textSize(14);
    p.text("SLOW-MO", CANVAS_WIDTH - 10, 70);
  }
  
  // Objective reminder
  p.textAlign(p.CENTER, p.BOTTOM);
  p.fill(200, 200, 220);
  p.textSize(11);
  p.text("DEFEND YOUR CANNON! Destroy enemy base before they destroy you!", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 5);
}

export function drawPauseOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  p.textSize(16);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
}

export function drawGameOverScreen(p) {
  p.background(20, 20, 40, 200);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Title
  p.fill(isWin ? 100 : 255, isWin ? 255 : 100, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "VICTORY!" : "DEFEATED", CANVAS_WIDTH / 2, 100);
  
  // Rank (only for wins)
  if (isWin) {
    p.textSize(64);
    p.fill(255, 220, 100);
    p.text(`RANK: ${gameState.finalRank}`, CANVAS_WIDTH / 2, 160);
  } else {
    p.textSize(24);
    p.fill(255, 150, 150);
    p.text("Your cannon was destroyed!", CANVAS_WIDTH / 2, 160);
  }
  
  // Score breakdown
  p.textSize(16);
  p.fill(220, 220, 240);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  
  p.textSize(12);
  p.fill(180, 180, 200);
  let y = 250;
  if (isWin) {
    p.text(`Blue Gates: ${gameState.blueGatesPassed}`, CANVAS_WIDTH / 2, y);
    y += 20;
  }
  p.text(`Units Reached Base: ${gameState.unitsReachedBase}`, CANVAS_WIDTH / 2, y);
  y += 20;
  p.text(`Enemies Killed: ${gameState.enemiesKilled}`, CANVAS_WIDTH / 2, y);
  y += 20;
  p.text(`Obstacles Destroyed: ${gameState.obstaclesDestroyed}`, CANVAS_WIDTH / 2, y);
  
  // Continue/Restart prompt
  p.fill(255, 255, 100);
  p.textSize(20);
  const pulse = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(255 * pulse, 255 * pulse, 100);
  if (isWin) {
    p.text("PRESS R FOR NEXT LEVEL", CANVAS_WIDTH / 2, 350);
  } else {
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 350);
  }
}

export function drawBackground(p) {
  // Top-down battlefield background
  // Base gradient
  for (let i = 0; i < CANVAS_HEIGHT; i++) {
    const inter = i / CANVAS_HEIGHT;
    const c = p.lerpColor(p.color(30, 40, 35), p.color(25, 35, 30), inter);
    p.stroke(c);
    p.line(0, i, CANVAS_WIDTH, i);
  }
  
  // Grid lines for depth
  p.stroke(40, 50, 45, 80);
  p.strokeWeight(1);
  for (let x = 100; x < CANVAS_WIDTH; x += 50) {
    p.line(x, 0, x, CANVAS_HEIGHT);
  }
  for (let y = 0; y < CANVAS_HEIGHT; y += 50) {
    p.line(0, y, CANVAS_WIDTH, y);
  }
}