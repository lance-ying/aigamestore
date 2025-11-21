// ui.js - UI rendering functions
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, STYLES } from './globals.js';

export function drawStartScreen(p) {
  p.background(30, 40, 60);
  
  // Title
  p.fill(255, 200, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("INCREDIBOX", CANVAS_WIDTH / 2, 80);
  
  // Description
  p.fill(200, 200, 255);
  p.textSize(14);
  p.text("Create amazing music by mixing beats, melodies, effects, and voices!", CANVAS_WIDTH / 2, 140);
  p.text("Discover special combos to unlock new styles and earn points!", CANVAS_WIDTH / 2, 160);
  
  // Instructions
  p.fill(255, 255, 200);
  p.textSize(12);
  p.textAlign(p.LEFT, p.CENTER);
  const instructionsY = 200;
  p.text("Arrow Keys: Navigate icons and beatboxers", 100, instructionsY);
  p.text("Space: Assign icon or toggle mute", 100, instructionsY + 20);
  p.text("Z: Clear all icons", 100, instructionsY + 40);
  p.text("ESC: Pause game", 100, instructionsY + 60);
  p.text("R: Restart to start screen", 100, instructionsY + 80);
  
  // Start prompt
  p.fill(100, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 350);
}

export function drawGameUI(p) {
  // Draw score
  p.fill(255, 255, 255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
  
  // Draw level indicator
  p.textAlign(p.LEFT, p.TOP);
  const currentStyle = STYLES[gameState.currentStyleId];
  p.text(`Level: ${currentStyle.name}`, 10, 10);
  
  // Draw satisfaction meter
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text("Satisfaction", 10, 35);
  
  const meterWidth = 150;
  const meterHeight = 15;
  const meterX = 10;
  const meterY = 50;
  
  // Background
  p.fill(50);
  p.noStroke();
  p.rect(meterX, meterY, meterWidth, meterHeight);
  
  // Fill
  const fillWidth = (gameState.satisfactionMeter / 100) * meterWidth;
  const meterColor = gameState.satisfactionMeter > 50 ? [100, 255, 100] :
                      gameState.satisfactionMeter > 25 ? [255, 255, 100] :
                      [255, 100, 100];
  p.fill(...meterColor);
  p.rect(meterX, meterY, fillWidth, meterHeight);
  
  // Border
  p.noFill();
  p.stroke(255);
  p.strokeWeight(2);
  p.rect(meterX, meterY, meterWidth, meterHeight);
  
  // Draw combos discovered
  p.fill(255, 255, 255);
  p.noStroke();
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(12);
  p.text(`Combos: ${gameState.discoveredCombos.size}/${currentStyle.requiredCombos}`, 
         CANVAS_WIDTH - 10, 35);
}

export function drawPausedOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 255, 255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(20);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(16);
  p.text("Press ESC to continue", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  p.text("Press R to restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

export function drawGameOverScreen(p, isWin) {
  p.background(isWin ? [40, 80, 40] : [80, 40, 40]);
  
  // Title
  p.fill(255, 255, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "VICTORY!" : "GAME OVER", CANVAS_WIDTH / 2, 100);
  
  // Message
  p.textSize(20);
  if (isWin) {
    p.text("You've completed all levels!", CANVAS_WIDTH / 2, 160);
    p.text("You are a master music creator!", CANVAS_WIDTH / 2, 190);
  } else {
    p.text("Your satisfaction ran out!", CANVAS_WIDTH / 2, 160);
    p.text("Keep experimenting to maintain interest!", CANVAS_WIDTH / 2, 190);
  }
  
  // Score
  p.fill(255, 255, 100);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 250);
  
  // Instructions
  p.fill(255, 255, 255);
  p.textSize(18);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 320);
}

export function drawLevelCompleteOverlay(p) {
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  const nextStyle = STYLES[gameState.currentStyleId + 1];
  
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("LEVEL COMPLETE!", CANVAS_WIDTH / 2, 120);
  
  p.fill(255, 255, 255);
  p.textSize(20);
  p.text(`Unlocked: ${nextStyle.name}`, CANVAS_WIDTH / 2, 180);
  
  p.textSize(24);
  p.text("+1000 BONUS", CANVAS_WIDTH / 2, 230);
  
  p.fill(100, 255, 100);
  p.textSize(18);
  const continueAlpha = Math.sin(gameState.levelCompleteTimer * 0.1) * 127 + 127;
  p.fill(100, 255, 100, continueAlpha);
  p.text("Press ENTER to continue", CANVAS_WIDTH / 2, 300);
}

export function drawComboAnimation(p) {
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  const progress = gameState.comboAnimationTimer / 120;
  const scale = 1 + Math.sin(progress * Math.PI) * 0.3;
  
  p.push();
  p.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  p.scale(scale);
  
  // Combo burst effect
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 + progress * Math.PI;
    const radius = 100 + Math.sin(progress * Math.PI * 2) * 30;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    p.fill(255, 200, 100, 200);
    p.noStroke();
    p.ellipse(x, y, 20);
  }
  
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("COMBO DISCOVERED!", 0, -30);
  
  if (gameState.lastDiscoveredCombo) {
    p.textSize(24);
    p.fill(255, 255, 255);
    p.text(gameState.lastDiscoveredCombo, 0, 10);
  }
  
  p.textSize(28);
  p.fill(100, 255, 100);
  p.text("+500", 0, 50);
  
  p.pop();
}