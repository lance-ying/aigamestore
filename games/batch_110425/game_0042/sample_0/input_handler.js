// input_handler.js - Input handling

import { 
  gameState, 
  PHASE_START, 
  PHASE_PLAYING, 
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  TRAP_DART,
  TRAP_SPRING,
  TRAP_LAVA,
  TRAP_SUMMON,
  GRID_COLS,
  GRID_ROWS
} from './globals.js';
import { initGame, setGamePhase, placeTrap, upgradeTrap, canPlaceTrap } from './game_logic.js';

const TRAP_TYPES = [TRAP_DART, TRAP_SPRING, TRAP_LAVA, TRAP_SUMMON];

export function handleKeyPressed(p) {
  const key = p.key;
  const keyCode = p.keyCode;
  
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Global controls
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === PHASE_START) {
      setGamePhase(PHASE_PLAYING, p);
      initGame(p);
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === PHASE_PLAYING) {
      setGamePhase(PHASE_PAUSED, p);
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      setGamePhase(PHASE_PLAYING, p);
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === PHASE_GAME_OVER_WIN || 
        gameState.gamePhase === PHASE_GAME_OVER_LOSE ||
        gameState.gamePhase === PHASE_PAUSED) {
      setGamePhase(PHASE_START, p);
    }
    return;
  }
  
  // Gameplay controls
  if (gameState.gamePhase === PHASE_PLAYING) {
    handleGameplayInput(keyCode, p);
  }
}

function handleGameplayInput(keyCode, p) {
  // Arrow keys - navigate
  if (keyCode === 37) { // LEFT
    if (gameState.selectedTrapType) {
      gameState.cursorPos.x = Math.max(0, gameState.cursorPos.x - 1);
    } else if (gameState.upgradingTrap) {
      gameState.upgradingTrap = null;
    } else {
      gameState.menuIndex = Math.max(0, gameState.menuIndex - 1);
    }
  }
  
  if (keyCode === 39) { // RIGHT
    if (gameState.selectedTrapType) {
      gameState.cursorPos.x = Math.min(GRID_COLS - 1, gameState.cursorPos.x + 1);
    } else if (gameState.upgradingTrap) {
      gameState.upgradingTrap = null;
    } else {
      gameState.menuIndex = Math.min(TRAP_TYPES.length - 1, gameState.menuIndex + 1);
    }
  }
  
  if (keyCode === 38) { // UP
    if (gameState.selectedTrapType) {
      gameState.cursorPos.y = Math.max(0, gameState.cursorPos.y - 1);
    }
  }
  
  if (keyCode === 40) { // DOWN
    if (gameState.selectedTrapType) {
      gameState.cursorPos.y = Math.min(GRID_ROWS - 1, gameState.cursorPos.y + 1);
    }
  }
  
  // Space - confirm action
  if (keyCode === 32) { // SPACE
    if (gameState.upgradingTrap) {
      // Confirm upgrade
      upgradeTrap(gameState.upgradingTrap, p);
      gameState.upgradingTrap = null;
    } else if (gameState.selectedTrapType) {
      // Confirm trap placement
      const success = placeTrap(
        gameState.cursorPos.x, 
        gameState.cursorPos.y, 
        gameState.selectedTrapType,
        p
      );
      if (success) {
        gameState.selectedTrapType = null;
      }
    } else {
      // Select trap from menu
      gameState.selectedTrapType = TRAP_TYPES[gameState.menuIndex];
    }
  }
  
  // Z - cancel/deselect
  if (keyCode === 90) { // Z
    if (gameState.upgradingTrap) {
      gameState.upgradingTrap = null;
    } else if (gameState.selectedTrapType) {
      gameState.selectedTrapType = null;
    } else {
      // Check if cursor is on a trap for upgrade
      const trap = gameState.grid[gameState.cursorPos.y][gameState.cursorPos.x];
      if (trap && trap.canUpgrade()) {
        gameState.upgradingTrap = trap;
      }
    }
  }
}

export function processAutomatedInput(p) {
  if (gameState.controlMode === "HUMAN") return;
  
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  // Get action from automated testing
  const action = window.get_automated_testing_action(gameState);
  
  if (action && action.keyCode) {
    // Simulate key press
    p.keyCode = action.keyCode;
    p.key = action.key || String.fromCharCode(action.keyCode);
    handleKeyPressed(p);
  }
}