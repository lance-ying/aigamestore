// board.js - Board management and gem logic

import { gameState, GEM_EMPTY, GEM_OBSTACLE, GEM_BLUE_STAR, GEM_RED_CIRCLE } from './globals.js';

export function initializeBoard(p) {
  const { boardWidth, boardHeight, levelConfig } = gameState;
  
  // Create empty board
  gameState.board = [];
  for (let y = 0; y < boardHeight; y++) {
    gameState.board[y] = [];
    for (let x = 0; x < boardWidth; x++) {
      gameState.board[y][x] = GEM_EMPTY;
    }
  }
  
  // Place obstacles for level 4
  if (levelConfig && levelConfig.obstacles > 0) {
    let obstaclesPlaced = 0;
    while (obstaclesPlaced < levelConfig.obstacles) {
      const rx = Math.floor(p.random(boardWidth));
      const ry = Math.floor(p.random(boardHeight));
      if (gameState.board[ry][rx] === GEM_EMPTY) {
        gameState.board[ry][rx] = GEM_OBSTACLE;
        obstaclesPlaced++;
      }
    }
  }
  
  // Fill with random gems
  fillBoard(p);
  
  // Remove initial matches
  while (hasMatches()) {
    clearMatches(p);
    fillBoard(p);
  }
}

export function fillBoard(p) {
  const { boardWidth, boardHeight, levelConfig } = gameState;
  const gemTypes = levelConfig ? levelConfig.gemTypes : [0, 1, 2, 3, 6, 7];
  
  for (let y = 0; y < boardHeight; y++) {
    for (let x = 0; x < boardWidth; x++) {
      if (gameState.board[y][x] === GEM_EMPTY) {
        gameState.board[y][x] = gemTypes[Math.floor(p.random(gemTypes.length))];
      }
    }
  }
}

export function isValidPosition(x, y) {
  return x >= 0 && x < gameState.boardWidth && y >= 0 && y < gameState.boardHeight;
}

export function canSwap(x1, y1, x2, y2) {
  if (!isValidPosition(x1, y1) || !isValidPosition(x2, y2)) return false;
  
  const gem1 = gameState.board[y1][x1];
  const gem2 = gameState.board[y2][x2];
  
  // Can't swap obstacles or empty cells
  if (gem1 === GEM_OBSTACLE || gem2 === GEM_OBSTACLE) return false;
  if (gem1 === GEM_EMPTY || gem2 === GEM_EMPTY) return false;
  
  // Check if adjacent
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
    return true;
  }
  
  return false;
}

export function swapGems(x1, y1, x2, y2) {
  const temp = gameState.board[y1][x1];
  gameState.board[y1][x1] = gameState.board[y2][x2];
  gameState.board[y2][x2] = temp;
}

export function findMatches() {
  const matches = [];
  const { boardWidth, boardHeight } = gameState;
  
  // Horizontal matches
  for (let y = 0; y < boardHeight; y++) {
    let matchStart = 0;
    for (let x = 1; x < boardWidth; x++) {
      const currentGem = gameState.board[y][x];
      const prevGem = gameState.board[y][x - 1];
      
      if (currentGem === prevGem && currentGem !== GEM_EMPTY && currentGem !== GEM_OBSTACLE) {
        // Continue match
      } else {
        // Check if we have a match
        if (x - matchStart >= 3) {
          const match = [];
          for (let i = matchStart; i < x; i++) {
            match.push({ x: i, y: y });
          }
          matches.push(match);
        }
        matchStart = x;
      }
    }
    // Check end of row
    if (boardWidth - matchStart >= 3) {
      const match = [];
      for (let i = matchStart; i < boardWidth; i++) {
        match.push({ x: i, y: y });
      }
      matches.push(match);
    }
  }
  
  // Vertical matches
  for (let x = 0; x < boardWidth; x++) {
    let matchStart = 0;
    for (let y = 1; y < boardHeight; y++) {
      const currentGem = gameState.board[y][x];
      const prevGem = gameState.board[y - 1][x];
      
      if (currentGem === prevGem && currentGem !== GEM_EMPTY && currentGem !== GEM_OBSTACLE) {
        // Continue match
      } else {
        // Check if we have a match
        if (y - matchStart >= 3) {
          const match = [];
          for (let i = matchStart; i < y; i++) {
            match.push({ x: x, y: i });
          }
          matches.push(match);
        }
        matchStart = y;
      }
    }
    // Check end of column
    if (boardHeight - matchStart >= 3) {
      const match = [];
      for (let i = matchStart; i < boardHeight; i++) {
        match.push({ x: x, y: i });
      }
      matches.push(match);
    }
  }
  
  return matches;
}

export function hasMatches() {
  return findMatches().length > 0;
}

export function clearMatches(p) {
  const matches = findMatches();
  let totalScore = 0;
  let blueStarsCleared = 0;
  let redCirclesCleared = 0;
  
  if (matches.length === 0) return { score: 0, blueStars: 0, redCircles: 0 };
  
  gameState.matchesThisTurn++;
  
  matches.forEach(match => {
    const gemType = gameState.board[match[0].y][match[0].x];
    const matchSize = match.length;
    let basePoints = 0;
    
    if (matchSize === 3) basePoints = 10;
    else if (matchSize === 4) basePoints = 25;
    else basePoints = 50;
    
    const cascadeBonus = gameState.matchesThisTurn > 1 ? 5 : 0;
    const pointsPerGem = basePoints + cascadeBonus;
    const matchScore = Math.floor(pointsPerGem * matchSize * gameState.currentComboMultiplier);
    
    totalScore += matchScore;
    
    // Clear gems and count special gems
    match.forEach(pos => {
      const gem = gameState.board[pos.y][pos.x];
      if (gem === GEM_BLUE_STAR) blueStarsCleared++;
      if (gem === GEM_RED_CIRCLE) redCirclesCleared++;
      
      gameState.board[pos.y][pos.x] = GEM_EMPTY;
      
      // Add clear animation
      gameState.clearAnimations.push({
        x: pos.x,
        y: pos.y,
        progress: 0
      });
    });
  });
  
  // Update combo multiplier for next match
  gameState.currentComboMultiplier += 0.5;
  
  return { score: totalScore, blueStars: blueStarsCleared, redCircles: redCirclesCleared };
}

export function applyGravity() {
  const { boardWidth, boardHeight } = gameState;
  let moved = false;
  
  for (let x = 0; x < boardWidth; x++) {
    for (let y = boardHeight - 1; y >= 0; y--) {
      if (gameState.board[y][x] === GEM_EMPTY) {
        // Find gem above
        for (let searchY = y - 1; searchY >= 0; searchY--) {
          const gem = gameState.board[searchY][x];
          if (gem !== GEM_EMPTY && gem !== GEM_OBSTACLE) {
            // Move gem down
            gameState.board[y][x] = gem;
            gameState.board[searchY][x] = GEM_EMPTY;
            
            // Add fall animation
            gameState.fallAnimations.push({
              x: x,
              fromY: searchY,
              toY: y,
              gem: gem,
              progress: 0
            });
            
            moved = true;
            break;
          } else if (gem === GEM_OBSTACLE) {
            break;
          }
        }
      }
    }
  }
  
  return moved;
}

export function getAllPossibleMoves() {
  const moves = [];
  const { boardWidth, boardHeight } = gameState;
  
  for (let y = 0; y < boardHeight; y++) {
    for (let x = 0; x < boardWidth; x++) {
      // Try right swap
      if (x < boardWidth - 1 && canSwap(x, y, x + 1, y)) {
        swapGems(x, y, x + 1, y);
        if (hasMatches()) {
          moves.push({ x1: x, y1: y, x2: x + 1, y2: y });
        }
        swapGems(x, y, x + 1, y); // Swap back
      }
      
      // Try down swap
      if (y < boardHeight - 1 && canSwap(x, y, x, y + 1)) {
        swapGems(x, y, x, y + 1);
        if (hasMatches()) {
          moves.push({ x1: x, y1: y, x2: x, y2: y + 1 });
        }
        swapGems(x, y, x, y + 1); // Swap back
      }
    }
  }
  
  return moves;
}