// ui.js - User interface rendering

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, WEAPONS, OUTFITS, LEVELS, GAME_PHASES } from './globals.js';

export function renderStartScreen(p) {
  p.background(30, 30, 50);
  
  // Title
  p.fill(255, 200, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("BUDDY BASH", CANVAS_WIDTH / 2, 80);
  
  p.textSize(18);
  p.fill(200, 200, 200);
  p.text("Stress Relief Sandbox", CANVAS_WIDTH / 2, 120);
  
  // Instructions
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  p.fill(180, 180, 180);
  const instructions = [
    "Objective: Reach the target score before time runs out!",
    "",
    "Controls:",
    "• SPACE - Fire weapon",
    "• SHIFT - Reset Buddy",
    "• ARROW KEYS - Cycle weapons (L/R) and outfits (U/D)",
    "• Z - Select Hand/Punch mode",
    "• ESC - Pause game",
    "• R - Restart to menu"
  ];
  
  let y = 160;
  instructions.forEach(line => {
    p.text(line, 100, y);
    y += 20;
  });
  
  // Press ENTER prompt
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  const flash = Math.sin(p.frameCount * 0.1) * 0.5 + 0.5;
  p.fill(255, 255, 100, 150 + flash * 105);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 350);
  
  // Stats
  p.textSize(12);
  p.fill(150, 150, 150);
  p.text(`Bucks: ${gameState.bucks}`, CANVAS_WIDTH / 2, 380);
}

export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 255, 255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(20);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(16);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
}

export function renderGameOverScreen(p, won) {
  p.background(30, 30, 50);
  
  p.textAlign(p.CENTER, p.CENTER);
  
  if (won) {
    p.fill(100, 255, 100);
    p.textSize(48);
    p.text("LEVEL COMPLETE!", CANVAS_WIDTH / 2, 100);
    
    p.fill(200, 200, 200);
    p.textSize(24);
    p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 160);
    p.text(`Target: ${gameState.levelTargetScore}`, CANVAS_WIDTH / 2, 190);
    
    if (gameState.currentLevel < LEVELS.length) {
      p.textSize(16);
      p.fill(150, 150, 255);
      p.text(`Next: ${LEVELS[gameState.currentLevel].name}`, CANVAS_WIDTH / 2, 230);
    } else {
      p.textSize(20);
      p.fill(255, 215, 0);
      p.text("ALL LEVELS COMPLETE!", CANVAS_WIDTH / 2, 230);
    }
  } else {
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text("TIME'S UP!", CANVAS_WIDTH / 2, 100);
    
    p.fill(200, 200, 200);
    p.textSize(24);
    p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 160);
    p.text(`Needed: ${gameState.levelTargetScore}`, CANVAS_WIDTH / 2, 190);
  }
  
  p.fill(255, 255, 100);
  p.textSize(20);
  const flash = Math.sin(p.frameCount * 0.1) * 0.5 + 0.5;
  p.fill(255, 255, 100, 150 + flash * 105);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 300);
  
  // High score
  p.fill(180, 180, 180);
  p.textSize(14);
  p.text(`High Score: ${gameState.highScores[gameState.currentLevel - 1]}`, CANVAS_WIDTH / 2, 340);
}

export function renderHUD(p) {
  // Background bar
  p.fill(0, 0, 0, 100);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 40);
  
  // Score
  p.fill(255, 255, 255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(18);
  p.text(`SCORE: ${String(gameState.score).padStart(6, '0')}`, CANVAS_WIDTH - 10, 10);
  
  // Level
  p.textAlign(p.LEFT, p.TOP);
  p.text(`LEVEL: ${gameState.currentLevel}`, 10, 10);
  
  // Bucks
  p.fill(255, 215, 0);
  p.text(`💰 ${gameState.bucks}`, 150, 10);
  
  // Timer
  p.textAlign(p.CENTER, p.TOP);
  const timeLeft = Math.ceil(gameState.levelTimeRemaining / 60);
  const timeColor = timeLeft < 10 ? [255, 100, 100] : [255, 255, 255];
  p.fill(...timeColor);
  p.text(`TIME: ${timeLeft}s`, CANVAS_WIDTH / 2, 10);
  
  // Combo multiplier
  if (gameState.comboMultiplier > 1) {
    p.fill(255, 150, 50);
    p.textSize(14);
    p.text(`x${gameState.comboMultiplier} COMBO!`, CANVAS_WIDTH / 2, 50);
  }
  
  // Weapon bar at bottom
  renderWeaponBar(p);
}

export function renderWeaponBar(p) {
  const barY = CANVAS_HEIGHT - 60;
  const barHeight = 60;
  
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, barY, CANVAS_WIDTH, barHeight);
  
  const iconSize = 40;
  const spacing = 60;
  const startX = (CANVAS_WIDTH - spacing * Math.min(WEAPONS.length, 5)) / 2 + spacing / 2;
  
  for (let i = 0; i < Math.min(WEAPONS.length, 5); i++) {
    const weapon = WEAPONS[i];
    const x = startX + i * spacing;
    const y = barY + barHeight / 2;
    
    const isUnlocked = gameState.unlockedWeapons.includes(i);
    const isActive = i === gameState.activeWeaponIndex;
    
    // Highlight active weapon
    if (isActive) {
      p.fill(255, 200, 100, 100);
      p.rect(x - iconSize / 2 - 5, y - iconSize / 2 - 5, iconSize + 10, iconSize + 10, 5);
    }
    
    // Weapon icon background
    p.fill(isUnlocked ? 60 : 30);
    p.stroke(isActive ? [255, 200, 100] : [100, 100, 100]);
    p.strokeWeight(2);
    p.rect(x - iconSize / 2, y - iconSize / 2, iconSize, iconSize, 5);
    
    // Weapon icon
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(24);
    p.noStroke();
    p.fill(isUnlocked ? 255 : 100);
    p.text(weapon.icon, x, y);
    
    // Weapon name
    p.textSize(10);
    p.fill(isUnlocked ? 200 : 100);
    p.text(weapon.name, x, y + 30);
  }
}