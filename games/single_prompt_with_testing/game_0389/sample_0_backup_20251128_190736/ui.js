// ui.js - User interface rendering
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function drawStartScreen(p) {
  p.background(20, 25, 40);
  
  // Title with glow effect
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  // Glow
  p.fill(100, 200, 255, 50);
  p.noStroke();
  p.textSize(72);
  p.text("BEEP", CANVAS_WIDTH / 2, 80);
  
  // Title
  p.fill(100, 200, 255);
  p.textSize(64);
  p.text("BEEP", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(150, 180, 200);
  p.textSize(16);
  p.text("GRAVITY GUN PLATFORMER", CANVAS_WIDTH / 2, 130);
  
  // Instructions box
  p.fill(30, 35, 50, 200);
  p.stroke(100, 200, 255, 100);
  p.strokeWeight(2);
  p.rect(50, 160, CANVAS_WIDTH - 100, 160, 5);
  
  // Instructions
  p.fill(200, 220, 240);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    "Navigate BEEP through deadly hazards using your gravity gun!",
    "",
    "ARROW KEYS - Move left/right",
    "UP ARROW - Jump",
    "SPACE - Fire gravity gun (hold to grab)",
    "Z - Pull closer / Push away (toggle)",
    "",
    "Grab blocks to create platforms. Throw enemies into lava!",
    "Reach the blue portal to win!"
  ];
  
  let yPos = 175;
  for (let line of instructions) {
    p.text(line, 70, yPos);
    yPos += 18;
  }
  
  // Start prompt
  p.fill(100, 200, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  const alpha = (Math.sin(p.frameCount * 0.1) + 1) * 127;
  p.fill(100, 200, 255, alpha);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
  
  p.pop();
}

export function drawPauseOverlay(p) {
  p.push();
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 255, 255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  p.pop();
}

export function drawGameOverScreen(p) {
  p.background(20, 25, 40);
  
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  if (gameState.gamePhase === "GAME_OVER_WIN") {
    // Victory
    p.fill(100, 255, 150);
    p.textSize(48);
    p.text("MISSION COMPLETE!", CANVAS_WIDTH / 2, 120);
    
    p.fill(150, 200, 180);
    p.textSize(24);
    p.text("You escaped the facility!", CANVAS_WIDTH / 2, 180);
  } else {
    // Defeat
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 120);
    
    p.fill(200, 150, 150);
    p.textSize(24);
    p.text("BEEP was destroyed...", CANVAS_WIDTH / 2, 180);
  }
  
  // Score
  p.fill(200, 220, 240);
  p.textSize(20);
  p.text(`Final Score: ${Math.floor(gameState.score)}`, CANVAS_WIDTH / 2, 240);
  
  // Restart prompt
  const alpha = (Math.sin(p.frameCount * 0.1) + 1) * 127;
  p.fill(100, 200, 255, alpha);
  p.textSize(18);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 320);
  
  p.pop();
}

export function drawHUD(p) {
  p.push();
  
  // Health bar
  p.fill(40, 40, 50);
  p.noStroke();
  p.rect(10, 10, 204, 24, 3);
  
  const healthColor = gameState.health > 50 ? [100, 255, 150] : [255, 100, 100];
  p.fill(...healthColor);
  const healthWidth = (gameState.health / 100) * 200;
  p.rect(12, 12, healthWidth, 20, 2);
  
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text("HEALTH", 16, 14);
  
  // Score
  p.fill(40, 40, 50);
  p.rect(10, 44, 120, 24, 3);
  p.fill(100, 200, 255);
  p.text(`SCORE: ${Math.floor(gameState.score)}`, 16, 48);
  
  // Gravity gun status
  if (gameState.gravityGunActive) {
    p.fill(40, 40, 50);
    p.rect(10, 78, 180, 24, 3);
    p.fill(100, 255, 150);
    const mode = gameState.pullMode ? "PULL" : "PUSH";
    p.text(`GRAVITY GUN: ${mode}`, 16, 82);
  }
  
  p.pop();
}

export function drawBackground(p) {
  // Gradient background
  for (let y = 0; y < CANVAS_HEIGHT; y++) {
    const inter = y / CANVAS_HEIGHT;
    const c = p.lerpColor(p.color(30, 35, 50), p.color(50, 45, 70), inter);
    p.stroke(c);
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Stars (parallax effect based on camera)
  p.push();
  p.noStroke();
  p.randomSeed(42);
  for (let i = 0; i < 50; i++) {
    const x = p.random(CANVAS_WIDTH);
    const y = p.random(CANVAS_HEIGHT);
    const size = p.random(1, 3);
    const parallax = gameState.cameraX * 0.1;
    const starX = (x - parallax) % CANVAS_WIDTH;
    p.fill(200, 200, 255, p.random(100, 200));
    p.circle(starX, y, size);
  }
  p.pop();
}