// input.js - Input handling functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { LEVELS } from './levels.js';
import { getWordPathForCell } from './wordPaths.js';
import { checkWordComplete, checkLevelComplete } from './validation.js';

export function handleKeyPress(p, keyCode, key) {
  // Log input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key: key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  if (gameState.gamePhase === 'START') {
    if (keyCode === 13) { // ENTER
      startGame(p);
    }
  } else if (gameState.gamePhase === 'PLAYING') {
    if (keyCode === 27) { // ESC
      pauseGame(p);
    } else if (keyCode === 82) { // R
      restartGame(p);
    } else {
      handleGameplayInput(p, keyCode, key);
    }
  } else if (gameState.gamePhase === 'PAUSED') {
    if (keyCode === 27) { // ESC
      resumeGame(p);
    } else if (keyCode === 82) { // R
      restartGame(p);
    }
  } else if (gameState.gamePhase === 'GAME_OVER_WIN' || gameState.gamePhase === 'GAME_OVER_LOSE') {
    if (keyCode === 82) { // R
      restartGame(p);
    } else if (keyCode === 13 && gameState.gamePhase === 'GAME_OVER_WIN') { // ENTER
      nextLevel(p);
    }
  }
}

function startGame(p) {
  gameState.gamePhase = 'PLAYING';
  gameState.currentLevelIndex = 0;
  gameState.score = 0;
  loadLevel(p, 0);
  
  p.logs.game_info.push({
    data: { phase: 'PLAYING', level: 1 },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function pauseGame(p) {
  gameState.gamePhase = 'PAUSED';
  
  p.logs.game_info.push({
    data: { phase: 'PAUSED' },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function resumeGame(p) {
  gameState.gamePhase = 'PLAYING';
  
  p.logs.game_info.push({
    data: { phase: 'PLAYING' },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function restartGame(p) {
  gameState.gamePhase = 'START';
  gameState.score = 0;
  gameState.currentLevelIndex = 0;
  gameState.selectedCell = { row: -1, col: -1 };
  gameState.highlightedPath = [];
  gameState.completedWords = new Set();
  gameState.hintsUsed = 0;
  gameState.incorrectAttempts = 0;
  
  p.logs.game_info.push({
    data: { phase: 'START' },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function nextLevel(p) {
  if (gameState.currentLevelIndex < LEVELS.length - 1) {
    gameState.currentLevelIndex++;
    loadLevel(p, gameState.currentLevelIndex);
    gameState.gamePhase = 'PLAYING';
    
    p.logs.game_info.push({
      data: { phase: 'PLAYING', level: gameState.currentLevelIndex + 1 },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else {
    restartGame(p);
  }
}

function loadLevel(p, levelIndex) {
  const level = LEVELS[levelIndex];
  gameState.currentLevel = level;
  
  // Initialize empty grid for player input
  gameState.grid = [];
  for (let row = 0; row < level.gridSize.rows; row++) {
    gameState.grid[row] = [];
    for (let col = 0; col < level.gridSize.cols; col++) {
      gameState.grid[row][col] = '';
    }
  }
  
  // Reset level-specific state
  gameState.startTime = Date.now();
  gameState.elapsedTime = 0;
  gameState.hintsUsed = 0;
  gameState.incorrectAttempts = 0;
  gameState.completedWords = new Set();
  
  // Select first empty cell
  selectFirstEmptyCell(p);
}

function selectFirstEmptyCell(p) {
  const level = gameState.currentLevel;
  for (let row = 0; row < level.gridSize.rows; row++) {
    for (let col = 0; col < level.gridSize.cols; col++) {
      if (level.cells[row][col].type === 'empty') {
        selectCell(p, row, col);
        return;
      }
    }
  }
}

function handleGameplayInput(p, keyCode, key) {
  if (gameState.selectedCell.row === -1) return;
  
  const row = gameState.selectedCell.row;
  const col = gameState.selectedCell.col;
  
  // Arrow key navigation
  if (keyCode === 37) { // LEFT
    navigateCell(p, row, col - 1);
  } else if (keyCode === 38) { // UP
    navigateCell(p, row - 1, col);
  } else if (keyCode === 39) { // RIGHT
    navigateCell(p, row, col + 1);
  } else if (keyCode === 40) { // DOWN
    navigateCell(p, row + 1, col);
  }
  // Letter input (A-Z)
  else if (keyCode >= 65 && keyCode <= 90) {
    inputLetter(p, key.toUpperCase());
  }
  // Backspace
  else if (keyCode === 8) {
    deleteLetter(p);
  }
  // Space - jump to next empty cell in path
  else if (keyCode === 32) {
    jumpToNextEmpty(p);
  }
  // Tab - use hint
  else if (keyCode === 9) {
    useHint(p);
  }
}

function navigateCell(p, newRow, newCol) {
  const level = gameState.currentLevel;
  
  // Check bounds
  if (newRow < 0 || newRow >= level.gridSize.rows || 
      newCol < 0 || newCol >= level.gridSize.cols) {
    return;
  }
  
  // Check if cell is selectable (empty type)
  if (level.cells[newRow][newCol].type === 'empty') {
    selectCell(p, newRow, newCol);
  }
}

function selectCell(p, row, col) {
  gameState.selectedCell = { row, col };
  
  // Find and highlight word path
  const wordPath = getWordPathForCell(gameState.currentLevel.wordPaths, row, col);
  if (wordPath) {
    gameState.highlightedPath = wordPath.path.map(cell => ({ row: cell.row, col: cell.col }));
  } else {
    gameState.highlightedPath = [];
  }
}

function inputLetter(p, letter) {
  const row = gameState.selectedCell.row;
  const col = gameState.selectedCell.col;
  
  // Set letter in grid
  gameState.grid[row][col] = letter;
  
  // Check if correct
  const correctLetter = gameState.currentLevel.solution[row][col];
  if (letter === correctLetter) {
    // Award points for correct letter
    gameState.score += 10;
    
    // Check if word is complete
    checkWordCompletion(p, row, col);
  } else {
    gameState.incorrectAttempts++;
  }
  
  // Move to next cell in path
  moveToNextCellInPath(p);
}

function deleteLetter(p) {
  const row = gameState.selectedCell.row;
  const col = gameState.selectedCell.col;
  
  if (gameState.grid[row][col] !== '') {
    gameState.grid[row][col] = '';
  } else {
    // Move to previous cell in path
    moveToPreviousCellInPath(p);
  }
}

function moveToNextCellInPath(p) {
  if (gameState.highlightedPath.length === 0) return;
  
  const currentRow = gameState.selectedCell.row;
  const currentCol = gameState.selectedCell.col;
  
  // Find current position in path
  let currentIndex = -1;
  for (let i = 0; i < gameState.highlightedPath.length; i++) {
    if (gameState.highlightedPath[i].row === currentRow && 
        gameState.highlightedPath[i].col === currentCol) {
      currentIndex = i;
      break;
    }
  }
  
  // Move to next cell
  if (currentIndex >= 0 && currentIndex < gameState.highlightedPath.length - 1) {
    const nextCell = gameState.highlightedPath[currentIndex + 1];
    selectCell(p, nextCell.row, nextCell.col);
  }
}

function moveToPreviousCellInPath(p) {
  if (gameState.highlightedPath.length === 0) return;
  
  const currentRow = gameState.selectedCell.row;
  const currentCol = gameState.selectedCell.col;
  
  // Find current position in path
  let currentIndex = -1;
  for (let i = 0; i < gameState.highlightedPath.length; i++) {
    if (gameState.highlightedPath[i].row === currentRow && 
        gameState.highlightedPath[i].col === currentCol) {
      currentIndex = i;
      break;
    }
  }
  
  // Move to previous cell
  if (currentIndex > 0) {
    const prevCell = gameState.highlightedPath[currentIndex - 1];
    selectCell(p, prevCell.row, prevCell.col);
    gameState.grid[prevCell.row][prevCell.col] = '';
  }
}

function jumpToNextEmpty(p) {
  if (gameState.highlightedPath.length === 0) return;
  
  const currentRow = gameState.selectedCell.row;
  const currentCol = gameState.selectedCell.col;
  
  // Find current position in path
  let currentIndex = -1;
  for (let i = 0; i < gameState.highlightedPath.length; i++) {
    if (gameState.highlightedPath[i].row === currentRow && 
        gameState.highlightedPath[i].col === currentCol) {
      currentIndex = i;
      break;
    }
  }
  
  // Find next empty cell
  for (let i = currentIndex + 1; i < gameState.highlightedPath.length; i++) {
    const cell = gameState.highlightedPath[i];
    if (gameState.grid[cell.row][cell.col] === '') {
      selectCell(p, cell.row, cell.col);
      return;
    }
  }
  
  // Wrap around
  for (let i = 0; i <= currentIndex; i++) {
    const cell = gameState.highlightedPath[i];
    if (gameState.grid[cell.row][cell.col] === '') {
      selectCell(p, cell.row, cell.col);
      return;
    }
  }
}

function useHint(p) {
  if (gameState.selectedCell.row === -1) return;
  
  const row = gameState.selectedCell.row;
  const col = gameState.selectedCell.col;
  
  // Don't reveal if already correct
  if (gameState.grid[row][col] === gameState.currentLevel.solution[row][col]) {
    moveToNextCellInPath(p);
    return;
  }
  
  const level = LEVELS[gameState.currentLevelIndex];
  
  // Deduct points
  gameState.score = Math.max(0, gameState.score - level.hintCost);
  gameState.hintsUsed++;
  
  // Reveal letter
  const correctLetter = gameState.currentLevel.solution[row][col];
  gameState.grid[row][col] = correctLetter;
  
  // Check word completion
  checkWordCompletion(p, row, col);
  
  // Move to next cell
  moveToNextCellInPath(p);
}

function checkWordCompletion(p, row, col) {
  const wordPath = getWordPathForCell(gameState.currentLevel.wordPaths, row, col);
  if (!wordPath) return;
  
  // Check if all cells in word path are filled correctly
  let allCorrect = true;
  for (const cell of wordPath.path) {
    const playerLetter = gameState.grid[cell.row][cell.col];
    const correctLetter = cell.letter;
    if (playerLetter !== correctLetter) {
      allCorrect = false;
      break;
    }
  }
  
  if (allCorrect) {
    const wordKey = `${wordPath.clueRow},${wordPath.clueCol}`;
    if (!gameState.completedWords.has(wordKey)) {
      gameState.completedWords.add(wordKey);
      gameState.score += 100; // Word completion bonus
      
      // Check if level is complete
      if (checkLevelComplete(gameState.currentLevel, gameState.grid, gameState.completedWords)) {
        completeLevel(p);
      }
    }
  }
}

function completeLevel(p) {
  // Award level completion bonus
  gameState.score += 500;
  
  // Award time bonus
  const level = LEVELS[gameState.currentLevelIndex];
  const timeBonus = Math.max(0, (level.maxTime - gameState.elapsedTime) * 2);
  gameState.score += Math.floor(timeBonus);
  
  // Check for no errors bonus
  if (gameState.incorrectAttempts === 0) {
    gameState.score += 500;
  }
  
  gameState.gamePhase = 'GAME_OVER_WIN';
  
  p.logs.game_info.push({
    data: { phase: 'GAME_OVER_WIN', level: gameState.currentLevelIndex + 1, score: gameState.score },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function updateElapsedTime() {
  if (gameState.gamePhase === 'PLAYING' && gameState.startTime > 0) {
    gameState.elapsedTime = (Date.now() - gameState.startTime) / 1000;
  }
}