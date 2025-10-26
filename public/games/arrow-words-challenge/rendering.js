// rendering.js - All rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { LEVELS } from './levels.js';

export function renderStartScreen(p) {
  p.background(240, 245, 250);
  
  // Title
  p.fill(30, 60, 120);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(42);
  p.textStyle(p.BOLD);
  p.text('Arrow Words Challenge', CANVAS_WIDTH / 2, 80);
  
  // Description
  p.fill(60, 80, 100);
  p.textSize(14);
  p.textStyle(p.NORMAL);
  const desc1 = 'Fill in the crossword grid using arrow clues.';
  const desc2 = 'Each clue has an arrow showing the word direction.';
  const desc3 = 'Complete all words to advance to the next level!';
  p.text(desc1, CANVAS_WIDTH / 2, 140);
  p.text(desc2, CANVAS_WIDTH / 2, 160);
  p.text(desc3, CANVAS_WIDTH / 2, 180);
  
  // Instructions
  p.fill(40, 50, 70);
  p.textSize(13);
  p.textAlign(p.LEFT, p.CENTER);
  const instructionsX = 100;
  let instructionsY = 220;
  const lineHeight = 20;
  
  p.text('• Arrow Keys: Navigate cells', instructionsX, instructionsY);
  instructionsY += lineHeight;
  p.text('• A-Z: Type letters', instructionsX, instructionsY);
  instructionsY += lineHeight;
  p.text('• BACKSPACE: Delete letter', instructionsX, instructionsY);
  instructionsY += lineHeight;
  p.text('• SPACE: Next empty cell', instructionsX, instructionsY);
  instructionsY += lineHeight;
  p.text('• TAB: Use hint (costs points)', instructionsX, instructionsY);
  instructionsY += lineHeight;
  p.text('• ESC: Pause game', instructionsX, instructionsY);
  
  // Start prompt
  p.fill(20, 100, 200);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  p.textStyle(p.BOLD);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}

export function renderPlayingScreen(p) {
  p.background(250, 250, 250);
  
  // Render game info at top
  renderGameInfo(p);
  
  // Render grid
  renderGrid(p);
  
  // Render hint button
  renderHintButton(p);
}

export function renderGameInfo(p) {
  // Level indicator
  p.fill(40, 50, 70);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(16);
  p.textStyle(p.BOLD);
  p.text(`Level ${gameState.currentLevelIndex + 1}`, CANVAS_WIDTH / 2, 10);
  
  // Time
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.textStyle(p.NORMAL);
  const minutes = Math.floor(gameState.elapsedTime / 60);
  const seconds = Math.floor(gameState.elapsedTime % 60);
  p.text(`Time: ${minutes}:${seconds.toString().padStart(2, '0')}`, 10, 10);
  
  // Score
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
}

export function renderGrid(p) {
  if (!gameState.currentLevel) return;
  
  const level = gameState.currentLevel;
  const grid = level.cells;
  const gridSize = level.gridSize;
  
  // Calculate cell size and grid position
  const maxGridWidth = CANVAS_WIDTH - 40;
  const maxGridHeight = CANVAS_HEIGHT - 100;
  const cellSize = Math.min(
    Math.floor(maxGridWidth / gridSize.cols),
    Math.floor(maxGridHeight / gridSize.rows),
    50
  );
  
  const gridWidth = cellSize * gridSize.cols;
  const gridHeight = cellSize * gridSize.rows;
  const gridX = (CANVAS_WIDTH - gridWidth) / 2;
  const gridY = 50;
  
  // Store grid layout for click detection
  gameState.gridLayout = {
    x: gridX,
    y: gridY,
    cellSize: cellSize,
    rows: gridSize.rows,
    cols: gridSize.cols
  };
  
  // First pass: draw highlighted path background
  if (gameState.highlightedPath && gameState.highlightedPath.length > 0) {
    p.fill(255, 252, 220);
    p.noStroke();
    for (const cell of gameState.highlightedPath) {
      const x = gridX + cell.col * cellSize;
      const y = gridY + cell.row * cellSize;
      p.rect(x, y, cellSize, cellSize);
    }
  }
  
  // Draw cells
  for (let row = 0; row < gridSize.rows; row++) {
    for (let col = 0; col < gridSize.cols; col++) {
      const cell = grid[row][col];
      const x = gridX + col * cellSize;
      const y = gridY + row * cellSize;
      
      // Draw cell background and border
      if (cell.type === 'blocked') {
        p.fill(60, 60, 70);
        p.stroke(40, 40, 50);
      } else if (cell.type === 'clue') {
        p.fill(200, 200, 210);
        p.stroke(100, 100, 110);
      } else {
        // Empty or filled cell
        p.fill(255, 255, 255);
        p.stroke(180, 180, 190);
      }
      
      // Highlight selected cell
      if (gameState.selectedCell.row === row && gameState.selectedCell.col === col) {
        p.stroke(50, 100, 255);
        p.strokeWeight(3);
      } else {
        p.strokeWeight(1);
      }
      
      p.rect(x, y, cellSize, cellSize);
      
      // Draw cell content
      if (cell.type === 'clue') {
        // Draw clue text and arrow
        p.fill(40, 40, 50);
        p.noStroke();
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(Math.min(9, cellSize / 5));
        p.textStyle(p.NORMAL);
        
        // Word wrap clue text
        const words = cell.text.split(' ');
        let line = '';
        let lineY = y + 2;
        const maxWidth = cellSize - 4;
        
        for (const word of words) {
          const testLine = line + word + ' ';
          p.textSize(Math.min(9, cellSize / 5));
          const testWidth = p.textWidth(testLine);
          if (testWidth > maxWidth && line.length > 0) {
            p.text(line, x + 2, lineY);
            line = word + ' ';
            lineY += 10;
          } else {
            line = testLine;
          }
        }
        p.text(line, x + 2, lineY);
        
        // Draw arrow
        drawArrow(p, x, y, cellSize, cell.dir);
      } else if (cell.type === 'empty') {
        // Draw player's input
        const playerLetter = gameState.grid[row][col];
        if (playerLetter) {
          p.fill(30, 30, 40);
          p.textAlign(p.CENTER, p.CENTER);
          p.textSize(Math.min(24, cellSize * 0.6));
          p.textStyle(p.BOLD);
          p.text(playerLetter, x + cellSize / 2, y + cellSize / 2);
        }
      }
    }
  }
}

function drawArrow(p, x, y, cellSize, direction) {
  p.fill(40, 40, 50);
  p.noStroke();
  
  const arrowSize = Math.min(8, cellSize / 5);
  const arrowX = x + cellSize - arrowSize - 2;
  const arrowY = y + cellSize - arrowSize - 2;
  
  if (direction === 'right') {
    // Right arrow
    p.triangle(
      arrowX, arrowY + arrowSize / 2,
      arrowX + arrowSize, arrowY + arrowSize / 2,
      arrowX + arrowSize * 0.7, arrowY
    );
    p.triangle(
      arrowX, arrowY + arrowSize / 2,
      arrowX + arrowSize, arrowY + arrowSize / 2,
      arrowX + arrowSize * 0.7, arrowY + arrowSize
    );
  } else if (direction === 'down') {
    // Down arrow
    p.triangle(
      arrowX + arrowSize / 2, arrowY,
      arrowX + arrowSize / 2, arrowY + arrowSize,
      arrowX, arrowY + arrowSize * 0.7
    );
    p.triangle(
      arrowX + arrowSize / 2, arrowY,
      arrowX + arrowSize / 2, arrowY + arrowSize,
      arrowX + arrowSize, arrowY + arrowSize * 0.7
    );
  }
}

export function renderHintButton(p) {
  const level = LEVELS[gameState.currentLevelIndex];
  const buttonX = CANVAS_WIDTH - 120;
  const buttonY = CANVAS_HEIGHT - 35;
  const buttonW = 110;
  const buttonH = 25;
  
  // Button background
  p.fill(100, 150, 200);
  p.stroke(70, 120, 170);
  p.strokeWeight(2);
  p.rect(buttonX, buttonY, buttonW, buttonH, 5);
  
  // Button text
  p.fill(255);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(12);
  p.textStyle(p.BOLD);
  p.text(`TAB: Hint (-${level.hintCost})`, buttonX + buttonW / 2, buttonY + buttonH / 2);
  
  // Store button bounds for click detection
  gameState.hintButtonBounds = { x: buttonX, y: buttonY, w: buttonW, h: buttonH };
}

export function renderPausedScreen(p) {
  // Draw the game in background
  renderPlayingScreen(p);
  
  // Semi-transparent overlay
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Paused text
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
  
  // Instructions
  p.textSize(18);
  p.textStyle(p.NORMAL);
  p.text('Press ESC to resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  p.text('Press R to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
  
  // Small paused indicator in top right
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.fill(255, 200, 100);
  p.text('PAUSED', CANVAS_WIDTH - 10, 30);
}

export function renderGameOverScreen(p, won) {
  p.background(240, 245, 250);
  
  // Title
  if (won) {
    p.fill(50, 150, 50);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.textStyle(p.BOLD);
    
    if (gameState.currentLevelIndex >= LEVELS.length - 1) {
      p.text('GAME COMPLETE!', CANVAS_WIDTH / 2, 100);
    } else {
      p.text(`Level ${gameState.currentLevelIndex + 1} Complete!`, CANVAS_WIDTH / 2, 100);
    }
  } else {
    p.fill(180, 50, 50);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.textStyle(p.BOLD);
    p.text('GAME OVER', CANVAS_WIDTH / 2, 100);
  }
  
  // Score
  p.fill(40, 50, 70);
  p.textSize(24);
  p.textStyle(p.NORMAL);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);
  
  // Time
  const minutes = Math.floor(gameState.elapsedTime / 60);
  const seconds = Math.floor(gameState.elapsedTime % 60);
  p.textSize(18);
  p.text(`Time: ${minutes}:${seconds.toString().padStart(2, '0')}`, CANVAS_WIDTH / 2, 220);
  
  // Stats
  if (won) {
    const level = LEVELS[gameState.currentLevelIndex];
    const timeBonus = Math.max(0, (level.maxTime - gameState.elapsedTime) * 2);
    p.textSize(14);
    p.text(`Time Bonus: +${Math.floor(timeBonus)} points`, CANVAS_WIDTH / 2, 250);
    p.text(`Hints Used: ${gameState.hintsUsed}`, CANVAS_WIDTH / 2, 270);
  }
  
  // Instructions
  p.fill(20, 100, 200);
  p.textSize(18);
  p.textStyle(p.BOLD);
  
  if (won && gameState.currentLevelIndex < LEVELS.length - 1) {
    p.text('Press ENTER for next level', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 60);
  }
  p.text('Press R to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
}