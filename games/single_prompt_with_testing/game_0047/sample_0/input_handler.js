// input_handler.js - Input handling

import {
  gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED,
  PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE
} from './globals.js';
import { initGame, handleInteraction, logInput, logGameInfo } from './game_logic.js';

export function handleKeyPressed(p, key, keyCode) {
  logInput(p, "keyPressed", { key, keyCode });
  
  // Game phase transitions
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === PHASE_START) {
      gameState.gamePhase = PHASE_PLAYING;
      gameState.startTime = Date.now();
      logGameInfo(p, { event: "game_started" });
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === PHASE_GAME_OVER_WIN || 
        gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      gameState.gamePhase = PHASE_START;
      initGame(p);
      logGameInfo(p, { event: "game_restarted" });
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === PHASE_PLAYING) {
      gameState.gamePhase = PHASE_PAUSED;
      logGameInfo(p, { event: "game_paused" });
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      gameState.gamePhase = PHASE_PLAYING;
      logGameInfo(p, { event: "game_resumed" });
    }
    return;
  }
  
  // Gameplay controls
  if (gameState.gamePhase === PHASE_PLAYING) {
    if (keyCode === 32) { // SPACE
      handleInteraction(p);
    }
    
    if (keyCode === 16) { // SHIFT
      if (gameState.player) {
        gameState.player.isSprinting = true;
      }
    }
  }
}

export function handleKeyReleased(p, key, keyCode) {
  logInput(p, "keyReleased", { key, keyCode });
  
  if (keyCode === 16) { // SHIFT
    if (gameState.player) {
      gameState.player.isSprinting = false;
    }
  }
}

export function getMovementInput(p) {
  if (gameState.controlMode !== "HUMAN") return null;
  if (gameState.gamePhase !== PHASE_PLAYING) return null;
  
  const input = {
    forward: 0,
    strafe: 0,
    turn: 0
  };
  
  if (p.keyIsDown(38) || p.keyIsDown(87)) { // UP or W
    input.forward = 1;
  }
  if (p.keyIsDown(40) || p.keyIsDown(83)) { // DOWN or S
    input.forward = -1;
  }
  if (p.keyIsDown(37) || p.keyIsDown(65)) { // LEFT or A
    input.turn = -1;
  }
  if (p.keyIsDown(39) || p.keyIsDown(68)) { // RIGHT or D
    input.turn = 1;
  }
  
  return input;
}