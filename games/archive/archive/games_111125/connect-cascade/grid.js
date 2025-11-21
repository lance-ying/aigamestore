// grid.js - Grid management functions
import { gameState } from './globals.js';
import { Dot } from './dot.js';
import { getColorName } from './levels.js';

export function initializeGrid(p, config) {
  const { gridRows, gridCols, colors, anchors } = config;
  gameState.grid = [];
  gameState.gridRows = gridRows;
  gameState.gridCols = gridCols;
  gameState.colors = colors;

  // Create empty grid
  for (let row = 0; row < gridRows; row++) {
    gameState.grid[row] = [];
    for (let col = 0; col < gridCols; col++) {
      gameState.grid[row][col] = null;
    }
  }

  // Place anchor dots if any
  const anchorPositions = [];
  if (anchors > 0) {
    for (let i = 0; i < anchors; i++) {
      let row, col;
      do {
        row = Math.floor(p.random(0, Math.min(3, gridRows)));
        col = Math.floor(p.random(gridCols));
      } while (anchorPositions.some(pos => pos.row === row && pos.col === col));
      anchorPositions.push({ row, col });
    }
  }

  // Fill grid with dots
  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      const color = colors[Math.floor(p.random(colors.length))];
      const isAnchor = anchorPositions.some(pos => pos.row === row && pos.col === col);
      const dot = new Dot(col, row, color, isAnchor ? 'anchor' : 'normal');
      gameState.grid[row][col] = dot;
    }
  }
}

export function getDotAtPosition(gridX, gridY) {
  if (gridY < 0 || gridY >= gameState.gridRows || gridX < 0 || gridX >= gameState.gridCols) {
    return null;
  }
  return gameState.grid[gridY][gridX];
}

export function areDotsAdjacent(dot1, dot2) {
  const dx = Math.abs(dot1.gridX - dot2.gridX);
  const dy = Math.abs(dot1.gridY - dot2.gridY);
  return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
}

export function colorsMatch(color1, color2) {
  return color1[0] === color2[0] && color1[1] === color2[1] && color1[2] === color2[2];
}

export function isSquareFormed(path, selectedDot) {
  if (path.length < 4) return false;
  const lastDot = path[path.length - 1];
  return areDotsAdjacent(lastDot, selectedDot);
}

export function clearDots(p, dotsToRemove) {
  for (let dot of dotsToRemove) {
    if (gameState.grid[dot.gridY] && gameState.grid[dot.gridY][dot.gridX] === dot) {
      gameState.grid[dot.gridY][dot.gridX] = null;
      dot.isClearing = true;
      
      // Update objectives
      const colorName = getColorName(dot.color);
      if (gameState.levelObjectives[colorName]) {
        gameState.levelObjectives[colorName].current++;
      }
    }
  }
}

export function applyGravity(p) {
  const movements = [];
  
  for (let col = 0; col < gameState.gridCols; col++) {
    let writeRow = gameState.gridRows - 1;
    
    for (let row = gameState.gridRows - 1; row >= 0; row--) {
      const dot = gameState.grid[row][col];
      if (dot !== null) {
        if (writeRow !== row) {
          gameState.grid[writeRow][col] = dot;
          gameState.grid[row][col] = null;
          dot.gridY = writeRow;
          dot.isFalling = true;
          movements.push({ dot, fromRow: row, toRow: writeRow });
        }
        writeRow--;
      }
    }
  }
  
  return movements;
}

export function fillEmptySpaces(p) {
  const newDots = [];
  
  for (let col = 0; col < gameState.gridCols; col++) {
    for (let row = 0; row < gameState.gridRows; row++) {
      if (gameState.grid[row][col] === null) {
        const color = gameState.colors[Math.floor(p.random(gameState.colors.length))];
        const dot = new Dot(col, row, color, 'normal');
        gameState.grid[row][col] = dot;
        dot.isFalling = true;
        newDots.push(dot);
      }
    }
  }
  
  return newDots;
}

export function checkAnchorObjective() {
  if (!gameState.levelObjectives.anchor) return;
  
  let anchorsAtBottom = 0;
  const bottomRow = gameState.gridRows - 1;
  
  for (let col = 0; col < gameState.gridCols; col++) {
    const dot = gameState.grid[bottomRow][col];
    if (dot && dot.type === 'anchor') {
      anchorsAtBottom++;
    }
  }
  
  gameState.levelObjectives.anchor.current = anchorsAtBottom;
}