// ui.js - UI rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES } from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 30, 50);
  
  // Title
  p.fill(255, 200, 50);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text("SKATE PHYSICS", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(200, 200, 200);
  p.textSize(16);
  p.textStyle(p.NORMAL);
  p.text("Master the tricks, build your combo!", CANVAS_WIDTH / 2, 130);
  
  // Instructions
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.LEFT, p.CENTER);
  
  const instructions = [
    "CONTROLS:",
    "↑ Arrow - Ollie (jump)",
    "↓ Arrow - Manual",
    "← Arrow - Kickflip Left",
    "→ Arrow - Kickflip Right",
    "SPACE - Push (speed up)",
    "A/D - Steer",
    "W - Grind (near rail)",
    "",
    "Chain tricks for combo multipliers!"
  ];
  
  let yPos = 170;
  for (const line of instructions) {
    if (line === "CONTROLS:") {
      p.fill(255, 200, 50);
      p.textStyle(p.BOLD);
    } else if (line === "") {
      yPos += 5;
      continue;
    } else {
      p.fill(200, 200, 200);
      p.textStyle(p.NORMAL);
    }
    p.text(line, 150, yPos);
    yPos += 20;
  }
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.textStyle(p.BOLD);
  const alpha = p.map(p.sin(p.frameCount * 0.1), -1, 1, 100, 255);
  p.fill(255, 255, 100, alpha);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
}

export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  p.textSize(16);
  p.textStyle(p.NORMAL);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
}

export function renderGameOver(p) {
  p.background(20, 30, 50);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Title
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text(isWin ? "LEGENDARY!" : "GAME OVER", CANVAS_WIDTH / 2, 120);
  
  // Score
  p.fill(255);
  p.textSize(32);
  p.text(`Final Score: ${Math.floor(gameState.score)}`, CANVAS_WIDTH / 2, 180);
  
  // Stats
  p.textSize(20);
  p.text(`Best Combo: x${gameState.combo}`, CANVAS_WIDTH / 2, 220);
  
  // Restart prompt
  p.fill(255, 255, 100);
  p.textSize(20);
  p.textStyle(p.BOLD);
  const alpha = p.map(p.sin(p.frameCount * 0.1), -1, 1, 100, 255);
  p.fill(255, 255, 100, alpha);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 300);
}

export function renderHUD(p) {
  // Score
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(20);
  p.textStyle(p.BOLD);
  p.text(`Score: ${Math.floor(gameState.score)}`, 10, 10);
  
  // Combo
  if (gameState.combo > 1) {
    p.fill(255, 200, 50);
    p.textSize(24);
    p.text(`COMBO x${gameState.combo}`, 10, 40);
    
    // Combo timer bar
    const barWidth = 100;
    const barHeight = 6;
    const fillWidth = (gameState.comboTimer / 120) * barWidth;
    
    p.fill(50);
    p.rect(10, 70, barWidth, barHeight);
    p.fill(255, 200, 50);
    p.rect(10, 70, fillWidth, barHeight);
  }
  
  // Current trick
  if (gameState.currentTrick) {
    p.fill(100, 255, 100);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(18);
    p.text(gameState.currentTrick, CANVAS_WIDTH / 2, 10);
  }
  
  // Grind/Manual indicator
  if (gameState.player) {
    if (gameState.player.isGrinding) {
      p.fill(255, 150, 50);
      p.textAlign(p.CENTER, p.TOP);
      p.textSize(16);
      p.text("GRINDING!", CANVAS_WIDTH / 2, 40);
    } else if (gameState.player.isManual) {
      p.fill(255, 255, 50);
      p.textAlign(p.CENTER, p.TOP);
      p.textSize(16);
      p.text("MANUAL!", CANVAS_WIDTH / 2, 40);
    }
  }
  
  // Control mode indicator
  if (gameState.controlMode !== 'HUMAN') {
    p.fill(255, 100, 100);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(14);
    p.text(`[${gameState.controlMode}]`, CANVAS_WIDTH - 10, 10);
  }
}