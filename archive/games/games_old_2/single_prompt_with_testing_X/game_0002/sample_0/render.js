// render.js - Rendering functions

import {
  gameState,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  INTERSECTION_Y_START,
  INTERSECTION_HEIGHT,
  LANES_PER_INTERSECTION,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_LOSE
} from './globals.js';

export function renderStartScreen(p) {
  p.background(40, 40, 60);
  
  // Title
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text('TRAFFIC RUN', CANVAS_WIDTH / 2, 100);
  
  // Instructions
  p.fill(255);
  p.textSize(16);
  p.textStyle(p.NORMAL);
  p.text('Time your acceleration to cross busy intersections!', CANVAS_WIDTH / 2, 180);
  p.text('Avoid collisions and collect coins for points.', CANVAS_WIDTH / 2, 210);
  
  // Controls
  p.textSize(14);
  p.fill(200, 200, 255);
  p.text('SPACE - Accelerate through intersection', CANVAS_WIDTH / 2, 260);
  p.text('ESC - Pause', CANVAS_WIDTH / 2, 285);
  
  // Start prompt
  p.fill(255, 255, 0);
  p.textSize(20);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 350);
}

export function renderGame(p) {
  // Sky background
  p.background(135, 206, 235);
  
  // Draw road below intersection
  p.fill(60, 60, 60);
  p.noStroke();
  p.rect(250, 0, 100, CANVAS_HEIGHT);
  
  // Road lines
  p.stroke(255, 255, 0);
  p.strokeWeight(2);
  for (let y = 0; y < CANVAS_HEIGHT; y += 30) {
    p.line(300, y, 300, y + 15);
  }
  
  // Draw intersection
  p.fill(70, 70, 70);
  p.noStroke();
  p.rect(0, gameState.intersectionY, CANVAS_WIDTH, INTERSECTION_HEIGHT);
  
  // Intersection lane markings
  p.stroke(255, 255, 255);
  p.strokeWeight(2);
  p.strokeCap(p.SQUARE);
  for (let i = 1; i < LANES_PER_INTERSECTION; i++) {
    const y = gameState.intersectionY + (i * (INTERSECTION_HEIGHT / LANES_PER_INTERSECTION));
    for (let x = 0; x < CANVAS_WIDTH; x += 40) {
      p.line(x, y, x + 20, y);
    }
  }
  
  // Intersection boundaries
  p.stroke(255, 255, 0);
  p.strokeWeight(4);
  p.line(0, gameState.intersectionY, CANVAS_WIDTH, gameState.intersectionY);
  p.line(0, gameState.intersectionY + INTERSECTION_HEIGHT, CANVAS_WIDTH, gameState.intersectionY + INTERSECTION_HEIGHT);
  
  // Draw all entities
  gameState.entities.forEach(entity => {
    if (entity && entity.render) {
      entity.render();
    }
  });
  
  // Draw UI
  renderUI(p);
}

export function renderUI(p) {
  // Score
  p.fill(255);
  p.stroke(0);
  p.strokeWeight(3);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(20);
  p.text(`Score: ${gameState.score}`, 10, 10);
  
  // Crossings
  p.text(`Crossings: ${gameState.crossingsCompleted}`, 10, 40);
  
  // Difficulty indicator
  p.textSize(16);
  p.text(`Level: ${gameState.currentDifficulty}`, 10, 70);
  
  // Speed indicator for player
  if (gameState.player) {
    const speedPercent = Math.floor((gameState.player.velocity / 8) * 100);
    p.fill(255, 200, 0);
    p.text(`Speed: ${speedPercent}%`, 480, 10);
  }
  
  // Control hint
  if (gameState.player && gameState.player.atIntersection) {
    p.fill(255, 255, 0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(18);
    p.text('PRESS SPACE TO GO!', CANVAS_WIDTH / 2, 50);
  }
}

export function renderPausedOverlay(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Paused text
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  p.textSize(20);
  p.textStyle(p.NORMAL);
  p.text('Press ESC to resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
}

export function renderGameOver(p) {
  p.background(40, 40, 60);
  
  // Game Over title
  p.fill(255, 50, 50);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(56);
  p.textStyle(p.BOLD);
  p.text('GAME OVER', CANVAS_WIDTH / 2, 100);
  
  // Collision message
  p.fill(255);
  p.textSize(20);
  p.textStyle(p.NORMAL);
  p.text('Collision with traffic!', CANVAS_WIDTH / 2, 170);
  
  // Stats
  p.textSize(24);
  p.fill(255, 215, 0);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 230);
  
  p.fill(255);
  p.textSize(20);
  p.text(`Intersections Crossed: ${gameState.crossingsCompleted}`, CANVAS_WIDTH / 2, 270);
  p.text(`Difficulty Reached: Level ${gameState.currentDifficulty}`, CANVAS_WIDTH / 2, 300);
  
  // Restart prompt
  p.fill(255, 255, 0);
  p.textSize(22);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 360);
}