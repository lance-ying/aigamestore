// ui.js - UI rendering functions

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function drawStartScreen(p) {
  p.background(20, 15, 30);

  // Animated background
  p.noStroke();
  for (let i = 0; i < 20; i++) {
    const x = (p.frameCount * 0.5 + i * 50) % (CANVAS_WIDTH + 100);
    const y = 50 + i * 20;
    p.fill(80, 60, 150, 30);
    p.ellipse(x, y, 40, 40);
  }

  // Title
  p.fill(255, 150, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(42);
  p.text("VTuber Studio", CANVAS_WIDTH / 2, 80);

  p.fill(200, 150, 255);
  p.textSize(20);
  p.text("Simulator", CANVAS_WIDTH / 2, 115);

  // Description
  p.fill(255);
  p.textSize(14);
  p.text("Match viewer requests to gain followers!", CANVAS_WIDTH / 2, 160);
  p.text("Reach 1000 followers to become a star!", CANVAS_WIDTH / 2, 180);

  // Instructions box
  p.fill(40, 35, 60);
  p.stroke(100, 80, 150);
  p.strokeWeight(2);
  p.rect(CANVAS_WIDTH / 2 - 180, 210, 360, 120, 10);

  p.noStroke();
  p.fill(255, 200, 100);
  p.textSize(16);
  p.textAlign(p.LEFT, p.TOP);
  p.text("Controls:", CANVAS_WIDTH / 2 - 160, 220);

  p.fill(220);
  p.textSize(12);
  p.text("Arrow Keys: Move avatar position", CANVAS_WIDTH / 2 - 160, 245);
  p.text("Z: Change expression", CANVAS_WIDTH / 2 - 160, 265);
  p.text("Space: Perform action", CANVAS_WIDTH / 2 - 160, 285);
  p.text("Shift: Toggle zoom", CANVAS_WIDTH / 2 - 160, 305);

  // Start prompt
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  const alpha = 200 + Math.sin(p.frameCount * 0.1) * 55;
  p.fill(255, 255, 100, alpha);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
}

export function drawGameUI(p) {
  // Top bar
  p.fill(30, 25, 40, 230);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 40);

  // Followers
  p.fill(255, 200, 255);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(16);
  p.text(`Followers: ${gameState.followers}/${gameState.targetFollowers}`, 15, 20);

  // Progress bar
  const barX = 200;
  const barWidth = 200;
  const barHeight = 15;
  const progress = gameState.followers / gameState.targetFollowers;

  p.fill(60, 50, 80);
  p.rect(barX, 12, barWidth, barHeight, 5);

  p.fill(150, 100, 255);
  p.rect(barX, 12, barWidth * progress, barHeight, 5);

  // Missed requests
  p.fill(255, 150, 150);
  p.textAlign(p.RIGHT, p.CENTER);
  p.text(`Missed: ${gameState.missedRequests}/${gameState.maxMissed}`, CANVAS_WIDTH - 15, 20);

  // Accuracy
  const total = gameState.completedRequests + gameState.missedRequests;
  const accuracy = total > 0 ? Math.round((gameState.completedRequests / total) * 100) : 100;
  p.fill(200, 255, 200);
  p.text(`Accuracy: ${accuracy}%`, CANVAS_WIDTH - 150, 20);

  // Paused indicator
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.fill(255, 255, 100);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(14);
    p.text("PAUSED", CANVAS_WIDTH - 10, 45);
  }

  // Match zone indicator
  p.stroke(255, 200, 100, 100);
  p.strokeWeight(2);
  p.noFill();
  p.rect(80, 50, 60, CANVAS_HEIGHT - 100, 10);
}

export function drawGameOverScreen(p, won) {
  p.background(20, 15, 30, 230);

  // Result
  if (won) {
    p.fill(100, 255, 150);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text("YOU WIN!", CANVAS_WIDTH / 2, 120);

    p.fill(200, 255, 200);
    p.textSize(20);
    p.text("You're a VTuber star!", CANVAS_WIDTH / 2, 170);
  } else {
    p.fill(255, 100, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text("STREAM ENDED", CANVAS_WIDTH / 2, 120);

    p.fill(255, 200, 200);
    p.textSize(20);
    p.text("Too many missed requests...", CANVAS_WIDTH / 2, 170);
  }

  // Stats box
  p.fill(40, 35, 60);
  p.stroke(100, 80, 150);
  p.strokeWeight(2);
  p.rect(CANVAS_WIDTH / 2 - 150, 210, 300, 100, 10);

  p.noStroke();
  p.fill(255, 200, 100);
  p.textSize(16);
  p.textAlign(p.CENTER, p.TOP);
  p.text("Final Stats", CANVAS_WIDTH / 2, 220);

  p.fill(220);
  p.textSize(14);
  p.text(`Followers: ${gameState.followers}`, CANVAS_WIDTH / 2, 250);
  
  const total = gameState.completedRequests + gameState.missedRequests;
  const accuracy = total > 0 ? Math.round((gameState.completedRequests / total) * 100) : 100;
  p.text(`Accuracy: ${accuracy}%`, CANVAS_WIDTH / 2, 275);

  // Restart prompt
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  const alpha = 200 + Math.sin(p.frameCount * 0.1) * 55;
  p.fill(255, 255, 100, alpha);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 350);
}