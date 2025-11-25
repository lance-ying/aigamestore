// Input handling

import { gameState, KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_SPACE, KEY_SHIFT, KEY_Z, KEY_ENTER, KEY_ESC, KEY_R, PHASE_START, PHASE_PLAYING, PHASE_PAUSED } from './globals.js';

// Key state tracking
export const keys = {};

export function handleKeyPressed(p) {
  keys[p.keyCode] = true;
  
  // Log input
  if (p.logs && p.logs.inputs) {
    p.logs.inputs.push({
      input_type: 'keyPressed',
      data: { key: p.key, keyCode: p.keyCode },
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Phase control - ENTER
  if (p.keyCode === KEY_ENTER) {
    if (gameState.gamePhase === PHASE_START) {
      startGame(p);
    }
  }
  
  // Phase control - ESC
  if (p.keyCode === KEY_ESC) {
    if (gameState.gamePhase === PHASE_PLAYING) {
      gameState.gamePhase = PHASE_PAUSED;
      logGameInfo(p, PHASE_PAUSED);
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      gameState.gamePhase = PHASE_PLAYING;
      logGameInfo(p, PHASE_PLAYING);
    }
  }
  
  // Phase control - R (Restart)
  if (p.keyCode === KEY_R) {
    if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
      restartGame(p);
    }
  }
}

export function handleKeyReleased(p) {
  keys[p.keyCode] = false;
  
  // Log input
  if (p.logs && p.logs.inputs) {
    p.logs.inputs.push({
      input_type: 'keyReleased',
      data: { key: p.key, keyCode: p.keyCode },
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
}

export function isKeyPressed(keyCode) {
  return keys[keyCode] === true;
}

export function handleGameplayInput() {
  if (gameState.gamePhase !== PHASE_PLAYING || !gameState.player || gameState.player.isDead) {
    return;
  }
  
  // Movement
  if (isKeyPressed(KEY_LEFT)) {
    gameState.player.moveLeft();
  }
  if (isKeyPressed(KEY_RIGHT)) {
    gameState.player.moveRight();
  }
  
  // Jump
  if (isKeyPressed(KEY_UP)) {
    gameState.player.jump();
    keys[KEY_UP] = false; // Prevent holding
  }
  
  // Shooting
  if (isKeyPressed(KEY_SPACE)) {
    gameState.player.shoot();
  }
  
  // Dash
  if (isKeyPressed(KEY_SHIFT)) {
    gameState.player.dash();
    keys[KEY_SHIFT] = false; // Prevent holding
  }
  
  // Parry
  if (isKeyPressed(KEY_Z)) {
    gameState.player.parry();
    keys[KEY_Z] = false; // Prevent holding
  }
}

function startGame(p) {
  gameState.gamePhase = PHASE_PLAYING;
  logGameInfo(p, PHASE_PLAYING);
}

function restartGame(p) {
  // Import and reset game
  import('./game.js').then(module => {
    module.initializeGame(p);
    gameState.gamePhase = PHASE_START;
    logGameInfo(p, PHASE_START);
  });
}

function logGameInfo(p, phase) {
  if (p.logs && p.logs.game_info) {
    p.logs.game_info.push({
      data: { gamePhase: phase },
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
}