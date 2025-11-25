// renderer.js - Rendering functions

import { gameState, GAME_PHASES, COLORS, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function drawStartScreen(p) {
  p.background(...COLORS.background);
  
  p.fill(...COLORS.text);
  p.textAlign(p.CENTER, p.CENTER);
  
  // Title
  p.textSize(48);
  p.text("LYNE", CANVAS_WIDTH / 2, 80);
  
  // Description
  p.textSize(16);
  p.text("Connect the shapes. Fill the board.", CANVAS_WIDTH / 2, 140);
  p.text("Each shape shows how many connections it needs.", CANVAS_WIDTH / 2, 165);
  
  // Instructions
  p.textSize(14);
  p.text("Arrow Keys: Move cursor", CANVAS_WIDTH / 2, 220);
  p.text("Space: Select/Connect nodes", CANVAS_WIDTH / 2, 245);
  p.text("Z: Undo last connection", CANVAS_WIDTH / 2, 270);
  p.text("ESC: Pause", CANVAS_WIDTH / 2, 295);
  
  // Start prompt
  p.textSize(20);
  const alpha = Math.floor(128 + 127 * Math.sin(p.frameCount * 0.05));
  p.fill(255, 255, 255, alpha);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 350);
}

export function drawPlayingScreen(p) {
  p.background(...COLORS.background);
  
  // Draw completed paths
  for (const path of gameState.paths) {
    path.draw(p, false);
  }
  
  // Draw current path in progress
  if (gameState.currentPath) {
    gameState.currentPath.draw(p, true);
  }
  
  // Draw nodes
  for (let i = 0; i < gameState.nodes.length; i++) {
    const node = gameState.nodes[i];
    const isCursor = i === gameState.cursor.nodeIndex;
    const isSelected = gameState.currentPath && gameState.currentPath.nodes.includes(node);
    node.draw(p, isSelected, isCursor);
  }
  
  // Draw UI
  drawUI(p);
}

export function drawUI(p) {
  p.fill(...COLORS.text);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text(`Level: ${gameState.currentLevel + 1}`, 10, 10);
  p.text(`Score: ${gameState.score}`, 10, 35);
  p.text(`Moves: ${gameState.moves}`, 10, 60);
  
  // Instructions hint
  p.textSize(12);
  p.textAlign(p.RIGHT, p.TOP);
  p.text("Z: Undo", CANVAS_WIDTH - 10, 10);
  p.text("ESC: Pause", CANVAS_WIDTH - 10, 30);
}

export function drawPausedScreen(p) {
  drawPlayingScreen(p);
  
  // Overlay
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(...COLORS.text);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  p.textSize(16);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
}

export function drawGameOverScreen(p) {
  p.background(...COLORS.background);
  
  p.fill(...COLORS.text);
  p.textAlign(p.CENTER, p.CENTER);
  
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    p.textSize(48);
    p.fill(100, 255, 100);
    p.text("PUZZLE COMPLETE!", CANVAS_WIDTH / 2, 120);
    
    p.fill(...COLORS.text);
    p.textSize(24);
    p.text(`Level ${gameState.currentLevel + 1} Solved`, CANVAS_WIDTH / 2, 180);
    p.textSize(20);
    p.text(`Moves: ${gameState.moves}`, CANVAS_WIDTH / 2, 220);
    p.text(`Total Score: ${gameState.score}`, CANVAS_WIDTH / 2, 250);
  } else {
    p.textSize(48);
    p.fill(255, 100, 100);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 150);
    
    p.fill(...COLORS.text);
    p.textSize(20);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  }
  
  p.textSize(20);
  const alpha = Math.floor(128 + 127 * Math.sin(p.frameCount * 0.05));
  p.fill(255, 255, 255, alpha);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 320);
}

export function renderGame(p) {
  switch (gameState.gamePhase) {
    case GAME_PHASES.START:
      drawStartScreen(p);
      break;
    case GAME_PHASES.PLAYING:
      drawPlayingScreen(p);
      break;
    case GAME_PHASES.PAUSED:
      drawPausedScreen(p);
      break;
    case GAME_PHASES.GAME_OVER_WIN:
    case GAME_PHASES.GAME_OVER_LOSE:
      drawGameOverScreen(p);
      break;
  }
}