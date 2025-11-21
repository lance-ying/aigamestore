// ui.js - UI rendering functions

import { 
  CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_START, PHASE_PLAYING, 
  PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE,
  TRACK_LENGTH
} from './globals.js';

export function renderStartScreen(p, gameState) {
  p.push();
  
  // Background gradient
  for (let i = 0; i < CANVAS_HEIGHT; i++) {
    const inter = i / CANVAS_HEIGHT;
    const c = p.lerpColor(p.color(101, 67, 33), p.color(255, 240, 220), inter);
    p.stroke(c);
    p.line(0, i, CANVAS_WIDTH, i);
  }
  
  // Title
  p.fill(255, 250, 240);
  p.stroke(101, 67, 33);
  p.strokeWeight(6);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("COFFEE STACK", CANVAS_WIDTH / 2, 60);
  
  // Decorative cups
  drawDecorativeCup(p, CANVAS_WIDTH / 2 - 100, 80);
  drawDecorativeCup(p, CANVAS_WIDTH / 2 + 100, 80);
  
  // Instructions
  p.fill(80, 50, 30);
  p.noStroke();
  p.textSize(14);
  p.textAlign(p.CENTER);
  
  const instructions = [
    "Build the perfect coffee stack!",
    "",
    "CONTROLS:",
    "← → : Move between lanes",
    "↑ : Speed boost (uses energy)",
    "Z / SHIFT : Quick dodge",
    "",
    "Collect cups, fill with coffee,",
    "add sleeves & lids to complete drinks.",
    "Avoid obstacles that knock items off!",
    "",
    "Serve completed drinks to customers",
    "for maximum coins!"
  ];
  
  let yPos = 140;
  for (const line of instructions) {
    p.text(line, CANVAS_WIDTH / 2, yPos);
    yPos += line === "" ? 10 : 20;
  }
  
  // Start prompt
  p.fill(160, 82, 45);
  p.textSize(20);
  const pulse = Math.sin(p.frameCount * 0.1) * 10 + 245;
  p.fill(pulse, pulse - 50, 50);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  
  p.pop();
}

function drawDecorativeCup(p, x, y) {
  p.push();
  p.fill(255, 250, 240);
  p.stroke(200, 190, 180);
  p.strokeWeight(2);
  p.beginShape();
  p.vertex(x - 15, y);
  p.vertex(x + 15, y);
  p.vertex(x + 18, y + 20);
  p.vertex(x - 18, y + 20);
  p.endShape(p.CLOSE);
  
  p.fill(101, 67, 33);
  p.noStroke();
  p.beginShape();
  p.vertex(x - 13, y + 3);
  p.vertex(x + 13, y + 3);
  p.vertex(x + 16, y + 18);
  p.vertex(x - 16, y + 18);
  p.endShape(p.CLOSE);
  
  p.fill(220, 220, 220);
  p.stroke(180);
  p.strokeWeight(1);
  p.ellipse(x, y, 32, 8);
  p.pop();
}

export function renderGameUI(p, gameState) {
  p.push();
  
  // Background panel
  p.fill(40, 30, 25, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 35);
  
  // Stack info
  p.fill(255, 250, 240);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(14);
  p.text(`Cups: ${gameState.player.getStackHeight()}`, 10, 18);
  
  // Completed drinks
  const completed = gameState.player.getCompletedDrinks();
  p.fill(255, 215, 0);
  p.text(`Complete: ${completed}`, 120, 18);
  
  // Coins
  p.fill(255, 215, 0);
  p.text(`Coins: ${gameState.coins}`, 250, 18);
  
  // Progress bar
  const progressWidth = 150;
  const progressX = CANVAS_WIDTH - progressWidth - 10;
  const progressY = 12;
  
  const progress = Math.min(1, gameState.scrollOffset / TRACK_LENGTH);
  
  p.fill(60, 50, 45);
  p.stroke(100);
  p.strokeWeight(1);
  p.rect(progressX, progressY, progressWidth, 12, 2);
  
  p.fill(100, 200, 255);
  p.noStroke();
  p.rect(progressX + 2, progressY + 2, (progressWidth - 4) * progress, 8, 2);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(10);
  p.text("PROGRESS", progressX + progressWidth / 2, progressY + 6);
  
  // Paused indicator
  if (gameState.gamePhase === PHASE_PAUSED) {
    p.fill(255, 255, 255, 200);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.text("PAUSED", CANVAS_WIDTH - 10, 40);
  }
  
  p.pop();
}

export function renderGameOverScreen(p, gameState) {
  p.push();
  
  // Semi-transparent overlay
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Determine win/lose
  const isWin = gameState.gamePhase === PHASE_GAME_OVER_WIN;
  
  // Title
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  if (isWin) {
    p.fill(100, 255, 100);
    p.stroke(50, 200, 50);
  } else {
    p.fill(255, 100, 100);
    p.stroke(200, 50, 50);
  }
  p.strokeWeight(4);
  p.text(isWin ? "SUCCESS!" : "GAME OVER", CANVAS_WIDTH / 2, 100);
  
  // Stats
  p.noStroke();
  p.fill(255, 250, 240);
  p.textSize(20);
  
  const stats = [
    `Cups Collected: ${gameState.cupsCollected}`,
    `Completed Drinks: ${gameState.completedDrinks}`,
    `Coins Earned: ${gameState.coins}`,
    `Total Coins: ${gameState.totalCoins}`
  ];
  
  let yPos = 180;
  for (const stat of stats) {
    p.text(stat, CANVAS_WIDTH / 2, yPos);
    yPos += 35;
  }
  
  // Restart prompt
  p.fill(255, 215, 0);
  p.textSize(18);
  const pulse = Math.sin(p.frameCount * 0.1) * 20 + 235;
  p.fill(pulse, pulse - 30, 50);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
  
  p.pop();
}

export function renderServingPhase(p, gameState) {
  p.push();
  
  // Cafe counter background
  p.fill(139, 90, 60);
  p.noStroke();
  p.rect(0, CANVAS_HEIGHT - 100, CANVAS_WIDTH, 100);
  
  // Counter top
  p.fill(160, 110, 80);
  p.rect(0, CANVAS_HEIGHT - 100, CANVAS_WIDTH, 15);
  
  // Message
  p.fill(255, 250, 240);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  p.text("Serving Customers...", CANVAS_WIDTH / 2, 80);
  
  p.pop();
}