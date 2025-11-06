// ui.js - UI rendering

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, PHASE_LEVEL_COMPLETE, LEVEL_CONFIGS } from './globals.js';

export function renderUI(p) {
  if (gameState.gamePhase === PHASE_START) {
    renderStartScreen(p);
  } else if (gameState.gamePhase === PHASE_PLAYING) {
    renderPlayingUI(p);
  } else if (gameState.gamePhase === PHASE_PAUSED) {
    renderPlayingUI(p);
    renderPausedOverlay(p);
  } else if (gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
    renderGameOverScreen(p, false);
  } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_LEVEL_COMPLETE) {
    renderGameOverScreen(p, true);
  }
}

function renderStartScreen(p) {
  p.background(34, 34, 34);
  
  // Title
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('SNAKE.IO', CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.textSize(20);
  p.fill(150, 220, 50);
  p.text('Multiplayer Survival', CANVAS_WIDTH / 2, 120);
  
  // Instructions
  p.textSize(16);
  p.fill(200);
  p.textAlign(p.CENTER, p.TOP);
  
  const instructions = [
    'OBJECTIVE:',
    'Grow your snake by eating pellets and defeating AI opponents.',
    'Reach the target length to complete each level!',
    '',
    'CONTROLS:',
    'Arrow Keys: Turn Left/Right',
    'Space/Shift: Speed Boost (costs mass)',
    'ESC: Pause',
    '',
    'LEVELS:',
    'Level 1: Reach 50 length',
    'Level 2: Reach 120 length',
    'Level 3: Reach 250 length',
  ];
  
  let yPos = 170;
  for (let line of instructions) {
    if (line.includes('OBJECTIVE') || line.includes('CONTROLS') || line.includes('LEVELS')) {
      p.fill(150, 220, 50);
    } else {
      p.fill(200);
    }
    p.text(line, CANVAS_WIDTH / 2, yPos);
    yPos += 20;
  }
  
  // Press Enter prompt
  p.textSize(24);
  p.fill(255, 220, 0);
  const alpha = p.map(p.sin(p.frameCount * 0.1), -1, 1, 100, 255);
  p.fill(255, 220, 0, alpha);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}

function renderPlayingUI(p) {
  // Score and length
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text(`SCORE: ${gameState.score} | LENGTH: ${gameState.playerLength}`, 10, 10);
  
  // Level
  p.textAlign(p.RIGHT, p.TOP);
  const config = LEVEL_CONFIGS[gameState.currentLevel];
  p.text(`LEVEL ${gameState.currentLevel}: ${config.name}`, CANVAS_WIDTH - 10, 10);
  
  // Target length progress
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(14);
  p.fill(150, 220, 50);
  p.text(`Target: ${gameState.playerLength}/${config.targetLength}`, CANVAS_WIDTH / 2, 10);
  
  // Progress bar
  const barWidth = 200;
  const barHeight = 8;
  const barX = (CANVAS_WIDTH - barWidth) / 2;
  const barY = 30;
  
  p.fill(60);
  p.rect(barX, barY, barWidth, barHeight);
  
  const progress = Math.min(gameState.playerLength / config.targetLength, 1);
  p.fill(150, 220, 50);
  p.rect(barX, barY, barWidth * progress, barHeight);
}

function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  
  p.textSize(20);
  p.text('Press ESC to resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  p.text('Press R to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
}

function renderGameOverScreen(p, isWin) {
  p.background(34, 34, 34);
  
  // Title
  p.fill(isWin ? [100, 220, 100] : [220, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  
  if (gameState.gamePhase === PHASE_LEVEL_COMPLETE) {
    p.text('LEVEL COMPLETE!', CANVAS_WIDTH / 2, 100);
  } else if (isWin) {
    p.text('VICTORY!', CANVAS_WIDTH / 2, 100);
    p.textSize(24);
    p.fill(150, 220, 50);
    p.text('All levels conquered!', CANVAS_WIDTH / 2, 150);
  } else {
    p.text('GAME OVER', CANVAS_WIDTH / 2, 100);
  }
  
  // Score
  p.textSize(32);
  p.fill(255);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 200);
  p.text(`Final Length: ${gameState.playerLength}`, CANVAS_WIDTH / 2, 240);
  
  // Level info
  p.textSize(20);
  p.fill(200);
  p.text(`Level Reached: ${gameState.currentLevel}`, CANVAS_WIDTH / 2, 280);
  
  // Instructions
  p.textSize(24);
  p.fill(255, 220, 0);
  const alpha = p.map(p.sin(p.frameCount * 0.1), -1, 1, 100, 255);
  p.fill(255, 220, 0, alpha);
  
  if (gameState.gamePhase === PHASE_LEVEL_COMPLETE) {
    p.text('PRESS ENTER TO CONTINUE', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  } else {
    p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  }
}

export function renderArena(p) {
  // Dark background
  p.background(34, 34, 34);
  
  // Grid pattern
  p.stroke(50, 50, 50);
  p.strokeWeight(1);
  const gridSize = 20;
  for (let x = 0; x < CANVAS_WIDTH; x += gridSize) {
    p.line(x, 0, x, CANVAS_HEIGHT);
  }
  for (let y = 0; y < CANVAS_HEIGHT; y += gridSize) {
    p.line(0, y, CANVAS_WIDTH, y);
  }
  p.noStroke();
  
  // Boundary
  p.noFill();
  p.stroke(150, 150, 150);
  p.strokeWeight(3);
  p.rect(20, 20, CANVAS_WIDTH - 40, CANVAS_HEIGHT - 40);
  p.noStroke();
}