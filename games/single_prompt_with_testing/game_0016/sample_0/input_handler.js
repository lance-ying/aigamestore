// input_handler.js - Input handling

import {
  gameState,
  GAME_PHASES
} from './globals.js';
import {
  handleGather,
  handleCraft,
  handleCampfire,
  consumeFood,
  checkPortalWin
} from './game_logic.js';

export function handleKeyPress(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Game phase transitions
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { phase: "PAUSED" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      restartGame();
      p.logs.game_info.push({
        data: { phase: "START" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  // Gameplay controls
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  if (keyCode === 32) { // SPACE
    handleGather(p);
  } else if (keyCode === 90) { // Z
    handleCraft();
  } else if (keyCode === 16) { // SHIFT
    handleCampfire();
  }
  
  // Number keys to eat food (not in controls but useful)
  if (key === '1') {
    consumeFood('berry');
  } else if (key === '2') {
    consumeFood('meat');
  }
}

export function getMovementKeys(p) {
  return {
    left: p.keyIsDown(37),
    right: p.keyIsDown(39),
    up: p.keyIsDown(38),
    down: p.keyIsDown(40)
  };
}

function restartGame() {
  // Reset game state but keep logs
  gameState.gamePhase = GAME_PHASES.START;
  gameState.hunger = 100;
  gameState.timeOfDay = 0;
  gameState.cyclesCompleted = 0;
  gameState.score = 0;
  
  gameState.inventory = {
    berry: 0,
    wood: 0,
    stone: 0,
    meat: 0,
    hasAxe: false,
    hasPickaxe: false
  };
  
  gameState.positionHistory = [];
}