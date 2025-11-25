// render.js - Rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 30, 40);
  
  // Title
  p.fill(255, 0, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('BROFORCE FOREVER', CANVAS_WIDTH/2, 80);
  
  // Stars and stripes decoration
  p.fill(255, 255, 255);
  for (let i = 0; i < 5; i++) {
    drawStar(100 + i * 100, 140, 8);
  }
  
  // Description
  p.fill(220, 220, 220);
  p.textSize(14);
  p.text('Battle through destructible terrain!', CANVAS_WIDTH/2, 180);
  p.text('Rescue prisoners to unlock new Bros!', CANVAS_WIDTH/2, 200);
  p.text('Reach the extraction helicopter to win!', CANVAS_WIDTH/2, 220);
  
  // Controls
  p.fill(255, 255, 100);
  p.textSize(12);
  p.textAlign(p.LEFT, p.CENTER);
  p.text('Arrow Keys: Move / Aim', 150, 260);
  p.text('Z: Jump', 150, 280);
  p.text('Space: Fire Weapon', 150, 300);
  p.text('Shift: Special Ability', 150, 320);
  
  // Start prompt
  p.fill(255, 255, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  if (Math.floor(p.frameCount / 30) % 2 === 0) {
    p.text('PRESS ENTER TO START', CANVAS_WIDTH/2, 360);
  }
}

export function renderGameOverScreen(p) {
  p.background(20, 30, 40);
  
  const won = gameState.gamePhase === "GAME_OVER_WIN";
  
  // Title
  p.fill(won ? [0, 255, 0] : [255, 0, 0]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(won ? 'MISSION COMPLETE!' : 'GAME OVER', CANVAS_WIDTH/2, 120);
  
  // Stats
  p.fill(220, 220, 220);
  p.textSize(20);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH/2, 180);
  p.text(`Bros Rescued: ${gameState.rescuedCount}`, CANVAS_WIDTH/2, 210);
  
  if (won) {
    p.fill(255, 215, 0);
    p.textSize(16);
    p.text('Freedom has been delivered!', CANVAS_WIDTH/2, 250);
  } else {
    p.fill(180, 180, 180);
    p.textSize(16);
    p.text('The terrorists won this time...', CANVAS_WIDTH/2, 250);
  }
  
  // Restart prompt
  p.fill(255, 255, 255);
  p.textSize(18);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH/2, 320);
}

export function renderPausedIndicator(p) {
  p.fill(255, 255, 255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text('PAUSED', CANVAS_WIDTH - 10, 10);
}

export function renderHUD(p) {
  if (!gameState.player) return;
  
  // Health bar
  p.fill(255, 0, 0);
  p.rect(10, 10, 100, 15);
  p.fill(0, 255, 0);
  const healthPercent = gameState.player.health / gameState.player.maxHealth;
  p.rect(10, 10, 100 * healthPercent, 15);
  
  // Health text
  p.fill(255, 255, 255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text(`HP: ${gameState.player.health}/${gameState.player.maxHealth}`, 15, 12);
  
  // Score
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
  
  // Bro type
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Bro: ${gameState.player.broType}`, 10, 35);
  
  // Rescued count
  p.text(`Rescued: ${gameState.rescuedCount}`, 10, 55);
  
  // Weapon cooldowns
  if (gameState.player.shootCooldown > 0) {
    p.fill(255, 255, 0);
    p.text(`Weapon: ${Math.ceil(gameState.player.shootCooldown / 6) / 10}s`, CANVAS_WIDTH - 120, 35);
  }
  if (gameState.player.specialCooldown > 0) {
    p.fill(255, 100, 0);
    p.text(`Special: ${Math.ceil(gameState.player.specialCooldown / 6) / 10}s`, CANVAS_WIDTH - 120, 55);
  }
}

function drawStar(x, y, size) {
  const p = window.gameInstance;
  p.push();
  p.translate(x, y);
  p.beginShape();
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const px = Math.cos(angle) * size;
    const py = Math.sin(angle) * size;
    p.vertex(px, py);
  }
  p.endShape(p.CLOSE);
  p.pop();
}