// input.js - Input handling

import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';
import { initializeGameState } from './globals.js';
import { selectCard, executeAction, cancelAction } from './game_logic.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Global keys
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === PHASE_START) {
      startGame(p);
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === PHASE_PLAYING) {
      gameState.gamePhase = PHASE_PAUSED;
      p.logs.game_info.push({
        data: { gamePhase: PHASE_PAUSED },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      gameState.gamePhase = PHASE_PLAYING;
      p.logs.game_info.push({
        data: { gamePhase: PHASE_PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      restartGame(p);
    }
    return;
  }
  
  // Playing controls
  if (gameState.gamePhase === PHASE_PLAYING && gameState.currentPlayer === 0 && gameState.controlMode === "HUMAN") {
    handlePlayingInput(p, keyCode);
  }
}

function handlePlayingInput(p, keyCode) {
  if (gameState.actionState === "SELECT_CARD") {
    // Card selection with arrow keys (left/right)
    if (keyCode === 37) { // Left arrow
      gameState.selectedCardIndex = Math.max(0, gameState.selectedCardIndex - 1);
    } else if (keyCode === 39) { // Right arrow
      gameState.selectedCardIndex = Math.min(gameState.cardMarket.length - 1, gameState.selectedCardIndex + 1);
    } else if (keyCode === 32) { // Space - confirm
      if (gameState.selectedCardIndex >= 0) {
        selectCard(gameState.selectedCardIndex);
      }
    }
  } else if (gameState.actionState === "SELECT_REGION") {
    // Region selection with arrow keys
    if (keyCode === 37 || keyCode === 38 || keyCode === 39 || keyCode === 40) {
      navigateRegions(keyCode);
    } else if (keyCode === 32) { // Space - confirm
      if (gameState.selectedRegionId >= 0) {
        executeAction(gameState.selectedRegionId);
      }
    } else if (keyCode === 90) { // Z - cancel
      cancelAction();
    }
  }
}

function navigateRegions(keyCode) {
  if (gameState.selectedRegionId < 0) {
    gameState.selectedRegionId = 0;
    return;
  }
  
  const currentRegion = gameState.regions[gameState.selectedRegionId];
  let closest = gameState.selectedRegionId;
  let minDist = Infinity;
  
  gameState.regions.forEach((region, idx) => {
    if (idx === gameState.selectedRegionId) return;
    
    const dx = region.x - currentRegion.x;
    const dy = region.y - currentRegion.y;
    
    let isInDirection = false;
    if (keyCode === 37 && dx < -20) isInDirection = true; // Left
    if (keyCode === 39 && dx > 20) isInDirection = true;  // Right
    if (keyCode === 38 && dy < -20) isInDirection = true; // Up
    if (keyCode === 40 && dy > 20) isInDirection = true;  // Down
    
    if (isInDirection) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        closest = idx;
      }
    }
  });
  
  gameState.selectedRegionId = closest;
}

function startGame(p) {
  initializeGameState();
  gameState.gamePhase = PHASE_PLAYING;
  gameState.selectedCardIndex = 0;
  gameState.selectedRegionId = -1;
  
  p.logs.game_info.push({
    data: { gamePhase: PHASE_PLAYING, message: "Game Started" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function restartGame(p) {
  initializeGameState();
  gameState.gamePhase = PHASE_START;
  
  p.logs.game_info.push({
    data: { gamePhase: PHASE_START, message: "Game Restarted" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}