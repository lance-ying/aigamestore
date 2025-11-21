// rendering.js - All rendering functions

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
  p.background(30, 40, 60);
  
  // Title
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text("SPILL IT", CANVAS_WIDTH / 2, 80);
  
  // Description
  p.fill(200, 200, 200);
  p.textSize(16);
  p.textStyle(p.NORMAL);
  p.text("Drop balls to knock over all the glasses!", CANVAS_WIDTH / 2, 140);
  p.text("Use physics and chain reactions to win!", CANVAS_WIDTH / 2, 165);
  
  // Instructions
  p.fill(150, 200, 255);
  p.textSize(14);
  p.text("HOW TO PLAY:", CANVAS_WIDTH / 2, 210);
  
  p.fill(220, 220, 220);
  p.textSize(13);
  p.text("• Press SPACE to drop a ball", CANVAS_WIDTH / 2, 235);
  p.text("• Knock over ALL glasses to win", CANVAS_WIDTH / 2, 255);
  p.text("• Limited balls per level!", CANVAS_WIDTH / 2, 275);
  
  // Level info
  p.fill(255, 200, 100);
  p.textSize(16);
  p.text(`Level: ${gameState.currentLevel} / ${gameState.maxLevel}`, CANVAS_WIDTH / 2, 310);
  p.text(`Total Coins: ${gameState.totalCoins}`, CANVAS_WIDTH / 2, 335);
  
  // Start prompt
  p.fill(100, 255, 100);
  p.textSize(18);
  const blink = Math.floor(p.frameCount / 30) % 2 === 0;
  if (blink) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
  }
}

export function renderGame(p) {
  // Sky background
  p.background(135, 206, 235);
  
  // Draw spawn indicator at top
  p.fill(255, 100, 100, 100);
  p.noStroke();
  p.circle(CANVAS_WIDTH / 2, 30, 20);
  p.stroke(255, 100, 100);
  p.strokeWeight(2);
  p.line(CANVAS_WIDTH / 2, 20, CANVAS_WIDTH / 2, 40);
  
  // Render all entities
  gameState.platforms.forEach(platform => platform.render());
  gameState.glasses.forEach(glass => glass.render());
  gameState.balls.forEach(ball => ball.render());
  
  // UI - Balls remaining
  p.fill(255);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.textStyle(p.BOLD);
  p.text(`Balls: ${gameState.ballsRemaining}`, 10, 10);
  
  // Level info
  p.textAlign(p.CENTER, p.TOP);
  p.text(`Level ${gameState.currentLevel}`, CANVAS_WIDTH / 2, 10);
  
  // Glasses toppled counter
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`Glasses: ${gameState.glassesToppledCount}/${gameState.glasses.length}`, CANVAS_WIDTH - 10, 10);
  
  // Coins
  p.textAlign(p.LEFT, p.TOP);
  p.fill(255, 215, 0);
  p.text(`Coins: ${gameState.totalCoins}`, 10, 35);
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
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  
  p.textSize(18);
  p.textStyle(p.NORMAL);
  p.text("Press ESC to continue", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
  p.text("Press R to restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 55);
}

export function renderGameOver(p) {
  p.background(30, 40, 60);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Title
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text(isWin ? "LEVEL COMPLETE!" : "LEVEL FAILED", CANVAS_WIDTH / 2, 100);
  
  // Stats
  p.fill(220, 220, 220);
  p.textSize(18);
  p.textStyle(p.NORMAL);
  
  if (isWin) {
    p.text(`Glasses Toppled: ${gameState.glassesToppledCount}/${gameState.glasses.length}`, CANVAS_WIDTH / 2, 160);
    p.text(`Balls Used: ${gameState.totalBalls - gameState.ballsRemaining}/${gameState.totalBalls}`, CANVAS_WIDTH / 2, 190);
    
    p.fill(255, 215, 0);
    p.textSize(24);
    p.text(`Coins Earned: +${gameState.coins}`, CANVAS_WIDTH / 2, 230);
    
    p.fill(150, 200, 255);
    p.textSize(16);
    if (gameState.currentLevel < gameState.maxLevel) {
      p.text(`Next: Level ${gameState.currentLevel + 1}`, CANVAS_WIDTH / 2, 270);
    } else {
      p.text("All levels complete!", CANVAS_WIDTH / 2, 270);
    }
  } else {
    p.text(`Glasses Toppled: ${gameState.glassesToppledCount}/${gameState.glasses.length}`, CANVAS_WIDTH / 2, 160);
    p.text("Out of balls!", CANVAS_WIDTH / 2, 190);
    
    p.fill(255, 200, 100);
    p.textSize(16);
    p.text("Try again with better timing!", CANVAS_WIDTH / 2, 230);
  }
  
  // Restart prompt
  p.fill(255);
  p.textSize(20);
  const blink = Math.floor(p.frameCount / 30) % 2 === 0;
  if (blink) {
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 340);
  }
}