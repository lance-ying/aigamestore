// rendering.js - Game rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, LANE_WIDTH, NUM_LANES } from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 20, 40);
  
  // Draw decorative background
  drawBackground(p);
  
  // Title
  p.fill(255, 200, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text("SNAKE VS BLOCK", CANVAS_WIDTH / 2, 80);
  
  // Description
  p.fill(255);
  p.textSize(14);
  p.textStyle(p.NORMAL);
  p.text("Control the snake through an endless track!", CANVAS_WIDTH / 2, 140);
  p.text("Collect balls to grow, avoid losing all your balls!", CANVAS_WIDTH / 2, 160);
  
  // Instructions
  p.textSize(16);
  p.fill(100, 200, 255);
  p.text("HOW TO PLAY:", CANVAS_WIDTH / 2, 200);
  
  p.fill(255);
  p.textSize(12);
  p.text("Use LEFT/RIGHT arrows or A/D to steer", CANVAS_WIDTH / 2, 230);
  p.text("Collect yellow balls to increase snake length", CANVAS_WIDTH / 2, 250);
  p.text("Blocks reduce your length by their number", CANVAS_WIDTH / 2, 270);
  p.text("Game ends when snake length reaches zero", CANVAS_WIDTH / 2, 290);
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textSize(20);
  const blink = Math.sin(p.frameCount * 0.1) > 0;
  if (blink) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 340);
  }
}

export function renderGame(p) {
  // Background with gradient
  drawGameBackground(p);
  
  // Draw lanes
  drawLanes(p);
  
  // Translate view to follow snake
  p.push();
  const head = gameState.snakeBalls[0];
  if (head) {
    const offsetY = head.y - CANVAS_HEIGHT / 3;
    p.translate(0, -offsetY);
    
    // Render entities
    gameState.blocks.forEach(block => block.render(p));
    gameState.collectibles.forEach(ball => ball.render(p));
    gameState.snakeBalls.forEach(ball => ball.render(p));
  }
  p.pop();
  
  // UI overlay
  renderUI(p);
}

export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  p.textSize(16);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
}

export function renderGameOver(p) {
  p.background(40, 20, 20);
  
  p.fill(255, 100, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text("GAME OVER", CANVAS_WIDTH / 2, 120);
  
  // Stats
  p.fill(255);
  p.textSize(24);
  p.textStyle(p.NORMAL);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);
  p.text(`Distance: ${gameState.distance}`, CANVAS_WIDTH / 2, 210);
  
  // Restart prompt
  p.fill(255, 255, 100);
  p.textSize(20);
  const blink = Math.sin(p.frameCount * 0.1) > 0;
  if (blink) {
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 280);
  }
}

function drawBackground(p) {
  for (let i = 0; i < 20; i++) {
    const y = (i * 40 + p.frameCount) % CANVAS_HEIGHT;
    p.stroke(50, 50, 80, 100);
    p.strokeWeight(2);
    p.line(0, y, CANVAS_WIDTH, y);
  }
}

function drawGameBackground(p) {
  // Gradient background
  for (let y = 0; y < CANVAS_HEIGHT; y++) {
    const inter = p.map(y, 0, CANVAS_HEIGHT, 0, 1);
    const c = p.lerpColor(p.color(30, 30, 60), p.color(10, 10, 30), inter);
    p.stroke(c);
    p.line(0, y, CANVAS_WIDTH, y);
  }
}

function drawLanes(p) {
  const startX = (CANVAS_WIDTH - NUM_LANES * LANE_WIDTH) / 2;
  
  // Draw lane dividers
  for (let i = 0; i <= NUM_LANES; i++) {
    const x = startX + i * LANE_WIDTH;
    p.stroke(80, 80, 120, 150);
    p.strokeWeight(2);
    p.line(x, 0, x, CANVAS_HEIGHT);
  }
}

function renderUI(p) {
  // Semi-transparent background for UI
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 50);
  
  // Score and stats
  p.fill(255);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(16);
  p.text(`Length: ${gameState.snakeLength}`, 10, 15);
  p.text(`Score: ${gameState.score}`, 10, 35);
  
  p.textAlign(p.RIGHT, p.CENTER);
  p.text(`Distance: ${gameState.distance}`, CANVAS_WIDTH - 10, 15);
  p.text(`Difficulty: ${gameState.difficulty.toFixed(1)}x`, CANVAS_WIDTH - 10, 35);
}