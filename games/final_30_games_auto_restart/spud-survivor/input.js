// input.js - Input handling
import { gameState, GAME_PHASES } from './globals.js';
import { applyUpgrade, generateUpgradeOptions, generateShopItems } from './upgrades.js';
import { hasNextWave, hasNextLevel } from './waves.js';
// Import the moved and new functions from game_logic.js
import { initializeGame, resetToStart, clearAutoRestart } from './game_logic.js';
import { addHighScore } from './globals.js'; // Import addHighScore directly

export const keys = {
  w: false,
  a: false,
  s: false,
  d: false,
  up: false,
  left: false,
  down: false,
  right: false,
  space: false,
  shift: false,
  enter: false,
  escape: false,
  r: false
};

// Track keys that were just pressed this frame (for tap-based controls)
export const keysJustPressed = {
  w: false,
  a: false,
  s: false,
  d: false,
  up: false,
  left: false,
  down: false,
  right: false,
  space: false,
  shift: false,
  enter: false,
  escape: false,
  r: false
};

export function clearJustPressed() {
  for (const key in keysJustPressed) {
    keysJustPressed[key] = false;
  }
}

export function handleKeyPressed(p, keyCode, key) {
  // Log input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Update key states (for non-movement keys)
  const wasPressed = updateKeyState(keyCode, true);
  
  // Mark as just pressed (for tap-based movement)
  if (!wasPressed) {
    updateJustPressedState(keyCode, true);
  }
  
  // Phase-specific controls
  switch (gameState.gamePhase) {
    case GAME_PHASES.START:
      if (keyCode === 13) { // Enter
        startGame(p);
      }
      break;
      
    case GAME_PHASES.PLAYING:
      if (keyCode === 27) { // Escape
        gameState.gamePhase = GAME_PHASES.PAUSED;
        p.logs.game_info.push({
          data: { phase: 'PAUSED' },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (keyCode === 16) { // Shift
        if (gameState.player) {
          gameState.player.activateDash();
        }
      }
      break;
      
    case GAME_PHASES.PAUSED:
      if (keyCode === 27) { // Escape
        gameState.gamePhase = GAME_PHASES.PLAYING;
        p.logs.game_info.push({
          data: { phase: 'PLAYING' },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (keyCode === 82) { // R
        resetToStart(p); // Calls clearAutoRestart internally
      }
      break;
      
    case GAME_PHASES.LEVEL_UP_MENU:
      if (keyCode === 87 || keyCode === 38) { // W or Up
        gameState.selectedUpgradeIndex = Math.max(0, gameState.selectedUpgradeIndex - 1);
      } else if (keyCode === 83 || keyCode === 40) { // S or Down
        gameState.selectedUpgradeIndex = Math.min(gameState.availableUpgrades.length - 1, gameState.selectedUpgradeIndex + 1);
      } else if (keyCode === 32) { // Space
        const selectedUpgrade = gameState.availableUpgrades[gameState.selectedUpgradeIndex];
        applyUpgrade(selectedUpgrade);
        gameState.gamePhase = GAME_PHASES.PLAYING;
        p.logs.game_info.push({
          data: { phase: 'PLAYING', upgrade: selectedUpgrade },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      break;
      
    case GAME_PHASES.WAVE_COMPLETE:
      handleWaveCompleteInput(p, keyCode);
      break;
      
    case GAME_PHASES.GAME_OVER_WIN:
    case GAME_PHASES.GAME_OVER_LOSE:
      if (keyCode === 82) { // R
        resetToStart(p); // Calls clearAutoRestart internally
      }
      break;
  }
}

export function handleKeyReleased(p, keyCode, key) {
  // Log input
  p.logs.inputs.push({
    input_type: 'keyReleased',
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  updateKeyState(keyCode, false);
}

function updateKeyState(keyCode, pressed) {
  let wasPressed = false;
  switch (keyCode) {
    case 87: wasPressed = keys.w; keys.w = pressed; break; // W
    case 65: wasPressed = keys.a; keys.a = pressed; break; // A
    case 83: wasPressed = keys.s; keys.s = pressed; break; // S
    case 68: wasPressed = keys.d; keys.d = pressed; break; // D
    case 38: wasPressed = keys.up; keys.up = pressed; break; // Arrow Up
    case 37: wasPressed = keys.left; keys.left = pressed; break; // Arrow Left
    case 40: wasPressed = keys.down; keys.down = pressed; break; // Arrow Down
    case 39: wasPressed = keys.right; keys.right = pressed; break; // Arrow Right
    case 32: wasPressed = keys.space; keys.space = pressed; break; // Space
    case 16: wasPressed = keys.shift; keys.shift = pressed; break; // Shift
    case 13: wasPressed = keys.enter; keys.enter = pressed; break; // Enter
    case 27: wasPressed = keys.escape; keys.escape = pressed; break; // Escape
    case 82: wasPressed = keys.r; keys.r = pressed; break; // R
  }
  return wasPressed;
}

function updateJustPressedState(keyCode, pressed) {
  switch (keyCode) {
    case 87: keysJustPressed.w = pressed; break; // W
    case 65: keysJustPressed.a = pressed; break; // A
    case 83: keysJustPressed.s = pressed; break; // S
    case 68: keysJustPressed.d = pressed; break; // D
    case 38: keysJustPressed.up = pressed; break; // Arrow Up
    case 37: keysJustPressed.left = pressed; break; // Arrow Left
    case 40: keysJustPressed.down = pressed; break; // Arrow Down
    case 39: keysJustPressed.right = pressed; break; // Arrow Right
    case 32: keysJustPressed.space = pressed; break; // Space
    case 16: keysJustPressed.shift = pressed; break; // Shift
    case 13: keysJustPressed.enter = pressed; break; // Enter
    case 27: keysJustPressed.escape = pressed; break; // Escape
    case 82: keysJustPressed.r = pressed; break; // R
  }
}

function handleWaveCompleteInput(p, keyCode) {
  const isLevelComplete = gameState.currentWave >= getMaxWaveForLevel(gameState.currentLevel);
  
  if (isLevelComplete && gameState.shopItems) {
    if (keyCode === 87 || keyCode === 38) { // W or Up
      gameState.selectedUpgradeIndex = Math.max(0, gameState.selectedUpgradeIndex - 1);
    } else if (keyCode === 83 || keyCode === 40) { // S or Down
      gameState.selectedUpgradeIndex = Math.min(gameState.shopItems.length - 1, gameState.selectedUpgradeIndex + 1);
    } else if (keyCode === 32) { // Space
      const selectedItem = gameState.shopItems[gameState.selectedUpgradeIndex];
      if (gameState.materials >= selectedItem.cost) {
        gameState.materials -= selectedItem.cost;
        selectedItem.apply(gameState.player);
        p.logs.game_info.push({
          data: { action: 'shop_purchase', item: selectedItem.name },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      
      // Continue anyway
      advanceWave(p);
    }
  } else if (keyCode === 32) { // Space
    advanceWave(p);
  }
}

function advanceWave(p) {
  if (hasNextWave(gameState.currentLevel, gameState.currentWave)) {
    gameState.currentWave++;
    gameState.gamePhase = GAME_PHASES.PLAYING;
  } else if (hasNextLevel(gameState.currentLevel)) {
    gameState.currentLevel++;
    gameState.currentWave = 1;
    gameState.gamePhase = GAME_PHASES.PLAYING;
  } else {
    // Game won
    // Only transition to GAME_OVER_WIN once
    if (gameState.gamePhase !== GAME_PHASES.GAME_OVER_WIN) {
        gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
        addHighScore(gameState.score); // Use the imported addHighScore
        // Auto-restart will be scheduled by updateGame in the next frame.
    }
  }
  
  p.logs.game_info.push({
    data: { phase: gameState.gamePhase, level: gameState.currentLevel, wave: gameState.currentWave },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function getMaxWaveForLevel(level) {
  const waveConfig = {
    1: 3,
    2: 4,
    3: 5
  };
  return waveConfig[level] || 3;
}

function startGame(p) {
  clearAutoRestart(); // Clear any pending auto-restart if user presses enter from start screen
  initializeGame(p); // Now imported from game_logic.js
  gameState.gamePhase = GAME_PHASES.PLAYING;
  p.logs.game_info.push({
    data: { phase: 'PLAYING', action: 'game_start' },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}