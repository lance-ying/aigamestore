// input.js - Input handling

import { gameState, GAME_PHASES, FISHING_PHASES } from './globals.js';
import { castLine, steerLure, shootWeapon, openShop, closeShop } from './fishing.js';
import { purchaseUpgrade } from './shop.js';
import { startGame, togglePause, restartGame } from './game.js';

export function handleKeyPressed(p) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Game phase controls
  if (p.keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      startGame(p);
    }
    return;
  }
  
  if (p.keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      togglePause(p);
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      togglePause(p);
    }
    return;
  }
  
  if (p.keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      restartGame(p);
    }
    return;
  }
  
  // Gameplay controls
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  // Shop controls
  if (p.keyCode === 16) { // SHIFT
    if (gameState.fishingPhase === FISHING_PHASES.SURFACE) {
      openShop();
    } else if (gameState.fishingPhase === FISHING_PHASES.SHOP) {
      closeShop();
    }
    return;
  }
  
  // Shop purchases
  if (gameState.fishingPhase === FISHING_PHASES.SHOP) {
    if (p.key === '1') {
      purchaseUpgrade(p, 'line');
    } else if (p.key === '2') {
      purchaseUpgrade(p, 'speed');
    } else if (p.key === '3') {
      purchaseUpgrade(p, 'weapon');
    }
    return;
  }
  
  // Cast line
  if (p.keyCode === 90) { // Z
    castLine(p);
  }
  
  // Shoot weapon
  if (p.keyCode === 32) { // SPACE
    shootWeapon(p);
  }
}

export function handleKeyReleased(p) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyReleased",
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Stop steering
  if (p.keyCode === 37 || p.keyCode === 39) {
    if (gameState.player) {
      gameState.player.vx = 0;
    }
  }
}

export function handleContinuousInput(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  if (gameState.fishingPhase !== FISHING_PHASES.DESCENDING) return;
  
  // Steering
  if (p.keyIsDown(37)) { // LEFT
    steerLure(-1);
  } else if (p.keyIsDown(39)) { // RIGHT
    steerLure(1);
  } else {
    if (gameState.player) {
      gameState.player.vx *= 0.9; // Decelerate
    }
  }
}