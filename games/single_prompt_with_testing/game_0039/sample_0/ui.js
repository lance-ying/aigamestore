// ui.js - UI rendering functions
import { 
  CANVAS_WIDTH, CANVAS_HEIGHT, 
  PHASE_START, PHASE_PLAYING, PHASE_PAUSED, 
  PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE,
  gameState 
} from './globals.js';

export function drawStartScreen(p) {
  p.background(20, 20, 40);
  
  // Floating particles
  for (let i = 0; i < 30; i++) {
    const x = (i * 37 + p.frameCount * 0.5) % CANVAS_WIDTH;
    const y = (i * 53 + p.sin(p.frameCount * 0.01 + i) * 20) % CANVAS_HEIGHT;
    p.noStroke();
    p.fill(200, 220, 255, 100);
    p.ellipse(x, y, 3, 3);
  }
  
  // Title
  p.fill(220, 230, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("Before Your Eyes", CANVAS_WIDTH/2, 80);
  
  // Subtitle
  p.textSize(16);
  p.fill(180, 200, 230);
  p.text("A Journey Through Memory", CANVAS_WIDTH/2, 120);
  
  // Instructions
  p.textSize(14);
  p.fill(200, 210, 240);
  p.textAlign(p.LEFT);
  
  const startY = 170;
  const lineHeight = 22;
  
  p.text("You are a soul reliving life's most precious moments.", 60, startY);
  p.text("Collect memory fragments to understand your story.", 60, startY + lineHeight);
  p.text("Reach the final memory before time runs out.", 60, startY + lineHeight * 2);
  
  // Controls
  p.textSize(13);
  p.fill(180, 190, 220);
  const controlY = startY + lineHeight * 4;
  p.text("← → Arrow Keys: Move", 80, controlY);
  p.text("SPACE: Blink (advance/interact)", 80, controlY + lineHeight);
  p.text("Z (Hold): Reflect (slow time)", 80, controlY + lineHeight * 2);
  p.text("ESC: Pause    R: Restart", 80, controlY + lineHeight * 3);
  
  // Start prompt
  const alpha = 128 + Math.sin(p.frameCount * 0.1) * 127;
  p.fill(255, 255, 200, alpha);
  p.textSize(18);
  p.textAlign(p.CENTER);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT - 40);
}

export function drawGameUI(p) {
  p.push();
  
  // Time remaining bar
  const barWidth = 200;
  const barHeight = 20;
  const barX = CANVAS_WIDTH - barWidth - 20;
  const barY = 20;
  
  const timePercent = gameState.timeRemaining / 180;
  const barColor = timePercent > 0.5 ? [100, 200, 100] : timePercent > 0.25 ? [200, 200, 100] : [200, 100, 100];
  
  // Bar background
  p.fill(40, 40, 60, 180);
  p.stroke(100, 100, 120);
  p.strokeWeight(2);
  p.rect(barX, barY, barWidth, barHeight, 3);
  
  // Bar fill
  p.noStroke();
  p.fill(...barColor, 200);
  p.rect(barX + 2, barY + 2, (barWidth - 4) * timePercent, barHeight - 4, 2);
  
  // Time text
  p.fill(255, 255, 255);
  p.textSize(12);
  p.textAlign(p.CENTER, p.CENTER);
  const minutes = Math.floor(gameState.timeRemaining / 60);
  const seconds = Math.floor(gameState.timeRemaining % 60);
  p.text(`${minutes}:${seconds.toString().padStart(2, '0')}`, barX + barWidth/2, barY + barHeight/2);
  
  // Score display
  p.fill(255, 255, 255, 220);
  p.textAlign(p.LEFT);
  p.textSize(16);
  p.text(`Fragments: ${gameState.fragmentsCollected}/${gameState.totalFragmentsNeeded}`, 20, 30);
  
  // Memory progress
  p.textSize(14);
  p.fill(200, 220, 255, 200);
  p.text(`Memory ${gameState.memoryIndex + 1}/${gameState.memories.length}`, 20, 55);
  
  // Reflection mode indicator
  if (gameState.reflectionMode) {
    p.fill(150, 200, 255, 200);
    p.textSize(12);
    p.textAlign(p.CENTER);
    p.text("Reflecting...", CANVAS_WIDTH/2, CANVAS_HEIGHT - 20);
  }
  
  p.pop();
}

export function drawPausedOverlay(p) {
  p.push();
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 255, 255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text("PAUSED", CANVAS_WIDTH - 20, 20);
  
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(16);
  p.text("Press ESC to resume", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
  
  p.pop();
}

export function drawGameOverScreen(p, won) {
  p.background(won ? [230, 230, 250] : [40, 40, 60]);
  
  // Result message
  p.fill(won ? [100, 100, 150] : [200, 200, 220]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  
  if (won) {
    p.text("Journey Complete", CANVAS_WIDTH/2, 100);
    
    p.textSize(16);
    p.fill(120, 120, 170);
    p.text("Your story has been told.", CANVAS_WIDTH/2, 150);
    p.text("You have found peace.", CANVAS_WIDTH/2, 180);
  } else {
    p.text("Time Ran Out", CANVAS_WIDTH/2, 100);
    
    p.textSize(16);
    p.fill(180, 180, 200);
    p.text("Some memories were left behind...", CANVAS_WIDTH/2, 150);
    p.text("But your journey continues.", CANVAS_WIDTH/2, 180);
  }
  
  // Final score
  p.textSize(20);
  p.fill(won ? [100, 100, 150] : [200, 200, 220]);
  p.text(`Memory Fragments: ${gameState.fragmentsCollected}`, CANVAS_WIDTH/2, 230);
  
  // Restart prompt
  const alpha = 128 + Math.sin(p.frameCount * 0.1) * 127;
  p.fill(255, 255, 200, alpha);
  p.textSize(18);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH/2, CANVAS_HEIGHT - 60);
}

export function drawTransitionEffect(p, alpha) {
  p.push();
  p.fill(255, 255, 255, alpha);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  p.pop();
}