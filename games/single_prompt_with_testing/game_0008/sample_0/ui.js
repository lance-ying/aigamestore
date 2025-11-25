// ui.js - User interface rendering
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function drawStartScreen(p) {
  p.background(20, 15, 30);
  
  // Decorative background
  p.noStroke();
  for (let i = 0; i < 50; i++) {
    let x = (i * 137) % CANVAS_WIDTH;
    let y = (i * 219) % CANVAS_HEIGHT;
    p.fill(40, 30, 50, 100);
    p.circle(x, y, 3);
  }
  
  // Title
  p.fill(220, 200, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.text("SILKSONG", CANVAS_WIDTH / 2, 80);
  
  p.textSize(18);
  p.fill(180, 160, 200);
  p.text("ASCENT", CANVAS_WIDTH / 2, 115);
  
  // Instructions
  p.textSize(14);
  p.fill(200, 180, 220);
  p.textAlign(p.CENTER, p.TOP);
  
  let instructions = [
    "Battle through a haunted kingdom as Hornet",
    "",
    "ARROW KEYS - Move",
    "SPACE - Jump (hold for higher jump)",
    "Z - Attack with needle",
    "SHIFT - Dash (when unlocked)",
    "",
    "Defeat enemies to collect soul essence",
    "Reach the citadel at the peak to win!",
    "",
    "ESC - Pause | R - Restart"
  ];
  
  let yPos = 160;
  for (let line of instructions) {
    p.text(line, CANVAS_WIDTH / 2, yPos);
    yPos += 20;
  }
  
  // Start prompt
  p.textSize(20);
  p.fill(255, 220, 150, 150 + Math.sin(p.frameCount * 0.1) * 100);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}

export function drawPauseOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 255, 255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

export function drawGameOverScreen(p, won) {
  p.background(20, 15, 30);
  
  p.textAlign(p.CENTER, p.CENTER);
  
  if (won) {
    p.fill(220, 200, 100);
    p.textSize(48);
    p.text("VICTORY", CANVAS_WIDTH / 2, 120);
    
    p.textSize(20);
    p.fill(200, 180, 150);
    p.text("You reached the citadel!", CANVAS_WIDTH / 2, 170);
  } else {
    p.fill(200, 80, 80);
    p.textSize(48);
    p.text("DEFEATED", CANVAS_WIDTH / 2, 120);
    
    p.textSize(20);
    p.fill(180, 100, 100);
    p.text("The kingdom claims another soul", CANVAS_WIDTH / 2, 170);
  }
  
  p.textSize(24);
  p.fill(180, 180, 200);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  
  p.textSize(18);
  p.fill(220, 200, 220, 150 + Math.sin(p.frameCount * 0.1) * 100);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 60);
}

export function drawHUD(p, cameraY) {
  // Health bar
  p.push();
  p.noStroke();
  p.fill(50, 40, 60);
  p.rect(10, 10, 150, 20);
  
  let healthPercent = gameState.player.health / gameState.player.maxHealth;
  p.fill(200, 50, 50);
  p.rect(10, 10, 150 * healthPercent, 20);
  
  p.fill(255, 255, 255);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(12);
  p.text(`HP: ${Math.max(0, Math.floor(gameState.player.health))}`, 15, 20);
  p.pop();
  
  // Score
  p.push();
  p.fill(255, 255, 255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text(`Soul: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
  p.pop();
  
  // Dash indicator
  if (gameState.dashUnlocked) {
    p.push();
    p.noStroke();
    
    let dashReady = gameState.player.dashCooldown === 0;
    p.fill(dashReady ? 255 : 100, dashReady ? 220 : 100, dashReady ? 150 : 100);
    p.rect(10, 40, 80, 15);
    
    if (!dashReady) {
      let cooldownPercent = 1 - (gameState.player.dashCooldown / 60);
      p.fill(255, 220, 150);
      p.rect(10, 40, 80 * cooldownPercent, 15);
    }
    
    p.fill(50, 40, 60);
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(10);
    p.text("DASH", 15, 47);
    p.pop();
  }
  
  // Altitude indicator
  p.push();
  let altitude = Math.max(0, Math.floor((380 - gameState.highestY) / 10));
  p.fill(200, 200, 220);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text(`Altitude: ${altitude}m`, 10, 65);
  p.pop();
}