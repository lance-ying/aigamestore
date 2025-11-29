// input.js - Input handling

import { gameState } from './globals.js';
import { drawFromStock, pickUpCard, dropCard, undo, autoMoveToFoundation, canAutoComplete, performAutoComplete } from './gameLogic.js';
import { LEVEL_CONFIG } from './levelManager.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase control keys
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === "START") {
      startGame(p);
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === "PLAYING") {
      gameState.gamePhase = "PAUSED";
      logGameInfo(p);
    } else if (gameState.gamePhase === "PAUSED") {
      gameState.gamePhase = "PLAYING";
      logGameInfo(p);
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
      restartGame(p);
    }
    return;
  }
  
  // Gameplay keys
  if (gameState.gamePhase !== "PLAYING") return;
  
  if (keyCode === 37) { // Arrow Left
    navigateLeft();
  } else if (keyCode === 38) { // Arrow Up
    navigateUp();
  } else if (keyCode === 39) { // Arrow Right
    navigateRight();
  } else if (keyCode === 40) { // Arrow Down
    navigateDown();
  } else if (keyCode === 32) { // Space
    handleSpaceKey();
  } else if (keyCode === 16) { // Shift
    toggleDrawMode();
  } else if (keyCode === 90) { // Z
    undo();
  } else if (keyCode === 87) { // W
    drawFromStock();
  } else if (keyCode === 65) { // A
    if (canAutoComplete()) {
      performAutoComplete();
    }
  } else if (keyCode === 83) { // S
    handleAutoMove();
  }
}

function startGame(p) {
  gameState.gamePhase = "PLAYING";
  gameState.score = 0;
  gameState.moves = 0;
  gameState.startTime = Date.now();
  gameState.levelStartTime = Date.now();
  gameState.elapsedTime = 0;
  gameState.selectedPile = { type: 'tableau', index: 0 };
  gameState.selectedCardIndex = null;
  gameState.pickedUpCards = null;
  gameState.undoStack = [];
  gameState.autoCompleting = false;
  
  // Initialize player state
  gameState.player = {
    selectedPile: gameState.selectedPile,
    selectedCardIndex: gameState.selectedCardIndex
  };
  
  logGameInfo(p);
}

function restartGame(p) {
  gameState.gamePhase = "START";
  gameState.selectedPile = null;
  gameState.selectedCardIndex = null;
  gameState.pickedUpCards = null;
  logGameInfo(p);
}

function navigateLeft() {
  if (!gameState.selectedPile) {
    gameState.selectedPile = { type: 'tableau', index: 0 };
    return;
  }
  
  const { type, index } = gameState.selectedPile;
  
  if (type === 'tableau') {
    if (index > 0) {
      gameState.selectedPile = { type: 'tableau', index: index - 1 };
    } else {
      gameState.selectedPile = { type: 'foundation', index: 3 };
    }
  } else if (type === 'foundation') {
    if (index > 0) {
      gameState.selectedPile = { type: 'foundation', index: index - 1 };
    } else {
      gameState.selectedPile = { type: 'waste', index: 0 };
    }
  } else if (type === 'waste') {
    gameState.selectedPile = { type: 'stock', index: 0 };
  } else if (type === 'stock') {
    gameState.selectedPile = { type: 'tableau', index: 6 };
  }
  
  gameState.selectedCardIndex = null;
}

function navigateRight() {
  if (!gameState.selectedPile) {
    gameState.selectedPile = { type: 'tableau', index: 0 };
    return;
  }
  
  const { type, index } = gameState.selectedPile;
  
  if (type === 'tableau') {
    if (index < 6) {
      gameState.selectedPile = { type: 'tableau', index: index + 1 };
    } else {
      gameState.selectedPile = { type: 'stock', index: 0 };
    }
  } else if (type === 'stock') {
    gameState.selectedPile = { type: 'waste', index: 0 };
  } else if (type === 'waste') {
    gameState.selectedPile = { type: 'foundation', index: 0 };
  } else if (type === 'foundation') {
    if (index < 3) {
      gameState.selectedPile = { type: 'foundation', index: index + 1 };
    } else {
      gameState.selectedPile = { type: 'tableau', index: 0 };
    }
  }
  
  gameState.selectedCardIndex = null;
}

function navigateUp() {
  if (!gameState.selectedPile || gameState.selectedPile.type !== 'tableau') return;
  
  const column = gameState.tableau[gameState.selectedPile.index];
  if (column.length === 0) return;
  
  if (gameState.selectedCardIndex === null) {
    gameState.selectedCardIndex = column.length - 1;
  } else if (gameState.selectedCardIndex > 0) {
    gameState.selectedCardIndex--;
  }
}

function navigateDown() {
  if (!gameState.selectedPile || gameState.selectedPile.type !== 'tableau') return;
  
  const column = gameState.tableau[gameState.selectedPile.index];
  if (column.length === 0) return;
  
  if (gameState.selectedCardIndex === null) {
    gameState.selectedCardIndex = 0;
  } else if (gameState.selectedCardIndex < column.length - 1) {
    gameState.selectedCardIndex++;
  }
}

function handleSpaceKey() {
  if (gameState.pickedUpCards) {
    // Try to drop
    if (gameState.selectedPile) {
      dropCard(gameState.selectedPile.type, gameState.selectedPile.index);
    }
  } else {
    // Try to pick up
    if (gameState.selectedPile) {
      const { type, index } = gameState.selectedPile;
      
      if (type === 'stock') {
        drawFromStock();
      } else if (type === 'tableau') {
        const cardIndex = gameState.selectedCardIndex !== null ? 
                         gameState.selectedCardIndex : 
                         (gameState.tableau[index].length - 1);
        pickUpCard(type, index, cardIndex);
      } else if (type === 'waste') {
        pickUpCard(type, index, gameState.waste.length - 1);
      }
    }
  }
}

function handleAutoMove() {
  if (!gameState.selectedPile) return;
  
  const { type, index } = gameState.selectedPile;
  let card = null;
  
  if (type === 'tableau') {
    const column = gameState.tableau[index];
    if (column.length > 0) {
      card = column[column.length - 1];
    }
  } else if (type === 'waste' && gameState.waste.length > 0) {
    card = gameState.waste[gameState.waste.length - 1];
  }
  
  if (card) {
    const foundationIndex = autoMoveToFoundation(card);
    if (foundationIndex >= 0) {
      pickUpCard(type, index, type === 'tableau' ? gameState.tableau[index].length - 1 : gameState.waste.length - 1);
      dropCard('foundation', foundationIndex);
    }
  }
}

function toggleDrawMode() {
  const config = LEVEL_CONFIG[gameState.level];
  if (config.allowDrawToggle) {
    gameState.drawMode = gameState.drawMode === 1 ? 3 : 1;
  }
}

function logGameInfo(p) {
  p.logs.game_info.push({
    data: { gamePhase: gameState.gamePhase, level: gameState.level },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}