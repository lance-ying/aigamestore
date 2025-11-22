import { gameState, LEVELS, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
  const theme = LEVELS[0].theme;
  p.background(...theme.bg);
  
  p.fill(60, 60, 80);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("Word Search Explorer", CANVAS_WIDTH / 2, 80);
  
  p.textSize(16);
  p.fill(40, 40, 60);
  p.text("Find all hidden words in the letter grid!", CANVAS_WIDTH / 2, 140);
  p.text("Words can be horizontal, vertical, diagonal, or backwards", CANVAS_WIDTH / 2, 165);
  
  p.textSize(14);
  p.text("CONTROLS:", CANVAS_WIDTH / 2, 210);
  p.textSize(12);
  p.text("Arrow Keys: Navigate grid", CANVAS_WIDTH / 2, 235);
  p.text("Space: Use hint", CANVAS_WIDTH / 2, 255);
  p.text("ESC: Pause game", CANVAS_WIDTH / 2, 275);
  
  p.textSize(20);
  p.fill(100, 100, 255);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 330);
}

export function renderPauseOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  p.text("Game Paused", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  p.textSize(14);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
  p.text("Press R to restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 35);
}

export function renderGameOverScreen(p) {
  const levelData = LEVELS[gameState.currentLevel - 1];
  const theme = levelData.theme;
  p.background(...theme.bg);
  
  p.fill(60, 60, 80);
  p.textAlign(p.CENTER, p.CENTER);
  
  if (gameState.gamePhase === "GAME_OVER_WIN") {
    p.textSize(40);
    p.text("Congratulations!", CANVAS_WIDTH / 2, 100);
    p.textSize(20);
    p.text("You've completed all puzzles!", CANVAS_WIDTH / 2, 150);
  } else {
    p.textSize(40);
    p.text("Game Over", CANVAS_WIDTH / 2, 100);
  }
  
  p.textSize(24);
  p.fill(100, 100, 255);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  
  p.textSize(18);
  p.fill(40, 40, 60);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 300);
}

export function renderGameplay(p) {
  const levelData = LEVELS[gameState.currentLevel - 1];
  const theme = levelData.theme;
  const gridSize = levelData.gridSize;
  
  // Background
  p.background(...theme.bg);
  
  // Calculate grid dimensions
  const maxGridWidth = 380;
  const maxGridHeight = 340;
  const cellSize = Math.min(maxGridWidth / gridSize, maxGridHeight / gridSize);
  const gridWidth = cellSize * gridSize;
  const gridHeight = cellSize * gridSize;
  const offsetX = 20;
  const offsetY = 50;
  
  // UI Elements
  renderUI(p, levelData, cellSize, gridSize, offsetX, offsetY);
  
  // Grid
  renderGrid(p, gridSize, cellSize, offsetX, offsetY);
  
  // Word list
  renderWordList(p, levelData, gridWidth, offsetX);
}

function renderUI(p, levelData, cellSize, gridSize, offsetX, offsetY) {
  // Level indicator
  p.fill(40, 40, 60);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text(`Level ${gameState.currentLevel}: ${levelData.name}`, 10, 10);
  
  // Score
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
  
  // Timer
  const elapsedTime = Math.floor((Date.now() - gameState.levelStartTime) / 1000);
  const minutes = Math.floor(elapsedTime / 60);
  const seconds = elapsedTime % 60;
  p.text(`Time: ${minutes}:${seconds.toString().padStart(2, '0')}`, CANVAS_WIDTH - 10, 28);
  
  // Hints
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Hints: ${gameState.availableHints}`, 10, 28);
}

function renderGrid(p, gridSize, cellSize, offsetX, offsetY) {
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const x = offsetX + c * cellSize;
      const y = offsetY + r * cellSize;
      
      // Check if cell is part of found word
      let isFound = false;
      for (const word of gameState.targetWords) {
        if (word.found) {
          for (const cell of word.path) {
            if (cell.row === r && cell.col === c) {
              isFound = true;
              break;
            }
          }
        }
        if (isFound) break;
      }
      
      // Check if cell is selected
      let isSelected = false;
      for (const cell of gameState.selectedCells) {
        if (cell.row === r && cell.col === c) {
          isSelected = true;
          break;
        }
      }
      
      // Check if cell is temp highlighted
      let isTempHighlight = false;
      for (const cell of gameState.tempHighlightCells) {
        if (cell.row === r && cell.col === c) {
          isTempHighlight = true;
          break;
        }
      }
      
      // Check if hovered
      const isHovered = gameState.hoveredCell && 
                       gameState.hoveredCell.row === r && 
                       gameState.hoveredCell.col === c;
      
      // Cell background
      if (isFound) {
        p.fill(100, 200, 100);
      } else if (isSelected) {
        p.fill(150, 200, 255);
      } else if (isTempHighlight) {
        p.fill(255, 255, 150);
      } else if (isHovered) {
        p.fill(220, 220, 220);
      } else {
        p.fill(240, 240, 240);
      }
      
      p.stroke(180, 180, 180);
      p.strokeWeight(1);
      p.rect(x, y, cellSize, cellSize);
      
      // Letter
      p.fill(40, 40, 60);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(cellSize * 0.5);
      p.text(gameState.gridLetters[r][c], x + cellSize / 2, y + cellSize / 2);
    }
  }
}

function renderWordList(p, levelData, gridWidth, offsetX) {
  const listX = offsetX + gridWidth + 20;
  const listY = 50;
  
  p.fill(40, 40, 60);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text("Words to Find:", listX, listY);
  
  let yOffset = listY + 20;
  for (const wordObj of gameState.targetWords) {
    if (wordObj.found) {
      p.fill(150, 150, 150);
      p.text(wordObj.word, listX, yOffset);
      p.stroke(150, 150, 150);
      p.line(listX, yOffset + 6, listX + 60, yOffset + 6);
      p.noStroke();
    } else {
      p.fill(40, 40, 60);
      p.text(wordObj.word, listX, yOffset);
    }
    yOffset += 18;
  }
}

export function renderLevelComplete(p) {
  const levelData = LEVELS[gameState.currentLevel - 1];
  const theme = levelData.theme;
  p.background(...theme.bg);
  
  p.fill(60, 60, 80);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text(`Level ${gameState.currentLevel} Complete!`, CANVAS_WIDTH / 2, 120);
  
  const elapsedTime = Math.floor((Date.now() - gameState.levelStartTime) / 1000);
  const timeBonus = Math.max(0, Math.floor(500 - (elapsedTime * 1.5)));
  
  p.textSize(18);
  p.fill(40, 40, 60);
  p.text(`Time: ${elapsedTime}s`, CANVAS_WIDTH / 2, 180);
  p.text(`Time Bonus: ${timeBonus}`, CANVAS_WIDTH / 2, 205);
  p.text(`Level Score: ${gameState.score}`, CANVAS_WIDTH / 2, 230);
  
  if (gameState.currentLevel < gameState.totalLevels) {
    p.textSize(20);
    p.fill(100, 100, 255);
    p.text("PRESS ENTER FOR NEXT LEVEL", CANVAS_WIDTH / 2, 300);
  } else {
    p.textSize(20);
    p.fill(100, 100, 255);
    p.text("PRESS ENTER TO CONTINUE", CANVAS_WIDTH / 2, 300);
  }
}

export function getGridDimensions(gridSize) {
  const maxGridWidth = 380;
  const maxGridHeight = 340;
  const cellSize = Math.min(maxGridWidth / gridSize, maxGridHeight / gridSize);
  const offsetX = 20;
  const offsetY = 50;
  
  return { cellSize, offsetX, offsetY };
}