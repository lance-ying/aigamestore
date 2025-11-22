// rendering.js - Rendering functions

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  FPS,
  MISSION_TIME_LIMIT,
  ZOOM_NORMAL
} from './globals.js';

export function drawStartScreen(p) {
  p.background(20, 25, 35);
  
  // Title
  p.fill(200, 50, 50);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("HITMAN: SNIPER", CANVAS_WIDTH / 2, 60);
  
  // Subtitle
  p.fill(180, 180, 200);
  p.textSize(16);
  p.text("Agent 47 - Silent Assassin", CANVAS_WIDTH / 2, 100);
  
  // Instructions
  p.fill(220, 220, 230);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  
  const instructions = [
    "MISSION BRIEFING:",
    "",
    "Eliminate all PRIMARY TARGETS (marked with red triangles)",
    "before time runs out. Stay undetected to maintain your",
    "stealth bonus multiplier.",
    "",
    "CONTROLS:",
    "• Arrow Keys - Aim crosshair",
    "• SPACE - Fire weapon",
    "• SHIFT - Toggle zoom (2x/4x)",
    "• Z - Reload",
    "",
    "TACTICS:",
    "• Headshots guarantee instant elimination",
    "• Shoot explosive barrels for environmental kills",
    "• Missing shots near guards increases alert level",
    "• Full detection = Mission Failed",
    "",
    "SCORING:",
    "• Primary Target: 1000 pts",
    "• Environmental Kill: +500 pts",
    "• Headshot Bonus: +300 pts",
    "• Stealth Multiplier: x1.5"
  ];
  
  let yPos = 140;
  for (let line of instructions) {
    if (line.startsWith("•")) {
      p.fill(180, 180, 200);
    } else if (line.includes(":")) {
      p.fill(200, 50, 50);
    } else {
      p.fill(200, 200, 210);
    }
    p.text(line, 50, yPos);
    yPos += 16;
  }
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  const flash = Math.sin(p.frameCount * 0.1) * 0.5 + 0.5;
  p.fill(255, 255, 100, 150 + flash * 105);
  p.text("PRESS ENTER TO START MISSION", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
}

export function drawPlayingScreen(p, gameState) {
  // Background - compound view
  drawBackground(p);
  
  // Draw compound elements
  drawCompound(p);
  
  // Draw explosive barrels
  for (let barrel of gameState.explosiveBarrels) {
    barrel.draw(p);
  }
  
  // Draw targets and guards
  for (let target of gameState.primaryTargets) {
    target.draw(p);
  }
  for (let guard of gameState.guards) {
    guard.draw(p);
  }
  
  // Draw effects
  for (let effect of gameState.effects) {
    effect.draw(p);
  }
  
  // Draw bullets
  for (let bullet of gameState.bullets) {
    bullet.draw(p);
  }
  
  // Draw crosshair (always on top)
  if (gameState.crosshair) {
    gameState.crosshair.draw(p, gameState.zoomLevel);
  }
  
  // Draw UI
  drawUI(p, gameState);
  
  // Draw scope overlay
  if (gameState.zoomLevel > ZOOM_NORMAL) {
    drawScopeOverlay(p, gameState);
  }
}

function drawBackground(p) {
  // Sky gradient
  for (let i = 0; i < CANVAS_HEIGHT * 0.4; i++) {
    const t = i / (CANVAS_HEIGHT * 0.4);
    p.stroke(30 + t * 40, 35 + t * 45, 50 + t * 60);
    p.line(0, i, CANVAS_WIDTH, i);
  }
  
  // Ground
  p.fill(40, 50, 35);
  p.noStroke();
  p.rect(0, CANVAS_HEIGHT * 0.4, CANVAS_WIDTH, CANVAS_HEIGHT * 0.6);
}

function drawCompound(p) {
  // Building structures
  p.fill(60, 60, 70);
  p.stroke(40, 40, 50);
  p.strokeWeight(2);
  
  // Left building
  p.rect(50, 200, 120, 160);
  
  // Center building
  p.rect(220, 180, 160, 180);
  
  // Right building
  p.rect(430, 210, 120, 150);
  
  // Windows
  p.fill(80, 90, 100);
  p.noStroke();
  
  // Left building windows
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 3; j++) {
      p.rect(65 + i * 40, 220 + j * 40, 25, 30);
    }
  }
  
  // Center building windows
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 4; j++) {
      p.rect(235 + i * 45, 200 + j * 40, 30, 30);
    }
  }
  
  // Right building windows
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 3; j++) {
      p.rect(445 + i * 40, 230 + j * 40, 25, 30);
    }
  }
}

function drawUI(p, gameState) {
  p.push();
  
  // Timer
  const timeRemaining = Math.ceil(gameState.missionTimer / FPS);
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timeColor = timeRemaining < 30 ? [255, 100, 100] : [200, 200, 220];
  
  p.fill(...timeColor);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(24);
  p.text(`${minutes}:${seconds.toString().padStart(2, '0')}`, CANVAS_WIDTH / 2, 10);
  
  // Score
  p.fill(255, 220, 100);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text(`SCORE: ${Math.floor(gameState.score)}`, CANVAS_WIDTH - 10, 10);
  
  // Multiplier
  if (gameState.multiplier > 1) {
    p.fill(100, 255, 100);
    p.textSize(14);
    p.text(`x${gameState.multiplier.toFixed(1)}`, CANVAS_WIDTH - 10, 30);
  }
  
  // Targets remaining
  p.fill(200, 50, 50);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  const targetsAlive = gameState.primaryTargets.filter(t => t.alive).length;
  p.text(`TARGETS: ${targetsAlive}/${gameState.primaryTargets.length}`, 10, 10);
  
  // Ammo
  p.fill(220, 220, 230);
  p.textAlign(p.LEFT, p.BOTTOM);
  p.textSize(18);
  if (gameState.isReloading) {
    p.fill(255, 150, 50);
    p.text("RELOADING...", 10, CANVAS_HEIGHT - 10);
  } else {
    p.text(`AMMO: ${gameState.currentAmmo}`, 10, CANVAS_HEIGHT - 10);
  }
  
  // Zoom indicator
  p.textAlign(p.RIGHT, p.BOTTOM);
  p.textSize(14);
  p.fill(180, 180, 200);
  p.text(`ZOOM: ${gameState.zoomLevel}x`, CANVAS_WIDTH - 10, CANVAS_HEIGHT - 10);
  
  // Alert level
  if (gameState.alertLevel > 0) {
    const alertWidth = 150;
    const alertHeight = 20;
    const alertX = CANVAS_WIDTH / 2 - alertWidth / 2;
    const alertY = CANVAS_HEIGHT - 35;
    
    // Background
    p.fill(50, 50, 50);
    p.noStroke();
    p.rect(alertX, alertY, alertWidth, alertHeight);
    
    // Alert bar
    const alertPercent = Math.min(gameState.alertLevel / 100, 1);
    const alertColor = alertPercent < 0.5 ? [255, 200, 0] : [255, 50, 50];
    p.fill(...alertColor);
    p.rect(alertX, alertY, alertWidth * alertPercent, alertHeight);
    
    // Border
    p.noFill();
    p.stroke(200, 200, 200);
    p.strokeWeight(2);
    p.rect(alertX, alertY, alertWidth, alertHeight);
    
    // Label
    p.fill(255, 255, 255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text("ALERT", CANVAS_WIDTH / 2, alertY + alertHeight / 2);
  }
  
  // Pause indicator
  if (gameState.gamePhase === PHASE_PAUSED) {
    p.fill(255, 255, 100);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(14);
    p.text("PAUSED", CANVAS_WIDTH - 10, 50);
  }
  
  p.pop();
}

function drawScopeOverlay(p, gameState) {
  p.push();
  
  // Darken edges
  p.fill(0, 0, 0, 100);
  p.noStroke();
  
  // Top
  p.rect(0, 0, CANVAS_WIDTH, 50);
  // Bottom
  p.rect(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 50);
  // Left
  p.rect(0, 0, 80, CANVAS_HEIGHT);
  // Right
  p.rect(CANVAS_WIDTH - 80, 0, 80, CANVAS_HEIGHT);
  
  // Scope reticle circles
  p.noFill();
  p.stroke(255, 255, 255, 50);
  p.strokeWeight(1);
  p.circle(gameState.crosshair.x, gameState.crosshair.y, 100);
  p.circle(gameState.crosshair.x, gameState.crosshair.y, 200);
  
  p.pop();
}

export function drawGameOverScreen(p, gameState) {
  p.background(20, 25, 35);
  
  const isWin = gameState.gamePhase === PHASE_GAME_OVER_WIN;
  
  // Title
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "MISSION COMPLETE" : "MISSION FAILED", CANVAS_WIDTH / 2, 80);
  
  // Status message
  p.fill(200, 200, 220);
  p.textSize(18);
  if (isWin) {
    p.text("All targets eliminated. Excellent work, Agent 47.", CANVAS_WIDTH / 2, 130);
  } else {
    p.text(gameState.missionTimer <= 0 ? "Time expired." : "You were detected.", CANVAS_WIDTH / 2, 130);
  }
  
  // Stats
  p.fill(220, 220, 230);
  p.textSize(16);
  p.textAlign(p.LEFT, p.TOP);
  
  const stats = [
    "",
    "MISSION STATISTICS:",
    "",
    `Final Score: ${Math.floor(gameState.score)}`,
    `Targets Eliminated: ${gameState.targetsEliminated}/${gameState.primaryTargets.length}`,
    `Guards Neutralized: ${gameState.guardsEliminated}`,
    `Environmental Kills: ${gameState.environmentalKills}`,
    `Headshots: ${gameState.headshotCount}`,
    `Accuracy: ${gameState.shotsAttempted > 0 ? Math.floor((gameState.headshotCount + gameState.targetsEliminated + gameState.guardsEliminated) / gameState.shotsAttempted * 100) : 0}%`
  ];
  
  let yPos = 170;
  for (let line of stats) {
    if (line.includes(":") && !line.startsWith("Final")) {
      p.fill(180, 180, 200);
    } else if (line.startsWith("MISSION")) {
      p.fill(200, 50, 50);
    } else if (line.startsWith("Final")) {
      p.fill(255, 220, 100);
      p.textSize(20);
    } else {
      p.fill(200, 200, 210);
    }
    p.text(line, 100, yPos);
    yPos += 24;
    if (line.startsWith("Final")) {
      p.textSize(16);
    }
  }
  
  // Restart prompt
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  const flash = Math.sin(p.frameCount * 0.1) * 0.5 + 0.5;
  p.fill(255, 255, 100, 150 + flash * 105);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}