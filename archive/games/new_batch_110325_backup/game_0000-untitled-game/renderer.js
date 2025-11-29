// renderer.js - Rendering functions

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
  p.background(40, 40, 60);
  
  p.fill(255, 200, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('SUGAR, SUGAR', CANVAS_WIDTH / 2, 100);
  
  p.fill(200);
  p.textSize(16);
  p.text('Guide falling sugar particles into cups by drawing barriers!', CANVAS_WIDTH / 2, 160);
  p.text('Use color filters, gravity switches, and teleporters strategically.', CANVAS_WIDTH / 2, 185);
  
  p.textSize(14);
  p.fill(150, 200, 255);
  p.text('CONTROLS:', CANVAS_WIDTH / 2, 220);
  
  p.fill(180);
  p.textSize(12);
  p.text('ARROW KEYS: Hold and drag to draw barrier lines', CANVAS_WIDTH / 2, 245);
  p.text('SPACE: Release burst of sugar from spawners', CANVAS_WIDTH / 2, 265);
  p.text('D: Delete the most recently drawn barrier', CANVAS_WIDTH / 2, 285);
  p.text('ESC: Pause/Unpause', CANVAS_WIDTH / 2, 305);
  
  p.fill(100, 255, 100);
  p.textSize(20);
  const pulse = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(100 * pulse, 255 * pulse, 100 * pulse);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 350);
}

export function renderGame(p) {
  // Background gradient
  for (let y = 0; y < CANVAS_HEIGHT; y++) {
    const inter = y / CANVAS_HEIGHT;
    const c = p.lerpColor(p.color(180, 220, 240), p.color(240, 240, 250), inter);
    p.stroke(c);
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Render all entities
  gameState.entities.forEach(entity => {
    if (entity && entity.render) {
      entity.render(p);
    }
  });
  
  // Render drawing in progress
  if (gameState.isDrawing && gameState.drawingPoints.length > 1) {
    p.push();
    p.stroke(255, 200, 100);
    p.strokeWeight(4);
    p.noFill();
    p.beginShape();
    gameState.drawingPoints.forEach(point => {
      p.vertex(point.x, point.y);
    });
    p.endShape();
    p.pop();
  }
  
  // UI
  renderUI(p);
}

function renderUI(p) {
  // Top bar background
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 35);
  
  // Level and score
  p.fill(255);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(16);
  p.text(`Level: ${gameState.currentLevel}`, 10, 18);
  
  p.textAlign(p.CENTER, p.CENTER);
  p.text(`Spawned: ${gameState.sugarSpawned}`, CANVAS_WIDTH / 2, 18);
  
  p.textAlign(p.RIGHT, p.CENTER);
  p.text(`In Cups: ${gameState.sugarInCups}`, CANVAS_WIDTH - 10, 18);
  
  // Barriers count
  const nonStaticBarriers = gameState.barriers.filter(b => !b.isStatic).length;
  p.fill(200, 200, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(12);
  p.text(`Barriers: ${nonStaticBarriers}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 10);
}

export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  
  p.textSize(16);
  p.text('Press ESC to resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

export function renderGameOver(p) {
  renderGame(p);
  
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    p.fill(100, 255, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text('LEVEL COMPLETE!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
    
    p.fill(255);
    p.textSize(20);
    p.text(`Sugar Collected: ${gameState.sugarInCups}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
    p.text(`Barriers Used: ${gameState.barriers.filter(b => !b.isStatic).length}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    
    p.fill(150, 200, 255);
    p.textSize(16);
    const pulse = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
    p.fill(150 * pulse, 200 * pulse, 255 * pulse);
    p.text('Press R to continue to next level', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    p.fill(255, 100, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text('CUP OVERFLOW!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
    
    p.fill(255);
    p.textSize(16);
    p.text('A cup has exceeded its maximum capacity', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
    
    p.fill(150, 200, 255);
    const pulse = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
    p.fill(150 * pulse, 200 * pulse, 255 * pulse);
    p.text('Press R to restart level', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
  }
}