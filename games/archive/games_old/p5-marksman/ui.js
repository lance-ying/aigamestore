// ui.js - UI rendering functions

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 30, 50);
  
  // Title
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("P5 MARKSMAN", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(200, 200, 200);
  p.textSize(16);
  p.text("Elite Sniper Operations", CANVAS_WIDTH / 2, 130);
  
  // Description
  p.fill(180, 180, 180);
  p.textSize(12);
  p.textAlign(p.CENTER, p.TOP);
  const desc = [
    "Eliminate hostile targets with precision.",
    "Avoid hitting civilians at all costs.",
    "Manage your ammunition and complete missions within the time limit.",
    "",
    "Earn bonus points for headshots and accuracy."
  ];
  let yPos = 170;
  for (let line of desc) {
    p.text(line, CANVAS_WIDTH / 2, yPos);
    yPos += 18;
  }
  
  // Controls
  p.fill(150, 200, 255);
  p.textSize(11);
  p.textAlign(p.LEFT, p.TOP);
  const controls = [
    "Arrow Keys: Pan view",
    "W/S: Zoom in/out",
    "Z: Quick scope (2x)",
    "Space: Fire",
    "Shift: Reload"
  ];
  yPos = 280;
  for (let line of controls) {
    p.text(line, 50, yPos);
    yPos += 16;
  }
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textSize(18);
  p.textAlign(p.CENTER, p.CENTER);
  if (Math.floor(p.frameCount / 30) % 2 === 0) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
  }
}

export function renderGameOver(p, won) {
  p.background(0, 0, 0, 200);
  
  p.fill(won ? 100 : 255, won ? 255 : 100, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(won ? "MISSION SUCCESS!" : "MISSION FAILED!", CANVAS_WIDTH / 2, 120);
  
  p.fill(255);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);
  
  if (won) {
    p.textSize(16);
    const accuracy = gameState.shotsFired > 0 ? 
      Math.floor((gameState.shotsHit / gameState.shotsFired) * 100) : 0;
    p.text(`Accuracy: ${accuracy}%`, CANVAS_WIDTH / 2, 220);
    p.text(`Targets Eliminated: ${gameState.targetsEliminated}`, CANVAS_WIDTH / 2, 245);
  }
  
  p.fill(255, 255, 100);
  p.textSize(18);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 320);
}

export function renderPausedIndicator(p) {
  p.fill(255, 255, 100);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

export function renderHUD(p) {
  // Level
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text(`LEVEL: ${gameState.currentLevel}`, 10, 10);
  
  // Score
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
  
  // Time
  p.textAlign(p.CENTER, p.TOP);
  const timeColor = gameState.timeRemaining < 30 ? [255, 100, 100] : [255, 255, 255];
  p.fill(...timeColor);
  p.text(`TIME: ${Math.ceil(gameState.timeRemaining)}s`, CANVAS_WIDTH / 2, 10);
  
  // Ammo
  p.fill(255);
  p.textAlign(p.LEFT, p.BOTTOM);
  p.textSize(16);
  p.text(`AMMO: ${gameState.ammoInClip} / ${gameState.ammoReserve}`, 10, CANVAS_HEIGHT - 10);
  
  if (gameState.isReloading) {
    p.fill(255, 200, 100);
    p.text("RELOADING...", 10, CANVAS_HEIGHT - 30);
  }
  
  // Zoom
  p.textAlign(p.RIGHT, p.BOTTOM);
  p.fill(150, 200, 255);
  p.text(`ZOOM: ${gameState.zoomLevel.toFixed(1)}x`, CANVAS_WIDTH - 10, CANVAS_HEIGHT - 10);
  
  // Targets
  p.fill(255);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.text(`TARGETS: ${gameState.targetsEliminated} / ${gameState.targetsRequired}`, 
         CANVAS_WIDTH / 2, CANVAS_HEIGHT - 10);
}

export function renderCrosshair(p, recoilOffset) {
  const size = 15;
  const gap = 8;
  const centerX = CANVAS_WIDTH / 2;
  const centerY = CANVAS_HEIGHT / 2 + recoilOffset;
  
  p.stroke(100, 255, 100);
  p.strokeWeight(2);
  
  // Cross lines
  p.line(centerX - size, centerY, centerX - gap, centerY);
  p.line(centerX + gap, centerY, centerX + size, centerY);
  p.line(centerX, centerY - size, centerX, centerY - gap);
  p.line(centerX, centerY + gap, centerX, centerY + size);
  
  // Center dot
  p.fill(100, 255, 100);
  p.noStroke();
  p.ellipse(centerX, centerY, 3);
}

export function renderScopeOverlay(p, zoomLevel) {
  const vignetteStrength = (zoomLevel - 1) / 3; // 0 at 1x, 1 at 4x
  
  if (vignetteStrength > 0) {
    p.push();
    p.noStroke();
    
    // Darken edges
    for (let i = 0; i < 50; i++) {
      const alpha = (i / 50) * vignetteStrength * 150;
      p.fill(0, 0, 0, alpha);
      p.rect(0, 0, i, CANVAS_HEIGHT);
      p.rect(CANVAS_WIDTH - i, 0, i, CANVAS_HEIGHT);
      p.rect(0, 0, CANVAS_WIDTH, i);
      p.rect(0, CANVAS_HEIGHT - i, CANVAS_WIDTH, i);
    }
    
    p.pop();
  }
}