// input_handler.js - Handle all user inputs

import {
  gameState,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  MONSTER_SLOTS
} from './globals.js';
import { startGame, selectUpgrade, deployMonster, useSelectedMonsterSkill } from './game_logic.js';

let p5Instance = null;

export function setP5Instance(p) {
  p5Instance = p;
}

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
  
  // Phase transitions
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === PHASE_START) {
      startGame();
      return;
    }
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === PHASE_PLAYING) {
      gameState.gamePhase = PHASE_PAUSED;
      p.logs.game_info.push({
        data: { phase: "PAUSED" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      gameState.gamePhase = PHASE_PLAYING;
      p.logs.game_info.push({
        data: { phase: "PLAYING" },
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
        data: { phase: "START" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  // Game controls
  if (gameState.gamePhase === PHASE_PLAYING && !gameState.showUpgradeScreen) {
    handlePlayingInput(p, keyCode);
  } else if (gameState.showUpgradeScreen) {
    handleUpgradeInput(p, keyCode);
  }
}

function handlePlayingInput(p, keyCode) {
  // Z - Cycle through monsters
  if (keyCode === 90) {
    if (gameState.monsters.length > 0) {
      gameState.selectedMonsterIndex = (gameState.selectedMonsterIndex + 1) % gameState.monsters.length;
    }
    return;
  }
  
  // Shift - Quick select slot
  if (keyCode === 16) {
    gameState.selectedSlotIndex = (gameState.selectedSlotIndex + 1) % MONSTER_SLOTS.length;
    return;
  }
  
  // Arrow keys - Navigate slots or cycle monster types
  if (keyCode === 37 || keyCode === 38 || keyCode === 39 || keyCode === 40) {
    if (keyCode === 37) { // LEFT
      gameState.selectedSlotIndex = Math.max(0, gameState.selectedSlotIndex - 1);
    } else if (keyCode === 39) { // RIGHT
      gameState.selectedSlotIndex = Math.min(MONSTER_SLOTS.length - 1, gameState.selectedSlotIndex + 1);
    } else if (keyCode === 38) { // UP
      gameState.selectedSlotIndex = Math.max(0, gameState.selectedSlotIndex - 2);
    } else if (keyCode === 40) { // DOWN
      gameState.selectedSlotIndex = Math.min(MONSTER_SLOTS.length - 1, gameState.selectedSlotIndex + 2);
    }
    return;
  }
  
  // Space - Deploy monster or use skill
  if (keyCode === 32) {
    if (gameState.selectedMonsterIndex >= 0) {
      // Use skill
      useSelectedMonsterSkill();
    } else if (gameState.availableMonsterTypes.length > 0) {
      // Deploy monster to selected slot
      const typeIndex = gameState.availableMonsterTypes[0];
      deployMonster(gameState.selectedSlotIndex, typeIndex);
    }
    return;
  }
}

function handleUpgradeInput(p, keyCode) {
  // Arrow keys - Navigate upgrades
  if (keyCode === 38) { // UP
    gameState.selectedUpgrade = Math.max(0, gameState.selectedUpgrade - 1);
  } else if (keyCode === 40) { // DOWN
    gameState.selectedUpgrade = Math.min(gameState.upgradeOptions.length - 1, gameState.selectedUpgrade + 1);
  }
  
  // Space - Select upgrade
  if (keyCode === 32) {
    selectUpgrade(gameState.selectedUpgrade);
  }
}