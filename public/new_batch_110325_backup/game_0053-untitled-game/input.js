// input.js - Input handling

import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, POLO_IDLE, POLO_WALKING } from './globals.js';
import { startGame, pauseGame, unpauseGame, restartGame, startPoloWalking, rewindPolo } from './game_logic.js';

let p5Instance = null;

export function initInput(p) {
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
  
  // Game phase transitions
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === PHASE_START) {
      startGame(p);
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === PHASE_PLAYING) {
      pauseGame(p);
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      unpauseGame(p);
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === PHASE_GAME_OVER_WIN || 
        gameState.gamePhase === PHASE_GAME_OVER_LOSE ||
        gameState.gamePhase === PHASE_PLAYING ||
        gameState.gamePhase === PHASE_PAUSED) {
      restartGame(p);
    }
    return;
  }
  
  // Gameplay controls
  if (gameState.gamePhase === PHASE_PLAYING) {
    handleGameplayInput(p, keyCode);
  }
}

function handleGameplayInput(p, keyCode) {
  // Cooldown check
  if (p.frameCount - gameState.lastActionFrame < gameState.inputCooldown) {
    return;
  }
  
  // Arrow keys: select panels
  if (keyCode === 37) { // LEFT
    selectPreviousPanel();
    gameState.lastActionFrame = p.frameCount;
  } else if (keyCode === 39) { // RIGHT
    selectNextPanel();
    gameState.lastActionFrame = p.frameCount;
  }
  // Space: swap selected panels
  else if (keyCode === 32) { // SPACE
    swapSelectedPanels();
    gameState.lastActionFrame = p.frameCount;
  }
  // Z: start Polo walking
  else if (keyCode === 90) { // Z
    if (gameState.poloState === POLO_IDLE) {
      startPoloWalking(p);
      gameState.lastActionFrame = p.frameCount;
    }
  }
  // Shift: rewind
  else if (keyCode === 16) { // SHIFT
    if (gameState.rewindAvailable && gameState.poloState !== POLO_IDLE) {
      rewindPolo(p);
      gameState.lastActionFrame = p.frameCount;
    }
  }
}

function selectPreviousPanel() {
  if (gameState.panels.length === 0) return;
  
  // Find currently selected panel
  let currentIndex = -1;
  for (let i = 0; i < gameState.panels.length; i++) {
    if (gameState.panels[i].selected) {
      currentIndex = i;
      break;
    }
  }
  
  // If none selected, select first
  if (currentIndex === -1) {
    gameState.panels[0].selected = true;
    gameState.selectedPanels = [0];
    return;
  }
  
  // If one selected, move selection left
  if (gameState.selectedPanels.length === 1) {
    gameState.panels[currentIndex].selected = false;
    const newIndex = (currentIndex - 1 + gameState.panels.length) % gameState.panels.length;
    gameState.panels[newIndex].selected = true;
    gameState.selectedPanels = [newIndex];
  }
}

function selectNextPanel() {
  if (gameState.panels.length === 0) return;
  
  // Find currently selected panel
  let currentIndex = -1;
  for (let i = 0; i < gameState.panels.length; i++) {
    if (gameState.panels[i].selected) {
      currentIndex = i;
      break;
    }
  }
  
  // If none selected, select first
  if (currentIndex === -1) {
    gameState.panels[0].selected = true;
    gameState.selectedPanels = [0];
    return;
  }
  
  // If one selected and we can select a second
  if (gameState.selectedPanels.length === 1) {
    const newIndex = (currentIndex + 1) % gameState.panels.length;
    
    // If start or exit, skip
    if (gameState.panels[newIndex].type === "START" || gameState.panels[newIndex].type === "EXIT") {
      // Keep current selection
      return;
    }
    
    gameState.panels[newIndex].selected = true;
    gameState.selectedPanels.push(newIndex);
  } else {
    // Two selected, move to next
    gameState.panels[currentIndex].selected = false;
    const newIndex = (currentIndex + 1) % gameState.panels.length;
    gameState.panels[newIndex].selected = true;
    gameState.selectedPanels = [newIndex];
  }
}

function swapSelectedPanels() {
  if (gameState.selectedPanels.length !== 2) return;
  
  const [idx1, idx2] = gameState.selectedPanels;
  
  // Don't swap start or exit panels
  if (gameState.panels[idx1].type === "START" || 
      gameState.panels[idx1].type === "EXIT" ||
      gameState.panels[idx2].type === "START" || 
      gameState.panels[idx2].type === "EXIT") {
    return;
  }
  
  // Swap panels
  [gameState.panels[idx1], gameState.panels[idx2]] = [gameState.panels[idx2], gameState.panels[idx1]];
  
  // Update indices
  gameState.panels[idx1].index = idx1;
  gameState.panels[idx2].index = idx2;
  
  // Clear selection
  gameState.panels[idx1].selected = false;
  gameState.panels[idx2].selected = false;
  gameState.selectedPanels = [];
}

export { handleGameplayInput };