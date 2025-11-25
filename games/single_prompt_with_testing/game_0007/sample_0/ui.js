// ui.js - UI rendering functions

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, 
         PHASE_START, PHASE_PLAYING, PHASE_PAUSED,
         PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 30, 50);
  
  // Decorative background
  p.push();
  p.noStroke();
  for (let i = 0; i < 30; i++) {
    const x = (i * 87) % CANVAS_WIDTH;
    const y = (i * 53) % CANVAS_HEIGHT;
    const size = 30 + (i % 3) * 20;
    p.fill(40, 50, 80, 50);
    p.ellipse(x, y, size, size);
  }
  p.pop();
  
  // Title
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  // Title shadow
  p.fill(0, 0, 0, 100);
  p.textSize(48);
  p.text("CUPHEAD", CANVAS_WIDTH / 2 + 3, 70 + 3);
  
  // Title
  p.fill(255, 220, 100);
  p.stroke(200, 50, 50);
  p.strokeWeight(4);
  p.textSize(48);
  p.text("CUPHEAD", CANVAS_WIDTH / 2, 70);
  
  // Subtitle
  p.noStroke();
  p.fill(255, 200, 200);
  p.textSize(16);
  p.text("BOSS BATTLE", CANVAS_WIDTH / 2, 110);
  
  // Description
  p.fill(220, 220, 220);
  p.textSize(14);
  p.text("Defeat the Devil Boss to pay off your debt!", CANVAS_WIDTH / 2, 150);
  p.text("Survive the boss attacks and shoot to win!", CANVAS_WIDTH / 2, 170);
  
  // Instructions box
  p.fill(40, 50, 70, 200);
  p.stroke(100, 120, 150);
  p.strokeWeight(2);
  p.rect(CANVAS_WIDTH / 2 - 180, 200, 360, 120, 5);
  
  // Instructions
  p.noStroke();
  p.fill(255, 255, 255);
  p.textSize(13);
  p.textAlign(p.LEFT, p.TOP);
  const instructX = CANVAS_WIDTH / 2 - 160;
  p.text("← → Arrow Keys: Move Left/Right", instructX, 215);
  p.text("↑ Arrow Key: Jump", instructX, 235);
  p.text("Z Key: Shoot", instructX, 255);
  p.text("Space: Dash (invincible during dash)", instructX, 275);
  p.text("ESC: Pause    R: Restart", instructX, 295);
  
  // Start prompt
  p.textAlign(p.CENTER, p.CENTER);
  const flash = Math.sin(p.frameCount * 0.1) * 0.5 + 0.5;
  p.fill(255, 255, 100, 150 + flash * 105);
  p.textSize(18);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
  
  p.pop();
}

export function renderGameOverScreen(p, won) {
  p.push();
  
  // Semi-transparent overlay
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Result box
  p.fill(30, 30, 30, 230);
  p.stroke(won ? [100, 255, 100] : [255, 100, 100]);
  p.strokeWeight(4);
  p.rect(CANVAS_WIDTH / 2 - 150, CANVAS_HEIGHT / 2 - 100, 300, 200, 10);
  
  p.textAlign(p.CENTER, p.CENTER);
  p.noStroke();
  
  // Title
  if (won) {
    p.fill(100, 255, 100);
    p.textSize(40);
    p.text("KNOCKOUT!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
    p.fill(255, 255, 255);
    p.textSize(16);
    p.text("You defeated the Devil Boss!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  } else {
    p.fill(255, 100, 100);
    p.textSize(40);
    p.text("GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
    p.fill(255, 255, 255);
    p.textSize(16);
    p.text("Better luck next time!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  }
  
  // Score
  p.fill(255, 255, 200);
  p.textSize(18);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  
  // Restart prompt
  const flash = Math.sin(p.frameCount * 0.15) * 0.5 + 0.5;
  p.fill(255, 255, 255, 150 + flash * 105);
  p.textSize(16);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
  
  p.pop();
}

export function renderHUD(p, player) {
  p.push();
  
  // Player health bar
  const healthBarWidth = 150;
  const healthBarHeight = 20;
  const healthBarX = 20;
  const healthBarY = CANVAS_HEIGHT - 40;
  
  // Background
  p.fill(40, 40, 40);
  p.stroke(255);
  p.strokeWeight(2);
  p.rect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
  
  // Health
  const healthWidth = (player.health / player.maxHealth) * (healthBarWidth - 4);
  p.noStroke();
  const healthColor = player.health > 60 ? 
                      [100, 255, 100] : 
                      player.health > 30 ? 
                      [255, 255, 100] : 
                      [255, 100, 100];
  p.fill(...healthColor);
  p.rect(healthBarX + 2, healthBarY + 2, healthWidth, healthBarHeight - 4);
  
  // Label
  p.fill(255);
  p.noStroke();
  p.textAlign(p.LEFT, p.BOTTOM);
  p.textSize(12);
  p.text("HP", healthBarX, healthBarY - 2);
  
  // Score
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(18);
  p.fill(255, 255, 200);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 20, 20);
  
  // Dash cooldown indicator
  if (player.dashCooldown > 0) {
    const cooldownPercent = player.dashCooldown / player.dashDelay;
    p.fill(150, 150, 255, 150);
    p.noStroke();
    p.rect(healthBarX, healthBarY + 25, healthBarWidth * (1 - cooldownPercent), 5);
  } else {
    p.fill(100, 255, 100);
    p.noStroke();
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(10);
    p.text("DASH READY", healthBarX, healthBarY + 25);
  }
  
  // Paused indicator
  if (gameState.gamePhase === PHASE_PAUSED) {
    p.textAlign(p.RIGHT, p.TOP);
    p.fill(255, 255, 255);
    p.textSize(14);
    p.text("PAUSED", CANVAS_WIDTH - 20, 50);
  }
  
  p.pop();
}

export function renderBackground(p) {
  // Gradient background
  for (let y = 0; y < CANVAS_HEIGHT; y++) {
    const t = y / CANVAS_HEIGHT;
    const r = 30 + t * 20;
    const g = 20 + t * 30;
    const b = 50 + t * 30;
    p.stroke(r, g, b);
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Ground
  p.noStroke();
  p.fill(40, 30, 20);
  p.rect(0, gameState.groundY, CANVAS_WIDTH, CANVAS_HEIGHT - gameState.groundY);
  
  // Ground detail
  p.fill(60, 45, 30);
  for (let x = 0; x < CANVAS_WIDTH; x += 40) {
    p.rect(x, gameState.groundY, 35, 5);
  }
  
  // Background clouds/decorations
  p.noStroke();
  const cloudPositions = [
    { x: 100, y: 80, size: 60 },
    { x: 350, y: 120, size: 80 },
    { x: 500, y: 60, size: 50 }
  ];
  
  cloudPositions.forEach(cloud => {
    p.fill(60, 60, 90, 100);
    p.ellipse(cloud.x, cloud.y, cloud.size, cloud.size * 0.6);
    p.ellipse(cloud.x - 20, cloud.y + 5, cloud.size * 0.7, cloud.size * 0.5);
    p.ellipse(cloud.x + 20, cloud.y + 5, cloud.size * 0.7, cloud.size * 0.5);
  });
}