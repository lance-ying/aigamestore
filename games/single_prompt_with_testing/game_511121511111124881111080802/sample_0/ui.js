// ui.js - UI rendering for all game screens

import {
  gameState,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  COLORS
} from './globals.js';

// Render start screen
export function renderStartScreen(p) {
  p.background(...COLORS.background);

  // Title
  p.fill(...COLORS.text);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(56);
  p.textStyle(p.BOLD);
  p.text('SNAKE VS BLOCKS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 100);

  // Subtitle with animation
  const pulseAlpha = 200 + Math.sin(gameState.frameCount * 0.1) * 55;
  p.fill(COLORS.text[0], COLORS.text[1], COLORS.text[2], pulseAlpha);
  p.textSize(24);
  p.textStyle(p.NORMAL);
  p.text('Break the bricks and grow your snake!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

  // Instructions
  p.fill(...COLORS.text);
  p.textSize(16);
  p.text('Use LEFT and RIGHT arrow keys to move', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  p.text('Collect balls to grow your snake', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 45);
  p.text('Break bricks to score points', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
  p.text('Avoid running out of balls!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 95);

  // Start prompt with pulse
  const startAlpha = 200 + Math.sin(gameState.frameCount * 0.15) * 55;
  p.fill(COLORS.collectible[0], COLORS.collectible[1], COLORS.collectible[2], startAlpha);
  p.textSize(28);
  p.textStyle(p.BOLD);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 140);

  // High score
  if (gameState.highScore > 0) {
    p.fill(...COLORS.text);
    p.textSize(18);
    p.textStyle(p.NORMAL);
    p.text(`High Score: ${gameState.highScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
  }

  // Decorative elements
  drawDecorativeSnake(p, 50, 100, 5);
  drawDecorativeSnake(p, CANVAS_WIDTH - 50, 300, 4);
  drawDecorativeBrick(p, 100, CANVAS_HEIGHT - 80, 15);
  drawDecorativeBrick(p, CANVAS_WIDTH - 100, CANVAS_HEIGHT - 80, 20);
}

// Draw decorative snake for start screen
function drawDecorativeSnake(p, x, y, length) {
  for (let i = 0; i < length; i++) {
    const alpha = 150 - i * 20;
    const size = 12 - i * 1;
    const offsetY = Math.sin(gameState.frameCount * 0.05 + i * 0.5) * 5;

    p.fill(COLORS.snakeBall[0], COLORS.snakeBall[1], COLORS.snakeBall[2], alpha);
    p.noStroke();
    p.circle(x, y + i * 20 + offsetY, size * 2);
  }
}

// Draw decorative brick for start screen
function drawDecorativeBrick(p, x, y, value) {
  const rotation = Math.sin(gameState.frameCount * 0.05) * 0.1;

  p.push();
  p.translate(x, y);
  p.rotate(rotation);

  p.fill(...COLORS.brick);
  p.stroke(...COLORS.brickOutline);
  p.strokeWeight(2);
  p.rect(-25, -15, 50, 30, 5);

  p.fill(...COLORS.text);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(16);
  p.textStyle(p.BOLD);
  p.text(value, 0, 0);

  p.pop();
}

// Render game UI (HUD)
export function renderUI(p) {
  // Semi-transparent background for HUD
  p.fill(0, 0, 0, 100);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 50);

  // Score
  p.fill(...COLORS.text);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(20);
  p.textStyle(p.BOLD);
  p.text(`Score: ${gameState.score}`, 10, 10);

  // Snake length
  if (gameState.player) {
    const snakeLength = gameState.player.getLength();
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(24);
    p.text(`Balls: ${snakeLength}`, CANVAS_WIDTH / 2, 8);

    // Draw mini snake indicator
    const miniSnakeX = CANVAS_WIDTH / 2 - 60;
    const miniSnakeY = 25;
    for (let i = 0; i < Math.min(5, snakeLength); i++) {
      const alpha = 255 - i * 30;
      p.fill(COLORS.snakeBall[0], COLORS.snakeBall[1], COLORS.snakeBall[2], alpha);
      p.circle(miniSnakeX + i * 15, miniSnakeY, 10);
    }
    if (snakeLength > 5) {
      p.fill(...COLORS.text);
      p.textSize(12);
      p.text(`+${snakeLength - 5}`, miniSnakeX + 80, miniSnakeY - 5);
    }
  }

  // Distance/Progress
  const distance = Math.floor(gameState.rowsPassed);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(20);
  p.text(`Distance: ${distance}`, CANVAS_WIDTH - 10, 10);

  // Show controls hint briefly
  if (gameState.frameCount < 300) {
    const alpha = gameState.frameCount < 240 
      ? 255 
      : 255 * (1 - (gameState.frameCount - 240) / 60);

    p.fill(COLORS.text[0], COLORS.text[1], COLORS.text[2], alpha);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(14);
    p.text('← → to move | ESC to pause', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 25);
  }
}

// Render paused overlay
export function renderPausedOverlay(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Paused text
  p.fill(...COLORS.text);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(56);
  p.textStyle(p.BOLD);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

  // Instructions
  p.textSize(24);
  p.textStyle(p.NORMAL);
  const pulseAlpha = 200 + Math.sin(gameState.frameCount * 0.1) * 55;
  p.fill(COLORS.text[0], COLORS.text[1], COLORS.text[2], pulseAlpha);
  p.text('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

  // Show current stats
  p.fill(...COLORS.text);
  p.textSize(18);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
  if (gameState.player) {
    p.text(`Balls: ${gameState.player.getLength()}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 95);
  }
  p.text(`Distance: ${Math.floor(gameState.rowsPassed)}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 120);
}

// Render game over screen
export function renderGameOver(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const isWin = gameState.gamePhase === "GAME_OVER_WIN";

  // Game over text
  p.fill(isWin ? COLORS.collectible[0] : COLORS.brick[0], 
         isWin ? COLORS.collectible[1] : COLORS.brick[1], 
         isWin ? COLORS.collectible[2] : COLORS.brick[2]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(56);
  p.textStyle(p.BOLD);
  p.text('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);

  // Stats
  p.fill(...COLORS.text);
  p.textSize(28);
  p.textStyle(p.NORMAL);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

  p.textSize(20);
  p.text(`Distance: ${Math.floor(gameState.rowsPassed)}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  p.text(`Balls Collected: ${gameState.ballsCollected}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 45);
  p.text(`Bricks Destroyed: ${gameState.bricksDestroyed}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);

  // High score
  if (gameState.score >= gameState.highScore) {
    p.fill(COLORS.collectible[0], COLORS.collectible[1], COLORS.collectible[2]);
    p.textSize(24);
    p.textStyle(p.BOLD);
    p.text('NEW HIGH SCORE!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 105);
  } else {
    p.fill(...COLORS.text);
    p.textSize(18);
    p.text(`High Score: ${gameState.highScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 105);
  }

  // Restart instruction
  const pulseAlpha = 200 + Math.sin(gameState.frameCount * 0.15) * 55;
  p.fill(COLORS.text[0], COLORS.text[1], COLORS.text[2], pulseAlpha);
  p.textSize(28);
  p.textStyle(p.BOLD);
  p.text('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 150);
}

// Render background elements
export function renderBackground(p) {
  // Grid lines for depth effect
  p.stroke(COLORS.grid[0], COLORS.grid[1], COLORS.grid[2]);
  p.strokeWeight(1);

  const gridSpacing = 30;
  const offset = (gameState.cameraY % gridSpacing);

  // Vertical lines
  for (let x = 0; x < CANVAS_WIDTH; x += gridSpacing) {
    p.line(x, 0, x, CANVAS_HEIGHT);
  }

  // Horizontal lines
  for (let y = -gridSpacing; y < CANVAS_HEIGHT + gridSpacing; y += gridSpacing) {
    const lineY = y + offset;
    const alpha = 40 + Math.sin((lineY + gameState.cameraY) * 0.05) * 20;
    p.stroke(COLORS.grid[0], COLORS.grid[1], COLORS.grid[2], alpha);
    p.line(0, lineY, CANVAS_WIDTH, lineY);
  }
}

// Render screen effects (shake, flash)
export function renderScreenEffects(p) {
  // Flash effect
  if (gameState.flashAlpha > 0) {
    p.fill(255, 255, 255, gameState.flashAlpha);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    gameState.flashAlpha *= 0.9;
    if (gameState.flashAlpha < 1) {
      gameState.flashAlpha = 0;
    }
  }
}