// renderer.js - Rendering logic

import { gameState, GAME_PHASES, GAME_STATES, CELL_STATE, LEVELS, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

let p;

export function initRenderer(p5Instance) {
  p = p5Instance;
}

export function render() {
  p.background(30, 30, 30);
  
  if (gameState.gamePhase === GAME_PHASES.START) {
    renderTitleScreen();
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    renderPlayingScreen();
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    renderPlayingScreen();
    renderPauseOverlay();
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
             gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    renderGameOverScreen();
  }
}

function renderTitleScreen() {
  p.push();
  
  // Title
  p.fill(255, 255, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("GRIDLOCK DUEL", CANVAS_WIDTH / 2, 80);
  
  // Description
  p.textSize(16);
  p.fill(200, 200, 200);
  p.text("Battle the AI in strategic grid warfare!", CANVAS_WIDTH / 2, 140);
  p.text("Win rounds to advance through 5 challenging levels", CANVAS_WIDTH / 2, 165);
  
  // High Score
  p.textSize(20);
  p.fill(255, 215, 0);
  p.text(`HIGH SCORE: ${String(gameState.highScore).padStart(5, '0')}`, CANVAS_WIDTH / 2, 210);
  
  // Instructions
  p.textSize(14);
  p.fill(180, 180, 180);
  p.text("Arrow Keys: Navigate grid", CANVAS_WIDTH / 2, 260);
  p.text("Space/Z: Place your X mark", CANVAS_WIDTH / 2, 280);
  p.text("ESC: Pause  |  R: Restart", CANVAS_WIDTH / 2, 300);
  
  // Start prompt
  p.textSize(20);
  p.fill(100, 255, 100);
  const alpha = Math.sin(p.frameCount * 0.05) * 127 + 128;
  p.fill(100, 255, 100, alpha);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 350);
  
  p.pop();
}

function renderPlayingScreen() {
  // Render HUD
  renderHUD();
  
  // Render game board
  renderBoard();
  
  // Render marks
  renderMarks();
  
  // Render selection highlight
  if (gameState.currentTurn === "PLAYER" && gameState.gameStatus === GAME_STATES.PLAYING) {
    renderSelectionHighlight();
  }
  
  // Render winning line if exists
  if (gameState.winningLine) {
    renderWinningLine();
  }
  
  // Render level complete message
  if (gameState.gameStatus === GAME_STATES.LEVEL_COMPLETE) {
    renderLevelCompleteOverlay();
  }
}

function renderHUD() {
  p.push();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.fill(255, 255, 255);
  
  // Level
  const levelConfig = LEVELS[gameState.currentLevel - 1];
  p.text(`LEVEL: ${gameState.currentLevel}`, 10, 10);
  p.textSize(12);
  p.fill(200, 200, 200);
  p.text(levelConfig.name, 10, 30);
  
  // Score
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.fill(255, 255, 255);
  p.text(`SCORE: ${String(gameState.score).padStart(5, '0')}`, CANVAS_WIDTH - 10, 10);
  
  // Turn indicator
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(14);
  if (gameState.gameStatus === GAME_STATES.PLAYING) {
    const turnColor = gameState.currentTurn === "PLAYER" ? [255, 100, 100] : [100, 100, 255];
    p.fill(...turnColor);
    p.text(`${gameState.currentTurn}'S TURN`, CANVAS_WIDTH / 2, 10);
  }
  
  p.pop();
}

function renderBoard() {
  const cellSize = calculateCellSize();
  const gridStartX = (CANVAS_WIDTH - cellSize * gameState.boardSize) / 2;
  const gridStartY = (CANVAS_HEIGHT - cellSize * gameState.boardSize) / 2 + 30;
  
  p.push();
  p.stroke(255, 255, 255);
  p.strokeWeight(2);
  p.noFill();
  
  // Draw grid
  for (let i = 0; i <= gameState.boardSize; i++) {
    // Vertical lines
    p.line(
      gridStartX + i * cellSize,
      gridStartY,
      gridStartX + i * cellSize,
      gridStartY + cellSize * gameState.boardSize
    );
    
    // Horizontal lines
    p.line(
      gridStartX,
      gridStartY + i * cellSize,
      gridStartX + cellSize * gameState.boardSize,
      gridStartY + i * cellSize
    );
  }
  
  p.pop();
}

function renderMarks() {
  const cellSize = calculateCellSize();
  const gridStartX = (CANVAS_WIDTH - cellSize * gameState.boardSize) / 2;
  const gridStartY = (CANVAS_HEIGHT - cellSize * gameState.boardSize) / 2 + 30;
  const padding = cellSize * 0.2;
  
  p.push();
  
  for (let row = 0; row < gameState.boardSize; row++) {
    for (let col = 0; col < gameState.boardSize; col++) {
      const mark = gameState.board[row][col];
      const x = gridStartX + col * cellSize;
      const y = gridStartY + row * cellSize;
      
      if (mark === CELL_STATE.PLAYER) {
        // Draw X
        p.stroke(255, 80, 80);
        p.strokeWeight(5);
        p.line(x + padding, y + padding, x + cellSize - padding, y + cellSize - padding);
        p.line(x + cellSize - padding, y + padding, x + padding, y + cellSize - padding);
      } else if (mark === CELL_STATE.AI) {
        // Draw O
        p.stroke(80, 80, 255);
        p.strokeWeight(5);
        p.noFill();
        p.ellipse(x + cellSize / 2, y + cellSize / 2, cellSize - padding * 2);
      }
    }
  }
  
  p.pop();
}

function renderSelectionHighlight() {
  const cellSize = calculateCellSize();
  const gridStartX = (CANVAS_WIDTH - cellSize * gameState.boardSize) / 2;
  const gridStartY = (CANVAS_HEIGHT - cellSize * gameState.boardSize) / 2 + 30;
  
  const [row, col] = gameState.selectedCell;
  const x = gridStartX + col * cellSize;
  const y = gridStartY + row * cellSize;
  
  p.push();
  p.noFill();
  p.stroke(255, 255, 100);
  p.strokeWeight(4);
  p.rect(x + 2, y + 2, cellSize - 4, cellSize - 4);
  
  // Glow effect
  const alpha = Math.sin(p.frameCount * 0.1) * 50 + 100;
  p.fill(255, 255, 100, alpha);
  p.noStroke();
  p.rect(x, y, cellSize, cellSize);
  
  p.pop();
}

function renderWinningLine() {
  const cellSize = calculateCellSize();
  const gridStartX = (CANVAS_WIDTH - cellSize * gameState.boardSize) / 2;
  const gridStartY = (CANVAS_HEIGHT - cellSize * gameState.boardSize) / 2 + 30;
  
  const line = gameState.winningLine;
  
  p.push();
  p.stroke(0, 255, 0);
  p.strokeWeight(8);
  
  if (line.type === 'horizontal') {
    const y = gridStartY + line.row * cellSize + cellSize / 2;
    const x1 = gridStartX + line.startCol * cellSize + cellSize / 2;
    const x2 = gridStartX + line.endCol * cellSize + cellSize / 2;
    p.line(x1, y, x2, y);
  } else if (line.type === 'vertical') {
    const x = gridStartX + line.col * cellSize + cellSize / 2;
    const y1 = gridStartY + line.startRow * cellSize + cellSize / 2;
    const y2 = gridStartY + line.endRow * cellSize + cellSize / 2;
    p.line(x, y1, x, y2);
  } else if (line.type === 'diagonal-down') {
    const x1 = gridStartX + line.startCol * cellSize + cellSize / 2;
    const y1 = gridStartY + line.startRow * cellSize + cellSize / 2;
    const x2 = gridStartX + line.endCol * cellSize + cellSize / 2;
    const y2 = gridStartY + line.endRow * cellSize + cellSize / 2;
    p.line(x1, y1, x2, y2);
  } else if (line.type === 'diagonal-up') {
    const x1 = gridStartX + line.startCol * cellSize + cellSize / 2;
    const y1 = gridStartY + line.startRow * cellSize + cellSize / 2;
    const x2 = gridStartX + line.endCol * cellSize + cellSize / 2;
    const y2 = gridStartY + line.endRow * cellSize + cellSize / 2;
    p.line(x1, y1, x2, y2);
  }
  
  p.pop();
}

function renderLevelCompleteOverlay() {
  p.push();
  
  // Semi-transparent overlay
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Level complete message
  p.fill(100, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text(`LEVEL ${gameState.currentLevel} COMPLETE!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  
  // Score
  p.fill(255, 255, 255);
  p.textSize(20);
  p.text(`SCORE: ${String(gameState.score).padStart(5, '0')}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  // Next level prompt
  const alpha = Math.sin(p.frameCount * 0.1) * 127 + 128;
  p.fill(255, 255, 255, alpha);
  p.textSize(18);
  if (gameState.currentLevel < 5) {
    p.text("PRESS SPACE FOR NEXT LEVEL", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
  }
  
  p.pop();
}

function renderPauseOverlay() {
  p.push();
  p.fill(255, 255, 255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, 40);
  p.pop();
}

function renderGameOverScreen() {
  p.push();
  
  // Semi-transparent overlay
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Game over message
  p.textAlign(p.CENTER, p.CENTER);
  
  if (gameState.winner === "COMPLETE") {
    p.fill(255, 215, 0);
    p.textSize(42);
    p.text("GAME COMPLETE!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
    p.fill(100, 255, 100);
    p.textSize(24);
    p.text("You defeated all levels!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  } else if (gameState.winner === CELL_STATE.PLAYER) {
    p.fill(100, 255, 100);
    p.textSize(42);
    p.text("YOU WIN!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
  } else if (gameState.winner === CELL_STATE.AI) {
    p.fill(255, 100, 100);
    p.textSize(42);
    p.text("YOU LOSE!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
    p.fill(200, 200, 200);
    p.textSize(18);
    p.text("AI wins this round", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  } else if (gameState.winner === "DRAW") {
    p.fill(200, 200, 100);
    p.textSize(42);
    p.text("DRAW!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
    p.fill(200, 200, 200);
    p.textSize(18);
    p.text("Board filled with no winner", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  }
  
  // Final score
  p.fill(255, 255, 255);
  p.textSize(24);
  p.text(`FINAL SCORE: ${String(gameState.score).padStart(5, '0')}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  
  // High score
  p.fill(255, 215, 0);
  p.textSize(20);
  p.text(`HIGH SCORE: ${String(gameState.highScore).padStart(5, '0')}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
  
  // Restart prompt
  const alpha = Math.sin(p.frameCount * 0.1) * 127 + 128;
  p.fill(255, 255, 255, alpha);
  p.textSize(18);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
  
  p.pop();
}

function calculateCellSize() {
  const maxSize = Math.min(CANVAS_WIDTH - 100, CANVAS_HEIGHT - 150);
  return Math.floor(maxSize / gameState.boardSize);
}