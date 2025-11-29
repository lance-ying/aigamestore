// ui.js - UI rendering for all game screens

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

// Render start screen
export function renderStartScreen(p) {
  p.background(30, 30, 50);
  
  // Animated background
  for (let i = 0; i < 20; i++) {
    const x = (gameState.frameCount * 2 + i * 50) % (CANVAS_WIDTH + 100);
    const y = 50 + i * 20;
    p.fill(50, 50, 100, 100);
    p.noStroke();
    p.ellipse(x, y, 30, 30);
  }
  
  // Title
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text('SONIC', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 100);
  
  p.fill(100, 150, 255);
  p.textSize(36);
  p.text('THE HEDGEHOG 2', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
  
  // Description
  p.fill(255);
  p.textSize(14);
  p.textStyle(p.NORMAL);
  p.text('Collect rings, defeat enemies, and reach the goal!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
  p.text('Collect 50 rings to access Special Stages', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
  p.text('Get all 7 Chaos Emeralds to unlock Super Sonic!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
  
  // Controls
  p.textSize(12);
  p.fill(200);
  p.text('Arrow Keys: Move | Down: Spin Dash | Space/Up: Jump', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
  p.text('Z: Super Sonic (with emeralds) | ESC: Pause | R: Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
  
  // Start prompt
  p.fill(255, 255, 0);
  p.textSize(24);
  const alpha = (Math.sin(gameState.frameCount * 0.1) + 1) * 127 + 128;
  p.fill(255, 255, 0, alpha);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 120);
}

// Render HUD during gameplay
export function renderHUD(p) {
  // Score
  p.fill(255, 255, 0);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text(`SCORE: ${gameState.score}`, 10, 10);
  
  // Rings
  p.fill(255, 215, 0);
  p.text(`RINGS: ${gameState.ringCount}`, 10, 30);
  
  // Lives
  p.fill(255, 100, 100);
  p.text(`LIVES: ${gameState.lives}`, 10, 50);
  
  // Chaos Emeralds
  if (gameState.chaosEmeralds > 0) {
    p.fill(100, 255, 255);
    p.text(`EMERALDS: ${gameState.chaosEmeralds}/7`, 10, 70);
  }
  
  // Super Sonic indicator
  if (gameState.isSuperSonic) {
    p.fill(255, 255, 0);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(20);
    const pulse = Math.sin(gameState.frameCount * 0.2) * 0.3 + 0.7;
    p.fill(255, 255, 0, pulse * 255);
    p.text('SUPER SONIC!', CANVAS_WIDTH / 2, 10);
    
    // Time remaining
    const timeLeft = Math.ceil(gameState.superSonicTimer / 60);
    p.textSize(14);
    p.text(`Time: ${timeLeft}s`, CANVAS_WIDTH / 2, 35);
  }
  
  // Time (optional)
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  const minutes = Math.floor(gameState.gameTime / 3600);
  const seconds = Math.floor((gameState.gameTime % 3600) / 60);
  p.text(`${minutes}:${seconds.toString().padStart(2, '0')}`, CANVAS_WIDTH - 10, 10);
  
  // Level completion message
  if (gameState.levelComplete) {
    p.fill(255, 255, 0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(32);
    p.text('ACT CLEAR!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
    
    p.textSize(20);
    p.fill(255);
    p.text(`Bonus: 1000`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    p.text(`Total: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
  }
}

// Render paused overlay
export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 180);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  
  p.textSize(20);
  p.text('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
}

// Render game over screen
export function renderGameOver(p) {
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  // Title
  p.fill(isWin ? 255 : 255, isWin ? 255 : 100, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? 'STAGE CLEAR!' : 'GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
  
  // Stats
  p.fill(255);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  p.text(`Rings Collected: ${gameState.ringCount}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
  p.text(`Chaos Emeralds: ${gameState.chaosEmeralds}/7`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  
  // Restart prompt
  p.fill(255, 255, 0);
  p.textSize(20);
  const alpha = (Math.sin(gameState.frameCount * 0.1) + 1) * 127 + 128;
  p.fill(255, 255, 0, alpha);
  p.text('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 90);
}

// Render special stage
export function renderSpecialStage(p) {
  // Background gradient
  for (let i = 0; i < CANVAS_HEIGHT; i++) {
    const color1 = p.color(20, 0, 50);
    const color2 = p.color(100, 0, 150);
    const inter = i / CANVAS_HEIGHT;
    const c = p.lerpColor(color1, color2, inter);
    p.stroke(c);
    p.line(0, i, CANVAS_WIDTH, i);
  }
  
  // Grid pattern
  p.push();
  p.stroke(100, 50, 150, 100);
  p.strokeWeight(2);
  const gridSize = 50;
  for (let x = 0; x < CANVAS_WIDTH; x += gridSize) {
    for (let y = 0; y < CANVAS_HEIGHT; y += gridSize) {
      const offset = (gameState.frameCount * 2) % gridSize;
      p.line(x, 0, x, CANVAS_HEIGHT);
      p.line(0, y + offset, CANVAS_WIDTH, y + offset);
    }
  }
  p.pop();
  
  // Title
  p.fill(255, 255, 0);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(32);
  p.text('SPECIAL STAGE', CANVAS_WIDTH / 2, 20);
  
  // Instructions
  p.fill(255);
  p.textSize(16);
  p.text('Collect all rings to get a Chaos Emerald!', CANVAS_WIDTH / 2, 60);
  
  // Completion message
  if (gameState.specialStageComplete) {
    p.fill(255, 255, 0);
    p.textSize(48);
    p.text('EMERALD GET!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
    
    p.textSize(24);
    p.text(`${gameState.chaosEmeralds}/7 Emeralds`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  }
}

// Render background layers (parallax)
export function renderBackground(p) {
  // Sky gradient
  const skyTop = p.color(100, 150, 255);
  const skyBottom = p.color(200, 220, 255);
  
  for (let i = 0; i < CANVAS_HEIGHT; i++) {
    const inter = i / CANVAS_HEIGHT;
    const c = p.lerpColor(skyTop, skyBottom, inter);
    p.stroke(c);
    p.line(0, i, CANVAS_WIDTH, i);
  }
  
  // Clouds (parallax layer 1)
  p.noStroke();
  for (let i = 0; i < 5; i++) {
    const x = ((gameState.cameraX * 0.3 + i * 200) % (CANVAS_WIDTH + 200)) - 100;
    const y = 50 + i * 40;
    p.fill(255, 255, 255, 180);
    p.ellipse(x, y, 80, 40);
    p.ellipse(x + 40, y, 60, 35);
    p.ellipse(x - 30, y, 60, 35);
  }
  
  // Mountains (parallax layer 2)
  p.fill(100, 200, 100, 150);
  p.beginShape();
  p.vertex(0, CANVAS_HEIGHT);
  for (let i = 0; i <= CANVAS_WIDTH; i += 50) {
    const x = i;
    const y = CANVAS_HEIGHT - 100 - Math.sin((gameState.cameraX * 0.5 + i) * 0.01) * 50;
    p.vertex(x, y);
  }
  p.vertex(CANVAS_WIDTH, CANVAS_HEIGHT);
  p.endShape(p.CLOSE);
}