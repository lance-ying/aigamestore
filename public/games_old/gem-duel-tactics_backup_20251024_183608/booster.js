// booster.js - Booster ability system

import { gameState, GEM_EMPTY, GEM_OBSTACLE, GEM_BLUE_STAR, GEM_RED_CIRCLE } from './globals.js';
import { fillBoard } from './board.js';

export function activatePlayerBooster(p) {
  const boosterType = gameState.levelConfig.playerBooster;
  
  if (boosterType === "GEM_BLAST") {
    // Player needs to select target - enter selection mode
    gameState.boosterActive = true;
    gameState.boosterState = { type: "GEM_BLAST", step: "SELECT_TARGET" };
    return true;
  } else if (boosterType === "LINE_CLEAR") {
    gameState.boosterActive = true;
    gameState.boosterState = { type: "LINE_CLEAR", step: "SELECT_LINE" };
    return true;
  } else if (boosterType === "COLOR_CONVERSION") {
    gameState.boosterActive = true;
    gameState.boosterState = { type: "COLOR_CONVERSION", step: "SELECT_SOURCE" };
    return true;
  } else if (boosterType === "COLOR_ERADICATION") {
    gameState.boosterActive = true;
    gameState.boosterState = { type: "COLOR_ERADICATION", step: "SELECT_COLOR" };
    return true;
  }
  
  return false;
}

export function executeGemBlast(x, y, p) {
  let cleared = 0;
  const { boardWidth, boardHeight } = gameState;
  
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const tx = x + dx;
      const ty = y + dy;
      if (tx >= 0 && tx < boardWidth && ty >= 0 && ty < boardHeight) {
        const gem = gameState.board[ty][tx];
        if (gem !== GEM_EMPTY && gem !== GEM_OBSTACLE) {
          gameState.board[ty][tx] = GEM_EMPTY;
          cleared++;
          
          gameState.clearAnimations.push({
            x: tx,
            y: ty,
            progress: 0
          });
        }
      }
    }
  }
  
  return cleared * 10;
}

export function executeLineClear(isRow, index, p) {
  let cleared = 0;
  const { boardWidth, boardHeight } = gameState;
  
  if (isRow) {
    for (let x = 0; x < boardWidth; x++) {
      const gem = gameState.board[index][x];
      if (gem !== GEM_EMPTY && gem !== GEM_OBSTACLE) {
        gameState.board[index][x] = GEM_EMPTY;
        cleared++;
        
        gameState.clearAnimations.push({
          x: x,
          y: index,
          progress: 0
        });
      }
    }
  } else {
    for (let y = 0; y < boardHeight; y++) {
      const gem = gameState.board[y][index];
      if (gem !== GEM_EMPTY && gem !== GEM_OBSTACLE) {
        gameState.board[y][index] = GEM_EMPTY;
        cleared++;
        
        gameState.clearAnimations.push({
          x: index,
          y: y,
          progress: 0
        });
      }
    }
  }
  
  return cleared * 10;
}

export function executeColorConversion(sourceColor, targetColor, p) {
  const { boardWidth, boardHeight } = gameState;
  let converted = 0;
  
  for (let y = 0; y < boardHeight; y++) {
    for (let x = 0; x < boardWidth; x++) {
      if (gameState.board[y][x] === sourceColor) {
        gameState.board[y][x] = targetColor;
        converted++;
      }
    }
  }
  
  return converted * 5;
}

export function executeColorEradication(color, p) {
  const { boardWidth, boardHeight } = gameState;
  let cleared = 0;
  
  for (let y = 0; y < boardHeight; y++) {
    for (let x = 0; x < boardWidth; x++) {
      if (gameState.board[y][x] === color) {
        gameState.board[y][x] = GEM_EMPTY;
        cleared++;
        
        gameState.clearAnimations.push({
          x: x,
          y: y,
          progress: 0
        });
      }
    }
  }
  
  return cleared * 10;
}

export function activateAIBooster(p) {
  const boosterType = gameState.levelConfig.aiBooster;
  
  if (boosterType === "RANDOM_SWAP") {
    executeRandomSwap(p);
  } else if (boosterType === "BLOCK_GEM") {
    // Simplified: just skip for now
  } else if (boosterType === "BOARD_SHUFFLE") {
    executeBoardShuffle(p);
  } else if (boosterType === "BOOSTER_DRAIN") {
    gameState.playerBoosterCharge = 0;
  }
  
  gameState.aiBoosterCharge = 0;
}

function executeRandomSwap(p) {
  const { boardWidth, boardHeight } = gameState;
  let attempts = 0;
  
  while (attempts < 50) {
    const x1 = Math.floor(p.random(boardWidth));
    const y1 = Math.floor(p.random(boardHeight));
    const x2 = Math.floor(p.random(boardWidth));
    const y2 = Math.floor(p.random(boardHeight));
    
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    
    if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
      const gem1 = gameState.board[y1][x1];
      const gem2 = gameState.board[y2][x2];
      
      if (gem1 !== GEM_EMPTY && gem1 !== GEM_OBSTACLE && 
          gem2 !== GEM_EMPTY && gem2 !== GEM_OBSTACLE) {
        const temp = gameState.board[y1][x1];
        gameState.board[y1][x1] = gameState.board[y2][x2];
        gameState.board[y2][x2] = temp;
        break;
      }
    }
    attempts++;
  }
}

function executeBoardShuffle(p) {
  const { boardWidth, boardHeight } = gameState;
  const gems = [];
  
  // Collect all non-obstacle, non-empty gems
  for (let y = 0; y < boardHeight; y++) {
    for (let x = 0; x < boardWidth; x++) {
      const gem = gameState.board[y][x];
      if (gem !== GEM_OBSTACLE && gem !== GEM_EMPTY) {
        gems.push(gem);
      }
    }
  }
  
  // Shuffle gems array
  for (let i = gems.length - 1; i > 0; i--) {
    const j = Math.floor(p.random(i + 1));
    [gems[i], gems[j]] = [gems[j], gems[i]];
  }
  
  // Place shuffled gems back
  let gemIndex = 0;
  for (let y = 0; y < boardHeight; y++) {
    for (let x = 0; x < boardWidth; x++) {
      const current = gameState.board[y][x];
      if (current !== GEM_OBSTACLE && current !== GEM_EMPTY) {
        gameState.board[y][x] = gems[gemIndex++];
      }
    }
  }
}