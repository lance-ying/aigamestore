// crossword.js - Crossword game logic

import { gameState, LEVELS, CROSSWORD_PUZZLES } from './globals.js';

export function initCrossword(p, level) {
  const levelData = LEVELS[level - 1];
  const puzzleData = CROSSWORD_PUZZLES[level - 1];
  
  gameState.crossword.gridSize = puzzleData.size;
  gameState.crossword.timeRemaining = levelData.crossword.timeLimit;
  gameState.crossword.startTime = Date.now();
  gameState.crossword.activeRow = 0;
  gameState.crossword.activeCol = 0;
  gameState.crossword.activeDirection = "across";
  
  // Initialize grid
  gameState.crossword.grid = [];
  gameState.crossword.solution = [];
  gameState.crossword.blocked = [];
  
  for (let r = 0; r < puzzleData.size; r++) {
    gameState.crossword.grid[r] = [];
    gameState.crossword.solution[r] = [];
    gameState.crossword.blocked[r] = [];
    for (let c = 0; c < puzzleData.size; c++) {
      gameState.crossword.grid[r][c] = "";
      gameState.crossword.solution[r][c] = puzzleData.solution[r][c];
      gameState.crossword.blocked[r][c] = false;
    }
  }
  
  // Set blocked cells
  for (const [r, c] of puzzleData.blocked) {
    gameState.crossword.blocked[r][c] = true;
  }
  
  gameState.crossword.clues = puzzleData.clues;
  
  // Find first non-blocked cell
  for (let r = 0; r < puzzleData.size; r++) {
    for (let c = 0; c < puzzleData.size; c++) {
      if (!gameState.crossword.blocked[r][c]) {
        gameState.crossword.activeRow = r;
        gameState.crossword.activeCol = c;
        return;
      }
    }
  }
}

export function updateCrossword(p) {
  // Update timer
  const elapsed = (Date.now() - gameState.crossword.startTime) / 1000;
  gameState.crossword.timeRemaining = Math.max(0, LEVELS[gameState.currentLevel - 1].crossword.timeLimit - elapsed);
  
  // Check for timeout
  if (gameState.crossword.timeRemaining === 0) {
    return "timeout";
  }
  
  return null;
}

export function handleCrosswordInput(p, key, keyCode) {
  const size = gameState.crossword.gridSize;
  let r = gameState.crossword.activeRow;
  let c = gameState.crossword.activeCol;
  
  // Letter input
  if (keyCode >= 65 && keyCode <= 90) {
    if (!gameState.crossword.blocked[r][c]) {
      gameState.crossword.grid[r][c] = key.toUpperCase();
      // Move to next cell
      moveToNextCell(p);
    }
  }
  
  // Backspace or Shift - delete and move back
  if (keyCode === 8 || keyCode === 16) {
    if (!gameState.crossword.blocked[r][c]) {
      gameState.crossword.grid[r][c] = "";
    }
    moveToPrevCell(p);
  }
  
  // Arrow keys
  if (keyCode === 38) { // Up
    do {
      r = (r - 1 + size) % size;
    } while (gameState.crossword.blocked[r][c]);
    gameState.crossword.activeRow = r;
  }
  if (keyCode === 40) { // Down
    do {
      r = (r + 1) % size;
    } while (gameState.crossword.blocked[r][c]);
    gameState.crossword.activeRow = r;
  }
  if (keyCode === 37) { // Left
    do {
      c = (c - 1 + size) % size;
    } while (gameState.crossword.blocked[r][c]);
    gameState.crossword.activeCol = c;
  }
  if (keyCode === 39) { // Right
    do {
      c = (c + 1) % size;
    } while (gameState.crossword.blocked[r][c]);
    gameState.crossword.activeCol = c;
  }
  
  // Space - toggle direction
  if (keyCode === 32) {
    gameState.crossword.activeDirection = gameState.crossword.activeDirection === "across" ? "down" : "across";
  }
  
  // Enter - submit
  if (keyCode === 13) {
    return checkCrosswordSolution();
  }
  
  return null;
}

function moveToNextCell(p) {
  const size = gameState.crossword.gridSize;
  let r = gameState.crossword.activeRow;
  let c = gameState.crossword.activeCol;
  
  if (gameState.crossword.activeDirection === "across") {
    c++;
    if (c >= size || gameState.crossword.blocked[r][c]) {
      // Find next row with non-blocked cell
      for (let nr = r + 1; nr < size; nr++) {
        for (let nc = 0; nc < size; nc++) {
          if (!gameState.crossword.blocked[nr][nc]) {
            gameState.crossword.activeRow = nr;
            gameState.crossword.activeCol = nc;
            return;
          }
        }
      }
    } else {
      gameState.crossword.activeCol = c;
    }
  } else {
    r++;
    if (r >= size || gameState.crossword.blocked[r][c]) {
      // Find next column with non-blocked cell
      for (let nc = c + 1; nc < size; nc++) {
        for (let nr = 0; nr < size; nr++) {
          if (!gameState.crossword.blocked[nr][nc]) {
            gameState.crossword.activeRow = nr;
            gameState.crossword.activeCol = nc;
            return;
          }
        }
      }
    } else {
      gameState.crossword.activeRow = r;
    }
  }
}

function moveToPrevCell(p) {
  const size = gameState.crossword.gridSize;
  let r = gameState.crossword.activeRow;
  let c = gameState.crossword.activeCol;
  
  if (gameState.crossword.activeDirection === "across") {
    c--;
    if (c < 0 || gameState.crossword.blocked[r][c]) {
      // Find prev row with non-blocked cell
      for (let nr = r - 1; nr >= 0; nr--) {
        for (let nc = size - 1; nc >= 0; nc--) {
          if (!gameState.crossword.blocked[nr][nc]) {
            gameState.crossword.activeRow = nr;
            gameState.crossword.activeCol = nc;
            return;
          }
        }
      }
    } else {
      gameState.crossword.activeCol = c;
    }
  } else {
    r--;
    if (r < 0 || gameState.crossword.blocked[r][c]) {
      // Find prev column with non-blocked cell
      for (let nc = c - 1; nc >= 0; nc--) {
        for (let nr = size - 1; nr >= 0; nr--) {
          if (!gameState.crossword.blocked[nr][nc]) {
            gameState.crossword.activeRow = nr;
            gameState.crossword.activeCol = nc;
            return;
          }
        }
      }
    } else {
      gameState.crossword.activeRow = r;
    }
  }
}

export function checkCrosswordSolution() {
  const size = gameState.crossword.gridSize;
  let correct = true;
  
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!gameState.crossword.blocked[r][c]) {
        if (gameState.crossword.grid[r][c] !== gameState.crossword.solution[r][c]) {
          correct = false;
          break;
        }
      }
    }
    if (!correct) break;
  }
  
  if (correct) {
    const points = 500;
    const timeBonus = Math.floor(gameState.crossword.timeRemaining * 2);
    gameState.score += points + timeBonus;
    return "win";
  } else {
    return "incorrect";
  }
}

export function drawCrossword(p) {
  const size = gameState.crossword.gridSize;
  const cellSize = 60;
  const startX = (600 - size * cellSize) / 2;
  const startY = 80;
  
  // Draw grid
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const x = startX + c * cellSize;
      const y = startY + r * cellSize;
      
      if (gameState.crossword.blocked[r][c]) {
        p.fill(0);
        p.noStroke();
        p.rect(x, y, cellSize, cellSize);
      } else {
        p.fill(255);
        p.stroke(0);
        p.strokeWeight(1);
        
        // Highlight active cell
        if (r === gameState.crossword.activeRow && c === gameState.crossword.activeCol) {
          p.stroke(100, 150, 255);
          p.strokeWeight(3);
        }
        
        p.rect(x, y, cellSize, cellSize);
        
        // Draw letter
        if (gameState.crossword.grid[r][c]) {
          p.fill(0);
          p.noStroke();
          p.textAlign(p.CENTER, p.CENTER);
          p.textSize(24);
          p.text(gameState.crossword.grid[r][c], x + cellSize / 2, y + cellSize / 2);
        }
      }
    }
  }
  
  // Draw clue numbers
  p.fill(0);
  p.textSize(10);
  p.textAlign(p.LEFT, p.TOP);
  for (const clue of gameState.crossword.clues.across) {
    const x = startX + clue.col * cellSize + 2;
    const y = startY + clue.row * cellSize + 2;
    p.text(clue.number, x, y);
  }
  for (const clue of gameState.crossword.clues.down) {
    const x = startX + clue.col * cellSize + 2;
    const y = startY + clue.row * cellSize + 2;
    p.text(clue.number, x, y);
  }
  
  // Draw clues
  p.fill(255);
  p.textSize(11);
  p.textAlign(p.LEFT, p.TOP);
  let yOffset = startY + size * cellSize + 20;
  
  p.text("ACROSS:", 20, yOffset);
  yOffset += 15;
  for (const clue of gameState.crossword.clues.across) {
    p.text(`${clue.number}. ${clue.clue}`, 20, yOffset);
    yOffset += 12;
  }
  
  yOffset = startY + size * cellSize + 20;
  p.text("DOWN:", 320, yOffset);
  yOffset += 15;
  for (const clue of gameState.crossword.clues.down) {
    p.text(`${clue.number}. ${clue.clue}`, 320, yOffset);
    yOffset += 12;
  }
  
  // Draw timer
  const minutes = Math.floor(gameState.crossword.timeRemaining / 60);
  const seconds = Math.floor(gameState.crossword.timeRemaining % 60);
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text(`TIME: ${minutes}:${seconds.toString().padStart(2, '0')}`, 10, 10);
  
  // Draw score
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`SCORE: ${gameState.score}`, 590, 10);
  
  // Draw level
  p.textAlign(p.LEFT, p.BOTTOM);
  p.text(`LEVEL: ${gameState.currentLevel}`, 10, 390);
  
  // Draw instructions
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(11);
  p.text("Arrows: move | Space: toggle direction | Enter: submit", 300, 40);
}