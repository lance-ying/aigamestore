// rendering.js - Rendering functions
import { gameState } from './globals.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, DIFFICULTY_LEVELS } from './globals.js';
import { getParticles } from './game_logic.js';

export function drawStartScreen(p) {
  p.background(20, 25, 40);
  
  // Animated background
  drawAnimatedBackground(p);
  
  // Title
  p.push();
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(60);
  p.text("PRIMEE!", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(200, 200, 220);
  p.textSize(16);
  p.text("Prime Number Puzzle Action", CANVAS_WIDTH / 2, 120);
  
  // Instructions box
  p.fill(40, 45, 60);
  p.stroke(100, 120, 140);
  p.strokeWeight(2);
  p.rect(60, 150, CANVAS_WIDTH - 120, 180, 10);
  
  p.noStroke();
  p.fill(255, 255, 255);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  
  let y = 165;
  const instructions = [
    "🎯 OBJECTIVE:",
    "   Tap PRIME numbers to score points!",
    "   Cut COMPOSITE numbers (Z key) into factors,",
    "   then tap each prime factor for points!",
    "",
    "⚠️  WARNING:",
    "   Tapping a composite = -5 points penalty!",
    "",
    "⌨️  CONTROLS:",
    "   Arrow Keys: Move cursor",
    "   Space: Tap number/factor",
    "   Z: Cut composite number",
    "   Shift: Speed boost (hold)"
  ];
  
  for (const line of instructions) {
    p.text(line, 80, y);
    y += 18;
  }
  
  // Start prompt
  p.fill(100, 255, 150);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  const flash = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(100 * flash, 255 * flash, 150 * flash);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
  
  p.pop();
}

export function drawPlayingScreen(p) {
  p.background(20, 25, 40);
  
  // Background
  drawAnimatedBackground(p);
  
  // Draw numbers
  for (const num of gameState.numbers) {
    num.draw(p);
  }
  
  // Draw prime factors
  for (const entity of gameState.entities) {
    entity.draw(p);
  }
  
  // Draw particles
  const particles = getParticles();
  for (const particle of particles) {
    particle.draw(p);
  }
  
  // Draw cut line
  if (gameState.cutLine) {
    gameState.cutLine.draw(p);
  }
  
  // Draw cursor
  if (gameState.cursor) {
    gameState.cursor.draw(p);
  }
  
  // Draw UI
  drawUI(p);
  
  // Paused indicator
  if (gameState.gamePhase === PHASE_PAUSED) {
    p.push();
    p.fill(255, 255, 255);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
    p.pop();
  }
}

export function drawGameOverScreen(p) {
  p.background(20, 25, 40);
  
  drawAnimatedBackground(p);
  
  const isWin = gameState.gamePhase === PHASE_GAME_OVER_WIN;
  
  p.push();
  
  // Title
  p.fill(isWin ? [100, 255, 150] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(50);
  p.text(isWin ? "VICTORY!" : "TIME'S UP!", CANVAS_WIDTH / 2, 100);
  
  // Score box
  p.fill(40, 45, 60);
  p.stroke(100, 120, 140);
  p.strokeWeight(2);
  p.rect(150, 160, 300, 120, 10);
  
  p.noStroke();
  p.fill(255, 255, 255);
  p.textSize(20);
  p.text("FINAL SCORE", CANVAS_WIDTH / 2, 190);
  
  p.fill(255, 220, 100);
  p.textSize(48);
  p.text(gameState.score, CANVAS_WIDTH / 2, 235);
  
  // Level reached
  p.fill(200, 200, 220);
  p.textSize(16);
  p.text(`Level ${gameState.difficulty} Reached`, CANVAS_WIDTH / 2, 310);
  
  // Restart prompt
  p.fill(150, 200, 255);
  p.textSize(18);
  const flash = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(150 * flash, 200 * flash, 255 * flash);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 360);
  
  p.pop();
}

function drawUI(p) {
  p.push();
  
  // Top bar background
  p.fill(0, 0, 0, 100);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 35);
  
  // Score
  p.fill(255, 220, 100);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(18);
  p.text(`Score: ${gameState.score}`, 10, 10);
  
  // Timer
  p.fill(gameState.timer <= 10 ? [255, 100, 100] : [150, 200, 255]);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(18);
  p.text(`Time: ${gameState.timer}s`, CANVAS_WIDTH / 2, 10);
  
  // Level
  p.fill(200, 255, 200);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(18);
  p.text(`Level ${gameState.difficulty}`, CANVAS_WIDTH - 10, 10);
  
  // Level progress bar
  const nextLevel = DIFFICULTY_LEVELS.find(d => d.level === gameState.difficulty + 1);
  if (nextLevel) {
    const currentThreshold = DIFFICULTY_LEVELS[gameState.difficulty - 1].scoreThreshold;
    const progress = (gameState.score - currentThreshold) / (nextLevel.scoreThreshold - currentThreshold);
    const clampedProgress = Math.max(0, Math.min(1, progress));
    
    const barWidth = 150;
    const barHeight = 6;
    const barX = CANVAS_WIDTH - barWidth - 10;
    const barY = 32;
    
    p.fill(50, 50, 50);
    p.rect(barX, barY, barWidth, barHeight, 3);
    
    p.fill(100, 255, 150);
    p.rect(barX, barY, barWidth * clampedProgress, barHeight, 3);
  }
  
  p.pop();
}

function drawAnimatedBackground(p) {
  p.push();
  p.noStroke();
  
  // Grid lines
  for (let i = 0; i < 10; i++) {
    const alpha = 20;
    const offset = (p.frameCount * 0.5) % 50;
    p.stroke(60, 70, 90, alpha);
    p.strokeWeight(1);
    p.line(0, i * 50 + offset, CANVAS_WIDTH, i * 50 + offset);
    p.line(i * 60, 0, i * 60, CANVAS_HEIGHT);
  }
  
  p.pop();
}