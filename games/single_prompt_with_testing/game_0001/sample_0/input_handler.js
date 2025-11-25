// input_handler.js - Input handling

import {
  KEY_ENTER, KEY_ESC, KEY_R, KEY_SPACE, KEY_Z, KEY_SHIFT,
  KEY_LEFT, KEY_UP, KEY_RIGHT, KEY_DOWN,
  PHASE_START, PHASE_PLAYING, PHASE_PAUSED,
  PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE,
  gameState
} from './globals.js';

export function handleKeyPressed(p, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key: p.key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase transition keys
  if (keyCode === KEY_ENTER && gameState.gamePhase === PHASE_START) {
    return 'START_GAME';
  }
  
  if (keyCode === KEY_ESC && gameState.gamePhase === PHASE_PLAYING) {
    return 'PAUSE';
  }
  
  if (keyCode === KEY_ESC && gameState.gamePhase === PHASE_PAUSED) {
    return 'UNPAUSE';
  }
  
  if (keyCode === KEY_R && (gameState.gamePhase === PHASE_GAME_OVER_WIN || 
                             gameState.gamePhase === PHASE_GAME_OVER_LOSE)) {
    return 'RESTART';
  }
  
  return null;
}

export function handleGameplayInput(p) {
  if (gameState.controlMode === 'HUMAN') {
    return handleHumanInput(p);
  } else {
    return handleAutomatedInput();
  }
}

function handleHumanInput(p) {
  const actions = {
    moveLeft: p.keyIsDown(KEY_LEFT),
    moveRight: p.keyIsDown(KEY_RIGHT),
    moveUp: p.keyIsDown(KEY_UP),
    moveDown: p.keyIsDown(KEY_DOWN),
    shoot: p.keyIsDown(KEY_SPACE),
    bomb: false, // Handled in keyPressed
    special: p.keyIsDown(KEY_SHIFT)
  };
  
  return actions;
}

function handleAutomatedInput() {
  if (typeof window.get_automated_testing_action === 'function') {
    return window.get_automated_testing_action(gameState);
  }
  return {
    moveLeft: false,
    moveRight: false,
    moveUp: false,
    moveDown: false,
    shoot: false,
    bomb: false,
    special: false
  };
}

export function processBombInput(p, keyCode) {
  if (keyCode === KEY_Z && gameState.gamePhase === PHASE_PLAYING) {
    return true;
  }
  return false;
}