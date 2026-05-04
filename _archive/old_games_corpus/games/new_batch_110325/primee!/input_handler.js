// input_handler.js - Input handling
import { gameState } from './globals.js';
import { PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, MODE_HUMAN } from './globals.js';
import { initGame, tapNumber, cutNumber } from './game_logic.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  gameState.keys[keyCode] = true;
  
  // Global controls
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === PHASE_START) {
      gameState.gamePhase = PHASE_PLAYING;
      initGame(p);
    }
  } else if (keyCode === 27) { // ESC
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
  } else if (keyCode === 82) { // R
    if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      gameState.gamePhase = PHASE_START;
      p.logs.game_info.push({
        data: { phase: PHASE_START, action: "restart" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  // Gameplay controls (only in PLAYING phase and HUMAN mode)
  if (gameState.gamePhase === PHASE_PLAYING && gameState.controlMode === MODE_HUMAN) {
    if (keyCode === 32) { // SPACE - tap
      tapNumber(p, gameState.cursor);
    } else if (keyCode === 90) { // Z - cut
      cutNumber(p, gameState.cursor);
    }
  }
}

export function handleKeyReleased(p, key, keyCode) {
  gameState.keys[keyCode] = false;
}

export function processMovement(p) {
  if (gameState.gamePhase !== PHASE_PLAYING || !gameState.cursor) return;
  
  if (gameState.controlMode === MODE_HUMAN) {
    let dx = 0;
    let dy = 0;
    
    if (gameState.keys[37]) dx -= 1; // LEFT
    if (gameState.keys[39]) dx += 1; // RIGHT
    if (gameState.keys[38]) dy -= 1; // UP
    if (gameState.keys[40]) dy += 1; // DOWN
    
    const boosted = gameState.keys[16]; // SHIFT
    
    if (dx !== 0 || dy !== 0) {
      gameState.cursor.move(dx, dy, boosted);
    }
  }
}