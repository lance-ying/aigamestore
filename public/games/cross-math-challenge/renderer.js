// renderer.js - Rendering functions

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
  p.background(40, 44, 52);
  
  // Title
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("CrossMath Challenge", CANVAS_WIDTH / 2, 80);
  
  // Description
  p.fill(220, 220, 220);
  p.textSize(14);
  p.text("Fill the grid to create correct equations", CANVAS_WIDTH / 2, 140);
  p.text("both horizontally and vertically", CANVAS_WIDTH / 2, 160);
  
  // Instructions
  p.fill(180, 180, 200);
  p.textSize(12);
  p.textAlign(p.LEFT, p.CENTER);
  const instrX = 80;
  p.text("Arrow Keys: Navigate cells", instrX, 200);
  p.text("Number Keys: Enter numbers", instrX, 220);
  p.text("Space: Submit puzzle", instrX, 240);
  p.text("Shift: Use hint (-100 pts)", instrX, 260);
  p.text("Backspace: Clear cell", instrX, 280);
  p.text("Escape: Pause", instrX, 300);
  
  // Start prompt
  p.fill(100, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 350);
  
  // High score
  if (gameState.highScore > 0) {
    p.fill(255, 200, 100);
    p.textSize(14);
    p.text(`High Score: ${gameState.highScore}`, CANVAS_WIDTH / 2, 380);
  }
}

export function renderPlayingScreen(p) {
  p.background(240, 240, 245);
  
  // UI
  renderUI(p);
  
  // Grid
  renderGrid(p);
  
  // Validation feedback
  if (gameState.lastValidationResult && !gameState.lastValidationResult.valid) {
    renderValidationFeedback(p);
  }
}

export function renderUI(p) {
  // Level indicator
  p.fill(60, 60, 80);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text(`LEVEL: ${gameState.currentLevel} / ${gameState.totalLevels}`, 10, 10);
  
  // Score
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
  
  // Attempts remaining
  const attemptsLeft = gameState.maxIncorrectSubmissions - gameState.incorrectSubmissions;
  p.textAlign(p.CENTER, p.TOP);
  p.fill(...(attemptsLeft === 1 ? [255, 100, 100] : [60, 60, 80]));
  p.text(`Attempts: ${attemptsLeft}`, CANVAS_WIDTH / 2, 10);
}

export function renderGrid(p) {
  const grid = gameState.currentGridData;
  const size = gameState.gridSize;
  const cellSize = gameState.cellSize;
  const offsetX = gameState.gridOffsetX;
  const offsetY = gameState.gridOffsetY;
  
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const cell = grid[row][col];
      const x = offsetX + col * cellSize;
      const y = offsetY + row * cellSize;
      
      // Cell background
      if (cell.type === 'empty') {
        p.fill(255);
      } else if (cell.type === 'number' || cell.type === 'operator') {
        p.fill(200, 220, 255);
      }
      
      // Highlight selected cell
      if (gameState.selectedCell.row === row && gameState.selectedCell.col === col) {
        p.fill(150, 255, 150);
      }
      
      // Highlight incorrect cells if validation failed
      if (gameState.lastValidationResult && !gameState.lastValidationResult.valid) {
        const isIncorrect = gameState.lastValidationResult.incorrectCells.some(
          ic => ic.row === row && ic.col === col
        );
        if (isIncorrect && p.frameCount % 20 < 10) {
          p.fill(255, 150, 150);
        }
      }
      
      p.stroke(100, 100, 120);
      p.strokeWeight(1);
      p.rect(x, y, cellSize, cellSize);
      
      // Cell content
      p.fill(40, 40, 60);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(cell.type === 'operator' ? 24 : 20);
      
      if (cell.type === 'number') {
        p.text(cell.value, x + cellSize / 2, y + cellSize / 2);
      } else if (cell.type === 'operator') {
        p.text(cell.value, x + cellSize / 2, y + cellSize / 2);
      } else if (cell.type === 'empty' && cell.playerInput !== '') {
        p.fill(0, 100, 200);
        p.text(cell.playerInput, x + cellSize / 2, y + cellSize / 2);
      }
    }
  }
}

export function renderValidationFeedback(p) {
  if (p.frameCount % 20 < 10) {
    p.fill(255, 100, 100, 150);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16);
    p.text("INCORRECT - Try again!", CANVAS_WIDTH / 2, gameState.gridOffsetY - 30);
  }
}

export function renderPausedScreen(p) {
  renderPlayingScreen(p);
  
  // Dark overlay
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Pause text
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  
  p.textSize(16);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  p.text("Press R to restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
  
  // Small indicator in top right
  p.fill(255, 200, 100);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(12);
  p.text("PAUSED", CANVAS_WIDTH - 10, 30);
}

export function renderGameOverWin(p) {
  p.background(60, 80, 120);
  
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  
  if (gameState.currentLevel > gameState.totalLevels) {
    p.text("CONGRATULATIONS!", CANVAS_WIDTH / 2, 100);
    p.textSize(24);
    p.text("All Levels Complete!", CANVAS_WIDTH / 2, 140);
  } else {
    p.text("LEVEL COMPLETE!", CANVAS_WIDTH / 2, 100);
  }
  
  // Score
  p.fill(255);
  p.textSize(18);
  p.text(`Total Score: ${gameState.score}`, CANVAS_WIDTH / 2, 200);
  
  if (gameState.score === gameState.highScore) {
    p.fill(255, 200, 100);
    p.textSize(14);
    p.text("NEW HIGH SCORE!", CANVAS_WIDTH / 2, 230);
  }
  
  // Instructions
  p.fill(150, 255, 150);
  p.textSize(16);
  
  if (gameState.currentLevel > gameState.totalLevels) {
    p.text("Press ENTER to return to menu", CANVAS_WIDTH / 2, 280);
  } else {
    p.text("Press ENTER for next level", CANVAS_WIDTH / 2, 280);
  }
  
  p.fill(220, 220, 220);
  p.textSize(14);
  p.text("Press R to restart", CANVAS_WIDTH / 2, 310);
}

export function renderGameOverLose(p) {
  p.background(80, 40, 40);
  
  p.fill(255, 150, 150);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("LEVEL FAILED", CANVAS_WIDTH / 2, 120);
  
  p.fill(255);
  p.textSize(16);
  p.text("Too many incorrect submissions", CANVAS_WIDTH / 2, 180);
  
  p.textSize(18);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 230);
  
  // Instructions
  p.fill(255, 200, 150);
  p.textSize(16);
  p.text("Press ENTER to try again", CANVAS_WIDTH / 2, 280);
  
  p.fill(220, 220, 220);
  p.textSize(14);
  p.text("Press R to restart", CANVAS_WIDTH / 2, 310);
}

export function render(p) {
  switch (gameState.gamePhase) {
    case GAME_PHASES.START:
      renderStartScreen(p);
      break;
    case GAME_PHASES.PLAYING:
      renderPlayingScreen(p);
      break;
    case GAME_PHASES.PAUSED:
      renderPausedScreen(p);
      break;
    case GAME_PHASES.GAME_OVER_WIN:
      renderGameOverWin(p);
      break;
    case GAME_PHASES.GAME_OVER_LOSE:
      renderGameOverLose(p);
      break;
  }
}