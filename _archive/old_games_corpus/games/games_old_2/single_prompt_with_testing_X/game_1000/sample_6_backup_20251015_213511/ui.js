// ui.js - UI rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
  p.background(135, 206, 235);
  
  // Title
  p.fill(255);
  p.stroke(0);
  p.strokeWeight(4);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("BIRD SLINGSHOT", CANVAS_WIDTH / 2, 80);
  
  // Description
  p.textSize(16);
  p.noStroke();
  p.fill(0);
  p.text("Launch birds to destroy pigs and structures!", CANVAS_WIDTH / 2, 150);
  p.text("Use special abilities to maximize destruction", CANVAS_WIDTH / 2, 175);
  
  // Instructions
  p.textSize(14);
  p.textAlign(p.LEFT, p.CENTER);
  p.text("↑↓ - Adjust Power", 150, 220);
  p.text("←→ - Aim Angle", 150, 240);
  p.text("SPACE - Launch / Activate Ability", 150, 260);
  
  // Start prompt
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  p.fill(255, 255, 0);
  p.stroke(0);
  p.strokeWeight(2);
  
  const pulse = p.abs(p.sin(p.frameCount * 0.05));
  p.fill(255, 255, 0, 150 + pulse * 105);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 350);
}

export function renderGameUI(p) {
  // Score
  p.fill(255);
  p.stroke(0);
  p.strokeWeight(2);
  p.textSize(18);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Score: ${gameState.score}`, 10, 10);
  
  // Birds remaining
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`Birds: ${gameState.birdsRemaining}`, CANVAS_WIDTH - 10, 10);
}

export function renderSlingshot(p) {
  const base = gameState.slingshotBase;
  
  // Draw slingshot structure
  p.strokeWeight(8);
  p.stroke(80, 50, 20);
  p.line(base.x - 20, base.y, base.x - 20, base.y - 60);
  p.line(base.x + 20, base.y, base.x + 20, base.y - 60);
  
  // Draw bands if aiming
  if (gameState.isAiming && gameState.currentBird) {
    p.strokeWeight(3);
    p.stroke(60, 40, 20);
    
    const bird = gameState.currentBird;
    const birdX = bird.body.position.x;
    const birdY = bird.body.position.y;
    
    p.line(base.x - 20, base.y - 50, birdX, birdY);
    p.line(base.x + 20, base.y - 50, birdX, birdY);
  }
}

export function renderAimingGuide(p) {
  if (!gameState.isAiming || !gameState.currentBird) return;
  
  const base = gameState.slingshotBase;
  const angleRad = (gameState.slingshotAngle * Math.PI) / 180;
  const power = gameState.slingshotPower;
  
  // Draw trajectory prediction matching actual physics
  p.noFill();
  p.stroke(255, 255, 255, 100);
  p.strokeWeight(2);
  p.beginShape();
  
  const vx = Math.cos(angleRad) * power * 0.15;
  const vy = Math.sin(angleRad) * power * 0.15;
  const gravity = gameState.world.gravity.y;
  
  // Simulate trajectory using physics timestep (1/60 second per frame)
  let posX = base.x;
  let posY = base.y - 30;
  let velX = vx;
  let velY = vy;
  
  for (let step = 0; step < 120; step++) {
    p.vertex(posX, posY);
    
    // Update velocity and position per frame
    velY += gravity;
    posX += velX;
    posY += velY;
    
    // Stop if out of bounds
    if (posY > CANVAS_HEIGHT || posX > CANVAS_WIDTH + 100) break;
  }
  p.endShape();
  
  // Draw angle and power indicators
  p.fill(255);
  p.noStroke();
  p.textSize(12);
  p.textAlign(p.LEFT, p.CENTER);
  p.text(`Angle: ${Math.round(gameState.slingshotAngle)}°`, base.x + 40, base.y - 70);
  p.text(`Power: ${Math.round(power)}%`, base.x + 40, base.y - 55);
}

export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.stroke(0);
  p.strokeWeight(3);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  
  p.textSize(18);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

export function renderGameOver(p) {
  p.background(135, 206, 235);
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  // Draw background elements
  for (let i = 0; i < 20; i++) {
    p.fill(255, 255, 255, 100);
    p.noStroke();
    p.circle(
      (p.frameCount * 0.5 + i * 50) % (CANVAS_WIDTH + 100) - 50,
      50 + i * 15,
      20
    );
  }
  
  // Title
  p.fill(isWin ? [50, 255, 50] : [255, 50, 50]);
  p.stroke(0);
  p.strokeWeight(4);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(56);
  p.text(isWin ? "VICTORY!" : "GAME OVER", CANVAS_WIDTH / 2, 100);
  
  // Score
  p.fill(255);
  p.textSize(32);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);
  
  // Message
  p.textSize(18);
  if (isWin) {
    p.text("All pigs defeated!", CANVAS_WIDTH / 2, 240);
    p.text("Excellent shooting!", CANVAS_WIDTH / 2, 265);
  } else {
    p.text("Out of birds!", CANVAS_WIDTH / 2, 240);
    p.text("Try again!", CANVAS_WIDTH / 2, 265);
  }
  
  // Restart prompt
  p.textSize(24);
  p.fill(255, 255, 0);
  const pulse = p.abs(p.sin(p.frameCount * 0.05));
  p.fill(255, 255, 0, 150 + pulse * 105);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 350);
}