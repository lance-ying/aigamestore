// inputHandler.js - Handle player input

import { 
  gameState, 
  PHASE_START, 
  PHASE_PLAYING, 
  PHASE_PAUSED,
  GRID_COLS,
  GRID_ROWS,
  TRAP_DEFINITIONS,
  TRAP_ARROW,
  TRAP_SPIKE,
  TRAP_FIRE,
  TRAP_ICE
} from './globals.js';
import { Trap } from './entities.js';
import { isOnPath } from './pathGenerator.js';

export function handleKeyPressed(p, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // ENTER - Start game
  if (keyCode === 13 && gameState.gamePhase === PHASE_START) {
    gameState.gamePhase = PHASE_PLAYING;
    p.logs.game_info.push({
      data: { phase: PHASE_PLAYING },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // ESC - Pause/Unpause
  if (keyCode === 27) {
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
  }
  
  // R - Restart
  if (keyCode === 82) {
    // Reset will happen in game.js
  }
  
  // Game controls (only during PLAYING phase)
  if (gameState.gamePhase === PHASE_PLAYING) {
    handleGameplayInput(p, keyCode);
  }
}

function handleGameplayInput(p, keyCode) {
  // Arrow keys - Move cursor
  if (keyCode === 37) { // Left
    gameState.cursor.x = Math.max(0, gameState.cursor.x - 1);
  } else if (keyCode === 39) { // Right
    gameState.cursor.x = Math.min(GRID_COLS - 1, gameState.cursor.x + 1);
  } else if (keyCode === 38) { // Up
    gameState.cursor.y = Math.max(0, gameState.cursor.y - 1);
  } else if (keyCode === 40) { // Down
    gameState.cursor.y = Math.min(GRID_ROWS - 1, gameState.cursor.y + 1);
  }
  
  // Space - Open trap menu or close it
  if (keyCode === 32) {
    gameState.showTrapMenu = !gameState.showTrapMenu;
  }
  
  // Number keys - Select trap from menu
  if (gameState.showTrapMenu) {
    if (keyCode >= 49 && keyCode <= 52) { // Keys 1-4
      const trapIndex = keyCode - 49;
      const trapTypes = [TRAP_ARROW, TRAP_SPIKE, TRAP_FIRE, TRAP_ICE];
      if (trapIndex < trapTypes.length) {
        placeTrap(trapTypes[trapIndex], p);
        gameState.showTrapMenu = false;
      }
    }
  }
  
  // Z - Upgrade trap
  if (keyCode === 90) {
    upgradeTrapAtCursor();
  }
  
  // Shift - Sell trap
  if (keyCode === 16) {
    sellTrapAtCursor();
  }
}

function placeTrap(trapType, p) {
  const gridX = gameState.cursor.x;
  const gridY = gameState.cursor.y;
  
  // Check if position is valid
  if (isOnPath(gridX, gridY, gameState.path)) {
    return; // Can't place on path
  }
  
  // Check if there's already a trap here
  const existingTrap = gameState.traps.find(t => t.gridX === gridX && t.gridY === gridY);
  if (existingTrap) {
    return;
  }
  
  const def = TRAP_DEFINITIONS[trapType];
  if (gameState.gold < def.cost) {
    return; // Can't afford
  }
  
  // Place trap
  gameState.gold -= def.cost;
  const trap = new Trap(trapType, gridX, gridY, def);
  gameState.traps.push(trap);
  gameState.entities.push(trap);
}

function upgradeTrapAtCursor() {
  const gridX = gameState.cursor.x;
  const gridY = gameState.cursor.y;
  
  const trap = gameState.traps.find(t => t.gridX === gridX && t.gridY === gridY);
  if (trap) {
    trap.upgrade();
  }
}

function sellTrapAtCursor() {
  const gridX = gameState.cursor.x;
  const gridY = gameState.cursor.y;
  
  const trapIndex = gameState.traps.findIndex(t => t.gridX === gridX && t.gridY === gridY);
  if (trapIndex !== -1) {
    const trap = gameState.traps[trapIndex];
    trap.sell();
    gameState.traps.splice(trapIndex, 1);
    const entityIndex = gameState.entities.indexOf(trap);
    if (entityIndex !== -1) {
      gameState.entities.splice(entityIndex, 1);
    }
  }
}

export function updateHoveredTrap() {
  const gridX = gameState.cursor.x;
  const gridY = gameState.cursor.y;
  
  const trap = gameState.traps.find(t => t.gridX === gridX && t.gridY === gridY);
  gameState.hoveredTrap = trap || null;
}