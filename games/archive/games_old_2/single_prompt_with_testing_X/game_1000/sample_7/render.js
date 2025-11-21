// render.js - Rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, CROP_TYPES, SEASONS, GRID_ROWS, GRID_COLS } from './globals.js';

export function renderStartScreen(p) {
  p.background(135, 206, 235);
  
  // Farm background
  for (let i = 0; i < 20; i++) {
    p.fill(34, 139, 34, 100);
    p.noStroke();
    p.rect(p.random(CANVAS_WIDTH), p.random(CANVAS_HEIGHT), 60, 60);
  }
  
  // Title
  p.fill(139, 69, 19);
  p.textSize(48);
  p.textAlign(p.CENTER, p.CENTER);
  p.textStyle(p.BOLD);
  p.text("HARVEST HAVEN", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(34, 139, 34);
  p.textSize(20);
  p.text("A Farming Adventure", CANVAS_WIDTH / 2, 130);
  
  // Instructions
  p.fill(80, 50, 30);
  p.textSize(14);
  p.textAlign(p.CENTER, p.CENTER);
  p.textStyle(p.NORMAL);
  
  const instructions = [
    "Grow crops, manage your energy, and reach your harvest goal!",
    "",
    "Controls:",
    "Arrow Keys / WASD - Move",
    "Space - Interact (Till, Plant, Water, Harvest)",
    "Z - Switch Seeds",
    "Shift - Sprint (uses more energy)",
    "",
    "Tip: Crops need water daily to grow!"
  ];
  
  let y = 180;
  instructions.forEach(line => {
    p.text(line, CANVAS_WIDTH / 2, y);
    y += 20;
  });
  
  // Start prompt
  p.fill(255, 215, 0);
  p.textSize(18);
  p.textStyle(p.BOLD);
  const alpha = 128 + 127 * Math.sin(p.frameCount * 0.1);
  p.fill(255, 215, 0, alpha);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
}

export function renderGame(p) {
  // Sky background
  const skyColor = p.lerpColor(
    p.color(135, 206, 235),
    p.color(25, 25, 112),
    gameState.timeOfDay
  );
  p.background(skyColor);
  
  // Render farm grid
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      gameState.farmGrid[row][col].render(p);
    }
  }
  
  // Render player
  if (gameState.player) {
    gameState.player.render();
  }
  
  // UI
  renderUI(p);
}

export function renderUI(p) {
  // Top bar background
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 60);
  
  // Season and day
  p.fill(255, 255, 255);
  p.textSize(16);
  p.textAlign(p.LEFT, p.TOP);
  p.textStyle(p.BOLD);
  p.text(`${SEASONS[gameState.season].toUpperCase()} - Day ${gameState.day}`, 10, 10);
  
  // Score
  p.text(`Gold: ${gameState.score}`, 10, 30);
  
  // Energy bar
  p.fill(100, 100, 100);
  p.rect(200, 10, 150, 20);
  p.fill(255, 200, 0);
  const energyWidth = (gameState.energy / gameState.maxEnergy) * 150;
  p.rect(200, 10, energyWidth, 20);
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(12);
  p.text(`Energy: ${Math.floor(gameState.energy)}/${gameState.maxEnergy}`, 275, 20);
  
  // Harvests progress
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text(`Harvests: ${gameState.harvests}/${gameState.targetHarvests}`, 200, 35);
  
  // Level
  p.text(`Level ${gameState.farmingLevel}`, 10, 50);
  
  // Selected seed
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  const crop = CROP_TYPES[gameState.selectedSeed];
  p.fill(crop.color);
  p.text(`Seed: ${crop.name} (Z to switch)`, CANVAS_WIDTH - 10, 10);
  
  // Time indicator
  p.fill(255, 255, 0, 200);
  const timeX = CANVAS_WIDTH - 30;
  const timeY = 40;
  p.ellipse(timeX, timeY, 15, 15);
  p.fill(0, 0, 0, 100);
  p.arc(timeX, timeY, 15, 15, -p.PI / 2, -p.PI / 2 + p.TWO_PI * gameState.timeOfDay);
}

export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 255, 255);
  p.textSize(48);
  p.textAlign(p.CENTER, p.CENTER);
  p.textStyle(p.BOLD);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  
  p.textSize(18);
  p.textStyle(p.NORMAL);
  p.text("Press ESC to continue", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
}

export function renderGameOver(p) {
  p.background(135, 206, 235);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Title
  p.fill(isWin ? [34, 139, 34] : [180, 50, 50]);
  p.textSize(48);
  p.textAlign(p.CENTER, p.CENTER);
  p.textStyle(p.BOLD);
  p.text(isWin ? "HARVEST SUCCESS!" : "GAME OVER", CANVAS_WIDTH / 2, 100);
  
  // Stats
  p.fill(80, 50, 30);
  p.textSize(20);
  p.textStyle(p.NORMAL);
  
  const stats = [
    `Final Score: ${gameState.score} Gold`,
    `Total Harvests: ${gameState.harvests}`,
    `Days Played: ${gameState.day}`,
    `Farming Level: ${gameState.farmingLevel}`,
    `Season: ${SEASONS[gameState.season]}`
  ];
  
  let y = 180;
  stats.forEach(stat => {
    p.text(stat, CANVAS_WIDTH / 2, y);
    y += 35;
  });
  
  // Message
  if (isWin) {
    p.fill(34, 139, 34);
    p.textSize(18);
    p.text("You've become a master farmer!", CANVAS_WIDTH / 2, y + 20);
  }
  
  // Restart prompt
  p.fill(255, 215, 0);
  p.textSize(18);
  p.textStyle(p.BOLD);
  const alpha = 128 + 127 * Math.sin(p.frameCount * 0.1);
  p.fill(255, 215, 0, alpha);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
}