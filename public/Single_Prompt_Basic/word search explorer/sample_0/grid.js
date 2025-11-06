import { gameState, LEVELS } from './globals.js';

export function generateGrid(level) {
  const levelData = LEVELS[level - 1];
  const size = levelData.gridSize;
  const words = levelData.words;
  
  // Initialize empty grid
  const grid = Array(size).fill(null).map(() => Array(size).fill(''));
  const targetWords = [];
  
  // Directions: horizontal, vertical, diagonal, and their reverses
  const directions = [
    { dr: 0, dc: 1, name: 'H' },      // horizontal
    { dr: 1, dc: 0, name: 'V' },      // vertical
    { dr: 1, dc: 1, name: 'D' },      // diagonal down-right
    { dr: 0, dc: -1, name: 'RH' },    // reverse horizontal
    { dr: -1, dc: 0, name: 'RV' },    // reverse vertical
    { dr: -1, dc: -1, name: 'RD' },   // reverse diagonal
    { dr: 1, dc: -1, name: 'DD' },    // diagonal down-left
    { dr: -1, dc: 1, name: 'DU' }     // diagonal up-right
  ];
  
  // Sort words by length (longer first) for better placement
  const sortedWords = [...words].sort((a, b) => b.length - a.length);
  
  for (const word of sortedWords) {
    let placed = false;
    let attempts = 0;
    const maxAttempts = 100;
    
    while (!placed && attempts < maxAttempts) {
      attempts++;
      
      // Pick random direction
      const dir = directions[Math.floor(Math.random() * directions.length)];
      
      // Pick random start position
      const startRow = Math.floor(Math.random() * size);
      const startCol = Math.floor(Math.random() * size);
      
      // Check if word fits
      const path = [];
      let canPlace = true;
      
      for (let i = 0; i < word.length; i++) {
        const row = startRow + dir.dr * i;
        const col = startCol + dir.dc * i;
        
        if (row < 0 || row >= size || col < 0 || col >= size) {
          canPlace = false;
          break;
        }
        
        // Check if cell is empty or already has the correct letter
        if (grid[row][col] !== '' && grid[row][col] !== word[i]) {
          canPlace = false;
          break;
        }
        
        path.push({ row, col });
      }
      
      if (canPlace) {
        // Place the word
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
  
  // Fill remaining empty cells with random letters
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

export function getCellAtPosition(p, mouseX, mouseY, gridSize, cellSize, offsetX, offsetY) {
  const col = Math.floor((mouseX - offsetX) / cellSize);
  const row = Math.floor((mouseY - offsetY) / cellSize);
  
  if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
    return { row, col };
  }
  
  return null;
}

export function isAdjacent(cell1, cell2) {
  if (!cell1 || !cell2) return false;
  
  const rowDiff = Math.abs(cell1.row - cell2.row);
  const colDiff = Math.abs(cell1.col - cell2.col);
  
  // Adjacent includes diagonal
  return rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0);
}

export function getSelectedWord(selectedCells, grid) {
  if (selectedCells.length === 0) return "";
  
  let word = "";
  for (const cell of selectedCells) {
    word += grid[cell.row][cell.col];
  }
  
  return word;
}

export function checkWordMatch(word, targetWords) {
  for (let i = 0; i < targetWords.length; i++) {
    if (!targetWords[i].found && targetWords[i].word === word) {
      return i;
    }
  }
  return -1;
}

export function pathsMatch(path1, path2) {
  if (path1.length !== path2.length) return false;
  
  for (let i = 0; i < path1.length; i++) {
    if (path1[i].row !== path2[i].row || path1[i].col !== path2[i].col) {
      return false;
    }
  }
  
  return true;
}