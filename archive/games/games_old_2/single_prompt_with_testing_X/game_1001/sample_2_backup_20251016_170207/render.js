// render.js - Rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GRID_OFFSET_X, GRID_OFFSET_Y, DOT_SIZE, GRID_SIZE } from './globals.js';

export function renderStartScreen(p) {
  p.background(30, 30, 50);
  
  // Title
  p.fill(255, 255, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("DOT CONNECT", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.textSize(20);
  p.fill(200, 200, 255);
  p.text("Match & Clear Puzzle", CANVAS_WIDTH / 2, 130);
  
  // Instructions
  p.textSize(14);
  p.fill(255, 255, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("Connect 2+ adjacent dots of the same color", CANVAS_WIDTH / 2, 180);
  p.text("Make a square to clear ALL dots of that color!", CANVAS_WIDTH / 2, 205);
  p.text("Reach the target score within the move limit", CANVAS_WIDTH / 2, 230);
  
  // Controls
  p.textSize(12);
  p.fill(180, 180, 200);
  p.text("Arrow Keys: Move cursor | Space: Select/extend path", CANVAS_WIDTH / 2, 270);
  p.text("Enter: Clear selected dots | ESC: Cancel/Pause", CANVAS_WIDTH / 2, 290);
  
  // Start prompt
  p.textSize(24);
  p.fill(255, 255, 100);
  const alpha = 200 + 55 * p.sin(p.frameCount * 0.1);
  p.fill(255, 255, 100, alpha);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 340);
}

export function renderGame(p) {
  // Background
  p.background(30, 30, 50);
  
  // Draw grid background
  p.fill(40, 40, 60);
  p.noStroke();
  p.rect(GRID_OFFSET_X - 10, GRID_OFFSET_Y - 10, GRID_SIZE * DOT_SIZE + 20, GRID_SIZE * DOT_SIZE + 20, 10);
  
  // Draw grid lines
  p.stroke(50, 50, 70);
  p.strokeWeight(1);
  for (let i = 0; i <= GRID_SIZE; i++) {
    const x = GRID_OFFSET_X + i * DOT_SIZE;
    const y = GRID_OFFSET_Y + i * DOT_SIZE;
    p.line(x, GRID_OFFSET_Y, x, GRID_OFFSET_Y + GRID_SIZE * DOT_SIZE);
    p.line(GRID_OFFSET_X, y, GRID_OFFSET_X + GRID_SIZE * DOT_SIZE, y);
  }
  
  // Draw cursor
  const cursorScreenX = GRID_OFFSET_X + gameState.cursorX * DOT_SIZE + DOT_SIZE / 2;
  const cursorScreenY = GRID_OFFSET_Y + gameState.cursorY * DOT_SIZE + DOT_SIZE / 2;
  
  p.noFill();
  p.stroke(255, 255, 255, 200);
  p.strokeWeight(3);
  const cursorSize = 35 + 5 * p.sin(p.frameCount * 0.15);
  p.rect(cursorScreenX - cursorSize / 2, cursorScreenY - cursorSize / 2, cursorSize, cursorSize, 5);
  
  // Draw connection lines
  if (gameState.currentPath.length >= 2) {
    p.stroke(255, 255, 255, 150);
    p.strokeWeight(6);
    p.noFill();
    p.beginShape();
    gameState.currentPath.forEach(dot => {
      const pos = dot.getScreenPos();
      p.vertex(pos.x, pos.y);
    });
    p.endShape();
  }
  
  // Draw dots
  gameState.entities.forEach(entity => {
    if (entity.render) {
      entity.update();
      entity.render();
    }
  });
  
  // Draw particles
  for (let i = gameState.particleEffects.length - 1; i >= 0; i--) {
    const particle = gameState.particleEffects[i];
    if (!particle.update()) {
      gameState.particleEffects.splice(i, 1);
    } else {
      particle.render();
    }
  }
  
  // Draw UI
  drawUI(p);
  
  // Square indicator
  if (gameState.squareDetected && gameState.currentPath.length === 4) {
    p.fill(255, 255, 100);
    p.textSize(20);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("SQUARE! Clear All!", CANVAS_WIDTH / 2, GRID_OFFSET_Y - 25);
  }
}

function drawUI(p) {
  // Score panel
  p.fill(50, 50, 70);
  p.noStroke();
  p.rect(10, 10, 120, 120, 8);
  
  p.fill(255, 255, 255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text("LEVEL " + gameState.level, 20, 20);
  
  p.textSize(12);
  p.fill(200, 200, 200);
  p.text("Score:", 20, 45);
  p.fill(255, 255, 100);
  p.textSize(20);
  p.text(gameState.score, 20, 62);
  
  p.fill(200, 200, 200);
  p.textSize(12);
  p.text("Target: " + gameState.targetScore, 20, 88);
  
  // Moves panel
  p.fill(50, 50, 70);
  p.noStroke();
  p.rect(10, 140, 120, 60, 8);
  
  p.fill(200, 200, 200);
  p.textSize(12);
  p.text("Moves:", 20, 150);
  
  const movesLeft = gameState.maxMoves - gameState.moves;
  if (movesLeft <= 5) {
    p.fill(255, 100, 100);
  } else {
    p.fill(100, 255, 150);
  }
  p.textSize(24);
  p.text(movesLeft, 20, 165);
  
  // Progress bar
  const progress = gameState.score / gameState.targetScore;
  const barWidth = 100;
  const barHeight = 12;
  const barX = 20;
  const barY = 105;
  
  p.fill(60, 60, 80);
  p.noStroke();
  p.rect(barX, barY, barWidth, barHeight, 6);
  
  p.fill(100, 255, 150);
  p.rect(barX, barY, Math.min(barWidth, barWidth * progress), barHeight, 6);
}

export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 255, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  
  p.textSize(16);
  p.fill(200, 200, 200);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

export function renderGameOver(p) {
  p.background(30, 30, 50);
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  // Title
  p.fill(isWin ? [100, 255, 150] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "LEVEL COMPLETE!" : "GAME OVER", CANVAS_WIDTH / 2, 100);
  
  // Score
  p.fill(255, 255, 255);
  p.textSize(24);
  p.text("Final Score: " + gameState.score, CANVAS_WIDTH / 2, 180);
  
  if (isWin) {
    p.textSize(20);
    p.fill(255, 255, 100);
    p.text("Target Reached!", CANVAS_WIDTH / 2, 220);
  } else {
    p.textSize(18);
    p.fill(200, 200, 200);
    p.text("Out of Moves", CANVAS_WIDTH / 2, 220);
    p.text("Target: " + gameState.targetScore, CANVAS_WIDTH / 2, 245);
  }
  
  // Restart prompt
  p.textSize(20);
  p.fill(255, 255, 100);
  const alpha = 200 + 55 * p.sin(p.frameCount * 0.1);
  p.fill(255, 255, 100, alpha);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 320);
}