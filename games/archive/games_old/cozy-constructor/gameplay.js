// gameplay.js - Core gameplay logic

import { gameState, GAME_PHASE } from './globals.js';
import { LEVELS } from './levels.js';
import { createItemsFromLevel, checkValidPlacement } from './item.js';
import { checkAllRules } from './rules.js';
import { getTestAction } from './input.js';

export function initializeLevel(p) {
  const levelConfig = LEVELS[gameState.currentLevel];
  
  gameState.gridSize = levelConfig.gridSize;
  gameState.inventory = createItemsFromLevel(levelConfig);
  gameState.placedItems = [];
  gameState.heldItem = null;
  gameState.selectedInventoryIndex = -1;
  gameState.levelTimeLimit = levelConfig.timeLimit;
  gameState.levelStartTime = Date.now();
  gameState.timeRemaining = levelConfig.timeLimit;
  gameState.levelScore = 0;
  
  // Calculate grid display
  const gridDisplaySize = Math.min(350, 350);
  gameState.cellSize = Math.floor(gridDisplaySize / gameState.gridSize);
  const actualGridSize = gameState.cellSize * gameState.gridSize;
  gameState.gridOffsetX = 20;
  gameState.gridOffsetY = 80;
  
  // Log level start
  p.logs.game_info.push({
    data: { phase: "LEVEL_START", level: gameState.currentLevel + 1 },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function updateGameplay(p) {
  if (gameState.gamePhase !== GAME_PHASE.PLAYING) return;
  
  // Handle automated testing
  if (gameState.controlMode !== "HUMAN") {
    const testAction = getTestAction(p);
    if (testAction) {
      executeAction(p, testAction.action);
    }
  }
  
  // Update timer
  const elapsed = (Date.now() - gameState.levelStartTime) / 1000;
  gameState.timeRemaining = Math.max(0, gameState.levelTimeLimit - elapsed);
  
  // Check for time out
  if (gameState.timeRemaining <= 0) {
    gameOver(p, false);
  }
  
  // Check for level completion
  const levelConfig = LEVELS[gameState.currentLevel];
  const ruleCheck = checkAllRules(levelConfig);
  if (ruleCheck.passed) {
    levelComplete(p);
  }
}

export function handleKeyPress(p, keyCode, key) {
  // Global controls
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASE.START) {
      startGame(p);
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASE.PLAYING) {
      pauseGame(p);
    } else if (gameState.gamePhase === GAME_PHASE.PAUSED) {
      resumeGame(p);
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASE.GAME_OVER || 
        gameState.gamePhase === GAME_PHASE.LEVEL_COMPLETE ||
        gameState.gamePhase === GAME_PHASE.WIN) {
      restart(p);
    }
    return;
  }
  
  // Gameplay controls
  if (gameState.gamePhase === GAME_PHASE.PLAYING) {
    if (keyCode === 37) { // LEFT
      executeAction(p, "MOVE_LEFT");
    } else if (keyCode === 39) { // RIGHT
      executeAction(p, "MOVE_RIGHT");
    } else if (keyCode === 38) { // UP
      executeAction(p, "MOVE_UP");
    } else if (keyCode === 40) { // DOWN
      executeAction(p, "MOVE_DOWN");
    } else if (keyCode === 32) { // SPACE
      executeAction(p, "PLACE");
    } else if (keyCode === 90) { // Z
      executeAction(p, "ROTATE");
    } else if (keyCode === 16) { // SHIFT
      executeAction(p, "CANCEL");
    }
  }
  
  // Level complete/game over controls
  if (gameState.gamePhase === GAME_PHASE.LEVEL_COMPLETE) {
    if (keyCode === 32) { // SPACE for next level
      nextLevel(p);
    }
  }
}

function executeAction(p, action) {
  if (action === "MOVE_LEFT" && gameState.heldItem) {
    gameState.heldItemGridX = Math.max(0, gameState.heldItemGridX - 1);
    gameState.heldItem.gridX = gameState.heldItemGridX;
  } else if (action === "MOVE_RIGHT" && gameState.heldItem) {
    gameState.heldItemGridX = Math.min(gameState.gridSize - 1, gameState.heldItemGridX + 1);
    gameState.heldItem.gridX = gameState.heldItemGridX;
  } else if (action === "MOVE_UP" && gameState.heldItem) {
    gameState.heldItemGridY = Math.max(0, gameState.heldItemGridY - 1);
    gameState.heldItem.gridY = gameState.heldItemGridY;
  } else if (action === "MOVE_DOWN" && gameState.heldItem) {
    gameState.heldItemGridY = Math.min(gameState.gridSize - 1, gameState.heldItemGridY + 1);
    gameState.heldItem.gridY = gameState.heldItemGridY;
  } else if (action === "ROTATE" && gameState.heldItem) {
    gameState.heldItem.rotate();
  } else if (action === "PLACE" && gameState.heldItem) {
    attemptPlacement(p);
  } else if (action === "CANCEL" && gameState.heldItem) {
    cancelPlacement();
  } else if (action === "SELECT_NEXT") {
    selectNextItem();
  } else if (action === "SELECT_PREV") {
    selectPrevItem();
  }
  
  // Log player position if held item exists
  if (gameState.heldItem) {
    const screenX = gameState.gridOffsetX + gameState.heldItem.gridX * gameState.cellSize;
    const screenY = gameState.gridOffsetY + gameState.heldItem.gridY * gameState.cellSize;
    p.logs.player_info.push({
      screen_x: screenX,
      screen_y: screenY,
      game_x: gameState.heldItem.gridX,
      game_y: gameState.heldItem.gridY,
      framecount: p.frameCount
    });
  }
}

function attemptPlacement(p) {
  if (!gameState.heldItem) return;
  
  if (checkValidPlacement(gameState.heldItem)) {
    gameState.heldItem.isPlaced = true;
    gameState.placedItems.push(gameState.heldItem);
    
    // Award points
    gameState.levelScore += 50;
    gameState.score += 50;
    
    // Clear held item
    gameState.heldItem = null;
    gameState.selectedInventoryIndex = -1;
    
    p.logs.game_info.push({
      data: { action: "ITEM_PLACED", score: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function cancelPlacement() {
  gameState.heldItem = null;
  gameState.selectedInventoryIndex = -1;
}

function selectNextItem() {
  // Find next unplaced item
  for (let i = 0; i < gameState.inventory.length; i++) {
    const item = gameState.inventory[i];
    if (!item.isPlaced) {
      gameState.selectedInventoryIndex = i;
      gameState.heldItem = item;
      gameState.heldItemGridX = Math.floor(gameState.gridSize / 2);
      gameState.heldItemGridY = Math.floor(gameState.gridSize / 2);
      gameState.heldItem.gridX = gameState.heldItemGridX;
      gameState.heldItem.gridY = gameState.heldItemGridY;
      return;
    }
  }
}

function selectPrevItem() {
  // Find previous unplaced item
  for (let i = gameState.inventory.length - 1; i >= 0; i--) {
    const item = gameState.inventory[i];
    if (!item.isPlaced) {
      gameState.selectedInventoryIndex = i;
      gameState.heldItem = item;
      gameState.heldItemGridX = Math.floor(gameState.gridSize / 2);
      gameState.heldItemGridY = Math.floor(gameState.gridSize / 2);
      gameState.heldItem.gridX = gameState.heldItemGridX;
      gameState.heldItem.gridY = gameState.heldItemGridY;
      return;
    }
  }
}

function startGame(p) {
  gameState.gamePhase = GAME_PHASE.PLAYING;
  gameState.currentLevel = 0;
  gameState.score = 0;
  initializeLevel(p);
  
  p.logs.game_info.push({
    data: { phase: "GAME_START" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function pauseGame(p) {
  gameState.gamePhase = GAME_PHASE.PAUSED;
  p.logs.game_info.push({
    data: { phase: "PAUSED" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function resumeGame(p) {
  gameState.gamePhase = GAME_PHASE.PLAYING;
  // Adjust start time to account for pause
  const pauseDuration = Date.now() - gameState.levelStartTime;
  gameState.levelStartTime = Date.now() - (gameState.levelTimeLimit - gameState.timeRemaining) * 1000;
  
  p.logs.game_info.push({
    data: { phase: "RESUMED" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function levelComplete(p) {
  gameState.gamePhase = GAME_PHASE.LEVEL_COMPLETE;
  
  // Calculate time bonus
  const timeBonus = Math.max(0, Math.floor(1000 - (gameState.levelTimeLimit - gameState.timeRemaining) * 10));
  const levelBonus = 200;
  const totalLevelScore = gameState.levelScore + timeBonus + levelBonus;
  gameState.score += timeBonus + levelBonus;
  
  p.logs.game_info.push({
    data: { phase: "LEVEL_COMPLETE", level: gameState.currentLevel + 1, score: gameState.score },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function nextLevel(p) {
  gameState.currentLevel++;
  
  if (gameState.currentLevel >= LEVELS.length) {
    winGame(p);
  } else {
    gameState.gamePhase = GAME_PHASE.PLAYING;
    initializeLevel(p);
  }
}

function gameOver(p, win) {
  gameState.gamePhase = GAME_PHASE.GAME_OVER;
  
  p.logs.game_info.push({
    data: { phase: "GAME_OVER", win, score: gameState.score },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function winGame(p) {
  gameState.gamePhase = GAME_PHASE.WIN;
  
  // Update high score
  if (gameState.score > gameState.highScore) {
    gameState.highScore = gameState.score;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('cozyConstructorHighScore', gameState.score.toString());
    }
  }
  
  p.logs.game_info.push({
    data: { phase: "WIN", score: gameState.score },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function restart(p) {
  gameState.gamePhase = GAME_PHASE.START;
  gameState.currentLevel = 0;
  gameState.score = 0;
  gameState.levelScore = 0;
  gameState.inventory = [];
  gameState.placedItems = [];
  gameState.heldItem = null;
  
  p.logs.game_info.push({
    data: { phase: "RESTART" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function loadHighScore() {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('cozyConstructorHighScore');
    if (saved) {
      gameState.highScore = parseInt(saved, 10);
    }
  }
}