// render.js - Rendering functions
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function drawBackground(p) {
  // Wood grain background
  p.background(120, 90, 60);
  
  // Wood texture effect
  p.noStroke();
  for (let i = 0; i < 50; i++) {
    const x = (i * 157) % CANVAS_WIDTH;
    const y = (i * 97) % CANVAS_HEIGHT;
    const size = 20 + (i * 13) % 40;
    p.fill(110 + (i % 20), 80 + (i % 15), 50 + (i % 10), 30);
    p.ellipse(x, y, size, size * 0.3);
  }
}

export function drawUI(p) {
  // Score
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(18);
  p.text(`Score: ${gameState.totalScore}`, CANVAS_WIDTH - 10, 10);
  
  // Level
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Level: ${gameState.currentLevelIndex}`, 10, 10);
  
  // Message text
  if (gameState.messageTimer > 0) {
    const alpha = Math.min(255, gameState.messageTimer * 3);
    p.fill(255, 255, 255, alpha);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16);
    p.text(gameState.messageText, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
    gameState.messageTimer--;
  }
}

export function drawStartScreen(p) {
  p.background(40, 30, 50);
  
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("THREAD LOGIC", CANVAS_WIDTH / 2, 80);
  
  p.fill(200);
  p.textSize(16);
  p.text("Remove all screws from the board", CANVAS_WIDTH / 2, 140);
  p.text("Screws must be fully unscrewed", CANVAS_WIDTH / 2, 165);
  p.text("and unblocked to be removed", CANVAS_WIDTH / 2, 185);
  
  p.textSize(14);
  p.text("CONTROLS:", CANVAS_WIDTH / 2, 225);
  p.textSize(12);
  p.text("Arrow Keys: Move cursor / Move selected screw", CANVAS_WIDTH / 2, 250);
  p.text("Space: Select screw / Confirm removal", CANVAS_WIDTH / 2, 270);
  p.text("Shift: Deselect screw", CANVAS_WIDTH / 2, 290);
  p.text("Esc: Pause | R: Restart", CANVAS_WIDTH / 2, 310);
  
  // Pulse effect on prompt
  const pulse = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(100, 255, 100, 255 * pulse);
  p.textSize(20);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
}

export function drawPausedOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(18);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  
  p.textSize(16);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
  p.text("Press R to restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
}

export function drawLevelCompleteScreen(p) {
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(100, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text(`LEVEL ${gameState.currentLevelIndex} COMPLETE!`, CANVAS_WIDTH / 2, 100);
  
  p.fill(255);
  p.textSize(18);
  p.text(`Level Score: ${gameState.levelScore}`, CANVAS_WIDTH / 2, 160);
  p.text(`Time Bonus: ${gameState.timeBonus}`, CANVAS_WIDTH / 2, 190);
  p.text(`Total Score: ${gameState.totalScore}`, CANVAS_WIDTH / 2, 220);
  
  const pulse = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(100, 255, 100, 255 * pulse);
  p.textSize(20);
  
  if (gameState.currentLevelIndex < 5) {
    p.text("PRESS SPACE FOR NEXT LEVEL", CANVAS_WIDTH / 2, 280);
  } else {
    p.text("PRESS SPACE TO FINISH", CANVAS_WIDTH / 2, 280);
  }
}

export function drawGameOverScreen(p) {
  p.background(40, 30, 50);
  
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.text("ALL LEVELS COMPLETE!", CANVAS_WIDTH / 2, 120);
  
  p.fill(100, 255, 100);
  p.textSize(28);
  p.text(`Final Score: ${gameState.totalScore}`, CANVAS_WIDTH / 2, 180);
  
  p.fill(200);
  p.textSize(18);
  p.text("Congratulations!", CANVAS_WIDTH / 2, 230);
  
  const pulse = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(255, 255, 255, 255 * pulse);
  p.textSize(20);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 300);
}