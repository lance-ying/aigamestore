// input.js - Input handling

import { gameState, GAME_PHASES, TOWER_TYPES } from './globals.js';
import { placeTower, sellTower } from './tower.js';
import { getSlotAt } from './path.js';

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
    if (gameState.gamePhase === GAME_PHASES.START) {
      startGame(p);
    }
    return;
  }
  
  if (keyCode === 82) { // R
    resetGame(p);
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { event: "game_paused" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { event: "game_resumed" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  // Playing controls
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    handlePlayingInput(p, keyCode);
  }
}

function handlePlayingInput(p, keyCode) {
  // Arrow keys for navigation
  if (keyCode === 37) { // LEFT
    gameState.cursorX = Math.max(0, gameState.cursorX - 1);
  } else if (keyCode === 39) { // RIGHT
    gameState.cursorX = Math.min(5, gameState.cursorX + 1);
  } else if (keyCode === 38) { // UP
    gameState.cursorY = Math.max(0, gameState.cursorY - 1);
  } else if (keyCode === 40) { // DOWN
    gameState.cursorY = Math.min(2, gameState.cursorY + 1);
  }
  
  // Update selected slot
  const slotIndex = gameState.cursorY * 6 + gameState.cursorX;
  if (slotIndex < gameState.towerSlots.length) {
    gameState.selectedSlot = gameState.towerSlots[slotIndex];
    gameState.selectedTower = gameState.selectedSlot.tower;
  }
  
  // Space - Open menu or confirm selection
  if (keyCode === 32) { // SPACE
    if (gameState.showTowerMenu) {
      // Confirm tower purchase
      confirmTowerPurchase(p);
    } else if (gameState.selectedSlot && !gameState.selectedSlot.tower) {
      // Open tower menu
      gameState.showTowerMenu = true;
      gameState.menuSelection = 0;
    }
  }
  
  // Z - Cancel or sell
  if (keyCode === 90) { // Z
    if (gameState.showTowerMenu) {
      gameState.showTowerMenu = false;
    } else if (gameState.selectedTower) {
      sellTower(gameState.selectedTower);
      gameState.selectedTower = null;
    }
  }
  
  // Shift - Upgrade
  if (keyCode === 16) { // SHIFT
    if (gameState.selectedTower) {
      gameState.selectedTower.upgrade();
    }
  }
}

function confirmTowerPurchase(p) {
  if (!gameState.selectedSlot) return;
  
  const types = Object.keys(TOWER_TYPES);
  const menuSelection = gameState.menuSelection || 0;
  const selectedType = types[Math.min(menuSelection, types.length - 1)];
  
  if (placeTower(gameState.selectedSlot, selectedType)) {
    gameState.showTowerMenu = false;
    gameState.selectedTower = gameState.selectedSlot.tower;
    
    p.logs.game_info.push({
      data: { event: "tower_placed", type: selectedType, slot: gameState.selectedSlot.id },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function startGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  gameState.wave = 0;
  gameState.waveTimer = 0;
  
  p.logs.game_info.push({
    data: { event: "game_started", gamePhase: gameState.gamePhase },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function resetGame(p) {
  // Clear all entities
  gameState.towers = [];
  gameState.enemies = [];
  gameState.projectiles = [];
  gameState.particles = [];
  
  // Reset slots
  for (let slot of gameState.towerSlots) {
    slot.tower = null;
  }
  
  // Reset game state
  gameState.score = 0;
  gameState.gold = 200;
  gameState.lives = 20;
  gameState.wave = 0;
  gameState.waveTimer = 0;
  gameState.enemiesSpawned = 0;
  gameState.selectedSlot = null;
  gameState.selectedTower = null;
  gameState.showTowerMenu = false;
  gameState.levelComplete = false;
  gameState.cursorX = 0;
  gameState.cursorY = 0;
  gameState.gamePhase = GAME_PHASES.START;
  
  p.logs.game_info.push({
    data: { event: "game_reset", gamePhase: gameState.gamePhase },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function setupInput(p) {
  p.keyPressed = () => handleKeyPressed(p);
}