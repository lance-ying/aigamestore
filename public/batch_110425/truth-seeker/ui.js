// ui.js
import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES } from './globals.js';

export function drawStartScreen(p) {
  p.background(20, 15, 30);
  
  // Title with dramatic effect
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  // Title shadow
  p.fill(0);
  p.textSize(40);
  p.text("TRUTH SEEKER", CANVAS_WIDTH / 2 + 3, 80 + 3);
  
  // Title
  p.fill(255, 50, 80);
  p.textSize(40);
  p.text("TRUTH SEEKER", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(255, 200, 220);
  p.textSize(16);
  p.text("Class Trial Investigation", CANVAS_WIDTH / 2, 115);
  
  // Instructions box
  p.fill(40, 35, 50);
  p.stroke(255, 100, 150);
  p.strokeWeight(2);
  p.rect(100, 150, 400, 180, 10);
  
  // Instructions
  p.fill(255);
  p.noStroke();
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    "OBJECTIVE:",
    "• Collect Truth Bullets during Investigation",
    "• Shoot down lies in the Class Trial",
    "• Complete all 3 chapters to win!",
    "",
    "CONTROLS:",
    "• Arrow Keys: Move character",
    "• SPACE: Collect evidence",
    "• Z: Fire Truth Bullet at lies",
    "• SHIFT: Slow time (limited uses)"
  ];
  
  let yOffset = 160;
  instructions.forEach(line => {
    p.text(line, 120, yOffset);
    yOffset += 18;
  });
  
  // Start prompt
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(255, 220, 0);
  p.textSize(18);
  const pulse = Math.abs(Math.sin(p.frameCount * 0.05));
  p.fill(255, 220, 0, 150 + pulse * 105);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
  
  p.pop();
}

export function drawInvestigationUI(p, gameState) {
  // Top bar
  p.fill(20, 15, 30, 200);
  p.rect(0, 0, CANVAS_WIDTH, 35);
  
  // Chapter info
  p.fill(255, 200, 220);
  p.textSize(16);
  p.textAlign(p.LEFT, p.CENTER);
  p.text(`Chapter ${gameState.currentChapter}`, 10, 17);
  
  // Evidence collected
  p.fill(255, 220, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(`Evidence: ${gameState.collectedBullets.length}/${gameState.evidencePoints.length}`, CANVAS_WIDTH / 2, 17);
  
  // Score
  p.fill(100, 200, 255);
  p.textAlign(p.RIGHT, p.CENTER);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 17);
  
  // Bottom instruction
  p.fill(255, 255, 255, 200);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(12);
  p.text("Press SPACE near evidence to collect Truth Bullets", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 15);
}

export function drawClassTrialUI(p, gameState) {
  // Background
  p.fill(20, 15, 30, 100);
  p.rect(0, 0, CANVAS_WIDTH, 50);
  p.rect(0, CANVAS_HEIGHT - 80, CANVAS_WIDTH, 80);
  
  // Top bar
  p.fill(255, 50, 80);
  p.textSize(18);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("CLASS TRIAL", CANVAS_WIDTH / 2, 15);
  
  // Timer
  p.fill(gameState.trialTimeRemaining < 10 ? [255, 100, 100] : [255, 220, 0]);
  p.textSize(16);
  p.text(`Time: ${Math.ceil(gameState.trialTimeRemaining)}s`, CANVAS_WIDTH / 2, 35);
  
  // Lies found
  p.fill(100, 255, 150);
  p.textAlign(p.LEFT, p.CENTER);
  p.text(`Lies Found: ${gameState.liesFound}/${gameState.totalLies}`, 10, 35);
  
  // Health
  p.textAlign(p.RIGHT, p.CENTER);
  for (let i = 0; i < 3; i++) {
    p.fill(i < gameState.health ? [255, 100, 150] : [80, 60, 70]);
    p.ellipse(CANVAS_WIDTH - 20 - i * 30, 35, 20, 20);
  }
  
  // Bottom bar - Truth Bullets
  p.fill(40, 35, 50);
  p.rect(50, CANVAS_HEIGHT - 70, CANVAS_WIDTH - 100, 60, 10);
  
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  p.text("Truth Bullets (Press Z to fire):", 60, CANVAS_HEIGHT - 65);
  
  // Display collected bullets
  gameState.collectedBullets.forEach((bullet, i) => {
    const x = 60 + i * 90;
    const y = CANVAS_HEIGHT - 45;
    
    p.fill(60, 55, 70);
    p.stroke(255, 200, 0);
    p.strokeWeight(2);
    p.rect(x, y, 80, 30, 5);
    
    p.fill(255, 220, 0);
    p.noStroke();
    p.textSize(10);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(bullet.name, x + 40, y + 15);
  });
  
  // Slow-mo charges
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`Slow-Mo: ${gameState.slowMoCharges}`, CANVAS_WIDTH - 60, CANVAS_HEIGHT - 65);
  
  if (gameState.slowMoActive) {
    p.fill(100, 200, 255, 150);
    p.textSize(20);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("SLOW MOTION", CANVAS_WIDTH / 2, 80);
  }
}

export function drawPausedIndicator(p) {
  p.fill(255, 220, 0);
  p.textSize(16);
  p.textAlign(p.RIGHT, p.TOP);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

export function drawGameOverScreen(p, gameState) {
  p.background(20, 15, 30);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  // Result
  if (isWin) {
    p.fill(100, 255, 150);
    p.textSize(50);
    p.text("CASE SOLVED!", CANVAS_WIDTH / 2, 100);
    
    p.fill(255);
    p.textSize(18);
    p.text("You successfully exposed all the lies!", CANVAS_WIDTH / 2, 160);
  } else {
    p.fill(255, 100, 100);
    p.textSize(50);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 100);
    
    p.fill(255);
    p.textSize(18);
    p.text("The culprit escaped...", CANVAS_WIDTH / 2, 160);
  }
  
  // Stats
  p.fill(255, 220, 0);
  p.textSize(20);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  
  p.fill(255);
  p.textSize(16);
  p.text(`Chapters Completed: ${isWin ? gameState.maxChapters : gameState.currentChapter - 1}`, CANVAS_WIDTH / 2, 250);
  p.text(`Max Combo: ${gameState.maxCombo}`, CANVAS_WIDTH / 2, 275);
  
  // Restart prompt
  p.fill(255, 220, 0);
  p.textSize(18);
  const pulse = Math.abs(Math.sin(p.frameCount * 0.05));
  p.fill(255, 220, 0, 150 + pulse * 105);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 340);
  
  p.pop();
}