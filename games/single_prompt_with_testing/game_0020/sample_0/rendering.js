// rendering.js - Rendering functions
import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export function renderBackground(p, cameraX) {
  // Dark gradient background
  for (let i = 0; i < CANVAS_HEIGHT; i++) {
    const shade = p.map(i, 0, CANVAS_HEIGHT, 15, 35);
    p.stroke(shade, shade - 5, shade + 5);
    p.line(0, i, CANVAS_WIDTH, i);
  }
  
  // Distant fog effect
  p.push();
  p.noStroke();
  for (let i = 0; i < 3; i++) {
    const x = ((cameraX * 0.1 + i * 200) % (CANVAS_WIDTH + 200)) - 200;
    p.fill(40, 40, 50, 30);
    p.ellipse(x, 100 + i * 50, 250, 80);
  }
  p.pop();
}

export function renderStartScreen(p) {
  p.background(20, 20, 25);
  
  p.push();
  
  // Animated background elements
  for (let i = 0; i < 10; i++) {
    const offset = p.sin(p.frameCount * 0.02 + i) * 50;
    p.fill(30, 30, 40, 100);
    p.noStroke();
    p.rect(i * 70 - 20 + offset, 0, 40, CANVAS_HEIGHT);
  }
  
  // Title
  p.fill(200, 200, 220);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("INSIDE", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(150, 150, 170);
  p.textSize(16);
  p.text("A Dark Journey", CANVAS_WIDTH / 2, 120);
  
  // Description
  p.fill(180, 180, 200);
  p.textSize(14);
  const desc = "You are a boy escaping from a mysterious facility.\nNavigate through dangerous environments,\nsolve puzzles, and avoid detection.";
  p.text(desc, CANVAS_WIDTH / 2, 180);
  
  // Instructions
  p.fill(160, 160, 180);
  p.textSize(12);
  const instructions = [
    "Arrow Keys: Move and Jump",
    "Shift: Sprint",
    "Space: Push/Pull Objects",
    "Down Arrow: Crouch/Interact",
    "Z: Activate Switches",
    "",
    "Avoid spikes, pits, and surveillance cameras",
    "Reach the exit portal to progress"
  ];
  
  let y = 250;
  for (let line of instructions) {
    p.text(line, CANVAS_WIDTH / 2, y);
    y += 18;
  }
  
  // Start prompt (pulsing)
  const alpha = p.map(p.sin(p.frameCount * 0.1), -1, 1, 100, 255);
  p.fill(100, 200, 255, alpha);
  p.textSize(18);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
  
  p.pop();
}

export function renderPauseOverlay(p) {
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

export function renderGameOverScreen(p, win) {
  p.push();
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(win ? 100 : 200, win ? 255 : 100, win ? 100 : 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(win ? "ESCAPED" : "CAPTURED", CANVAS_WIDTH / 2, 120);
  
  p.fill(200, 200, 220);
  p.textSize(24);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);
  
  if (win) {
    p.textSize(18);
    p.fill(150, 200, 150);
    p.text("You successfully escaped the facility!", CANVAS_WIDTH / 2, 220);
  } else {
    p.textSize(18);
    p.fill(200, 150, 150);
    p.text(gameState.deathReason, CANVAS_WIDTH / 2, 220);
  }
  
  p.textSize(16);
  p.fill(180, 180, 200);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
  
  p.pop();
}

export function renderUI(p) {
  p.push();
  
  // Level indicator
  p.fill(150, 150, 170);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text(`Level ${gameState.level}/${gameState.maxLevel}`, 10, 10);
  
  // Score
  p.fill(150, 150, 170);
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
  
  // Health/status indicator
  if (gameState.player && gameState.player.alive) {
    p.fill(100, 255, 100);
    p.ellipse(CANVAS_WIDTH - 30, 35, 8, 8);
    p.fill(150, 150, 170);
    p.textSize(12);
    p.textAlign(p.RIGHT, p.TOP);
    p.text("ALIVE", CANVAS_WIDTH - 40, 30);
  }
  
  p.pop();
}

export function renderLevelTransition(p, level) {
  p.push();
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(100, 200, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text(`Level ${level}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  p.pop();
}