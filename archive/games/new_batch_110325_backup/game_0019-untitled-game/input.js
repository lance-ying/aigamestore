// input.js - Input handling

import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, GRID_SIZE } from './globals.js';
import { placeFacility, getFacilityTypesList } from './facility.js';
import { resetGame } from './game_logic.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase-specific controls
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
        data: { phase: PHASE_PAUSED },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      gameState.gamePhase = PHASE_PLAYING;
      p.logs.game_info.push({
        data: { phase: PHASE_PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      resetGame(p);
    }
    return;
  }
  
  // Gameplay controls (only in PLAYING phase)
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return;
  }
  
  handleGameplayInput(p, keyCode);
}

function handleGameplayInput(p, keyCode) {
  const prevX = gameState.cursorX;
  const prevY = gameState.cursorY;
  
  // Arrow keys - navigation
  if (keyCode === 37) { // LEFT
    gameState.cursorX = Math.max(0, gameState.cursorX - 1);
  } else if (keyCode === 39) { // RIGHT
    gameState.cursorX = Math.min(GRID_SIZE - 1, gameState.cursorX + 1);
  } else if (keyCode === 38) { // UP
    gameState.cursorY = Math.max(0, gameState.cursorY - 1);
  } else if (keyCode === 40) { // DOWN
    gameState.cursorY = Math.min(GRID_SIZE - 1, gameState.cursorY + 1);
  }
  
  // Log position change
  if (prevX !== gameState.cursorX || prevY !== gameState.cursorY) {
    logPlayerInfo(p);
  }
  
  // Shift - toggle build menu
  if (keyCode === 16) {
    gameState.buildMenuOpen = !gameState.buildMenuOpen;
    if (gameState.buildMenuOpen) {
      gameState.selectedFacilityIndex = 0;
      const types = getFacilityTypesList();
      gameState.selectedFacilityType = types[0];
    } else {
      gameState.selectedFacilityType = null;
    }
  }
  
  // Space - place facility or navigate menu
  if (keyCode === 32) {
    if (gameState.buildMenuOpen && gameState.selectedFacilityType) {
      const success = placeFacility(gameState.selectedFacilityType, gameState.cursorX, gameState.cursorY);
      if (success) {
        gameState.buildMenuOpen = false;
        gameState.selectedFacilityType = null;
        logPlayerInfo(p);
      }
    } else if (gameState.buildMenuOpen) {
      // Cycle through facility types
      const types = getFacilityTypesList();
      gameState.selectedFacilityIndex = (gameState.selectedFacilityIndex + 1) % types.length;
      gameState.selectedFacilityType = types[gameState.selectedFacilityIndex];
    }
  }
  
  // Z - cancel/close menu
  if (keyCode === 90) {
    if (gameState.buildMenuOpen) {
      gameState.buildMenuOpen = false;
      gameState.selectedFacilityType = null;
    }
  }
}

function startGame(p) {
  gameState.gamePhase = PHASE_PLAYING;
  p.logs.game_info.push({
    data: { phase: PHASE_PLAYING, message: "Game Started" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  logPlayerInfo(p);
}

function logPlayerInfo(p) {
  p.logs.player_info.push({
    screen_x: gameState.cursorX * 40 + 20,
    screen_y: gameState.cursorY * 40 + 20,
    game_x: gameState.cursorX,
    game_y: gameState.cursorY,
    framecount: p.frameCount
  });
}