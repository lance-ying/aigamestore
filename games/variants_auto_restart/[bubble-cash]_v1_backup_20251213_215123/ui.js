// ui.js - UI rendering

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, LOSE_LINE_Y } from './globals.js';
import { calculateShotBonus } from './levels.js';

export function drawUI(p) {
  p.push();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(20);
  p.fill(255);
  p.noStroke();

  // Score
  p.text(`SCORE: ${gameState.score}`, 10, 10);

  // Shots
  p.textAlign(p.CENTER, p.TOP);
  p.text(`SHOTS: ${gameState.shotsRemaining}`, CANVAS_WIDTH / 2, 10);

  // Level
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`LEVEL: ${gameState.currentLevel}`, CANVAS_WIDTH - 10, 10);

  // Lose line indicator
  p.stroke(255, 0, 0, 100);
  p.strokeWeight(2);
  p.line(0, LOSE_LINE_Y, CANVAS_WIDTH, LOSE_LINE_Y);

  p.pop();
}

export function drawStartScreen(p) {
  p.push();
  p.background(20, 30, 50);

  p.textAlign(p.CENTER, p.TOP);
  p.noStroke();

  // Replaced Title with "press enter to begin"
  p.fill(255, 220, 100);
  p.textSize(40);
  p.text('press enter to begin', CANVAS_WIDTH / 2, 40);

  // Removed "Press ENTER to Start" prompt as the new title serves this purpose.
  // Shifted subsequent sections up by 60 pixels to fill the space.

  // Controls
  p.textSize(18);
  p.fill(100, 200, 255);
  p.text('CONTROLS', CANVAS_WIDTH / 2, 90); // Original: 150 - 60 = 90
  p.textSize(14);
  p.fill(220);
  p.text('Arrow Keys: Aim   |   Space: Fire', CANVAS_WIDTH / 2, 115); // Original: 175 - 60 = 115
  p.text('Z: Swap Bubble   |   Esc: Pause', CANVAS_WIDTH / 2, 135); // Original: 195 - 60 = 135

  // Rules
  p.textSize(18);
  p.fill(100, 200, 255);
  p.text('RULES', CANVAS_WIDTH / 2, 175); // Original: 235 - 60 = 175
  p.textSize(14);
  p.fill(220);
  p.text('Match 3+ bubbles of same color to pop', CANVAS_WIDTH / 2, 200); // Original: 260 - 60 = 200
  p.text('Clear all bubbles to advance', CANVAS_WIDTH / 2, 220); // Original: 280 - 60 = 220

  // Game Over Conditions
  p.textSize(18);
  p.fill(255, 100, 100);
  p.text('GAME OVER IF', CANVAS_WIDTH / 2, 260); // Original: 320 - 60 = 260
  p.textSize(14);
  p.fill(220);
  p.text('Bubbles reach the bottom red line', CANVAS_WIDTH / 2, 285); // Original: 345 - 60 = 285
  p.text('You run out of shots', CANVAS_WIDTH / 2, 305); // Original: 365 - 60 = 305

  // Scoring
  p.textSize(18);
  p.fill(100, 255, 100);
  p.text('SCORING', CANVAS_WIDTH / 2, 345); // Original: 405 - 60 = 345
  p.textSize(14);
  p.fill(220);
  p.text('Pop Bubble: 10 pts', CANVAS_WIDTH / 2, 370); // Original: 430 - 60 = 370
  p.text('Drop Detached Bubble: 20 pts', CANVAS_WIDTH / 2, 390); // Original: 450 - 60 = 390
  p.text('Level Bonus: 100 pts × Remaining Shots', CANVAS_WIDTH / 2, 410); // Original: 470 - 60 = 410

  p.pop();
}

export function drawPausedIndicator(p) {
  p.push();
  p.textAlign(p.RIGHT, p.TOP);
  p.fill(255, 255, 100);
  p.textSize(18);
  p.noStroke();
  p.text('PAUSED', CANVAS_WIDTH - 10, 40);
  p.pop();
}

export function drawGameOverScreen(p, isWin) {
  p.push();
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  p.textAlign(p.CENTER, p.CENTER);
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.textSize(48);
  p.noStroke();
  p.text(isWin ? 'YOU WIN!' : 'GAME OVER', CANVAS_WIDTH / 2, 120);

  p.fill(255);
  p.textSize(24);
  p.text(`FINAL SCORE: ${gameState.finalScore}`, CANVAS_WIDTH / 2, 200);

  p.fill(255, 255, 100);
  p.textSize(20);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 280);

  p.pop();
}

export function drawLevelTransition(p) {
  p.push();
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  p.textAlign(p.CENTER, p.CENTER);
  p.fill(100, 255, 100);
  p.textSize(36);
  p.noStroke();
  p.text(`LEVEL ${gameState.currentLevel - 1} COMPLETE!`, CANVAS_WIDTH / 2, 150);

  p.fill(255);
  p.textSize(24);
  const bonus = calculateShotBonus();
  p.text(`Shot Bonus: +${bonus}`, CANVAS_WIDTH / 2, 200);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 230);

  p.fill(255, 255, 100);
  p.textSize(20);
  p.text(`GET READY FOR LEVEL ${gameState.currentLevel}!`, CANVAS_WIDTH / 2, 280);

  p.pop();
}