// rendering.js - Rendering functions for different game phases
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
  p.push();
  
  // Gradient background
  for (let y = 0; y < CANVAS_HEIGHT; y++) {
    const inter = y / CANVAS_HEIGHT;
    p.stroke(240 - inter * 40, 230 - inter * 50, 250 - inter * 30);
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Title
  p.fill(120, 80, 140);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("Florence", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.textSize(16);
  p.fill(140, 100, 160);
  p.text("An Interactive Story", CANVAS_WIDTH / 2, 130);
  
  // Description box
  p.fill(255, 255, 255, 230);
  p.stroke(180, 160, 200);
  p.strokeWeight(2);
  p.rect(50, 160, 500, 140, 10);
  
  // Description
  p.fill(80, 60, 100);
  p.noStroke();
  p.textSize(13);
  p.textAlign(p.CENTER, p.TOP);
  const description = "Experience Florence's emotional journey through\ninteractive vignettes. Each scene presents a unique\nmini-game that metaphorically represents moments\nin her life. Complete simple interactions to progress\nthrough the narrative.";
  p.text(description, CANVAS_WIDTH / 2, 175);
  
  // Controls
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  p.fill(100, 80, 120);
  const controlsY = 320;
  p.text("Controls:", 60, controlsY);
  p.textSize(11);
  p.text("Arrow Keys: Navigate/Move", 60, controlsY + 20);
  p.text("Space: Confirm/Interact", 60, controlsY + 38);
  p.text("Z: Alternative Action", 60, controlsY + 56);
  
  p.text("ESC: Pause", 330, controlsY + 20);
  p.text("R: Restart", 330, controlsY + 38);
  
  // Start prompt
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  const alpha = Math.abs(Math.sin(p.frameCount * 0.05)) * 255;
  p.fill(150, 80, 120, alpha);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 375);
  
  p.pop();
}

export function renderPauseIndicator(p) {
  p.push();
  p.fill(255, 255, 255, 230);
  p.stroke(100, 100, 100);
  p.strokeWeight(2);
  p.rect(480, 10, 110, 30, 5);
  
  p.fill(80, 80, 80);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  p.text("PAUSED", 535, 25);
  p.pop();
}

export function renderGameOver(p) {
  p.push();
  
  // Gradient background
  for (let y = 0; y < CANVAS_HEIGHT; y++) {
    const inter = y / CANVAS_HEIGHT;
    p.stroke(250 - inter * 50, 240 - inter * 60, 255 - inter * 40);
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Completion message
  p.fill(120, 80, 140);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(42);
  p.text("Journey Complete", CANVAS_WIDTH / 2, 100);
  
  // Message box
  p.fill(255, 255, 255, 240);
  p.stroke(180, 160, 200);
  p.strokeWeight(2);
  p.rect(80, 160, 440, 120, 10);
  
  // Message
  p.fill(100, 80, 120);
  p.noStroke();
  p.textSize(15);
  const message = "You've experienced Florence's story,\nfrom beginning to end.\n\nThank you for being part of her journey.";
  p.text(message, CANVAS_WIDTH / 2, 210);
  
  // Score
  p.textSize(18);
  p.fill(140, 100, 160);
  p.text(`Vignettes Completed: ${gameState.completedVignettes}`, CANVAS_WIDTH / 2, 310);
  
  // Restart prompt
  p.textSize(16);
  const alpha = Math.abs(Math.sin(p.frameCount * 0.05)) * 255;
  p.fill(150, 80, 120, alpha);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 360);
  
  p.pop();
}

export function renderVignette(p) {
  if (gameState.currentVignette) {
    gameState.currentVignette.render(p);
  }
}

export function renderUI(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  p.push();
  
  // Progress bar background
  p.fill(220, 220, 220);
  p.noStroke();
  p.rect(10, 10, 200, 20, 5);
  
  // Progress bar fill
  const progress = gameState.completedVignettes / gameState.totalVignettes;
  p.fill(150, 200, 150);
  p.rect(10, 10, 200 * progress, 20, 5);
  
  // Progress text
  p.fill(60, 60, 60);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(11);
  p.text(`${gameState.completedVignettes}/${gameState.totalVignettes}`, 110, 20);
  
  p.pop();
}