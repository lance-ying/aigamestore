// input_handler.js - Input handling

import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';
import { initGame } from './game_logic.js';
import { processTraveler } from './game_logic.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Global controls
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === PHASE_START) {
      gameState.gamePhase = PHASE_PLAYING;
      initGame(p);
      p.logs.game_info.push({
        data: { phase: PHASE_PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
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
      gameState.lastTimeUpdate = Date.now();
      p.logs.game_info.push({
        data: { phase: PHASE_PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === PHASE_GAME_OVER_WIN || 
        gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      gameState.gamePhase = PHASE_START;
      p.logs.game_info.push({
        data: { phase: PHASE_START },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  // Gameplay controls
  if (gameState.gamePhase === PHASE_PLAYING && gameState.currentTraveler) {
    handleGameplayInput(p, keyCode);
  }
}

function handleGameplayInput(p, keyCode) {
  // Inspect mode toggle
  if (keyCode === 16) { // SHIFT
    if (gameState.selectedDocument !== null) {
      gameState.inspectMode = !gameState.inspectMode;
    }
    return;
  }
  
  // In inspect mode, only allow exit
  if (gameState.inspectMode) {
    return;
  }
  
  // Arrow keys for document selection
  if (keyCode === 37 || keyCode === 39) { // LEFT/RIGHT
    if (gameState.selectedDocument === null) {
      gameState.selectedDocument = 0;
    } else {
      gameState.selectedDocument = (gameState.selectedDocument + 1) % 2;
    }
    return;
  }
  
  if (keyCode === 38 || keyCode === 40) { // UP/DOWN
    // Toggle between approve/deny buttons
    gameState.uiState.selectedButton = 
      gameState.uiState.selectedButton === "approve" ? "deny" : "approve";
    return;
  }
  
  // Action keys
  if (keyCode === 32) { // SPACE - Approve
    processTraveler(true);
    return;
  }
  
  if (keyCode === 90) { // Z - Deny
    processTraveler(false);
    return;
  }
}