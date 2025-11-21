// rendering.js - All rendering functions
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE, CELL_SIZE, GRID_START_X, GRID_START_Y } from './globals.js';
import { canPlaceBlock } from './grid.js';

export function renderStartScreen(p) {
  p.background(30, 30, 40);
  
  // Title
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("GridBlock Strategist", CANVAS_WIDTH / 2, 80);
  
  // Instructions
  p.fill(200, 200, 220);
  p.textSize(14);
  p.text("Place blocks on the 9×9 grid to complete rows, columns, or 3×3 squares.", CANVAS_WIDTH / 2, 150);
  p.text("Clear lines to score points and progress through 5 levels.", CANVAS_WIDTH / 2, 170);
  
  // Controls
  p.textSize(12);
  p.fill(180, 180, 200);
  p.text("Arrow Keys: Select block & Move cursor", CANVAS_WIDTH / 2, 210);
  p.text("WASD: Move cursor", CANVAS_WIDTH / 2, 230);
  p.text("Space: Place block", CANVAS_WIDTH / 2, 250);
  p.text("ESC: Pause | R: Restart", CANVAS_WIDTH / 2, 270);
  
  // High Score
  if (gameState.highScore > 0) {
    p.fill(255, 180, 100);
    p.textSize(16);
    p.text(`High Score: ${gameState.highScore}`, CANVAS_WIDTH / 2, 310);
  }
  
  // Start prompt
  p.fill(100, 255, 150);
  p.textSize(20);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
}

export function renderPlayingScreen(p) {
  p.background(30, 30, 40);
  
  // Score and Level
  p.fill(255, 220, 100);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text(`SCORE: ${gameState.score}`, 10, 10);
  
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`HIGH: ${gameState.highScore}`, CANVAS_WIDTH - 10, 10);
  
  p.textAlign(p.LEFT, p.BOTTOM);
  p.text(`LEVEL: ${gameState.level}`, 10, CANVAS_HEIGHT - 10);
  
  // Level target
  const target = gameState.levelTargets[gameState.level - 1];
  p.textAlign(p.RIGHT, p.BOTTOM);
  p.textSize(14);
  p.text(`Target: ${target}`, CANVAS_WIDTH - 10, CANVAS_HEIGHT - 10);
  
  // Render grid
  renderGrid(p);
  
  // Render preview ghost
  renderGhost(p);
  
  // Render available blocks
  renderAvailableBlocks(p);
  
  // Render paused indicator if paused
  if (gameState.gamePhase === "PAUSED") {
    p.fill(255, 255, 255, 200);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(14);
    p.text("PAUSED", CANVAS_WIDTH - 10, 35);
  }
}

export function renderGrid(p) {
  const grid = gameState.grid;
  
  // Draw 3x3 subgrid backgrounds
  for (let subY = 0; subY < 3; subY++) {
    for (let subX = 0; subX < 3; subX++) {
      const x = GRID_START_X + subX * 3 * CELL_SIZE;
      const y = GRID_START_Y + subY * 3 * CELL_SIZE;
      p.fill((subX + subY) % 2 === 0 ? 45 : 50);
      p.noStroke();
      p.rect(x, y, 3 * CELL_SIZE, 3 * CELL_SIZE);
    }
  }
  
  // Draw grid cells
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const cell = grid[y][x];
      const px = GRID_START_X + x * CELL_SIZE;
      const py = GRID_START_Y + y * CELL_SIZE;
      
      if (cell.filled) {
        p.fill(...cell.color);
        p.stroke(20, 20, 30);
        p.strokeWeight(1);
        p.rect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2);
      }
      
      // Grid lines
      p.stroke(80, 80, 90);
      p.strokeWeight(x % 3 === 0 ? 2 : 1);
      p.line(px, py, px, py + CELL_SIZE);
      
      p.strokeWeight(y % 3 === 0 ? 2 : 1);
      p.line(px, py, px + CELL_SIZE, py);
    }
  }
  
  // Right and bottom borders
  p.stroke(80, 80, 90);
  p.strokeWeight(2);
  p.line(GRID_START_X + GRID_SIZE * CELL_SIZE, GRID_START_Y, 
         GRID_START_X + GRID_SIZE * CELL_SIZE, GRID_START_Y + GRID_SIZE * CELL_SIZE);
  p.line(GRID_START_X, GRID_START_Y + GRID_SIZE * CELL_SIZE,
         GRID_START_X + GRID_SIZE * CELL_SIZE, GRID_START_Y + GRID_SIZE * CELL_SIZE);
}

export function renderGhost(p) {
  const selectedBlock = gameState.availableBlocks[gameState.selectedBlockIndex];
  if (!selectedBlock) return;
  
  const canPlace = canPlaceBlock(gameState.grid, selectedBlock, gameState.cursorX, gameState.cursorY);
  
  for (const [dx, dy] of selectedBlock.shape) {
    const x = gameState.cursorX + dx;
    const y = gameState.cursorY + dy;
    
    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
      const px = GRID_START_X + x * CELL_SIZE;
      const py = GRID_START_Y + y * CELL_SIZE;
      
      if (canPlace) {
        p.fill(100, 255, 150, 100);
        p.stroke(100, 255, 150, 200);
      } else {
        p.fill(255, 100, 100, 100);
        p.stroke(255, 100, 100, 200);
      }
      
      p.strokeWeight(2);
      p.rect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4);
    }
  }
}

export function renderAvailableBlocks(p) {
  const startY = CANVAS_HEIGHT - 80;
  const spacing = (CANVAS_WIDTH - 100) / 3;
  
  for (let i = 0; i < 3; i++) {
    const block = gameState.availableBlocks[i];
    if (!block) continue;
    
    const centerX = 50 + spacing * i + spacing / 2;
    const centerY = startY + 30;
    
    // Highlight selected block
    if (i === gameState.selectedBlockIndex) {
      p.fill(255, 220, 100, 100);
      p.noStroke();
      p.rect(centerX - 35, centerY - 35, 70, 70, 5);
    }
    
    // Draw block preview
    const blockWidth = block.getWidth();
    const blockHeight = block.getHeight();
    const cellSize = 10;
    const offsetX = -(blockWidth * cellSize) / 2;
    const offsetY = -(blockHeight * cellSize) / 2;
    
    for (const [dx, dy] of block.shape) {
      const px = centerX + offsetX + dx * cellSize;
      const py = centerY + offsetY + dy * cellSize;
      
      p.fill(...block.color);
      p.stroke(20, 20, 30);
      p.strokeWeight(1);
      p.rect(px, py, cellSize - 1, cellSize - 1);
    }
  }
}

export function renderGameOverScreen(p) {
  p.background(30, 30, 40);
  
  p.fill(255, 100, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("GAME OVER", CANVAS_WIDTH / 2, 120);
  
  p.fill(200, 200, 220);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);
  p.text(`Level Reached: ${gameState.level}`, CANVAS_WIDTH / 2, 210);
  
  if (gameState.score === gameState.highScore && gameState.score > 0) {
    p.fill(255, 220, 100);
    p.textSize(20);
    p.text("NEW HIGH SCORE!", CANVAS_WIDTH / 2, 250);
  }
  
  p.fill(100, 255, 150);
  p.textSize(20);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 320);
}

export function renderWinScreen(p) {
  p.background(30, 30, 40);
  
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(42);
  p.text("CONGRATULATIONS!", CANVAS_WIDTH / 2, 100);
  
  p.fill(100, 255, 150);
  p.textSize(24);
  p.text("You've Mastered the Grid!", CANVAS_WIDTH / 2, 150);
  
  p.fill(200, 200, 220);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 200);
  
  if (gameState.score === gameState.highScore) {
    p.fill(255, 220, 100);
    p.textSize(20);
    p.text("NEW HIGH SCORE!", CANVAS_WIDTH / 2, 240);
  }
  
  p.fill(100, 255, 150);
  p.textSize(20);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 310);
}

export function renderLevelTransition(p) {
  p.background(30, 30, 40, 200);
  
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  
  if (gameState.transitionTimer < 60) {
    p.text(`LEVEL ${gameState.level - 1} COMPLETE!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
    p.fill(200, 200, 220);
    p.textSize(20);
    p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
  } else {
    p.text(`LEVEL ${gameState.level}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    p.fill(200, 200, 220);
    p.textSize(18);
    p.text(`Target: ${gameState.levelTargets[gameState.level - 1]}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  }
}