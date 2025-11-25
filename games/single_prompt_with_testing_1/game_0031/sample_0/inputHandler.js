// inputHandler.js - Input handling for player and automated testing
import { gameState, KEY_LEFT, KEY_UP, KEY_RIGHT, KEY_DOWN, KEY_SPACE, KEY_SHIFT } from './globals.js';

export function getPlayerInput(p) {
  return {
    left: p.keyIsDown(KEY_LEFT),
    right: p.keyIsDown(KEY_RIGHT),
    up: p.keyIsDown(KEY_UP),
    down: p.keyIsDown(KEY_DOWN),
    space: p.keyIsDown(KEY_SPACE),
    shift: p.keyIsDown(KEY_SHIFT)
  };
}

export function getAutomatedInput(p) {
  if (typeof window.get_automated_testing_action === 'function') {
    const action = window.get_automated_testing_action(gameState);
    return {
      left: action.left || false,
      right: action.right || false,
      up: action.up || false,
      down: action.down || false,
      space: action.space || false,
      shift: action.shift || false
    };
  }
  
  // Default: no input
  return {
    left: false,
    right: false,
    up: false,
    down: false,
    space: false,
    shift: false
  };
}

export function getCurrentInput(p) {
  if (gameState.controlMode === 'HUMAN') {
    return getPlayerInput(p);
  } else {
    return getAutomatedInput(p);
  }
}