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
  // Cooldown check for navigation
  const navigationCooldown = 8;
  
  // Arrow keys: move cursor
  if (keyCode === 37) { // LEFT
    if (p.frameCount - gameState.lastActionFrame >= navigationCooldown) {
      moveCursorLeft();
      gameState.lastActionFrame = p.frameCount;
    }
  } else if (keyCode === 39) { // RIGHT
    if (p.frameCount - gameState.lastActionFrame >= navigationCooldown) {
      moveCursorRight();
      gameState.lastActionFrame = p.frameCount;
    }
  }
  // Space: select/swap
  else if (keyCode === 32) { // SPACE
    if (p.frameCount - gameState.lastActionFrame >= gameState.inputCooldown) {
      handleSelection();
      gameState.lastActionFrame = p.frameCount;
    }
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

function moveCursorLeft() {
  if (gameState.panels.length === 0) return;
  
  // Move cursor to previous swappable panel
  let newCursor = gameState.cursorIndex - 1;
  if (newCursor < 0) newCursor = gameState.panels.length - 1;
  
  // Skip START panel
  let attempts = 0;
  while (gameState.panels[newCursor].type === "START" && attempts < gameState.panels.length) {
    newCursor--;
    if (newCursor < 0) newCursor = gameState.panels.length - 1;
    attempts++;
  }
  
  gameState.cursorIndex = newCursor;
}

function moveCursorRight() {
  if (gameState.panels.length === 0) return;
  
  // Move cursor to next swappable panel
  let newCursor = gameState.cursorIndex + 1;
  if (newCursor >= gameState.panels.length) newCursor = 0;
  
  // Skip START panel
  let attempts = 0;
  while (gameState.panels[newCursor].type === "START" && attempts < gameState.panels.length) {
    newCursor++;
    if (newCursor >= gameState.panels.length) newCursor = 0;
    attempts++;
  }
  
  gameState.cursorIndex = newCursor;
}

function handleSelection() {
  if (gameState.panels.length === 0) return;
  
  const cursorPanel = gameState.panels[gameState.cursorIndex];
  
  // Can't select START panel
  if (cursorPanel.type === "START") {
    return;
  }
  
  const selectedIndices = gameState.selectedPanels;
  
  if (selectedIndices.length === 0) {
    // First selection
    cursorPanel.selected = true;
    cursorPanel.selectionOrder = 1;
    gameState.selectedPanels.push(gameState.cursorIndex);
  } else if (selectedIndices.length === 1) {
    if (selectedIndices[0] === gameState.cursorIndex) {
      // Deselect if clicking same panel
      cursorPanel.selected = false;
      cursorPanel.selectionOrder = 0;
      gameState.selectedPanels = [];
    } else {
      // Second selection - perform swap
      cursorPanel.selected = true;
      cursorPanel.selectionOrder = 2;
      gameState.selectedPanels.push(gameState.cursorIndex);
      
      // Perform swap immediately
      setTimeout(() => {
        swapSelectedPanels();
      }, 100);
    }
  } else {
    // Already have 2 selected, clear and start over
    clearSelection();
    cursorPanel.selected = true;
    cursorPanel.selectionOrder = 1;
    gameState.selectedPanels = [gameState.cursorIndex];
  }
}

function clearSelection() {
  gameState.selectedPanels.forEach(idx => {
    if (gameState.panels[idx]) {
      gameState.panels[idx].selected = false;
      gameState.panels[idx].selectionOrder = 0;
    }
  });
  gameState.selectedPanels = [];
}

function swapSelectedPanels() {
  if (gameState.selectedPanels.length !== 2) return;
  
  const [idx1, idx2] = gameState.selectedPanels;
  
  // Don't swap START panel (but EXIT is now allowed)
  if (gameState.panels[idx1].type === "START" || 
      gameState.panels[idx2].type === "START") {
    clearSelection();
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