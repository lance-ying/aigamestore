// ui.js - UI rendering functions

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  TARGET_DISPLAY_FPS,
  CRITICAL_FPS,
  MAX_CABLE_TWIST,
  CRITICAL_CABLE_TWIST,
  CRITICAL_TEMPERATURE,
  MAX_ENERGY,
  CHALLENGES_TO_WIN,
  gameState
} from './globals.js';

export function drawStartScreen(p) {
  p.background(20, 25, 35);
  
  // Title
  p.fill(100, 200, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("VR Performance Monitor", CANVAS_WIDTH / 2, 60);
  
  // Subtitle
  p.fill(150, 180, 200);
  p.textSize(16);
  p.text("Optimize Your Virtual Reality Experience", CANVAS_WIDTH / 2, 100);
  
  // Instructions box
  p.fill(30, 35, 45);
  p.stroke(100, 150, 200);
  p.strokeWeight(2);
  p.rect(50, 130, CANVAS_WIDTH - 100, 180, 5);
  
  p.noStroke();
  p.fill(255, 200, 0);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  p.text("OBJECTIVE:", 70, 145);
  
  p.fill(200, 220, 240);
  p.textSize(12);
  p.text("Complete " + CHALLENGES_TO_WIN + " performance challenges while maintaining", 70, 165);
  p.text("optimal VR metrics. Keep FPS high, manage cable twist,", 70, 182);
  p.text("and prevent system overheating!", 70, 199);
  
  p.fill(255, 200, 0);
  p.textSize(14);
  p.text("CONTROLS:", 70, 225);
  
  p.fill(200, 220, 240);
  p.textSize(11);
  p.text("Arrow Keys: Move headset position", 70, 245);
  p.text("Space: Performance Boost (drains energy, generates heat)", 70, 260);
  p.text("Shift: Untwist Cable (costs 25 energy)", 70, 275);
  p.text("Z: Quick Optimize (costs 30 energy, has cooldown)", 70, 290);
  
  // Start prompt
  p.fill(0, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  const flash = Math.sin(p.frameCount * 0.1) > 0;
  if (flash) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 350);
  }
}

export function drawGameplayUI(p) {
  // HUD background
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 70);
  
  // FPS Display
  drawMetric(p, 10, 10, "FPS", gameState.currentFPS.toFixed(0), TARGET_DISPLAY_FPS, CRITICAL_FPS, 90);
  
  // CPU/GPU Usage
  drawMetric(p, 130, 10, "CPU", gameState.cpuUsage.toFixed(0) + "%", 100, 80, 50);
  drawMetric(p, 250, 10, "GPU", gameState.gpuUsage.toFixed(0) + "%", 100, 80, 50);
  
  // Temperature
  drawMetric(p, 370, 10, "TEMP", gameState.gpuTemp.toFixed(0) + "°C", 85, CRITICAL_TEMPERATURE, 50);
  
  // Cable Twist Indicator
  drawCableTwist(p);
  
  // Energy Bar
  drawEnergyBar(p);
  
  // Score and Progress
  drawScoreAndProgress(p);
  
  // Cooldown indicators
  if (gameState.optimizeCooldown > 0) {
    p.fill(255, 150, 0);
    p.textSize(10);
    p.textAlign(p.RIGHT, p.TOP);
    p.text(`Optimize CD: ${Math.ceil(gameState.optimizeCooldown / 60)}s`, CANVAS_WIDTH - 10, 55);
  }
}

function drawMetric(p, x, y, label, value, max, critical, good) {
  const numValue = parseFloat(value);
  const isCritical = label === "FPS" ? numValue < critical : numValue > critical;
  const isGood = label === "FPS" ? numValue > good : numValue < good;
  
  p.fill(200);
  p.textSize(10);
  p.textAlign(p.LEFT, p.TOP);
  p.text(label, x, y);
  
  p.textSize(16);
  p.fill(...(isCritical ? [255, 50, 50] : (isGood ? [0, 255, 100] : [255, 200, 0])));
  p.text(value, x, y + 12);
}

function drawCableTwist(p) {
  const x = CANVAS_WIDTH - 120;
  const y = 15;
  
  p.fill(200);
  p.textSize(10);
  p.textAlign(p.LEFT, p.TOP);
  p.text("CABLE", x, y);
  
  const twistRatio = Math.abs(gameState.cableTwist) / MAX_CABLE_TWIST;
  const isCritical = Math.abs(gameState.cableTwist) > CRITICAL_CABLE_TWIST;
  
  p.fill(...(isCritical ? [255, 50, 50] : (twistRatio < 0.3 ? [0, 255, 100] : [255, 200, 0])));
  p.textSize(14);
  p.text(Math.abs(gameState.cableTwist).toFixed(0) + "°", x, y + 12);
  
  // Twist direction indicator
  p.push();
  p.translate(x + 80, y + 20);
  p.rotate(gameState.cableTwist * 0.01);
  p.noFill();
  p.stroke(...(isCritical ? [255, 50, 50] : [100, 150, 200]));
  p.strokeWeight(2);
  p.arc(0, 0, 20, 20, 0, p.PI * 1.5);
  p.pop();
}

function drawEnergyBar(p) {
  const x = 10;
  const y = 55;
  const width = 150;
  const height = 10;
  
  p.fill(50);
  p.noStroke();
  p.rect(x, y, width, height, 2);
  
  const energyRatio = gameState.energy / MAX_ENERGY;
  p.fill(...(energyRatio > 0.5 ? [0, 200, 255] : (energyRatio > 0.25 ? [255, 200, 0] : [255, 50, 50])));
  p.rect(x, y, width * energyRatio, height, 2);
  
  p.fill(200);
  p.textSize(9);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Energy: ${gameState.energy.toFixed(0)}/${MAX_ENERGY}`, x, y - 10);
}

function drawScoreAndProgress(p) {
  p.fill(255);
  p.textSize(16);
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
  
  p.textSize(12);
  p.fill(0, 255, 100);
  p.text(`Challenges: ${gameState.challengesCompleted}/${CHALLENGES_TO_WIN}`, CANVAS_WIDTH - 10, 30);
}

export function drawPausedIndicator(p) {
  p.fill(255, 200, 0);
  p.textSize(14);
  p.textAlign(p.RIGHT, p.TOP);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

export function drawGameOverScreen(p, isWin) {
  p.background(20, 25, 35);
  
  // Result message
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.fill(...(isWin ? [0, 255, 100] : [255, 50, 50]));
  p.text(isWin ? "MISSION COMPLETE!" : "SYSTEM FAILURE", CANVAS_WIDTH / 2, 100);
  
  // Stats box
  p.fill(30, 35, 45);
  p.stroke(100, 150, 200);
  p.strokeWeight(2);
  p.rect(100, 160, CANVAS_WIDTH - 200, 140, 5);
  
  p.noStroke();
  p.fill(255);
  p.textSize(16);
  p.text("FINAL STATISTICS", CANVAS_WIDTH / 2, 180);
  
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  p.fill(200, 220, 240);
  p.text(`Score: ${gameState.score}`, 120, 210);
  p.text(`Challenges Completed: ${gameState.challengesCompleted}/${CHALLENGES_TO_WIN}`, 120, 235);
  p.text(`Final FPS: ${gameState.currentFPS.toFixed(0)}`, 120, 260);
  
  // Restart prompt
  p.fill(0, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  const flash = Math.sin(p.frameCount * 0.1) > 0;
  if (flash) {
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 350);
  }
}