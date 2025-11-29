// rendering.js - Rendering functions for game elements

import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, LEVELS, gameState } from './globals.js';

export function renderPath(p) {
  const level = LEVELS[gameState.currentLevel - 1];
  
  p.push();
  
  // Draw ground with perspective
  for (let i = 0; i < 10; i++) {
    const z = i * 100 - (gameState.cameraZ % 100);
    const scale = 400 / (z + 400);
    const y = CANVAS_HEIGHT / 2 + (200 - z) * 0.5;
    const width = 400 * scale;
    
    // Alternating path tiles
    const shade = i % 2 === 0 ? 20 : 10;
    p.fill(
      level.color[0] + shade,
      level.color[1] + shade,
      level.color[2] + shade
    );
    p.rect(CANVAS_WIDTH / 2 - width / 2, y, width, 50 * scale);
    
    // Path edges
    p.fill(80, 60, 40);
    p.rect(CANVAS_WIDTH / 2 - width / 2 - 20 * scale, y, 20 * scale, 50 * scale);
    p.rect(CANVAS_WIDTH / 2 + width / 2, y, 20 * scale, 50 * scale);
  }
  
  p.pop();
}

export function renderBackground(p) {
  const level = LEVELS[gameState.currentLevel - 1];
  
  // Sky gradient
  for (let i = 0; i < CANVAS_HEIGHT / 2; i++) {
    const alpha = i / (CANVAS_HEIGHT / 2);
    p.stroke(30 + alpha * 50, 20 + alpha * 40, 50 + alpha * 30);
    p.line(0, i, CANVAS_WIDTH, i);
  }
  
  // Ground gradient
  for (let i = CANVAS_HEIGHT / 2; i < CANVAS_HEIGHT; i++) {
    const alpha = (i - CANVAS_HEIGHT / 2) / (CANVAS_HEIGHT / 2);
    p.stroke(
      level.color[0] * (1 - alpha * 0.5),
      level.color[1] * (1 - alpha * 0.5),
      level.color[2] * (1 - alpha * 0.5)
    );
    p.line(0, i, CANVAS_WIDTH, i);
  }
  
  // Distant temple structures (parallax)
  p.push();
  const parallaxOffset = (gameState.cameraZ * 0.1) % 200;
  p.fill(40, 30, 20, 100);
  for (let i = -1; i < 4; i++) {
    const x = i * 200 - parallaxOffset;
    p.triangle(x + 80, 150, x + 100, 100, x + 120, 150);
    p.rect(x + 90, 150, 20, 40);
  }
  p.pop();
}

export function renderUI(p) {
  p.push();
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(24);
  p.text(`Score: ${gameState.score}`, 20, 20);
  
  p.textSize(20);
  p.text(`Coins: ${gameState.coinCount}`, 20, 50);
  p.text(`Level: ${gameState.currentLevel}`, 20, 75);
  
  // Progress bar
  const level = LEVELS[gameState.currentLevel - 1];
  const progress = gameState.distanceTraveledInLevel / level.distance;
  p.fill(50);
  p.rect(20, CANVAS_HEIGHT - 40, 200, 20);
  p.fill(100, 200, 100);
  p.rect(20, CANVAS_HEIGHT - 40, 200 * progress, 20);
  p.fill(255);
  p.textSize(14);
  p.text(`${Math.floor(progress * 100)}%`, 230, CANVAS_HEIGHT - 38);
  
  p.pop();
}

export function renderStartScreen(p) {
  p.push();
  p.background(20, 15, 30);
  
  // Title
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('TEMPLE RUN', CANVAS_WIDTH / 2, 80);
  
  // Instructions
  p.fill(200);
  p.textSize(16);
  p.text('Race through ancient temple paths!', CANVAS_WIDTH / 2, 140);
  p.text('Complete 4 levels to escape.', CANVAS_WIDTH / 2, 165);
  
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  p.text('CONTROLS:', 150, 200);
  p.text('↑ / SPACE: Jump over obstacles', 150, 225);
  p.text('↓: Slide under barriers', 150, 245);
  p.text('← / →: Turn left/right', 150, 265);
  p.text('ESC: Pause game', 150, 285);
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  const flash = p.sin(p.frameCount * 0.1) > 0;
  if (flash) {
    p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 340);
  }
  
  p.pop();
}

export function renderPauseOverlay(p) {
  p.push();
  p.fill(0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(20);
  p.text('PAUSED', CANVAS_WIDTH - 10, 10);
  
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  p.text('Press ESC to resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  p.text('Press R to return to menu', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
  
  p.pop();
}

export function renderGameOverScreen(p, won) {
  p.push();
  p.background(20, 15, 30);
  
  p.fill(won ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(won ? 'YOU WON!' : 'GAME OVER', CANVAS_WIDTH / 2, 100);
  
  p.fill(255);
  p.textSize(32);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);
  p.textSize(24);
  p.text(`Coins Collected: ${gameState.coinCount}`, CANVAS_WIDTH / 2, 220);
  
  p.textSize(20);
  if (won) {
    p.text('You escaped the temple!', CANVAS_WIDTH / 2, 280);
  } else {
    p.text('You were caught by the temple!', CANVAS_WIDTH / 2, 280);
  }
  
  p.fill(255, 255, 100);
  p.textSize(24);
  const flash = p.sin(p.frameCount * 0.1) > 0;
  if (flash) {
    p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 340);
  }
  
  p.pop();
}

export function renderLevelComplete(p) {
  p.push();
  
  // Semi-transparent overlay
  p.fill(0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  const level = LEVELS[gameState.currentLevel - 2]; // Current level just completed
  
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text(`Level ${level.id} Complete!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  
  p.fill(255);
  p.textSize(24);
  p.text(`+500 Bonus`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
  
  if (gameState.currentLevel <= LEVELS.length) {
    const nextLevel = LEVELS[gameState.currentLevel - 1];
    p.textSize(20);
    p.text(`Next: ${nextLevel.name}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
  }
  
  p.pop();
}