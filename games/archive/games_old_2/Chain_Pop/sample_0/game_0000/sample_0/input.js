import { gameState, GAME_PHASES, CONTROL_MODES } from './globals.js';
import { initializeGrid, getNeighbors, clearChain, useBomb } from './grid.js';

export function handleKeyPressed(p) {
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  if (p.keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      startGame(p);
    }
  } else if (p.keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { phase: "PAUSED" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else if (p.keyCode === 82) { // R
    restartGame(p);
  }
  
  if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.controlMode === CONTROL_MODES.HUMAN) {
    handleGameplayInput(p);
  }
}

function handleGameplayInput(p) {
  // Arrow keys for cursor movement
  if (p.keyCode === 37) { // LEFT
    gameState.cursorX = Math.max(0, gameState.cursorX - 1);
  } else if (p.keyCode === 39) { // RIGHT
    gameState.cursorX = Math.min(gameState.gridCols - 1, gameState.cursorX + 1);
  } else if (p.keyCode === 38) { // UP
    gameState.cursorY = Math.max(0, gameState.cursorY - 1);
  } else if (p.keyCode === 40) { // DOWN
    gameState.cursorY = Math.min(gameState.gridRows - 1, gameState.cursorY + 1);
  } else if (p.keyCode === 32) { // SPACE
    handleSpaceKey(p);
  } else if (p.keyCode === 90) { // Z
    useBomb(p);
  }
}

function handleSpaceKey(p) {
  const ball = gameState.grid[gameState.cursorY][gameState.cursorX];
  
  if (!ball || ball.isObstacle) return;
  
  if (gameState.currentChain.length === 0) {
    // Start new chain
    gameState.currentChain = [ball];
    ball.isChained = true;
    gameState.selectedBall = ball;
  } else {
    const lastBall = gameState.currentChain[gameState.currentChain.length - 1];
    
    if (ball === lastBall) {
      // Complete chain
      clearChain(p);
      gameState.selectedBall = null;
      for (const b of gameState.currentChain) {
        b.isChained = false;
      }
    } else if (
      ball.colorName === lastBall.colorName &&
      !gameState.currentChain.includes(ball)
    ) {
      // Check adjacency
      const neighbors = getNeighbors(lastBall.gridY, lastBall.gridX);
      const isAdjacent = neighbors.some(n => 
        n.row === ball.gridY && n.col === ball.gridX
      );
      
      if (isAdjacent) {
        gameState.currentChain.push(ball);
        ball.isChained = true;
      }
    }
  }
}

function startGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  gameState.currentLevel = 1;
  gameState.totalScore = 0;
  initializeGrid(p);
  
  p.logs.game_info.push({
    data: { phase: "PLAYING", level: 1 },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function restartGame(p) {
  for (const b of gameState.currentChain) {
    b.isChained = false;
  }
  gameState.currentChain = [];
  gameState.selectedBall = null;
  gameState.gamePhase = GAME_PHASES.START;
  gameState.currentLevel = 1;
  gameState.totalScore = 0;
  gameState.particles = [];
  gameState.fallingBalls = [];
  
  p.logs.game_info.push({
    data: { phase: "START" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function updateAutomatedControl(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  if (gameState.controlMode === CONTROL_MODES.TEST_1) {
    // Basic testing: random moves
    if (p.frameCount % 60 === 0 && gameState.fallingBalls.length === 0) {
      const row = Math.floor(p.random(gameState.gridRows));
      const col = Math.floor(p.random(gameState.gridCols));
      gameState.cursorX = col;
      gameState.cursorY = row;
      
      const ball = gameState.grid[row][col];
      if (ball && !ball.isObstacle) {
        if (gameState.currentChain.length === 0) {
          gameState.currentChain = [ball];
          ball.isChained = true;
        } else {
          clearChain(p);
          for (const b of gameState.currentChain) {
            b.isChained = false;
          }
        }
      }
    }
  } else if (gameState.controlMode === CONTROL_MODES.TEST_2) {
    // Win testing: find and execute best chains
    if (p.frameCount % 30 === 0 && gameState.fallingBalls.length === 0) {
      const bestChain = findBestChain();
      if (bestChain.length >= 2) {
        executeChain(bestChain, p);
      }
    }
  }
}

function findBestChain() {
  let bestChain = [];
  
  for (let row = 0; row < gameState.gridRows; row++) {
    for (let col = 0; col < gameState.gridCols; col++) {
      const ball = gameState.grid[row][col];
      if (!ball || ball.isObstacle) continue;
      
      const chain = buildChainFrom(ball, []);
      if (chain.length > bestChain.length) {
        bestChain = chain;
      }
    }
  }
  
  return bestChain;
}

function buildChainFrom(ball, visited) {
  const chain = [ball];
  visited.push(ball);
  
  const neighbors = getNeighbors(ball.gridY, ball.gridX);
  for (const neighbor of neighbors) {
    const nBall = gameState.grid[neighbor.row][neighbor.col];
    if (
      nBall && 
      !nBall.isObstacle && 
      nBall.colorName === ball.colorName &&
      !visited.includes(nBall)
    ) {
      const subChain = buildChainFrom(nBall, visited);
      for (const b of subChain) {
        if (!chain.includes(b)) {
          chain.push(b);
        }
      }
    }
  }
  
  return chain;
}

function executeChain(chain, p) {
  for (const b of gameState.currentChain) {
    b.isChained = false;
  }
  
  gameState.currentChain = chain;
  for (const ball of chain) {
    ball.isChained = true;
  }
  
  setTimeout(() => {
    clearChain(p);
  }, 100);
}