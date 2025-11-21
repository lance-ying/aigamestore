// rendering.js - Game rendering functions

import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, gameState } from './globals.js';
import { renderPuzzleUI } from './puzzle_ui.js';

export function renderStartScreen(p) {
  p.background(40, 30, 50);
  
  // Decorative border
  p.stroke(180, 150, 100);
  p.strokeWeight(4);
  p.noFill();
  p.rect(20, 20, CANVAS_WIDTH - 40, CANVAS_HEIGHT - 40, 10);
  
  // Title
  p.fill(255, 220, 150);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("PROFESSOR LAYTON", CANVAS_WIDTH / 2, 80);
  p.textSize(24);
  p.text("and the Devil's Box", CANVAS_WIDTH / 2, 115);
  
  // Description
  p.fill(220, 200, 180);
  p.textSize(14);
  const desc = [
    "Guide Professor Layton through mysterious locations",
    "to uncover the truth behind the Devil's Box.",
    "",
    "Collect HINT COINS and solve PUZZLES to progress.",
    "Use coins wisely to get hints on difficult puzzles!"
  ];
  desc.forEach((line, idx) => {
    p.text(line, CANVAS_WIDTH / 2, 160 + idx * 20);
  });
  
  // Controls
  p.fill(255, 230, 180);
  p.textSize(13);
  p.text("CONTROLS:", CANVAS_WIDTH / 2, 280);
  
  p.fill(200, 180, 160);
  p.textSize(12);
  const controls = [
    "Arrow Keys - Move",
    "SPACE - Interact / Submit answer",
    "Z - Use hint (costs 1 coin)",
    "ESC - Pause     R - Restart"
  ];
  controls.forEach((line, idx) => {
    p.text(line, CANVAS_WIDTH / 2, 305 + idx * 18);
  });
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textSize(16);
  const blink = p.sin(p.frameCount * 0.1) > 0;
  if (blink) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 375);
  }
}

export function renderPlayingScreen(p, gameState) {
  const area = gameState.areas[gameState.currentArea];
  
  // Background
  p.background(area.background.r, area.background.g, area.background.b);
  
  // Add atmosphere
  p.noStroke();
  p.fill(255, 255, 255, 10);
  for (let i = 0; i < 30; i++) {
    const x = (p.frameCount * 0.5 + i * 157) % CANVAS_WIDTH;
    const y = (p.frameCount * 0.3 + i * 213) % CANVAS_HEIGHT;
    p.ellipse(x, y, 3, 3);
  }
  
  // Render obstacles
  area.obstacles.forEach(obs => obs.render());
  
  // Render puzzle hotspots
  gameState.puzzleHotspots.forEach(hotspot => {
    hotspot.update();
    hotspot.render();
  });
  
  // Render hint coins
  gameState.hintCoins.forEach(coin => {
    coin.update();
    coin.render();
  });
  
  // Render player
  if (gameState.player) {
    gameState.player.render();
  }
  
  // UI overlay
  renderUI(p, gameState);
  
  // Puzzle mode overlay
  if (gameState.inPuzzleMode && gameState.currentPuzzle) {
    renderPuzzleUI(p, gameState.currentPuzzle);
  }
  
  // Area transition message
  if (p.frameCount - gameState.lastInteraction < 120 && gameState.storyProgress > 0) {
    renderAreaMessage(p, area);
  }
}

function renderUI(p, gameState) {
  // Semi-transparent UI background
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 30);
  p.rect(0, CANVAS_HEIGHT - 30, CANVAS_WIDTH, 30);
  
  // Top UI
  p.fill(255, 220, 150);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(14);
  p.text(`Area: ${gameState.areas[gameState.currentArea].name}`, 10, 15);
  
  p.textAlign(p.RIGHT, p.CENTER);
  p.text(`Coins: ${gameState.collectedCoins}`, CANVAS_WIDTH - 10, 15);
  
  // Bottom UI
  p.textAlign(p.LEFT, p.CENTER);
  p.text(`Score: ${gameState.score}`, 10, CANVAS_HEIGHT - 15);
  
  p.textAlign(p.RIGHT, p.CENTER);
  p.text(`Puzzles: ${gameState.puzzlesSolved}/${gameState.totalPuzzles}`, CANVAS_WIDTH - 10, CANVAS_HEIGHT - 15);
  
  // Pause indicator
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.fill(255, 255, 100);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(12);
    p.text("PAUSED", CANVAS_WIDTH - 10, 35);
  }
}

function renderAreaMessage(p, area) {
  p.fill(0, 0, 0, 180);
  p.rect(100, 150, 400, 100, 10);
  
  p.fill(255, 220, 150);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.text(area.name, 300, 180);
  
  p.fill(220, 200, 180);
  p.textSize(13);
  const lines = area.description.split('\n');
  lines.forEach((line, idx) => {
    p.text(line, 300, 210 + idx * 18);
  });
}

export function renderGameOverScreen(p, gameState) {
  p.background(20, 15, 30);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Decorative elements
  for (let i = 0; i < 50; i++) {
    const x = (i * 137) % CANVAS_WIDTH;
    const y = (i * 219) % CANVAS_HEIGHT;
    p.fill(255, 215, 0, 100);
    p.noStroke();
    p.ellipse(x, y, 4, 4);
  }
  
  // Title
  p.fill(isWin ? 255 : 200, isWin ? 220 : 100, isWin ? 100 : 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text(isWin ? "MYSTERY SOLVED!" : "GAME OVER", CANVAS_WIDTH / 2, 100);
  
  // Message
  p.fill(255, 240, 200);
  p.textSize(16);
  if (isWin) {
    const messages = [
      "Professor Layton has uncovered",
      "the secrets of the Devil's Box!",
      "",
      "Through brilliant deduction and",
      "clever puzzle-solving, the truth",
      "has been revealed."
    ];
    messages.forEach((line, idx) => {
      p.text(line, CANVAS_WIDTH / 2, 160 + idx * 22);
    });
  }
  
  // Stats
  p.fill(255, 220, 150);
  p.textSize(18);
  p.text("FINAL STATS", CANVAS_WIDTH / 2, 280);
  
  p.fill(220, 200, 180);
  p.textSize(14);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 310);
  p.text(`Puzzles Solved: ${gameState.puzzlesSolved}/${gameState.totalPuzzles}`, CANVAS_WIDTH / 2, 335);
  
  // Restart prompt
  p.fill(255, 255, 100);
  p.textSize(16);
  const blink = p.sin(p.frameCount * 0.1) > 0;
  if (blink) {
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 375);
  }
}