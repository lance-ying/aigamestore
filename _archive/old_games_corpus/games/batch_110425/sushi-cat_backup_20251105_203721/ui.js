// ui.js - UI rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
  p.background(255, 240, 220);
  
  // Title
  p.fill(255, 100, 150);
  p.textSize(48);
  p.textAlign(p.CENTER, p.CENTER);
  p.textStyle(p.BOLD);
  p.text("SUSHI CAT", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(100, 50, 100);
  p.textSize(16);
  p.textStyle(p.NORMAL);
  p.text("Drop & Bounce Physics Adventure", CANVAS_WIDTH / 2, 120);
  
  // Instructions
  p.fill(60);
  p.textSize(14);
  p.textAlign(p.LEFT, p.CENTER);
  
  const instructions = [
    "• Position the cat with LEFT/RIGHT arrows",
    "• Press SPACE to drop",
    "• Collect sushi to fill the belly meter",
    "• Reach 100% to win the level",
    "• Limited drops per level - use them wisely!",
    "",
    "ESC to pause • R to restart"
  ];
  
  let yPos = 170;
  instructions.forEach(line => {
    p.text(line, 120, yPos);
    yPos += 22;
  });
  
  // Press Enter prompt
  p.fill(255, 100, 150);
  p.textSize(20);
  p.textAlign(p.CENTER, p.CENTER);
  p.textStyle(p.BOLD);
  
  // Blinking effect
  if (Math.floor(p.frameCount / 30) % 2 === 0) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 350);
  }
}

export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textSize(48);
  p.textAlign(p.CENTER, p.CENTER);
  p.textStyle(p.BOLD);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  
  p.textSize(16);
  p.textStyle(p.NORMAL);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

export function renderGameOver(p) {
  p.background(240);
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  // Title
  p.fill(isWin ? [100, 200, 100] : [200, 100, 100]);
  p.textSize(48);
  p.textAlign(p.CENTER, p.CENTER);
  p.textStyle(p.BOLD);
  p.text(isWin ? "LEVEL COMPLETE!" : "OUT OF DROPS!", CANVAS_WIDTH / 2, 120);
  
  // Stats
  p.fill(60);
  p.textSize(20);
  p.textStyle(p.NORMAL);
  p.text(`Level: ${gameState.currentLevel}`, CANVAS_WIDTH / 2, 180);
  p.text(`Belly Meter: ${Math.floor(gameState.bellyMeter)}%`, CANVAS_WIDTH / 2, 210);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 240);
  
  if (isWin) {
    p.fill(100, 200, 100);
    p.textSize(16);
    p.text("Great job collecting all that sushi!", CANVAS_WIDTH / 2, 280);
  } else {
    p.fill(200, 100, 100);
    p.textSize(16);
    p.text("Need more sushi to fill the belly!", CANVAS_WIDTH / 2, 280);
  }
  
  // Restart prompt
  p.fill(100);
  p.textSize(18);
  p.textStyle(p.BOLD);
  
  if (Math.floor(p.frameCount / 30) % 2 === 0) {
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 340);
  }
}

export function renderUI(p) {
  // Belly meter background
  const meterWidth = CANVAS_WIDTH - 40;
  const meterHeight = 30;
  const meterX = 20;
  const meterY = CANVAS_HEIGHT - meterHeight - 10;
  
  p.fill(200);
  p.noStroke();
  p.rect(meterX, meterY, meterWidth, meterHeight, 5);
  
  // Belly meter fill
  const fillWidth = (meterWidth - 4) * (gameState.bellyMeter / 100);
  const gradient = p.lerpColor(p.color(255, 200, 100), p.color(255, 100, 150), gameState.bellyMeter / 100);
  p.fill(gradient);
  p.rect(meterX + 2, meterY + 2, fillWidth, meterHeight - 4, 4);
  
  // Belly meter text
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.CENTER, p.CENTER);
  p.textStyle(p.BOLD);
  p.text(`BELLY: ${Math.floor(gameState.bellyMeter)}%`, CANVAS_WIDTH / 2, meterY + meterHeight / 2);
  
  // Level and drops info
  p.fill(255);
  p.textSize(16);
  p.textAlign(p.LEFT, p.TOP);
  p.textStyle(p.BOLD);
  p.text(`Level: ${gameState.currentLevel}`, 10, 10);
  p.text(`Drops: ${gameState.dropsRemaining}`, 10, 30);
  p.text(`Score: ${gameState.score}`, 10, 50);
  
  // Drop position indicator (when not dropped)
  if (!gameState.catDropped) {
    p.fill(255, 180, 200, 150);
    p.noStroke();
    p.triangle(gameState.dropPositionX - 10, 75, 
               gameState.dropPositionX + 10, 75,
               gameState.dropPositionX, 85);
    
    p.fill(255);
    p.textSize(12);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("SPACE", gameState.dropPositionX, 95);
  }
}