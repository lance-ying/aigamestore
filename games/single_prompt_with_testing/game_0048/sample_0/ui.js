// ui.js - UI rendering functions

import { gameState, PHASE_START, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 25, 35);
  
  // Animated background
  for (let i = 0; i < 20; i++) {
    const x = (i * 50 + p.frameCount * 0.5) % (CANVAS_WIDTH + 100) - 50;
    p.stroke(40, 45, 60);
    p.strokeWeight(2);
    p.line(x, 0, x, CANVAS_HEIGHT);
  }
  
  // Title
  p.fill(100, 200, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.text("CROSSHAIR DESIGNER", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(150, 180, 220);
  p.textSize(16);
  p.text("Design Your Perfect Aim", CANVAS_WIDTH / 2, 120);
  
  // Description
  p.fill(200, 210, 230);
  p.textSize(13);
  const descY = 160;
  p.text("Create and customize your ultimate crosshair", CANVAS_WIDTH / 2, descY);
  p.text("Test your design in target practice mode", CANVAS_WIDTH / 2, descY + 20);
  p.text("Hit " + gameState.requiredHits + " targets to win!", CANVAS_WIDTH / 2, descY + 40);
  
  // Instructions box
  p.fill(30, 35, 45);
  p.stroke(60, 120, 200);
  p.strokeWeight(2);
  p.rect(CANVAS_WIDTH / 2 - 180, 230, 360, 120, 8);
  
  p.fill(255, 255, 255);
  p.noStroke();
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  const instrX = CANVAS_WIDTH / 2 - 160;
  p.text("DESIGNER MODE:", instrX, 245);
  p.textSize(12);
  p.fill(200, 210, 230);
  p.text("Arrow Keys - Navigate options", instrX + 20, 265);
  p.text("Space - Reset to default", instrX + 20, 282);
  p.text("Shift - Fine-tune adjustments", instrX + 20, 299);
  
  p.fill(255, 255, 255);
  p.textSize(14);
  p.text("TARGET PRACTICE:", instrX, 318);
  p.textSize(12);
  p.fill(200, 210, 230);
  p.text("Arrow Keys - Move  |  Space - Shoot", instrX + 20, 335);
  
  // Toggle instruction
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(100, 255, 150);
  p.textSize(13);
  p.text("Press Z to toggle between modes", CANVAS_WIDTH / 2, 365);
  
  // Start prompt
  p.fill(255, 220, 100);
  p.textSize(18);
  const pulse = Math.sin(p.frameCount * 0.08) * 0.3 + 0.7;
  p.fill(255, 220, 100, 255 * pulse);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
}

export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  
  p.textSize(14);
  p.fill(200);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  
  // Small indicator in corner
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(12);
  p.fill(255, 200, 100);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

export function renderGameOverScreen(p) {
  p.background(20, 25, 35);
  
  const isWin = gameState.gamePhase === PHASE_GAME_OVER_WIN;
  
  // Title
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.fill(isWin ? [100, 255, 150] : [255, 100, 100]);
  p.text(isWin ? "VICTORY!" : "GAME OVER", CANVAS_WIDTH / 2, 100);
  
  // Message
  p.textSize(18);
  p.fill(200);
  if (isWin) {
    p.text("You've mastered your crosshair design!", CANVAS_WIDTH / 2, 150);
  } else {
    p.text("Keep practicing your aim!", CANVAS_WIDTH / 2, 150);
  }
  
  // Stats box
  p.fill(30, 35, 45);
  p.stroke(60, 120, 200);
  p.strokeWeight(2);
  p.rect(CANVAS_WIDTH / 2 - 150, 190, 300, 140, 8);
  
  p.noStroke();
  p.fill(255, 220, 100);
  p.textSize(24);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  
  p.fill(200);
  p.textSize(16);
  p.text(`Targets Destroyed: ${gameState.targetsDestroyed}`, CANVAS_WIDTH / 2, 255);
  
  const accuracy = gameState.shots > 0 ? Math.round((gameState.hits / gameState.shots) * 100) : 0;
  p.text(`Accuracy: ${accuracy}%`, CANVAS_WIDTH / 2, 280);
  p.text(`Shots Fired: ${gameState.shots}`, CANVAS_WIDTH / 2, 305);
  
  // Restart prompt
  p.fill(255, 220, 100);
  p.textSize(18);
  const pulse = Math.sin(p.frameCount * 0.08) * 0.3 + 0.7;
  p.fill(255, 220, 100, 255 * pulse);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
}