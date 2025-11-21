// input_handler.js - Handle all keyboard input
import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';
import { initializeGame } from './game_logic.js';
import { handlePlayerCardSelection, handlePlayerLocationSelection, handlePlayerAction, handleCancelAction } from './game_logic.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  if (p.logs) {
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key, keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Global controls
  if (keyCode === 13) { // ENTER - Start game
    if (gameState.gamePhase === PHASE_START) {
      gameState.gamePhase = PHASE_PLAYING;
      initializeGame(p);
      
      if (p.logs) {
        p.logs.game_info.push({
          data: { event: "game_start", gamePhase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    return;
  }
  
  if (keyCode === 27) { // ESC - Pause/Unpause
    if (gameState.gamePhase === PHASE_PLAYING) {
      gameState.gamePhase = PHASE_PAUSED;
      p.noLoop();
      
      if (p.logs) {
        p.logs.game_info.push({
          data: { event: "game_paused", gamePhase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      gameState.gamePhase = PHASE_PLAYING;
      p.loop();
      
      if (p.logs) {
        p.logs.game_info.push({
          data: { event: "game_resumed", gamePhase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    return;
  }
  
  if (keyCode === 82) { // R - Restart
    if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      gameState.gamePhase = PHASE_START;
      
      if (p.logs) {
        p.logs.game_info.push({
          data: { event: "game_restart", gamePhase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    return;
  }
  
  // Gameplay controls
  if (gameState.gamePhase === PHASE_PLAYING) {
    handleGameplayInput(p, keyCode);
  }
}

function handleGameplayInput(p, keyCode) {
  // Arrow keys
  if (keyCode === 37) { // LEFT
    if (gameState.selectedLocationIndex >= 0) {
      const loc = gameState.locations[gameState.selectedLocationIndex];
      if (loc.type === "market") {
        handleMarketNavigation(p, "left");
      } else {
        handlePlayerLocationSelection(p, "left");
      }
    } else {
      handlePlayerCardSelection(p, "left");
    }
  } else if (keyCode === 39) { // RIGHT
    if (gameState.selectedLocationIndex >= 0) {
      const loc = gameState.locations[gameState.selectedLocationIndex];
      if (loc.type === "market") {
        handleMarketNavigation(p, "right");
      } else {
        handlePlayerLocationSelection(p, "right");
      }
    } else {
      handlePlayerCardSelection(p, "right");
    }
  } else if (keyCode === 38) { // UP
    if (gameState.selectedLocationIndex >= 0) {
      const loc = gameState.locations[gameState.selectedLocationIndex];
      if (loc.type === "market") {
        handleMarketNavigation(p, "up");
      } else {
        handlePlayerLocationSelection(p, "up");
      }
    }
  } else if (keyCode === 40) { // DOWN
    if (gameState.selectedLocationIndex >= 0) {
      const loc = gameState.locations[gameState.selectedLocationIndex];
      if (loc.type === "market") {
        handleMarketNavigation(p, "down");
      } else {
        handlePlayerLocationSelection(p, "down");
      }
    } else if (gameState.selectedCardIndex >= 0) {
      handlePlayerLocationSelection(p, "down");
    }
  } else if (keyCode === 32) { // SPACE - Confirm
    handlePlayerAction(p);
  } else if (keyCode === 90) { // Z - Cancel
    handleCancelAction(p);
  }
}

function handleMarketNavigation(p, direction) {
  const marketCards = gameState.marketCards;
  if (marketCards.length === 0) return;
  
  if (gameState.selectedCardIndex < 0) {
    gameState.selectedCardIndex = 0;
    return;
  }
  
  const cols = 4;
  const currentRow = Math.floor(gameState.selectedCardIndex / cols);
  const currentCol = gameState.selectedCardIndex % cols;
  
  let newRow = currentRow;
  let newCol = currentCol;
  
  if (direction === "left") {
    newCol = (currentCol - 1 + cols) % cols;
  } else if (direction === "right") {
    newCol = (currentCol + 1) % cols;
  } else if (direction === "up") {
    newRow = Math.max(0, currentRow - 1);
  } else if (direction === "down") {
    newRow = Math.min(1, currentRow + 1);
  }
  
  const newIndex = newRow * cols + newCol;
  if (newIndex < marketCards.length) {
    gameState.selectedCardIndex = newIndex;
  }
}