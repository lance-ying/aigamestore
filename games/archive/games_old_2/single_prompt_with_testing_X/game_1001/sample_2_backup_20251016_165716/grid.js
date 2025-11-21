// grid.js - Grid management and game logic

import { gameState, GRID_SIZE, DOT_COLORS, GRID_OFFSET_X, GRID_OFFSET_Y, DOT_SIZE } from './globals.js';
import { Dot, Particle } from './entities.js';

export function initializeGrid(p) {
  gameState.grid = [];
  
  for (let y = 0; y < GRID_SIZE; y++) {
    gameState.grid[y] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      const colorIndex = Math.floor(p.random(0, DOT_COLORS.length));
      const dot = new Dot(p, x, y, colorIndex);
      gameState.grid[y][x] = dot;
      gameState.entities.push(dot);
    }
  }
}

export function getDotAtPosition(x, y) {
  const gridX = Math.floor((x - GRID_OFFSET_X) / DOT_SIZE);
  const gridY = Math.floor((y - GRID_OFFSET_Y) / DOT_SIZE);
  
  if (gridX >= 0 && gridX < GRID_SIZE && gridY >= 0 && gridY < GRID_SIZE) {
    return gameState.grid[gridY][gridX];
  }
  return null;
}

export function checkSquare(path) {
  if (path.length !== 4) return false;
  
  // Check if forms a square
  const positions = path.map(dot => ({ x: dot.gridX, y: dot.gridY }));
  
  // Find bounds
  const minX = Math.min(...positions.map(p => p.x));
  const maxX = Math.max(...positions.map(p => p.x));
  const minY = Math.min(...positions.map(p => p.y));
  const maxY = Math.max(...positions.map(p => p.y));
  
  // Check if it's a 2x2 square
  if (maxX - minX === 1 && maxY - minY === 1) {
    // Verify all four corners are present
    const hasTopLeft = path.some(d => d.gridX === minX && d.gridY === minY);
    const hasTopRight = path.some(d => d.gridX === maxX && d.gridY === minY);
    const hasBottomLeft = path.some(d => d.gridX === minX && d.gridY === maxY);
    const hasBottomRight = path.some(d => d.gridX === maxX && d.gridY === maxY);
    
    return hasTopLeft && hasTopRight && hasBottomLeft && hasBottomRight;
  }
  
  return false;
}

export function clearSelectedDots(p) {
  if (gameState.currentPath.length < 2) {
    return;
  }
  
  const isSquare = checkSquare(gameState.currentPath);
  
  if (isSquare) {
    // Clear all dots of this color
    const colorToClear = gameState.currentPath[0].colorIndex;
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const dot = gameState.grid[y][x];
        if (dot && dot.colorIndex === colorToClear) {
          dot.markedForClear = true;
          gameState.animatingDots.push(dot);
          createParticles(p, dot);
        }
      }
    }
    gameState.score += gameState.currentPath.length * 50;
    gameState.squareDetected = true;
  } else {
    // Clear only selected dots
    gameState.currentPath.forEach(dot => {
      dot.markedForClear = true;
      gameState.animatingDots.push(dot);
      createParticles(p, dot);
    });
    gameState.score += gameState.currentPath.length * 10;
  }
  
  // Update dots cleared tracking
  const colorIndex = gameState.currentPath[0].colorIndex;
  if (!gameState.dotsCleared[colorIndex]) {
    gameState.dotsCleared[colorIndex] = 0;
  }
  gameState.dotsCleared[colorIndex] += gameState.currentPath.length;
  
  gameState.moves++;
  
  setTimeout(() => {
    removeClearedDots();
    setTimeout(() => {
      dropDots();
      setTimeout(() => {
        fillEmptySpaces(p);
        checkWinCondition();
      }, 300);
    }, 200);
  }, 300);
}

function createParticles(p, dot) {
  const pos = dot.getScreenPos();
  for (let i = 0; i < 8; i++) {
    const particle = new Particle(p, pos.x, pos.y, dot.color);
    gameState.particleEffects.push(particle);
  }
}

function removeClearedDots() {
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const dot = gameState.grid[y][x];
      if (dot && dot.markedForClear) {
        dot.destroy();
        gameState.grid[y][x] = null;
        const index = gameState.entities.indexOf(dot);
        if (index > -1) {
          gameState.entities.splice(index, 1);
        }
      }
    }
  }
  gameState.animatingDots = [];
}

function dropDots() {
  for (let x = 0; x < GRID_SIZE; x++) {
    let emptySpaces = 0;
    for (let y = GRID_SIZE - 1; y >= 0; y--) {
      if (gameState.grid[y][x] === null) {
        emptySpaces++;
      } else if (emptySpaces > 0) {
        const dot = gameState.grid[y][x];
        gameState.grid[y + emptySpaces][x] = dot;
        gameState.grid[y][x] = null;
        dot.gridY = y + emptySpaces;
        
        const newY = GRID_OFFSET_Y + dot.gridY * DOT_SIZE + DOT_SIZE / 2;
        Matter.Body.setPosition(dot.body, { x: dot.body.position.x, y: newY });
      }
    }
  }
}

function fillEmptySpaces(p) {
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (gameState.grid[y][x] === null) {
        const colorIndex = Math.floor(p.random(0, DOT_COLORS.length));
        const dot = new Dot(p, x, y, colorIndex);
        gameState.grid[y][x] = dot;
        gameState.entities.push(dot);
      }
    }
  }
}

function checkWinCondition() {
  if (gameState.score >= gameState.targetScore) {
    gameState.gamePhase = "GAME_OVER_WIN";
  } else if (gameState.moves >= gameState.maxMoves) {
    gameState.gamePhase = "GAME_OVER_LOSE";
  }
}

export function clearAllSelections() {
  gameState.currentPath.forEach(dot => {
    dot.selected = false;
  });
  gameState.currentPath = [];
  gameState.squareDetected = false;
}