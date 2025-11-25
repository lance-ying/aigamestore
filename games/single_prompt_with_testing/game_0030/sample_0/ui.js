// ui.js - UI rendering functions

import { CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';

export function drawStartScreen(p, gameState) {
  p.background(20, 30, 50);
  
  // Stars
  p.randomSeed(42);
  for (let i = 0; i < 50; i++) {
    p.fill(255, 255, 255, p.random(100, 255));
    p.noStroke();
    p.ellipse(p.random(CANVAS_WIDTH), p.random(CANVAS_HEIGHT), p.random(1, 3), p.random(1, 3));
  }
  
  // Title
  p.fill(200, 180, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("SPIRITFARER", CANVAS_WIDTH / 2, 60);
  
  p.fill(150, 200, 255);
  p.textSize(16);
  p.text("A Journey to the Afterlife", CANVAS_WIDTH / 2, 100);
  
  // Instructions
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    "You are Stella, ferrymaster to the deceased.",
    "",
    "Objective:",
    "• Navigate your boat across mystical seas",
    "• Pick up spirit passengers (Space near them)",
    "• Collect fish and plants from floating islands",
    "• Cook meals (Z key) to make spirits happy",
    "• Guide happy spirits to the Everdoor (Space)",
    "• Release all spirits to win!",
    "",
    "Controls:",
    "← → : Move Stella  |  Space: Jump/Interact",
    "Z: Cook meals      |  ESC: Pause  |  R: Restart"
  ];
  
  let y = 140;
  for (let line of instructions) {
    p.text(line, 80, y);
    y += 18;
  }
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textSize(20);
  p.textAlign(p.CENTER);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}

export function drawPausedIndicator(p) {
  p.push();
  p.fill(255, 255, 100);
  p.textSize(14);
  p.textAlign(p.RIGHT, p.TOP);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  p.pop();
}

export function drawGameOverScreen(p, gameState, won) {
  p.push();
  
  // Semi-transparent overlay
  p.fill(0, 0, 0, 180);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.textAlign(p.CENTER, p.CENTER);
  
  if (won) {
    p.fill(150, 255, 150);
    p.textSize(42);
    p.text("ALL SPIRITS RELEASED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
    
    p.fill(255, 255, 200);
    p.textSize(18);
    p.text("You have completed your journey as Spiritfarer.", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    p.text("The spirits have found peace in the afterlife.", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 5);
  } else {
    p.fill(255, 150, 150);
    p.textSize(42);
    p.text("GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  }
  
  p.fill(255);
  p.textSize(20);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  
  p.fill(255, 255, 100);
  p.textSize(16);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
  
  p.pop();
}

export function drawHUD(p, gameState) {
  p.push();
  
  // Background panel
  p.fill(0, 0, 0, 150);
  p.rect(5, 5, 200, 75, 5);
  
  // Resources
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Fish: ${gameState.resources.fish}`, 15, 15);
  p.text(`Plants: ${gameState.resources.plants}`, 15, 32);
  p.text(`Meals: ${gameState.resources.meals}`, 15, 49);
  
  // Score
  p.text(`Score: ${gameState.score}`, 110, 15);
  
  // Spirits status
  p.text(`Spirits: ${gameState.spiritsReleased}/${gameState.totalSpirits}`, 110, 32);
  
  // Instructions hint
  p.fill(255, 255, 100);
  p.textSize(10);
  p.text("Space: Interact | Z: Cook", 15, 65);
  
  p.pop();
}

export function drawBackground(p) {
  // Sky gradient
  for (let y = 0; y < CANVAS_HEIGHT / 2; y++) {
    const inter = y / (CANVAS_HEIGHT / 2);
    const c = p.lerpColor(p.color(20, 30, 60), p.color(60, 100, 150), inter);
    p.stroke(c);
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Sea gradient
  for (let y = CANVAS_HEIGHT / 2; y < CANVAS_HEIGHT; y++) {
    const inter = (y - CANVAS_HEIGHT / 2) / (CANVAS_HEIGHT / 2);
    const c = p.lerpColor(p.color(40, 80, 140), p.color(20, 40, 80), inter);
    p.stroke(c);
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  p.noStroke();
  
  // Stars in sky
  p.randomSeed(42);
  for (let i = 0; i < 30; i++) {
    p.fill(255, 255, 255, p.random(100, 200));
    const sx = p.random(CANVAS_WIDTH);
    const sy = p.random(CANVAS_HEIGHT / 2);
    p.ellipse(sx, sy, 2, 2);
  }
}