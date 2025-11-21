// input.js - Input handling
import { gameState, GRID_SIZE } from './globals.js';
import { canPlaceBlock, placeBlock, checkAndClearLines, hasAnyValidPlacement } from './grid.js';
import { generateInitialBlocks } from './block.js';
import { calculateScore, addPlacementPoints, updateHighScore } from './scoring.js';
import { initializeLevel } from './levels.js';

let p5Instance = null;

export function setP5Instance(p) {
  p5Instance = p;
}

export function handleKeyPressed(p) {
  const key = p.key;
  const keyCode = p.keyCode;
  
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
    } else if (keyCode === 82) { // R
      restartGame(p);
    } else {
      handleGameplayInput(p, keyCode);
    }
  } else if (gameState.gamePhase === "PAUSED") {
    if (keyCode === 27) { // ESC
      unpauseGame(p);
    } else if (keyCode === 82) { // R
      restartGame(p);
    }
  } else if (gameState.gamePhase === "GAME_OVER" || gameState.gamePhase === "WIN") {
    if (keyCode === 82) { // R
      restartGame(p);
    }
  }
}

function handleGameplayInput(p, keyCode) {
  // Block selection (Arrow Left/Right)
  if (keyCode === 37) { // LEFT
    gameState.selectedBlockIndex = (gameState.selectedBlockIndex - 1 + 3) % 3;
  } else if (keyCode === 39) { // RIGHT
    gameState.selectedBlockIndex = (gameState.selectedBlockIndex + 1) % 3;
  }
  
  // Cursor movement
  else if (keyCode === 38 || keyCode === 87) { // UP or W
    gameState.cursorY = Math.max(0, gameState.cursorY - 1);
  } else if (keyCode === 40 || keyCode === 83) { // DOWN or S
    gameState.cursorY = Math.min(GRID_SIZE - 1, gameState.cursorY + 1);
  } else if (keyCode === 65) { // A
    gameState.cursorX = Math.max(0, gameState.cursorX - 1);
  } else if (keyCode === 68) { // D
    gameState.cursorX = Math.min(GRID_SIZE - 1, gameState.cursorX + 1);
  }
  
  // Place block
  else if (keyCode === 32) { // SPACE
    attemptPlaceBlock(p);
  }
}

function attemptPlaceBlock(p) {
  const selectedBlock = gameState.availableBlocks[gameState.selectedBlockIndex];
  if (!selectedBlock) return;
  
  if (canPlaceBlock(gameState.grid, selectedBlock, gameState.cursorX, gameState.cursorY)) {
    // Place the block
    placeBlock(gameState.grid, selectedBlock, gameState.cursorX, gameState.cursorY);
    
    // Add placement points
    gameState.score += addPlacementPoints(selectedBlock);
    
    // Remove the placed block and generate a new one
    gameState.availableBlocks[gameState.selectedBlockIndex] = null;
    
    // Check for clears
    const { clearedCount, clearCount } = checkAndClearLines(gameState.grid);
    const clearScore = calculateScore(clearedCount, clearCount);
    gameState.score += clearScore;
    
    // Check if all blocks are used
    const allUsed = gameState.availableBlocks.every(b => b === null);
    if (allUsed) {
      gameState.availableBlocks = generateInitialBlocks(gameState.level, p);
      gameState.selectedBlockIndex = 0;
    }
    
    // Update high score
    updateHighScore();
    
    // Check level progression
    if (gameState.score >= gameState.levelTargets[gameState.level - 1]) {
      if (gameState.level < 5) {
        startLevelTransition(p);
      } else {
        // Win!
        gameState.gamePhase = "WIN";
        p.logs.game_info.push({
          data: { phase: "WIN", score: gameState.score },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    // Log player info
    logPlayerInfo(p);
    
    // Check game over after placement
    gameState.gameOverChecked = false;
  }
}

function startGame(p) {
  gameState.score = 0;
  gameState.level = 1;
  gameState.streak = 0;
  gameState.gamePhase = "PLAYING";
  gameState.gameOverChecked = false;
  
  initializeLevel(1, p);
  
  p.logs.game_info.push({
    data: { phase: "PLAYING", level: 1 },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  logPlayerInfo(p);
}

function pauseGame(p) {
  gameState.gamePhase = "PAUSED";
  p.logs.game_info.push({
    data: { phase: "PAUSED" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function unpauseGame(p) {
  gameState.gamePhase = "PLAYING";
  p.logs.game_info.push({
    data: { phase: "PLAYING" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function restartGame(p) {
  gameState.gamePhase = "START";
  gameState.score = 0;
  gameState.level = 1;
  gameState.streak = 0;
  gameState.gameOverChecked = false;
  
  p.logs.game_info.push({
    data: { phase: "START" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function startLevelTransition(p) {
  gameState.level++;
  gameState.gamePhase = "LEVEL_TRANSITION";
  gameState.transitionTimer = 0;
  
  p.logs.game_info.push({
    data: { phase: "LEVEL_TRANSITION", level: gameState.level },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function logPlayerInfo(p) {
  p.logs.player_info.push({
    screen_x: gameState.cursorX,
    screen_y: gameState.cursorY,
    game_x: gameState.cursorX,
    game_y: gameState.cursorY,
    framecount: p.frameCount
  });
}

export function checkGameOver(p) {
  if (gameState.gamePhase !== "PLAYING" || gameState.gameOverChecked) return;
  
  if (!hasAnyValidPlacement(gameState.grid, gameState.availableBlocks)) {
    gameState.gamePhase = "GAME_OVER";
    gameState.gameOverChecked = true;
    updateHighScore();
    
    p.logs.game_info.push({
      data: { phase: "GAME_OVER", score: gameState.score, level: gameState.level },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function updateLevelTransition(p) {
  gameState.transitionTimer++;
  
  if (gameState.transitionTimer >= gameState.transitionDuration) {
    gameState.gamePhase = "PLAYING";
    initializeLevel(gameState.level, p);
    
    p.logs.game_info.push({
      data: { phase: "PLAYING", level: gameState.level },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}