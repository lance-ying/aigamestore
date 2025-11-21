// ui.js
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_PLAYING } from './globals.js';

export function renderStartScreen(p) {
  p.background(30, 30, 50);
  
  // Title
  p.fill(100, 200, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("HIDE BALL", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(200, 200, 255);
  p.textSize(20);
  p.text("Physics Puzzle Challenge", CANVAS_WIDTH / 2, 130);
  
  // Instructions
  p.fill(255);
  p.textSize(16);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("Protect the GREEN balls from the RED monster balls!", CANVAS_WIDTH / 2, 180);
  p.text("Use ARROW KEYS or WASD to move selected blocks", CANVAS_WIDTH / 2, 210);
  p.text("Press SPACE to select/deselect blocks", CANVAS_WIDTH / 2, 240);
  p.text("Use your limited moves wisely!", CANVAS_WIDTH / 2, 270);
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textSize(24);
  const alpha = (p.sin(p.frameCount * 0.1) + 1) * 127 + 50;
  p.fill(255, 255, 100, alpha);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 340);
}

export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 255, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  
  p.fill(255);
  p.textSize(20);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

export function renderGameOver(p) {
  p.background(30, 30, 50);
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  // Title
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "LEVEL COMPLETE!" : "GAME OVER", CANVAS_WIDTH / 2, 100);
  
  // Message
  p.fill(255);
  p.textSize(20);
  if (isWin) {
    p.text("All good balls protected!", CANVAS_WIDTH / 2, 160);
    p.text(`Level ${gameState.level} completed`, CANVAS_WIDTH / 2, 190);
  } else {
    p.text(gameState.gameOverReason, CANVAS_WIDTH / 2, 160);
    p.text("Try again!", CANVAS_WIDTH / 2, 190);
  }
  
  // Score
  p.textSize(24);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 240);
  
  // Instructions
  p.textSize(18);
  if (isWin) {
    p.fill(255, 255, 100);
    const alpha = (p.sin(p.frameCount * 0.1) + 1) * 127 + 50;
    p.fill(255, 255, 100, alpha);
    p.text("Press ENTER for next level", CANVAS_WIDTH / 2, 300);
  }
  
  p.fill(200);
  p.textSize(16);
  p.text("Press R to return to menu", CANVAS_WIDTH / 2, 340);
}

export function renderUI(p) {
  // Background panel
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, 50);
  
  // Level
  p.fill(255);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(18);
  p.text(`Level ${gameState.level}`, 10, 15);
  
  // Moves remaining
  const movesColor = gameState.movesRemaining > 3 ? [100, 255, 100] : [255, 200, 100];
  p.fill(movesColor);
  p.textSize(18);
  p.text(`Moves: ${gameState.movesRemaining}/${gameState.maxMoves}`, 10, 35);
  
  // Score
  p.fill(255, 255, 100);
  p.textAlign(p.RIGHT, p.CENTER);
  p.textSize(18);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 15);
  
  // Monster activation phase
  if (gameState.monsterActivated) {
    const timeLeft = gameState.monsterActivationDuration - gameState.monsterActivationTimer / 60;
    p.fill(255, 100, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(24);
    p.text(`MONSTERS ACTIVE: ${timeLeft.toFixed(1)}s`, CANVAS_WIDTH / 2, 25);
  }
  
  // Instructions at bottom
  if (!gameState.monsterActivated && gameState.movesRemaining > 0) {
    p.fill(255, 255, 255, 200);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    const msg = gameState.selectedBlock ? "ARROWS/WASD: Move | SPACE: Deselect" : "SPACE: Select block";
    p.text(msg, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 15);
  }
}