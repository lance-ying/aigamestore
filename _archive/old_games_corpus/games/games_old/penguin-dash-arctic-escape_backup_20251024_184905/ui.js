// ui.js - UI rendering

import {
  gameState,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER
} from './globals.js';

export function drawUI(p) {
  const phase = gameState.gamePhase;

  if (phase === PHASE_START) {
    drawStartScreen(p);
  } else if (phase === PHASE_PLAYING) {
    drawPlayingUI(p);
  } else if (phase === PHASE_PAUSED) {
    drawPlayingUI(p);
    drawPauseOverlay(p);
  } else if (phase === PHASE_GAME_OVER) {
    drawGameOverScreen(p);
  }
}

function drawStartScreen(p) {
  p.fill(20, 40, 60, 230);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Title
  p.fill(255, 255, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("PENGUIN DASH", CANVAS_WIDTH / 2, 80);
  
  p.textSize(24);
  p.text("Arctic Escape", CANVAS_WIDTH / 2, 120);

  // Description
  p.textSize(16);
  p.fill(200, 220, 255);
  p.text("Navigate three lanes through the Arctic!", CANVAS_WIDTH / 2, 170);
  p.text("Jump, slide, and dodge obstacles.", CANVAS_WIDTH / 2, 195);
  p.text("Collect fish and rescue penguins!", CANVAS_WIDTH / 2, 220);

  // Instructions
  p.textSize(14);
  p.fill(255, 255, 255);
  p.textAlign(p.LEFT, p.CENTER);
  p.text("Controls:", 150, 260);
  p.text("↑ - Jump", 150, 280);
  p.text("↓ - Slide", 150, 300);
  p.text("← → - Change Lane", 150, 320);
  p.text("ESC - Pause", 350, 280);
  p.text("R - Restart", 350, 300);

  // High score
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  p.fill(255, 220, 100);
  p.text(`HIGH SCORE: ${gameState.highScore}`, CANVAS_WIDTH / 2, 350);

  // Start prompt
  p.textSize(20);
  p.fill(100, 255, 150);
  const flash = Math.sin(p.frameCount * 0.1) * 0.5 + 0.5;
  p.fill(100 + flash * 155, 255, 150);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
}

function drawPlayingUI(p) {
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(20);
  p.text(`SCORE: ${gameState.score}`, 10, 10);
  
  p.textSize(18);
  p.text(`FISH: ${gameState.fishCount}`, 10, 35);
  p.text(`LIVES: ${gameState.lives}`, 10, 60);

  // Level indicator
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(20);
  p.text(`LEVEL: ${gameState.currentLevel}`, CANVAS_WIDTH - 10, 10);

  // Distance progress bar
  const config = gameState.levelConfig;
  if (config) {
    const progress = Math.min(gameState.distanceTraveled / config.distanceTarget, 1);
    p.fill(50, 50, 50, 150);
    p.noStroke();
    p.rect(CANVAS_WIDTH - 210, 40, 200, 15, 5);
    p.fill(100, 200, 255);
    p.rect(CANVAS_WIDTH - 210, 40, 200 * progress, 15, 5);
  }

  // Power-up timer
  if (gameState.powerUp.active) {
    const seconds = Math.ceil(gameState.powerUp.timer / 60);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(16);
    p.fill(255, 255, 100);
    const typeText = gameState.powerUp.type === 'shield' ? '🛡️ SHIELD' : '🧲 MAGNET';
    p.text(`${typeText}: ${seconds}s`, CANVAS_WIDTH / 2, 10);
  }
}

function drawPauseOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(24);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);

  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  p.text("Press R to restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

function drawGameOverScreen(p) {
  p.fill(20, 20, 40, 230);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  p.fill(255, 100, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("GAME OVER", CANVAS_WIDTH / 2, 120);

  p.fill(255);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);
  p.text(`Fish Collected: ${gameState.fishCount}`, CANVAS_WIDTH / 2, 210);
  p.text(`Reached Level: ${gameState.currentLevel}`, CANVAS_WIDTH / 2, 240);

  // Check if new high score
  if (gameState.score > gameState.highScore) {
    p.fill(255, 220, 100);
    p.textSize(20);
    p.text("NEW HIGH SCORE!", CANVAS_WIDTH / 2, 280);
  }

  p.fill(255);
  p.textSize(20);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
}

export function drawLevelComplete(p) {
  p.fill(20, 60, 40, 230);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  p.fill(100, 255, 150);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(`LEVEL ${gameState.currentLevel} COMPLETE!`, CANVAS_WIDTH / 2, 100);

  p.fill(255);
  p.textSize(24);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);
  p.text(`Fish: ${gameState.fishCount}`, CANVAS_WIDTH / 2, 210);

  if (gameState.currentLevel < 3) {
    p.textSize(20);
    const flash = Math.sin(p.frameCount * 0.1) * 0.5 + 0.5;
    p.fill(100 + flash * 155, 255, 150);
    p.text("PRESS ENTER FOR NEXT LEVEL", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
  } else {
    p.fill(255, 220, 100);
    p.textSize(36);
    p.text("YOU WIN!", CANVAS_WIDTH / 2, 260);
    p.fill(255);
    p.textSize(20);
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
  }
}