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
  
  // Find currently selected panels
  const selectedIndices = gameState.selectedPanels;
  
  // If we have 2 selected, clear and start over
  if (selectedIndices.length >= 2) {
    clearSelection();
    return;
  }
  
  // If one selected, move selection left
  if (selectedIndices.length === 1) {
    const currentIndex = selectedIndices[0];
    gameState.panels[currentIndex].selected = false;
    gameState.panels[currentIndex].selectionOrder = 0;
    
    let newIndex = currentIndex - 1;
    if (newIndex < 0) newIndex = gameState.panels.length - 1;
    
    gameState.panels[newIndex].selected = true;
    gameState.panels[newIndex].selectionOrder = 1;
    gameState.selectedPanels = [newIndex];
  } else {
    // None selected, select last
    const idx = gameState.panels.length - 1;
    gameState.panels[idx].selected = true;
    gameState.panels[idx].selectionOrder = 1;
    gameState.selectedPanels = [idx];
  }
}

function selectNextPanel() {
  if (gameState.panels.length === 0) return;
  
  const selectedIndices = gameState.selectedPanels;
  
  // If we have 2 selected, clear and start over
  if (selectedIndices.length >= 2) {
    clearSelection();
    return;
  }
  
  // If one selected
  if (selectedIndices.length === 1) {
    const currentIndex = selectedIndices[0];
    
    // Find next valid panel (skip START and EXIT)
    let newIndex = (currentIndex + 1) % gameState.panels.length;
    let attempts = 0;
    while ((gameState.panels[newIndex].type === "START" || 
            gameState.panels[newIndex].type === "EXIT") && 
           attempts < gameState.panels.length) {
      newIndex = (newIndex + 1) % gameState.panels.length;
      attempts++;
    }
    
    // If we found a valid panel and it's different from current
    if (newIndex !== currentIndex && 
        gameState.panels[newIndex].type !== "START" && 
        gameState.panels[newIndex].type !== "EXIT") {
      gameState.panels[newIndex].selected = true;
      gameState.panels[newIndex].selectionOrder = 2;
      gameState.selectedPanels.push(newIndex);
    }
  } else {
    // None selected, select first valid
    let idx = 0;
    while (idx < gameState.panels.length && 
           (gameState.panels[idx].type === "START" || 
            gameState.panels[idx].type === "EXIT")) {
      idx++;
    }
    if (idx < gameState.panels.length) {
      gameState.panels[idx].selected = true;
      gameState.panels[idx].selectionOrder = 1;
      gameState.selectedPanels = [idx];
    }
  }
}

function clearSelection() {
  gameState.selectedPanels.forEach(idx => {
    gameState.panels[idx].selected = false;
    gameState.panels[idx].selectionOrder = 0;
  });
  gameState.selectedPanels = [];
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
  
  // Store positions
  const pos1 = { x: gameState.panels[idx1].x, y: gameState.panels[idx1].y };
  const pos2 = { x: gameState.panels[idx2].x, y: gameState.panels[idx2].y };
  
  // Swap panels in array
  [gameState.panels[idx1], gameState.panels[idx2]] = [gameState.panels[idx2], gameState.panels[idx1]];
  
  // Swap positions visually
  gameState.panels[idx1].setPosition(pos1.x, pos1.y);
  gameState.panels[idx2].setPosition(pos2.x, pos2.y);
  
  // Update indices
  gameState.panels[idx1].index = idx1;
  gameState.panels[idx2].index = idx2;
  
  // Clear selection
  clearSelection();
}

export { handleGameplayInput };