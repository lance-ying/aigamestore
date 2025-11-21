import { gameState, LEVELS } from './globals.js';
import { getCellAtPosition, isAdjacent, getSelectedWord, checkWordMatch, pathsMatch } from './grid.js';
import { getGridDimensions } from './rendering.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  if (gameState.gamePhase === "START") {
    if (keyCode === 13) { // ENTER
      startGame(p);
    }
  } else if (gameState.gamePhase === "PLAYING") {
    if (keyCode === 27) { // ESC
      pauseGame(p);
    } else if (keyCode === 32) { // SPACE
      useHint(p);
    } else if (keyCode === 82) { // R
      restartGame(p);
    } else {
      handleArrowKeys(p, keyCode);
    }
  } else if (gameState.gamePhase === "PAUSED") {
    if (keyCode === 27) { // ESC
      resumeGame(p);
    } else if (keyCode === 82) { // R
      restartGame(p);
    }
  } else if (gameState.gamePhase === "LEVEL_COMPLETE") {
    if (keyCode === 13) { // ENTER
      nextLevel(p);
    } else if (keyCode === 82) { // R
      restartGame(p);
    }
  } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
    if (keyCode === 82) { // R
      restartGame(p);
    }
  }
}

function handleArrowKeys(p, keyCode) {
  const levelData = LEVELS[gameState.currentLevel - 1];
  const gridSize = levelData.gridSize;
  
  // If no cell selected, start at 0,0
  if (!gameState.hoveredCell) {
    gameState.hoveredCell = { row: 0, col: 0 };
    return;
  }
  
  let newRow = gameState.hoveredCell.row;
  let newCol = gameState.hoveredCell.col;
  
  if (keyCode === 38) { // UP
    newRow = Math.max(0, newRow - 1);
  } else if (keyCode === 40) { // DOWN
    newRow = Math.min(gridSize - 1, newRow + 1);
  } else if (keyCode === 37) { // LEFT
    newCol = Math.max(0, newCol - 1);
  } else if (keyCode === 39) { // RIGHT
    newCol = Math.min(gridSize - 1, newCol + 1);
  }
  
  gameState.hoveredCell = { row: newRow, col: newCol };
  
  // Auto-select adjacent cells when using arrow keys
  if (gameState.selectedCells.length > 0) {
    const lastCell = gameState.selectedCells[gameState.selectedCells.length - 1];
    if (isAdjacent(lastCell, gameState.hoveredCell)) {
      addCellToSelection(gameState.hoveredCell);
    }
  } else {
    addCellToSelection(gameState.hoveredCell);
  }
}

function addCellToSelection(cell) {
  if (!cell) return;
  
  // Check if already selected
  for (const selected of gameState.selectedCells) {
    if (selected.row === cell.row && selected.col === cell.col) {
      return;
    }
  }
  
  // If this is the first cell, add it
  if (gameState.selectedCells.length === 0) {
    gameState.selectedCells.push({ ...cell });
    return;
  }
  
  // Check if adjacent to last selected cell
  const lastCell = gameState.selectedCells[gameState.selectedCells.length - 1];
  if (isAdjacent(lastCell, cell)) {
    gameState.selectedCells.push({ ...cell });
  }
}

export function handleKeyReleased(p, key, keyCode) {
  if (gameState.gamePhase === "PLAYING") {
    // Check if selection is complete (when arrow keys are released)
    if (keyCode === 38 || keyCode === 40 || keyCode === 37 || keyCode === 39) {
      if (gameState.selectedCells.length > 0) {
        confirmSelection(p);
      }
    }
  }
}

function confirmSelection(p) {
  const word = getSelectedWord(gameState.selectedCells, gameState.gridLetters);
  const matchIndex = checkWordMatch(word, gameState.targetWords);
  
  if (matchIndex >= 0) {
    // Check if the path matches
    const targetPath = gameState.targetWords[matchIndex].path;
    const selectedPath = gameState.selectedCells;
    
    // Check forward and backward match
    const forwardMatch = pathsMatch(selectedPath, targetPath);
    const reverseMatch = pathsMatch(selectedPath, [...targetPath].reverse());
    
    if (forwardMatch || reverseMatch) {
      // Word found!
      gameState.targetWords[matchIndex].found = true;
      gameState.foundWords.push(word);
      gameState.score += 50;
      
      // Check if all words found
      let allFound = true;
      for (const wordObj of gameState.targetWords) {
        if (!wordObj.found) {
          allFound = false;
          break;
        }
      }
      
      if (allFound) {
        completeLevel(p);
      }
    } else {
      // Show temporary highlight for incorrect selection
      gameState.tempHighlightCells = [...gameState.selectedCells];
      setTimeout(() => {
        gameState.tempHighlightCells = [];
      }, 500);
    }
  } else {
    // Show temporary highlight for incorrect selection
    gameState.tempHighlightCells = [...gameState.selectedCells];
    setTimeout(() => {
      gameState.tempHighlightCells = [];
    }, 500);
  }
  
  // Clear selection
  gameState.selectedCells = [];
}

function useHint(p) {
  if (gameState.availableHints <= 0) return;
  
  // Prevent hint spam
  const now = Date.now();
  if (now - gameState.lastHintTime < 1000) return;
  gameState.lastHintTime = now;
  
  // Find first unfound word
  let unfoundWord = null;
  for (const wordObj of gameState.targetWords) {
    if (!wordObj.found) {
      unfoundWord = wordObj;
      break;
    }
  }
  
  if (unfoundWord) {
    gameState.availableHints--;
    
    // Highlight first letter of unfound word
    const firstCell = unfoundWord.path[0];
    gameState.tempHighlightCells = [firstCell];
    
    setTimeout(() => {
      gameState.tempHighlightCells = [];
    }, 2000);
  }
}

function startGame(p) {
  gameState.gamePhase = "PLAYING";
  gameState.currentLevel = 1;
  gameState.score = 0;
  initializeLevel(p);
  
  p.logs.game_info.push({
    data: { phase: "PLAYING", level: gameState.currentLevel },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function initializeLevel(p) {
  const levelData = LEVELS[gameState.currentLevel - 1];
  
  // Generate grid
  const { grid, targetWords } = generateGridForLevel(levelData);
  gameState.gridLetters = grid;
  gameState.targetWords = targetWords;
  gameState.foundWords = [];
  gameState.selectedCells = [];
  gameState.availableHints = levelData.hints;
  gameState.levelStartTime = Date.now();
  gameState.levelComplete = false;
  gameState.hoveredCell = null;
  gameState.tempHighlightCells = [];
}

function generateGridForLevel(levelData) {
  const size = levelData.gridSize;
  const words = levelData.words;
  
  const grid = Array(size).fill(null).map(() => Array(size).fill(''));
  const targetWords = [];
  
  const directions = [
    { dr: 0, dc: 1, name: 'H' },
    { dr: 1, dc: 0, name: 'V' },
    { dr: 1, dc: 1, name: 'D' },
    { dr: 0, dc: -1, name: 'RH' },
    { dr: -1, dc: 0, name: 'RV' },
    { dr: -1, dc: -1, name: 'RD' },
    { dr: 1, dc: -1, name: 'DD' },
    { dr: -1, dc: 1, name: 'DU' }
  ];
  
  const sortedWords = [...words].sort((a, b) => b.length - a.length);
  
  for (const word of sortedWords) {
    let placed = false;
    let attempts = 0;
    
    while (!placed && attempts < 100) {
      attempts++;
      
      const dir = directions[Math.floor(Math.random() * directions.length)];
      const startRow = Math.floor(Math.random() * size);
      const startCol = Math.floor(Math.random() * size);
      
      const path = [];
      let canPlace = true;
      
      for (let i = 0; i < word.length; i++) {
        const row = startRow + dir.dr * i;
        const col = startCol + dir.dc * i;
        
        if (row < 0 || row >= size || col < 0 || col >= size) {
          canPlace = false;
          break;
        }
        
        if (grid[row][col] !== '' && grid[row][col] !== word[i]) {
          canPlace = false;
          break;
        }
        
        path.push({ row, col });
      }
      
      if (canPlace) {
        for (let i = 0; i < word.length; i++) {
          grid[path[i].row][path[i].col] = word[i];
        }
        
        targetWords.push({
          word: word,
          found: false,
          path: path
        });
        
        placed = true;
      }
    }
  }
  
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === '') {
        grid[r][c] = letters[Math.floor(Math.random() * letters.length)];
      }
    }
  }
  
  return { grid, targetWords };
}

function completeLevel(p) {
  const elapsedTime = Math.floor((Date.now() - gameState.levelStartTime) / 1000);
  const timeBonus = Math.max(0, Math.floor(500 - (elapsedTime * 1.5)));
  const levelBonus = 100;
  
  gameState.score += timeBonus + levelBonus;
  gameState.gamePhase = "LEVEL_COMPLETE";
  gameState.levelComplete = true;
  
  p.logs.game_info.push({
    data: { phase: "LEVEL_COMPLETE", level: gameState.currentLevel, score: gameState.score },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function nextLevel(p) {
  if (gameState.currentLevel < gameState.totalLevels) {
    gameState.currentLevel++;
    gameState.gamePhase = "PLAYING";
    initializeLevel(p);
    
    p.logs.game_info.push({
      data: { phase: "PLAYING", level: gameState.currentLevel },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else {
    gameState.gamePhase = "GAME_OVER_WIN";
    
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_WIN", finalScore: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function pauseGame(p) {
  gameState.gamePhase = "PAUSED";
  
  p.logs.game_info.push({
    data: { phase: "PAUSED" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function resumeGame(p) {
  gameState.gamePhase = "PLAYING";
  
  p.logs.game_info.push({
    data: { phase: "PLAYING" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function restartGame(p) {
  gameState.gamePhase = "START";
  gameState.currentLevel = 1;
  gameState.score = 0;
  gameState.selectedCells = [];
  gameState.foundWords = [];
  gameState.hoveredCell = null;
  gameState.tempHighlightCells = [];
  
  p.logs.game_info.push({
    data: { phase: "START" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}