import { gameState } from './globals.js';
import { resetGameState } from './utils.js';

// Key codes
export const KEY_LEFT = 37;
export const KEY_UP = 38;
export const KEY_RIGHT = 39;
export const KEY_DOWN = 40;
export const KEY_SPACE = 32;
export const KEY_SHIFT = 16;
export const KEY_Z = 90;
export const KEY_ENTER = 13;
export const KEY_ESC = 27;
export const KEY_R = 82;

// Handle key pressed events
export function handleKeyPressed(p, keyCode) {
  // Log the key press
  p.logs.inputs.push({
    "input_type": "keyPressed",
    "data": { key: p.key, keyCode: keyCode },
    "framecount": p.frameCount,
    "timestamp": Date.now()
  });
  
  // Handle game phase transitions
  if (gameState.gamePhase === "START" && keyCode === KEY_ENTER) {
    gameState.gamePhase = "PLAYING";
    p.logs.game_info.push({
      "game_status": gameState.gamePhase,
      "data": {},
      "framecount": p.frameCount,
      "timestamp": Date.now()
    });
    return;
  }
  
  if ((gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") && keyCode === KEY_R) {
    gameState.gamePhase = "START";
    resetGameState();
    p.logs.game_info.push({
      "game_status": gameState.gamePhase,
      "data": {},
      "framecount": p.frameCount,
      "timestamp": Date.now()
    });
    return;
  }
  
  if (gameState.gamePhase === "PLAYING" && keyCode === KEY_ESC) {
    gameState.gamePhase = "PAUSED";
    p.logs.game_info.push({
      "game_status": gameState.gamePhase,
      "data": {},
      "framecount": p.frameCount,
      "timestamp": Date.now()
    });
    return;
  }
  
  if (gameState.gamePhase === "PAUSED" && keyCode === KEY_ESC) {
    gameState.gamePhase = "PLAYING";
    p.logs.game_info.push({
      "game_status": gameState.gamePhase,
      "data": {},
      "framecount": p.frameCount,
      "timestamp": Date.now()
    });
    return;
  }
}

// Process game controls during gameplay
export function processGameControls(p, keyCode) {
  if (gameState.gamePhase !== "PLAYING") return;
  
  const currentBlock = gameState.currentBlock;
  
  switch (keyCode) {
    case KEY_LEFT:
      currentBlock.x = Math.max(0, currentBlock.x - 1);
      break;
    case KEY_RIGHT:
      currentBlock.x = Math.min(
        gameState.grid[0].length - gameState.availableBlocks[gameState.selectedBlockIndex].shape[0].length, 
        currentBlock.x + 1
      );
      break;
    case KEY_UP:
      currentBlock.y = Math.max(0, currentBlock.y - 1);
      break;
    case KEY_DOWN:
      currentBlock.y = Math.min(
        gameState.grid.length - gameState.availableBlocks[gameState.selectedBlockIndex].shape.length, 
        currentBlock.y + 1
      );
      break;
    case KEY_Z:
      // Cycle through available blocks
      gameState.selectedBlockIndex = (gameState.selectedBlockIndex + 1) % gameState.availableBlocks.length;
      gameState.currentBlock.shape = gameState.availableBlocks[gameState.selectedBlockIndex].shape;
      break;
  }
  
  // Log player position
  p.logs.player_info.push({
    "screen_x": currentBlock.x,
    "screen_y": currentBlock.y,
    "game_x": currentBlock.x,
    "game_y": currentBlock.y,
    "framecount": p.frameCount,
    "timestamp": Date.now()
  });
}

// Set the control mode
export function setControlMode(mode) {
  gameState.controlMode = mode;
  
  // Update UI buttons
  const buttons = document.querySelectorAll('.control-button');
  buttons.forEach(button => {
    button.classList.remove('active');
  });
  
  if (mode === "HUMAN") {
    document.getElementById("humanModeBtn").classList.add('active');
  } else {
    document.getElementById(`${mode.toLowerCase()}_ModeBtn`).classList.add('active');
  }
}

// Expose setControlMode globally
window.setControlMode = setControlMode;