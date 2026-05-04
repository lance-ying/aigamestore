// ui.js
import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, gameState } from './globals.js';

export function renderStartScreen(p) {
  p.background(40, 50, 60);
  
  // Title
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("FACTORY BALLS", CANVAS_WIDTH / 2, 80);
  
  // Instructions
  p.fill(200, 210, 220);
  p.textSize(16);
  p.text("Transform the white ball to match the target design!", CANVAS_WIDTH / 2, 150);
  p.text("Use tools in the correct order to create the pattern.", CANVAS_WIDTH / 2, 175);
  
  // Controls
  p.textSize(14);
  p.fill(180, 190, 200);
  p.text("ARROW KEYS - Select tools", CANVAS_WIDTH / 2, 220);
  p.text("SPACE - Apply selected tool", CANVAS_WIDTH / 2, 245);
  p.text("Z - Reset ball to white", CANVAS_WIDTH / 2, 270);
  p.text("ENTER - Submit ball", CANVAS_WIDTH / 2, 295);
  
  // Start prompt
  p.fill(100, 200, 255);
  p.textSize(20);
  const alpha = p.map(p.sin(p.frameCount * 0.05), -1, 1, 100, 255);
  p.fill(100, 200, 255, alpha);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 350);
}

export function renderPauseIndicator(p) {
  p.push();
  p.fill(255, 220, 100);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  p.pop();
}

export function renderGameOverScreen(p, isWin) {
  p.push();
  
  // Semi-transparent overlay
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Message
  p.textAlign(p.CENTER, p.CENTER);
  if (isWin) {
    p.fill(100, 255, 100);
    p.textSize(48);
    p.text("LEVEL COMPLETE!", CANVAS_WIDTH / 2, 150);
    
    p.fill(200, 210, 220);
    p.textSize(24);
    p.text(`Level ${gameState.level}`, CANVAS_WIDTH / 2, 200);
    
    if (gameState.level >= gameState.maxLevels) {
      p.fill(255, 220, 100);
      p.textSize(32);
      p.text("ALL LEVELS COMPLETED!", CANVAS_WIDTH / 2, 250);
    }
  } else {
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 180);
  }
  
  // Instructions
  p.fill(180, 190, 200);
  p.textSize(18);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 320);
  
  p.pop();
}

export function renderUI(p) {
  p.push();
  
  // Level indicator
  p.fill(255, 220, 100);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(18);
  p.text(`Level: ${gameState.level}`, 10, 10);
  
  // Instructions
  p.fill(180, 190, 200);
  p.textSize(12);
  p.textAlign(p.CENTER, p.TOP);
  p.text("ARROW KEYS: Select Tool | SPACE: Apply | Z: Reset | ENTER: Submit", CANVAS_WIDTH / 2, 35);
  
  p.pop();
}

export function renderBox(p, x, y, label) {
  p.push();
  
  // Box
  p.fill(160, 140, 110);
  p.stroke(100, 80, 60);
  p.strokeWeight(2);
  p.rect(x - 60, y + 60, 120, 40, 5);
  
  // Label
  p.fill(80, 60, 40);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  p.text(label, x, y + 80);
  
  // Flaps
  p.fill(140, 120, 90);
  p.triangle(x - 60, y + 60, x - 40, y + 40, x, y + 60);
  p.triangle(x + 60, y + 60, x + 40, y + 40, x, y + 60);
  
  p.pop();
}

export default {
  renderStartScreen,
  renderPauseIndicator,
  renderGameOverScreen,
  renderUI,
  renderBox
};