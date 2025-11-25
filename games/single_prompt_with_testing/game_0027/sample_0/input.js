// input.js - Input handling

import { gameState, KEY_LEFT, KEY_UP, KEY_RIGHT, KEY_DOWN, KEY_ENTER, KEY_ESC, KEY_R } from './globals.js';
import { PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN } from './globals.js';
import { movePlayer } from './movement.js';
import { parseRules } from './rules.js';
import { loadLevel } from './game_logic.js';

export function handleKeyPress(p, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  // Phase-specific controls
  if (keyCode === KEY_ENTER && gameState.gamePhase === PHASE_START) {
    gameState.gamePhase = PHASE_PLAYING;
    gameState.score = 0;
    gameState.level = 1;
    loadLevel(0);
    logGameInfo(p, "Game started");
    return;
  }

  if (keyCode === KEY_ESC) {
    if (gameState.gamePhase === PHASE_PLAYING) {
      gameState.gamePhase = PHASE_PAUSED;
      logGameInfo(p, "Game paused");
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      gameState.gamePhase = PHASE_PLAYING;
      logGameInfo(p, "Game resumed");
    }
    return;
  }

  if (keyCode === KEY_R) {
    gameState.gamePhase = PHASE_START;
    logGameInfo(p, "Game restarted");
    return;
  }

  // Gameplay controls
  if (gameState.gamePhase === PHASE_PLAYING) {
    handleGameplayInput(p, keyCode);
  }
}

function handleGameplayInput(p, keyCode) {
  let moved = false;

  if (keyCode === KEY_LEFT) {
    moved = movePlayer(-1, 0);
  } else if (keyCode === KEY_RIGHT) {
    moved = movePlayer(1, 0);
  } else if (keyCode === KEY_UP) {
    moved = movePlayer(0, -1);
  } else if (keyCode === KEY_DOWN) {
    moved = movePlayer(0, 1);
  }

  if (moved) {
    gameState.moves++;
    parseRules(); // Re-parse rules after movement
    logPlayerInfo(p);
  }
}

function logGameInfo(p, data) {
  p.logs.game_info.push({
    data: data,
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function logPlayerInfo(p) {
  if (gameState.player && !gameState.player.deleted) {
    p.logs.player_info.push({
      screen_x: gameState.player.getCurrentX(),
      screen_y: gameState.player.getCurrentY(),
      game_x: gameState.player.gridX,
      game_y: gameState.player.gridY,
      framecount: p.frameCount
    });
  }
}

export function processAutomatedInput(p, action) {
  if (action && action.keyCode) {
    handleKeyPress(p, action.keyCode);
  }
}