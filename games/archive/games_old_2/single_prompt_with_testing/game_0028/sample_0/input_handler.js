// input_handler.js - Input handling for keyboard and automated testing

import { gameState, GAME_PHASES } from './globals.js';
import get_automated_testing_action from './automated_testing_controller.js';

export function handleKeyPressed(p) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Game phase transitions
  if (p.keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      startGame(p);
    }
    return;
  }
  
  if (p.keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { event: "paused" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { event: "resumed" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (p.keyCode === 82) { // R
    if (
      gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN ||
      gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE
    ) {
      resetGame(p);
    }
    return;
  }
  
  // Gameplay inputs (only during PLAYING phase)
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  // Upgrade menu inputs
  if (gameState.showUpgradeMenu) {
    if (p.keyCode >= 49 && p.keyCode <= 51) { // 1, 2, 3
      const index = p.keyCode - 49;
      if (index < gameState.availableUpgrades.length) {
        gameState.player.applyUpgrade(gameState.availableUpgrades[index]);
      }
    }
    return;
  }
  
  // Regular gameplay inputs
  updateKeyState(p.keyCode, true);
}

export function handleKeyReleased(p) {
  updateKeyState(p.keyCode, false);
}

function updateKeyState(keyCode, pressed) {
  switch (keyCode) {
    case 37: // Left
      gameState.keys.left = pressed;
      break;
    case 39: // Right
      gameState.keys.right = pressed;
      break;
    case 38: // Up
      gameState.keys.up = pressed;
      break;
    case 40: // Down
      gameState.keys.down = pressed;
      break;
    case 32: // Space
      gameState.keys.space = pressed;
      break;
    case 16: // Shift
      if (pressed && gameState.player) {
        gameState.player.autoAim = !gameState.player.autoAim;
      }
      break;
    case 90: // Z
      if (pressed && gameState.player) {
        gameState.player.activateShield();
      }
      break;
  }
}

export function processAutomatedInput(p) {
  if (gameState.controlMode === "HUMAN") return;
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  if (gameState.showUpgradeMenu) {
    // Auto-select first upgrade in automated mode
    if (gameState.availableUpgrades.length > 0) {
      gameState.player.applyUpgrade(gameState.availableUpgrades[0]);
    }
    return;
  }
  
  const action = get_automated_testing_action(gameState);
  
  // Reset all keys
  gameState.keys.left = false;
  gameState.keys.right = false;
  gameState.keys.up = false;
  gameState.keys.down = false;
  gameState.keys.space = false;
  gameState.keys.z = false;
  
  // Apply action
  if (action.left) gameState.keys.left = true;
  if (action.right) gameState.keys.right = true;
  if (action.up) gameState.keys.up = true;
  if (action.down) gameState.keys.down = true;
  if (action.fire) gameState.keys.space = true;
  if (action.ability) gameState.keys.z = true;
  if (action.toggleAutoAim && gameState.player) {
    gameState.player.autoAim = true;
  }
}

function startGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  
  // Initialize player
  const Player = require('./player.js').Player;
  gameState.player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  gameState.entities = [gameState.player];
  
  // Reset game state
  gameState.enemies = [];
  gameState.projectiles = [];
  gameState.pickups = [];
  gameState.score = 0;
  gameState.survivalTime = 0;
  gameState.waveLevel = 1;
  gameState.lastWaveTime = 0;
  gameState.enemiesDefeated = 0;
  gameState.totalDamageDealt = 0;
  gameState.showUpgradeMenu = false;
  gameState.availableUpgrades = [];
  
  p.logs.game_info.push({
    data: { event: "game_started" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function resetGame(p) {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.player = null;
  gameState.entities = [];
  gameState.enemies = [];
  gameState.projectiles = [];
  gameState.pickups = [];
  
  p.logs.game_info.push({
    data: { event: "game_reset" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}