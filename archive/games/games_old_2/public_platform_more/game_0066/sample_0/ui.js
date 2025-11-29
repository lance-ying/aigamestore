// ui.js - UI rendering functions
import { COLORS, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_START, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, STATE_CLIENT_SELECT, STATE_DATE_SELECT, STATE_DATE_VENUE, STATE_MINIGAME, STATE_DATE_RESULT } from './globals.js';

export function drawStartScreen(p, gameState) {
  p.background(...COLORS.background);
  
  // Title
  p.fill(...COLORS.primary);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("Kitty Powers'", CANVAS_WIDTH / 2, 80);
  p.textSize(52);
  p.text("MATCHMAKER", CANVAS_WIDTH / 2, 130);
  
  // Heart decoration
  drawHeart(p, CANVAS_WIDTH / 2 - 100, 105, 20, COLORS.accent);
  drawHeart(p, CANVAS_WIDTH / 2 + 100, 105, 20, COLORS.accent);
  
  // Description
  p.fill(...COLORS.text);
  p.textSize(14);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("Build your matchmaking empire!", CANVAS_WIDTH / 2, 180);
  p.text("Match clients with compatible dates and guide them", CANVAS_WIDTH / 2, 200);
  p.text("through romantic mini-games to fill the Love Meter!", CANVAS_WIDTH / 2, 220);
  
  // Instructions
  p.textSize(12);
  p.fill(...COLORS.textLight);
  p.text("CONTROLS:", CANVAS_WIDTH / 2, 260);
  p.text("Arrow Keys - Navigate menus", CANVAS_WIDTH / 2, 280);
  p.text("Space - Confirm selection", CANVAS_WIDTH / 2, 295);
  p.text("Z - Alternative action", CANVAS_WIDTH / 2, 310);
  p.text("ESC - Pause game", CANVAS_WIDTH / 2, 325);
  
  // Start prompt
  p.fill(...COLORS.primary);
  p.textSize(20);
  const flash = Math.floor(p.frameCount / 30) % 2 === 0;
  if (flash) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 365);
  }
}

export function drawGameOverScreen(p, gameState) {
  p.background(...COLORS.background);
  
  const isWin = gameState.gamePhase === PHASE_GAME_OVER_WIN;
  
  // Title
  p.fill(isWin ? ...COLORS.success : ...COLORS.failure);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "SUCCESS!" : "GAME OVER", CANVAS_WIDTH / 2, 100);
  
  // Message
  p.fill(...COLORS.text);
  p.textSize(18);
  if (isWin) {
    p.text("You've built a thriving matchmaking agency!", CANVAS_WIDTH / 2, 160);
  } else {
    p.text("Your agency couldn't attract enough clients.", CANVAS_WIDTH / 2, 160);
  }
  
  // Stats
  p.textSize(16);
  p.text(`Reputation: ${gameState.player.reputation}`, CANVAS_WIDTH / 2, 200);
  p.text(`Successful Dates: ${gameState.successfulDates}/${gameState.datesCompleted}`, CANVAS_WIDTH / 2, 225);
  p.text(`Unlocked Venues: ${gameState.unlockedVenues}`, CANVAS_WIDTH / 2, 250);
  
  // Restart prompt
  p.fill(...COLORS.primary);
  p.textSize(20);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 330);
}

export function drawPausedIndicator(p) {
  p.fill(...COLORS.text);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

export function drawUI(p, gameState) {
  // Top bar
  p.fill(...COLORS.panel);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 40);
  
  p.fill(...COLORS.text);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(14);
  p.text(`Reputation: ${gameState.player.reputation}`, 10, 20);
  p.text(`Dates: ${gameState.successfulDates}/${gameState.datesCompleted}`, 180, 20);
  p.text(`Venues: ${gameState.unlockedVenues}`, 350, 20);
  
  // Love meter during dates
  if (gameState.playState === STATE_MINIGAME || gameState.playState === STATE_DATE_RESULT) {
    drawLoveMeter(p, gameState);
  }
}

export function drawLoveMeter(p, gameState) {
  const x = CANVAS_WIDTH / 2 - 100;
  const y = 50;
  const w = 200;
  const h = 20;
  
  // Background
  p.fill(...COLORS.white);
  p.stroke(...COLORS.text);
  p.strokeWeight(2);
  p.rect(x, y, w, h);
  
  // Fill
  const fillWidth = (gameState.loveMeter / 100) * w;
  p.noStroke();
  if (gameState.loveMeter >= 75) {
    p.fill(...COLORS.success);
  } else if (gameState.loveMeter >= 50) {
    p.fill(...COLORS.secondary);
  } else {
    p.fill(...COLORS.failure);
  }
  p.rect(x, y, fillWidth, h);
  
  // Label
  p.fill(...COLORS.text);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(12);
  p.text(`Love Meter: ${Math.floor(gameState.loveMeter)}%`, CANVAS_WIDTH / 2, y + h / 2);
}

export function drawHeart(p, x, y, size, color) {
  p.push();
  p.translate(x, y);
  p.fill(...color);
  p.noStroke();
  
  p.beginShape();
  for (let a = 0; a < p.TWO_PI; a += 0.1) {
    const r = size * (2 - 2 * p.sin(a) + p.sin(a) * p.sqrt(p.abs(p.cos(a))) / (p.sin(a) + 1.4)) / 4;
    const px = r * p.cos(a);
    const py = r * p.sin(a);
    p.vertex(px, py);
  }
  p.endShape(p.CLOSE);
  
  p.pop();
}

export function drawPanel(p, x, y, w, h, title = null) {
  p.fill(...COLORS.panel);
  p.stroke(...COLORS.text);
  p.strokeWeight(2);
  p.rect(x, y, w, h, 10);
  
  if (title) {
    p.fill(...COLORS.primary);
    p.noStroke();
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(18);
    p.text(title, x + w / 2, y + 10);
  }
}