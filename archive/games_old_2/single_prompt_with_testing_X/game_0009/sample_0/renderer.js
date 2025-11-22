// renderer.js - Rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_LOSE } from './globals.js';

export function renderStartScreen(p) {
  p.background(30, 30, 40);
  
  // Title
  p.fill(100, 200, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text('TRAFFIC RUN', CANVAS_WIDTH / 2, 80);
  
  // Instructions
  p.fill(220);
  p.textSize(16);
  p.textStyle(p.NORMAL);
  p.text('Navigate through busy intersections', CANVAS_WIDTH / 2, 150);
  p.text('Time your crossing to avoid collisions', CANVAS_WIDTH / 2, 175);
  
  // Controls
  p.textSize(14);
  p.fill(180, 180, 255);
  p.text('HOLD SPACE to accelerate', CANVAS_WIDTH / 2, 220);
  p.text('RELEASE SPACE to brake', CANVAS_WIDTH / 2, 245);
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textSize(20);
  const pulse = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(255, 255, 100, pulse * 255);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 320);
}

export function renderGame(p) {
  // Sky background
  p.background(135, 206, 235);
  
  // Draw ground (below intersection)
  p.fill(80, 140, 80);
  p.noStroke();
  p.rect(0, gameState.intersectionBounds.end, CANVAS_WIDTH, CANVAS_HEIGHT - gameState.intersectionBounds.end);
  
  // Draw ground (above intersection)
  p.fill(80, 140, 80);
  p.rect(0, 0, CANVAS_WIDTH, gameState.intersectionBounds.start);
  
  // Draw intersection (road surface)
  p.fill(60, 60, 60);
  p.rect(0, gameState.intersectionBounds.start, CANVAS_WIDTH, 
         gameState.intersectionBounds.end - gameState.intersectionBounds.start);
  
  // Draw lane markings
  p.stroke(255, 255, 100);
  p.strokeWeight(2);
  p.drawingContext.setLineDash([10, 10]);
  for (let i = 1; i < gameState.levelConfig.lanes; i++) {
    const y = gameState.intersectionBounds.start + i * gameState.levelConfig.laneWidth;
    p.line(0, y, CANVAS_WIDTH, y);
  }
  p.drawingContext.setLineDash([]);
  
  // Draw stop line
  p.stroke(255, 255, 255);
  p.strokeWeight(4);
  p.line(0, gameState.intersectionBounds.end + 10, CANVAS_WIDTH, gameState.intersectionBounds.end + 10);
  
  // Render all entities
  for (let entity of gameState.entities) {
    entity.render();
  }
  
  // UI
  p.fill(255);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.textStyle(p.BOLD);
  p.text(`Level: ${gameState.level}`, 10, 10);
  p.text(`Coins: ${gameState.coins}`, 10, 35);
  
  // Speed indicator
  if (gameState.player) {
    const vel = gameState.player.body.velocity;
    const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
    const speedPercent = Math.min(100, (speed / gameState.player.maxSpeed) * 100);
    
    p.fill(220);
    p.textSize(12);
    p.text('SPEED', CANVAS_WIDTH - 100, 10);
    
    // Speed bar
    p.noFill();
    p.stroke(255);
    p.strokeWeight(2);
    p.rect(CANVAS_WIDTH - 100, 30, 80, 15);
    
    // Speed fill
    const speedColor = speedPercent > 80 ? [255, 100, 100] : [100, 255, 100];
    p.fill(speedColor[0], speedColor[1], speedColor[2]);
    p.noStroke();
    p.rect(CANVAS_WIDTH - 98, 32, 76 * (speedPercent / 100), 11);
  }
  
  // Control mode indicator
  if (gameState.controlMode !== 'HUMAN') {
    p.fill(255, 200, 0);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(14);
    p.text(`AI: ${gameState.controlMode}`, CANVAS_WIDTH / 2, 10);
  }
}

export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  
  p.textSize(18);
  p.textStyle(p.NORMAL);
  p.text('Press ESC to resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

export function renderGameOver(p) {
  p.background(40, 30, 30);
  
  p.fill(255, 100, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text('GAME OVER', CANVAS_WIDTH / 2, 100);
  
  p.fill(220);
  p.textSize(24);
  p.textStyle(p.NORMAL);
  p.text(`Level Reached: ${gameState.level}`, CANVAS_WIDTH / 2, 180);
  p.text(`Total Coins: ${gameState.coins}`, CANVAS_WIDTH / 2, 220);
  
  p.fill(255, 255, 100);
  p.textSize(20);
  const pulse = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(255, 255, 100, pulse * 255);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 300);
}