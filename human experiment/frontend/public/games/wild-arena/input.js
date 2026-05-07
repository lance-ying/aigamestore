// input.js - Input handling for human mode

import { gameState } from './globals.js'; // Removed GAME_PHASE

export function getPlayerInputs(p) {
  // Always return human inputs as test modes are removed
  return {
    up: p.keyIsDown(38),
    down: p.keyIsDown(40),
    left: p.keyIsDown(37),
    right: p.keyIsDown(39),
    fire: p.keyIsDown(32),
    ability: p.keyIsDown(16),
    weapon1: p.keyIsDown(49), // 1 key
    weapon2: p.keyIsDown(50), // 2 key
    weapon3: p.keyIsDown(51)  // 3 key
  };
}

// generateTestActions function removed