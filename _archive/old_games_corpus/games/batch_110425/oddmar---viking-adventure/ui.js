// ui.js - User interface rendering

import { gameState, MAX_HEALTH, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 30, 50);
  
  // Title
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(255, 220, 150);
  p.textSize(48);
  p.text("ODDMAR", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(200, 180, 150);
  p.textSize(16);
  p.text("Viking Adventure", CANVAS_WIDTH / 2, 120);
  
  // Description
  p.fill(200, 200, 200);
  p.textSize(14);
  p.text("Navigate treacherous lands filled with enemies and hazards", CANVAS_WIDTH / 2, 170);
  p.text("Collect weapons and shields to gain new abilities", CANVAS_WIDTH / 2, 190);
  p.text("Reach the exit portal to complete each level", CANVAS_WIDTH / 2, 210);
  
  // Instructions
  p.fill(255, 255, 200);
  p.textSize(12);
  p.textAlign(p.LEFT);
  p.text("CONTROLS:", 150, 250);
  p.fill(220, 220, 220);
  p.text("Arrow Keys: Move and Jump", 150, 270);
  p.text("Space: Attack", 150, 285);
  p.text("Z: Shield (when collected)", 150, 300);
  p.text("ESC: Pause", 150, 315);
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textSize(20);
  p.textAlign(p.CENTER);
  let flash = p.sin(p.frameCount * 0.1) > 0;
  if (flash) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
  }
  
  p.pop();
}

export function renderGameOverScreen(p) {
  p.push();
  
  // Semi-transparent overlay
  p.fill(0, 0, 0, 180);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.textAlign(p.CENTER, p.CENTER);
  
  if (gameState.gamePhase === "GAME_OVER_WIN") {
    p.fill(100, 255, 100);
    p.textSize(48);
    p.text("VICTORY!", CANVAS_WIDTH / 2, 150);
    
    p.fill(255, 255, 255);
    p.textSize(20);
    p.text("Level Complete!", CANVAS_WIDTH / 2, 200);
  } else {
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text("DEFEATED", CANVAS_WIDTH / 2, 150);
    
    p.fill(255, 255, 255);
    p.textSize(20);
    p.text("Oddmar has fallen...", CANVAS_WIDTH / 2, 200);
  }
  
  p.fill(255, 255, 150);
  p.textSize(24);
  p.text("Final Score: " + gameState.score, CANVAS_WIDTH / 2, 250);
  
  p.fill(200, 200, 255);
  p.textSize(18);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 320);
  
  p.pop();
}

export function renderPausedIndicator(p) {
  p.push();
  p.fill(255, 255, 100);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  p.pop();
}

export function renderHUD(p) {
  p.push();
  
  // Health
  p.fill(255, 255, 255);
  p.textSize(14);
  p.textAlign(p.LEFT);
  p.text("Health:", 10, 20);
  
  for (let i = 0; i < MAX_HEALTH; i++) {
    if (i < gameState.player.health) {
      p.fill(255, 100, 100);
    } else {
      p.fill(100, 100, 100);
    }
    p.rect(70 + i * 25, 10, 20, 20);
  }
  
  // Score
  p.fill(255, 255, 255);
  p.text("Score: " + gameState.score, 10, 45);
  
  // Weapon
  p.text("Weapon: " + gameState.player.weapon.toUpperCase(), 10, 65);
  
  // Shield indicator
  if (gameState.player.hasShield) {
    p.fill(100, 200, 255);
    p.text("Shield: Ready", 10, 85);
  }
  
  p.pop();
}