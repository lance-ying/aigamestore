// rendering.js - Rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE, GRID_COLS, GRID_ROWS } from './globals.js';
import { PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN } from './globals.js';

export function renderGame(p) {
  // Background
  p.background(40, 40, 50);

  if (gameState.gamePhase === PHASE_START) {
    renderStartScreen(p);
  } else if (gameState.gamePhase === PHASE_PLAYING || gameState.gamePhase === PHASE_PAUSED) {
    renderPlayingScreen(p);
    if (gameState.gamePhase === PHASE_PAUSED) {
      renderPauseOverlay(p);
    }
  } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN) {
    renderGameOverScreen(p);
  }
}

function renderStartScreen(p) {
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  
  // Title
  p.textSize(48);
  p.fill(255, 220, 100);
  p.text("BABA IS YOU", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.textSize(20);
  p.fill(200, 200, 220);
  p.text("Push words to create rules!", CANVAS_WIDTH / 2, 140);
  
  // Instructions
  p.textSize(16);
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    "HOW TO PLAY:",
    "• Push word blocks to form rules",
    "• Rules: NOUN + IS + PROPERTY",
    "• Example: BABA IS YOU (you control BABA)",
    "• Example: FLAG IS WIN (touch FLAG to win)",
    "• Break and remake rules to solve puzzles!",
    "",
    "CONTROLS:",
    "• Arrow Keys: Move",
    "• ESC: Pause",
    "• R: Restart"
  ];
  
  let y = 180;
  for (const line of instructions) {
    p.text(line, 100, y);
    y += 22;
  }
  
  // Start prompt
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  p.fill(255, 255, 100);
  const flash = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(255 * flash, 255 * flash, 100);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}

function renderPlayingScreen(p) {
  // Draw grid
  p.stroke(60, 60, 70);
  p.strokeWeight(1);
  for (let x = 0; x <= GRID_COLS; x++) {
    p.line(x * GRID_SIZE, 0, x * GRID_SIZE, CANVAS_HEIGHT);
  }
  for (let y = 0; y <= GRID_ROWS; y++) {
    p.line(0, y * GRID_SIZE, CANVAS_WIDTH, y * GRID_SIZE);
  }

  // Render entities
  for (const entity of gameState.entities) {
    if (!entity.deleted) {
      entity.render(p);
    }
  }

  // Render word blocks
  for (const word of gameState.wordBlocks) {
    if (!word.deleted) {
      word.render(p);
    }
  }

  // UI
  renderUI(p);
}

function renderUI(p) {
  // Score and level
  p.fill(255, 255, 255);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text(`Level: ${gameState.level}/${gameState.maxLevel}`, 10, 10);
  p.text(`Score: ${gameState.score}`, 10, 30);
  p.text(`Moves: ${gameState.moves}`, 10, 50);

  // Active rules display
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.fill(200, 200, 255);
  p.text("Active Rules:", CANVAS_WIDTH - 10, 10);
  let y = 30;
  for (const rule of gameState.activeRules) {
    p.text(`${rule.noun} IS ${rule.property}`, CANVAS_WIDTH - 10, y);
    y += 20;
  }
}

function renderPauseOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  p.textSize(16);
  p.text("Press ESC to continue", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
}

function renderGameOverScreen(p) {
  renderPlayingScreen(p);
  
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("LEVEL COMPLETE!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  
  p.fill(255);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
  p.text(`Moves: ${gameState.moves}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  
  p.textSize(20);
  p.fill(255, 255, 100);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
}