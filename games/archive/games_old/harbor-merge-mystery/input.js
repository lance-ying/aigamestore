// input.js - Input handling

import { gameState, LEVEL_CONFIG } from './globals.js';
import { getItemAtGridPosition, screenToGrid, isValidGridPosition, moveItemToGrid, removeItemFromGrid, initializeGrid, checkBoardFull } from './grid.js';
import { removeCompletedOrders, initializeOrders } from './orders.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Game phase controls
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === "START") {
      startGame(p);
    }
  } else if (keyCode === 27) { // ESC
    if (gameState.gamePhase === "PLAYING") {
      pauseGame(p);
    } else if (gameState.gamePhase === "PAUSED") {
      resumeGame(p);
    }
  } else if (keyCode === 82) { // R
    if (gameState.gamePhase === "PAUSED" || gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
      returnToMenu(p);
    }
  }
  
  // Gameplay controls
  if (gameState.gamePhase === "PLAYING") {
    if (keyCode === 32) { // SPACE
      handleSpacePress(p);
    } else if (keyCode === 90) { // Z
      handleZPress(p);
    } else if (keyCode >= 37 && keyCode <= 40) { // Arrow keys
      handleArrowKey(keyCode);
    }
  }
}

export function handleMousePressed(p) {
  if (gameState.gamePhase !== "PLAYING") return;
  
  const { gridX, gridY } = screenToGrid(p.mouseX, p.mouseY);
  
  if (isValidGridPosition(gridX, gridY)) {
    const item = getItemAtGridPosition(gridX, gridY);
    if (item) {
      gameState.selectedItem = item;
      gameState.draggedItem = item;
    }
  }
}

export function handleMouseReleased(p) {
  if (gameState.gamePhase !== "PLAYING") return;
  if (!gameState.draggedItem) return;
  
  const item = gameState.draggedItem;
  
  // Check if dropped in order zone
  if (isInOrderZone(p.mouseX, p.mouseY)) {
    tryFulfillOrder(p, item);
  } else {
    // Try to drop on grid
    const { gridX, gridY } = screenToGrid(p.mouseX, p.mouseY);
    if (isValidGridPosition(gridX, gridY)) {
      moveItemToGrid(item, gridX, gridY);
    }
  }
  
  gameState.draggedItem = null;
  gameState.selectedItem = null;
}

function handleSpacePress(p) {
  if (gameState.selectedItem) {
    // Drop selected item
    gameState.selectedItem = null;
  } else {
    // Select item at cursor
    const item = getItemAtGridPosition(gameState.cursorX, gameState.cursorY);
    if (item) {
      gameState.selectedItem = item;
    }
  }
}

function handleZPress(p) {
  if (!gameState.selectedItem) return;
  
  const item = gameState.selectedItem;
  
  // Try to fulfill order
  if (tryFulfillOrder(p, item)) {
    gameState.selectedItem = null;
  }
}

function handleArrowKey(keyCode) {
  switch (keyCode) {
    case 37: // LEFT
      gameState.cursorX = Math.max(0, gameState.cursorX - 1);
      break;
    case 38: // UP
      gameState.cursorY = Math.max(0, gameState.cursorY - 1);
      break;
    case 39: // RIGHT
      gameState.cursorX = Math.min(gameState.gridSize - 1, gameState.cursorX + 1);
      break;
    case 40: // DOWN
      gameState.cursorY = Math.min(gameState.gridSize - 1, gameState.cursorY + 1);
      break;
  }
}

function isInOrderZone(x, y) {
  const ORDER_ZONE_X = 480;
  const ORDER_ZONE_Y = 80;
  const ORDER_ZONE_WIDTH = 100;
  const ORDER_ZONE_HEIGHT = 300;
  
  return x >= ORDER_ZONE_X && x <= ORDER_ZONE_X + ORDER_ZONE_WIDTH &&
         y >= ORDER_ZONE_Y && y <= ORDER_ZONE_Y + ORDER_ZONE_HEIGHT;
}

function tryFulfillOrder(p, item) {
  for (const order of gameState.orders) {
    if (order.matches(item)) {
      order.fulfill(item);
      removeItemFromGrid(item);
      
      if (order.completed) {
        gameState.ordersCompleted++;
        removeCompletedOrders();
        
        // Check level completion
        const config = LEVEL_CONFIG[gameState.currentLevel];
        if (gameState.ordersCompleted >= config.ordersToComplete) {
          completeLevel(p);
        }
      }
      
      return true;
    }
  }
  
  return false;
}

function startGame(p) {
  gameState.gamePhase = "PLAYING";
  gameState.currentLevel = 0;
  gameState.score = 0;
  gameState.ordersCompleted = 0;
  
  initializeLevel(p, 0);
  
  p.logs.game_info.push({
    data: { phase: "PLAYING", level: 1 },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
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

function returnToMenu(p) {
  gameState.gamePhase = "START";
  p.logs.game_info.push({
    data: { phase: "START" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function completeLevel(p) {
  gameState.score += 500; // Bonus points
  
  if (gameState.currentLevel >= 4) {
    // Game won!
    gameState.gamePhase = "GAME_OVER_WIN";
    updateHighScore();
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_WIN", finalScore: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else {
    gameState.gamePhase = "LEVEL_TRANSITION";
    gameState.transitionTimer = 180; // 3 seconds
    p.logs.game_info.push({
      data: { phase: "LEVEL_TRANSITION", level: gameState.currentLevel + 1 },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function initializeLevel(p, levelIndex) {
  gameState.currentLevel = levelIndex;
  gameState.ordersCompleted = 0;
  gameState.spawnTimer = 0;
  gameState.cursorX = 0;
  gameState.cursorY = 0;
  
  initializeGrid(levelIndex);
  initializeOrders(levelIndex);
}

function updateHighScore() {
  if (gameState.score > gameState.highScore) {
    gameState.highScore = gameState.score;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('harborMergeHighScore', gameState.highScore.toString());
    }
  }
}

export function checkGameOver(p) {
  if (checkBoardFull()) {
    gameState.gamePhase = "GAME_OVER_LOSE";
    updateHighScore();
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_LOSE", finalScore: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}