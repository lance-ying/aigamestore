// input_handler.js - Handle keyboard input

import { gameState, KEY_ENTER, KEY_ESC, KEY_R, KEY_SPACE, KEY_SHIFT, KEY_LEFT, KEY_RIGHT, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, PLAYER_SPAWN_X_MIN, PLAYER_SPAWN_X_MAX, BASIC_UNIT_COST, STRONG_UNIT_COST } from './globals.js';
import { spawnPlayerUnit, resetGame } from './game_logic.js';

export function handleKeyPressed(p, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  const phase = gameState.gamePhase;
  
  // Phase transition keys
  if (keyCode === KEY_ENTER && phase === PHASE_START) {
    gameState.gamePhase = PHASE_PLAYING;
    resetGame();
    p.logs.game_info.push({
      data: { phase: "PLAYING", message: "Game started" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  if (keyCode === KEY_ESC && (phase === PHASE_PLAYING || phase === PHASE_PAUSED)) {
    gameState.gamePhase = phase === PHASE_PLAYING ? PHASE_PAUSED : PHASE_PLAYING;
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, message: phase === PHASE_PLAYING ? "Paused" : "Resumed" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  if (keyCode === KEY_R && (phase === PHASE_GAME_OVER_WIN || phase === PHASE_GAME_OVER_LOSE)) {
    gameState.gamePhase = PHASE_START;
    resetGame();
    p.logs.game_info.push({
      data: { phase: "START", message: "Restarted" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  // Gameplay keys (only in PLAYING phase)
  if (phase === PHASE_PLAYING) {
    if (keyCode === KEY_SPACE) {
      if (gameState.points >= BASIC_UNIT_COST) {
        spawnPlayerUnit('basic');
        gameState.points -= BASIC_UNIT_COST;
      }
    } else if (keyCode === KEY_SHIFT) {
      if (gameState.points >= STRONG_UNIT_COST) {
        spawnPlayerUnit('strong');
        gameState.points -= STRONG_UNIT_COST;
      }
    }
  }
}

export function handleContinuousInput(p) {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  // Cursor movement
  if (p.keyIsDown(KEY_LEFT)) {
    gameState.cursorX -= 3;
    if (gameState.cursorX < PLAYER_SPAWN_X_MIN) {
      gameState.cursorX = PLAYER_SPAWN_X_MIN;
    }
  }
  
  if (p.keyIsDown(KEY_RIGHT)) {
    gameState.cursorX += 3;
    if (gameState.cursorX > PLAYER_SPAWN_X_MAX) {
      gameState.cursorX = PLAYER_SPAWN_X_MAX;
    }
  }
}

export function processAutomatedInput(p, action) {
  if (!action) return;
  
  if (action.keyPressed) {
    handleKeyPressed(p, action.keyPressed);
  }
}