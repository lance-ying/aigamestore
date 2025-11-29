import { gameState, LEVELS, BALL_COLORS, COLOR_NAMES } from './globals.js';
import { Ball, Obstacle } from './ball.js';
import { Particle } from './particle.js';

export function initializeGrid(p) {
  const levelData = LEVELS[gameState.currentLevel - 1];
  gameState.gridRows = levelData.gridRows;
  gameState.gridCols = levelData.gridCols;
  gameState.movesLeft = levelData.moves;
  gameState.objectives = { ...levelData.objectives };
  gameState.score = 0;
  gameState.boostersAvailable = 1;
  gameState.clearedBalls = {
    RED: 0,
    GREEN: 0,
    BLUE: 0,
    YELLOW: 0,
    PURPLE: 0,
    totalBalls: 0
  };
  
  const availableWidth = 500;
  const availableHeight = 320;
  gameState.cellSize = Math.min(
    availableWidth / gameState.gridCols,
    availableHeight / gameState.gridRows
  );
  
  gameState.gridOffsetX = (600 - gameState.gridCols * gameState.cellSize) / 2;
  gameState.gridOffsetY = 70;
  
  gameState.grid = [];
  gameState.currentChain = [];
  gameState.selectedBall = null;
  gameState.cursorX = Math.floor(gameState.gridCols / 2);
  gameState.cursorY = Math.floor(gameState.gridRows / 2);
  gameState.particles = [];
  gameState.fallingBalls = [];
  
  // Create grid
  for (let row = 0; row < gameState.gridRows; row++) {
    gameState.grid[row] = [];
    for (let col = 0; col < gameState.gridCols; col++) {
      gameState.grid[row][col] = null;
    }
  }
  
  // Add obstacles if level has them
  if (levelData.obstacles) {
    const obstaclePositions = [];
    const centerRow = Math.floor(gameState.gridRows / 2);
    const centerCol = Math.floor(gameState.gridCols / 2);
    
    for (let i = 0; i < levelData.obstacles; i++) {
      let row, col;
      do {
        row = Math.floor(p.random(1, gameState.gridRows - 1));
        col = Math.floor(p.random(1, gameState.gridCols - 1));
      } while (
        obstaclePositions.some(pos => pos.row === row && pos.col === col) ||
        (Math.abs(row - centerRow) < 2 && Math.abs(col - centerCol) < 2)
      );
      
      obstaclePositions.push({ row, col });
      const obstacle = new Obstacle(col, row, p);
      obstacle.updatePosition(gameState.cellSize, gameState.gridOffsetX, gameState.gridOffsetY);
      gameState.grid[row][col] = obstacle;
    }
  }
  
  // Fill with balls
  for (let row = 0; row < gameState.gridRows; row++) {
    for (let col = 0; col < gameState.gridCols; col++) {
      if (!gameState.grid[row][col]) {
        const colorIndex = Math.floor(p.random(levelData.colors));
        const ball = new Ball(col, row, colorIndex, p);
        ball.updatePosition(gameState.cellSize, gameState.gridOffsetX, gameState.gridOffsetY);
        gameState.grid[row][col] = ball;
      }
    }
  }
  
  // Ensure no immediate chains
  removeInitialChains(p);
}

function removeInitialChains(p) {
  let changed = true;
  const levelData = LEVELS[gameState.currentLevel - 1];
  
  while (changed) {
    changed = false;
    for (let row = 0; row < gameState.gridRows; row++) {
      for (let col = 0; col < gameState.gridCols; col++) {
        const ball = gameState.grid[row][col];
        if (!ball || ball.isObstacle) continue;
        
        const neighbors = getNeighbors(row, col);
        const sameColorNeighbors = neighbors.filter(n => {
          const nBall = gameState.grid[n.row][n.col];
          return nBall && !nBall.isObstacle && nBall.colorName === ball.colorName;
        });
        
        if (sameColorNeighbors.length > 0) {
          const newColorIndex = Math.floor(p.random(levelData.colors));
          if (newColorIndex !== ball.color) {
            ball.color = newColorIndex;
            ball.colorName = COLOR_NAMES[newColorIndex];
            changed = true;
          }
        }
      }
    }
  }
}

export function getNeighbors(row, col) {
  const neighbors = [];
  const directions = [
    { dr: -1, dc: 0 },
    { dr: 1, dc: 0 },
    { dr: 0, dc: -1 },
    { dr: 0, dc: 1 }
  ];
  
  for (const dir of directions) {
    const newRow = row + dir.dr;
    const newCol = col + dir.dc;
    if (newRow >= 0 && newRow < gameState.gridRows && 
        newCol >= 0 && newCol < gameState.gridCols) {
      neighbors.push({ row: newRow, col: newCol });
    }
  }
  
  return neighbors;
}

export function applyGravity(p) {
  gameState.fallingBalls = [];
  
  for (let col = 0; col < gameState.gridCols; col++) {
    let writeRow = gameState.gridRows - 1;
    
    for (let row = gameState.gridRows - 1; row >= 0; row--) {
      const ball = gameState.grid[row][col];
      if (ball && !ball.isObstacle) {
        if (row !== writeRow) {
          gameState.grid[writeRow][col] = ball;
          gameState.grid[row][col] = null;
          ball.gridY = writeRow;
          ball.isFalling = true;
          ball.updatePosition(gameState.cellSize, gameState.gridOffsetX, gameState.gridOffsetY);
          gameState.fallingBalls.push(ball);
        }
        writeRow--;
      } else if (ball && ball.isObstacle) {
        writeRow = row - 1;
      }
    }
  }
}

export function fillEmptySpaces(p) {
  const levelData = LEVELS[gameState.currentLevel - 1];
  
  for (let col = 0; col < gameState.gridCols; col++) {
    for (let row = 0; row < gameState.gridRows; row++) {
      if (!gameState.grid[row][col]) {
        const colorIndex = Math.floor(p.random(levelData.colors));
        const ball = new Ball(col, row, colorIndex, p);
        ball.y = gameState.gridOffsetY - gameState.cellSize * (gameState.gridRows - row);
        ball.x = gameState.gridOffsetX + col * gameState.cellSize + gameState.cellSize / 2;
        ball.size = gameState.cellSize * 0.8;
        ball.isFalling = true;
        ball.updatePosition(gameState.cellSize, gameState.gridOffsetX, gameState.gridOffsetY);
        gameState.grid[row][col] = ball;
        gameState.fallingBalls.push(ball);
      }
    }
  }
}

export function checkNoMovesAvailable() {
  for (let row = 0; row < gameState.gridRows; row++) {
    for (let col = 0; col < gameState.gridCols; col++) {
      const ball = gameState.grid[row][col];
      if (!ball || ball.isObstacle) continue;
      
      const neighbors = getNeighbors(row, col);
      for (const neighbor of neighbors) {
        const nBall = gameState.grid[neighbor.row][neighbor.col];
        if (nBall && !nBall.isObstacle && nBall.colorName === ball.colorName) {
          return false;
        }
      }
    }
  }
  return true;
}

export function clearChain(p) {
  if (gameState.currentChain.length < 2) {
    gameState.currentChain = [];
    return;
  }
  
  const chainLength = gameState.currentChain.length;
  let chainScore = chainLength * 10;
  
  if (chainLength >= 10) {
    chainScore += 200;
  } else if (chainLength >= 8) {
    chainScore += 100;
  } else if (chainLength >= 5) {
    chainScore += 50;
  }
  
  gameState.score += chainScore;
  gameState.totalScore += chainScore;
  
  for (const ball of gameState.currentChain) {
    ball.isEliminating = true;
    ball.eliminationProgress = 0;
    
    gameState.clearedBalls[ball.colorName]++;
    gameState.clearedBalls.totalBalls++;
    
    // Create particles
    const ballColor = BALL_COLORS[ball.colorName];
    for (let i = 0; i < 8; i++) {
      const particle = new Particle(ball.x, ball.y, ballColor, p);
      gameState.particles.push(particle);
    }
  }
  
  gameState.movesLeft--;
  
  setTimeout(() => {
    for (const ball of gameState.currentChain) {
      for (let row = 0; row < gameState.gridRows; row++) {
        for (let col = 0; col < gameState.gridCols; col++) {
          if (gameState.grid[row][col] === ball) {
            gameState.grid[row][col] = null;
          }
        }
      }
    }
    
    gameState.currentChain = [];
    applyGravity(p);
    
    setTimeout(() => {
      fillEmptySpaces(p);
      
      setTimeout(() => {
        checkGameProgress(p);
      }, 500);
    }, 300);
  }, 300);
}

export function useBomb(p) {
  if (gameState.boostersAvailable <= 0) return;
  
  const centerRow = gameState.cursorY;
  const centerCol = gameState.cursorX;
  
  const ballsToClear = [];
  
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const row = centerRow + dr;
      const col = centerCol + dc;
      
      if (row >= 0 && row < gameState.gridRows && col >= 0 && col < gameState.gridCols) {
        const ball = gameState.grid[row][col];
        if (ball && !ball.isObstacle) {
          ballsToClear.push(ball);
        }
      }
    }
  }
  
  if (ballsToClear.length === 0) return;
  
  gameState.boostersAvailable--;
  
  for (const ball of ballsToClear) {
    ball.isEliminating = true;
    ball.eliminationProgress = 0;
    
    gameState.clearedBalls[ball.colorName]++;
    gameState.clearedBalls.totalBalls++;
    
    const ballColor = BALL_COLORS[ball.colorName];
    for (let i = 0; i < 12; i++) {
      const particle = new Particle(ball.x, ball.y, ballColor, p);
      gameState.particles.push(particle);
    }
  }
  
  setTimeout(() => {
    for (const ball of ballsToClear) {
      for (let row = 0; row < gameState.gridRows; row++) {
        for (let col = 0; col < gameState.gridCols; col++) {
          if (gameState.grid[row][col] === ball) {
            gameState.grid[row][col] = null;
          }
        }
      }
    }
    
    applyGravity(p);
    
    setTimeout(() => {
      fillEmptySpaces(p);
      
      setTimeout(() => {
        checkGameProgress(p);
      }, 500);
    }, 300);
  }, 300);
}

export function checkGameProgress(p) {
  const objectives = gameState.objectives;
  let allObjectivesMet = true;
  
  if (objectives.targetScore && gameState.score < objectives.targetScore) {
    allObjectivesMet = false;
  }
  
  if (objectives.totalBalls && gameState.clearedBalls.totalBalls < objectives.totalBalls) {
    allObjectivesMet = false;
  }
  
  for (const color of COLOR_NAMES) {
    if (objectives[color] && gameState.clearedBalls[color] < objectives[color]) {
      allObjectivesMet = false;
    }
  }
  
  if (allObjectivesMet) {
    const bonus = gameState.movesLeft * 10;
    gameState.score += bonus;
    gameState.totalScore += bonus;
    
    p.logs.game_info.push({
      data: { phase: "LEVEL_WIN", level: gameState.currentLevel, score: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    if (gameState.currentLevel < LEVELS.length) {
      gameState.gamePhase = "LEVEL_TRANSITION";
      gameState.showLevelTransition = true;
      gameState.levelTransitionTimer = 120;
    } else {
      gameState.gamePhase = "GAME_OVER_WIN";
      if (gameState.totalScore > gameState.highScore) {
        gameState.highScore = gameState.totalScore;
        localStorage.setItem('chainPopHighScore', gameState.highScore);
      }
    }
    return;
  }
  
  if (gameState.movesLeft <= 0 || checkNoMovesAvailable()) {
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_LOSE", score: gameState.totalScore },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    gameState.gamePhase = "GAME_OVER_LOSE";
  }
}