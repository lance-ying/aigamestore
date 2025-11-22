// rendering.js - Rendering functions

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
  p.background(30, 40, 60);

  // Title
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(255, 220, 100);
  p.textSize(48);
  p.text("LEO'S FORTUNE", CANVAS_WIDTH / 2, 80);

  // Subtitle
  p.fill(200, 200, 200);
  p.textSize(16);
  p.text("Platform Adventure", CANVAS_WIDTH / 2, 120);

  // Instructions box
  p.fill(50, 60, 80);
  p.stroke(100, 120, 150);
  p.strokeWeight(2);
  p.rect(50, 150, CANVAS_WIDTH - 100, 180, 10);

  // Instructions
  p.noStroke();
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  let instructions = [
    "OBJECTIVE:",
    "Collect all gold coins to activate the exit portal!",
    "",
    "CONTROLS:",
    "← → : Move Leo left and right",
    "↑ : Inflate (float and move faster)",
    "↓ : Deflate (precise movement)",
    "SPACE : Jump",
    "ESC : Pause | R : Restart"
  ];

  let yPos = 160;
  for (let line of instructions) {
    if (line.includes("OBJECTIVE") || line.includes("CONTROLS")) {
      p.fill(255, 220, 100);
      p.textSize(16);
    } else {
      p.fill(200, 200, 200);
      p.textSize(14);
    }
    p.text(line, 70, yPos);
    yPos += line === "" ? 10 : 22;
  }

  // Start prompt
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(255, 255, 100);
  p.textSize(20);
  let alpha = 128 + 127 * Math.sin(p.frameCount * 0.1);
  p.fill(255, 255, 100, alpha);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
}

export function renderPauseOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.RIGHT, p.TOP);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

export function renderGameOverScreen(p, win) {
  p.background(30, 40, 60);

  p.textAlign(p.CENTER, p.CENTER);

  if (win) {
    p.fill(100, 255, 100);
    p.textSize(48);
    p.text("LEVEL COMPLETE!", CANVAS_WIDTH / 2, 120);

    if (gameState.currentLevel >= gameState.totalLevels - 1) {
      p.fill(255, 220, 100);
      p.textSize(32);
      p.text("ALL LEVELS COMPLETED!", CANVAS_WIDTH / 2, 170);
      
      p.fill(200, 200, 255);
      p.textSize(20);
      p.text("Hardcore Mode Unlocked!", CANVAS_WIDTH / 2, 210);
    }
  } else {
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 120);

    p.fill(200, 200, 200);
    p.textSize(20);
    p.text("You died!", CANVAS_WIDTH / 2, 170);
  }

  // Stats
  p.fill(255, 255, 255);
  p.textSize(18);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  p.text(`Deaths: ${gameState.deaths}`, CANVAS_WIDTH / 2, 250);
  p.text(`Level: ${gameState.currentLevel + 1}`, CANVAS_WIDTH / 2, 280);

  // Restart prompt
  p.fill(255, 255, 100);
  p.textSize(20);
  let alpha = 128 + 127 * Math.sin(p.frameCount * 0.1);
  p.fill(255, 255, 100, alpha);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 340);
}

export function renderUI(p) {
  // UI Background
  p.fill(0, 0, 0, 100);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 30);

  // Score
  p.fill(255, 220, 100);
  p.textSize(16);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Score: ${gameState.score}`, 10, 8);

  // Coins
  p.fill(255, 220, 50);
  p.text(`Coins: ${gameState.coinsCollected}/${gameState.totalCoins}`, 150, 8);

  // Level
  p.fill(200, 200, 255);
  p.text(`Level: ${gameState.currentLevel + 1}/${gameState.totalLevels}`, 320, 8);

  // Deaths
  p.fill(255, 100, 100);
  p.text(`Deaths: ${gameState.deaths}`, 480, 8);
}

export function updateCamera(player) {
  // Simple camera follow
  gameState.cameraOffsetX = Math.max(0, Math.min(player.x - CANVAS_WIDTH / 2, 0));
  gameState.cameraOffsetY = 0;
}

export function renderBackground(p) {
  // Gradient background
  for (let y = 0; y < CANVAS_HEIGHT; y++) {
    let inter = y / CANVAS_HEIGHT;
    let c = p.lerpColor(p.color(30, 40, 60), p.color(60, 80, 100), inter);
    p.stroke(c);
    p.line(0, y, CANVAS_WIDTH, y);
  }

  // Stars
  p.noStroke();
  p.fill(255, 255, 255, 150);
  for (let i = 0; i < 30; i++) {
    let x = (i * 137.5) % CANVAS_WIDTH;
    let y = (i * 197.3) % CANVAS_HEIGHT;
    let size = 1 + (i % 3);
    p.ellipse(x, y, size, size);
  }
}