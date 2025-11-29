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
  p.text("Top-Down Shooter: Fire units through blue gates to multiply your army!", CANVAS_WIDTH / 2, 140);
  p.text("Avoid red gates and destroy the enemy base on the right side!", CANVAS_WIDTH / 2, 160);
  
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
  p.text("Z : Use Champion ability (destroys obstacles)", startX, y);
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
  
  // Champion ability indicator
  const abilityY = 70;
  p.textSize(14);
  if (gameState.championAbilityReady) {
    p.fill(100, 255, 100);
    p.text("Champion: READY (Z)", 10, abilityY);
  } else {
    p.fill(255, 100, 100);
    const cooldownSec = Math.ceil(gameState.championAbilityCooldown / 60);
    p.text(`Champion: ${cooldownSec}s`, 10, abilityY);
  }
  
  // Slow-mo indicator
  if (gameState.slowMotionActive) {
    p.fill(255, 255, 100);
    p.textSize(14);
    p.textAlign(p.RIGHT, p.TOP);
    p.text("SLOW-MO", CANVAS_WIDTH - 10, 10);
  }
  
  // Enemy base health
  if (gameState.enemyBase) {
    p.textAlign(p.RIGHT, p.TOP);
    p.fill(255, 100, 100);
    p.textSize(14);
    p.text(`Base HP: ${gameState.enemyBase.health}`, CANVAS_WIDTH - 10, 30);
  }
  
  // Objective reminder
  p.textAlign(p.CENTER, p.BOTTOM);
  p.fill(200, 200, 220);
  p.textSize(11);
  p.text("Shoot units through BLUE gates → Destroy enemy base!", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 5);
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
  p.text(isWin ? "VICTORY!" : "DEFEAT", CANVAS_WIDTH / 2, 100);
  
  // Rank
  if (isWin) {
    p.textSize(64);
    p.fill(255, 220, 100);
    p.text(`RANK: ${gameState.finalRank}`, CANVAS_WIDTH / 2, 160);
  }
  
  // Score breakdown
  p.textSize(16);
  p.fill(220, 220, 240);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 230);
  
  p.textSize(12);
  p.fill(180, 180, 200);
  p.text(`Blue Gates: ${gameState.blueGatesPassed}`, CANVAS_WIDTH / 2, 260);
  p.text(`Units Reached Base: ${gameState.unitsReachedBase}`, CANVAS_WIDTH / 2, 280);
  p.text(`Obstacles Destroyed: ${gameState.obstaclesDestroyed}`, CANVAS_WIDTH / 2, 300);
  
  // Restart prompt
  p.fill(255, 255, 100);
  p.textSize(20);
  const pulse = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(255 * pulse, 255 * pulse, 100);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 350);
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