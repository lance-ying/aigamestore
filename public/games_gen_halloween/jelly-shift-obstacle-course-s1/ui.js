// ui.js - UI rendering functions
import { 
  CANVAS_WIDTH, CANVAS_HEIGHT, 
  PHASE_START, PHASE_PLAYING, PHASE_PAUSED, 
  PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE,
  gameState 
} from './globals.js';

export function drawStartScreen(p) {
  p.background(20, 30, 50);
  
  // Animated background elements
  for (let i = 0; i < 5; i++) {
    const x = (p.frameCount * 0.5 + i * 120) % (CANVAS_WIDTH + 100) - 50;
    const y = 100 + i * 60;
    p.fill(100, 200, 255, 30);
    p.noStroke();
    p.ellipse(x, y, 60, 30);
  }
  
  // Title
  p.fill(100, 200, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("JELLY SHIFT", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(255);
  p.textSize(16);
  p.text("OBSTACLE COURSE", CANVAS_WIDTH / 2, 120);
  
  // Description
  p.fill(200, 220, 255);
  p.textSize(14);
  p.textAlign(p.CENTER, p.CENTER);
  const desc = [
    "Navigate through obstacles by changing your jelly's shape!",
    "",
    "Match your shape to fit through gaps.",
    "Collect diamonds for bonus points.",
    "Build combos to activate JELLY FEVER mode!"
  ];
  for (let i = 0; i < desc.length; i++) {
    p.text(desc[i], CANVAS_WIDTH / 2, 170 + i * 20);
  }
  
  // Controls
  p.fill(150, 200, 255);
  p.textSize(16);
  p.text("CONTROLS", CANVAS_WIDTH / 2, 290);
  
  p.fill(220, 240, 255);
  p.textSize(13);
  p.text("UP ARROW: Tall Shape", CANVAS_WIDTH / 2, 315);
  p.text("DOWN ARROW: Short Shape", CANVAS_WIDTH / 2, 335);
  
  // Start prompt (pulsing)
  const alpha = 200 + Math.sin(p.frameCount * 0.1) * 55;
  p.fill(255, 215, 0, alpha);
  p.textSize(20);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 375);
}

export function drawPausedIndicator(p) {
  p.fill(255, 255, 0);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

export function drawGameOverScreen(p, win) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Game over message
  p.textAlign(p.CENTER, p.CENTER);
  if (win) {
    p.fill(100, 255, 100);
    p.textSize(48);
    p.text("LEVEL COMPLETE!", CANVAS_WIDTH / 2, 120);
    
    p.fill(255);
    p.textSize(24);
    p.text("Great job!", CANVAS_WIDTH / 2, 170);
  } else {
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 120);
    
    p.fill(255);
    p.textSize(20);
    p.text("You collided with an obstacle!", CANVAS_WIDTH / 2, 170);
  }
  
  // Stats
  p.fill(200, 220, 255);
  p.textSize(18);
  p.text(`Level: ${gameState.level}`, CANVAS_WIDTH / 2, 220);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 245);
  p.text(`Distance: ${Math.floor(gameState.distance)}m`, CANVAS_WIDTH / 2, 270);
  
  // Restart prompt
  const alpha = 200 + Math.sin(p.frameCount * 0.1) * 55;
  p.fill(255, 215, 0, alpha);
  p.textSize(20);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 340);
}

export function drawHUD(p) {
  // Background for HUD
  p.fill(0, 0, 0, 100);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 50);
  
  // Score
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text(`Score: ${gameState.score}`, 10, 10);
  
  // Level
  p.text(`Level: ${gameState.level}`, 10, 28);
  
  // Distance to finish
  const distanceToFinish = Math.max(0, Math.floor(gameState.finishLineX - gameState.distance));
  p.textAlign(p.CENTER, p.TOP);
  p.text(`Distance: ${distanceToFinish}m`, CANVAS_WIDTH / 2, 10);
  
  // Combo
  if (gameState.combo > 0) {
    p.fill(255, 215, 0);
    p.text(`Combo: x${gameState.combo}`, CANVAS_WIDTH / 2, 28);
  }
  
  // Jelly Fever indicator
  if (gameState.jellyFeverActive) {
    const alpha = 200 + Math.sin(p.frameCount * 0.2) * 55;
    p.fill(255, 100, 200, alpha);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(18);
    p.text("JELLY FEVER!", CANVAS_WIDTH - 10, 10);
    
    // Fever timer bar
    const barWidth = 100;
    const barHeight = 8;
    const barX = CANVAS_WIDTH - 10 - barWidth;
    const barY = 32;
    const fillWidth = (gameState.jellyFeverTimer / 300) * barWidth;
    
    p.fill(50, 50, 50);
    p.rect(barX, barY, barWidth, barHeight);
    p.fill(255, 100, 200);
    p.rect(barX, barY, fillWidth, barHeight);
  }
}

export function drawBackground(p, offset) {
  // Gradient background
  for (let y = 0; y < CANVAS_HEIGHT; y++) {
    const inter = y / CANVAS_HEIGHT;
    const c1 = p.color(20, 30, 50);
    const c2 = p.color(10, 20, 40);
    const c = p.lerpColor(c1, c2, inter);
    p.stroke(c);
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Moving stars
  p.fill(255, 255, 255, 150);
  p.noStroke();
  for (let i = 0; i < 30; i++) {
    const x = ((offset * 0.2 + i * 57) % (CANVAS_WIDTH + 50)) - 25;
    const y = (i * 37) % CANVAS_HEIGHT;
    const size = 2 + (i % 3);
    p.ellipse(x, y, size, size);
  }
  
  // Ground line
  p.stroke(80, 100, 120);
  p.strokeWeight(2);
  p.line(0, CANVAS_HEIGHT / 2, CANVAS_WIDTH, CANVAS_HEIGHT / 2);
}