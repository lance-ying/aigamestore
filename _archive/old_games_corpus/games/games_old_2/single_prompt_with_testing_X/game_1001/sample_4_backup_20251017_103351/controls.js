// controls.js - Input handling and automated test controls

import { gameState, TRICK_TYPES } from './globals.js';
import { handleTrickScoring } from './physics.js';

export function handlePlayerInput(p) {
  if (!gameState.player || gameState.gamePhase !== 'PLAYING') {
    return;
  }
  
  const keys = p.keyIsDown.bind(p);
  
  // Space - Push
  if (keys(32)) {
    gameState.player.push();
  }
  
  // A - Steer Left
  if (keys(65)) {
    gameState.player.steerLeft();
  }
  
  // D - Steer Right
  if (keys(68)) {
    gameState.player.steerRight();
  }
}

export function handleKeyPressed(p, keyCode) {
  if (!gameState.player || gameState.gamePhase !== 'PLAYING') {
    return;
  }
  
  // Arrow Up - Ollie
  if (keyCode === 38) {
    if (gameState.player.ollie()) {
      handleTrickScoring(TRICK_TYPES.OLLIE, p);
      gameState.currentTrick = TRICK_TYPES.OLLIE;
    }
  }
  
  // Arrow Down - Manual
  if (keyCode === 40) {
    if (gameState.player.startManual()) {
      gameState.currentTrick = TRICK_TYPES.MANUAL;
    }
  }
  
  // Arrow Left - Kickflip Left
  if (keyCode === 37) {
    if (gameState.player.kickflip(-1)) {
      handleTrickScoring(TRICK_TYPES.KICKFLIP_LEFT, p);
      gameState.currentTrick = TRICK_TYPES.KICKFLIP_LEFT;
    }
  }
  
  // Arrow Right - Kickflip Right
  if (keyCode === 39) {
    if (gameState.player.kickflip(1)) {
      handleTrickScoring(TRICK_TYPES.KICKFLIP_RIGHT, p);
      gameState.currentTrick = TRICK_TYPES.KICKFLIP_RIGHT;
    }
  }
  
  // W - Grind
  if (keyCode === 87) {
    const nearestRail = findNearestRail();
    if (gameState.player.grind(nearestRail)) {
      gameState.currentTrick = TRICK_TYPES.GRIND;
    }
  }
}

function findNearestRail() {
  if (!gameState.player || gameState.rails.length === 0) {
    return null;
  }
  
  let nearest = null;
  let minDist = Infinity;
  
  for (const rail of gameState.rails) {
    const dx = rail.body.position.x - gameState.player.body.position.x;
    const dy = rail.body.position.y - gameState.player.body.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < minDist) {
      minDist = dist;
      nearest = rail;
    }
  }
  
  return nearest;
}

export function generateTestInputs(mode) {
  const inputs = [];
  
  if (mode === 'TEST_1') {
    // Basic test - push, ollie, land
    inputs.push(
      { frame: 10, key: 32, type: 'down' },  // Push
      { frame: 30, key: 32, type: 'up' },
      { frame: 50, key: 38, type: 'press' }, // Ollie
      { frame: 100, key: 32, type: 'down' }, // Push again
      { frame: 120, key: 32, type: 'up' },
      { frame: 150, key: 38, type: 'press' }, // Another ollie
      { frame: 160, key: 37, type: 'press' }  // Kickflip
    );
  } else if (mode === 'TEST_2') {
    // Win test - perform many tricks
    for (let i = 0; i < 20; i++) {
      inputs.push(
        { frame: i * 50 + 10, key: 32, type: 'down' },
        { frame: i * 50 + 20, key: 32, type: 'up' },
        { frame: i * 50 + 40, key: 38, type: 'press' },
        { frame: i * 50 + 45, key: (i % 2 === 0) ? 37 : 39, type: 'press' }
      );
    }
  }
  
  return inputs;
}

export function processTestInputs(p) {
  if (gameState.controlMode === 'HUMAN' || gameState.gamePhase !== 'PLAYING') {
    return;
  }
  
  const currentFrame = gameState.framesSinceStart;
  
  for (const input of gameState.testModeInputs) {
    if (input.frame === currentFrame) {
      if (input.type === 'press') {
        handleKeyPressed(p, input.key);
      }
    }
  }
  
  // Simulate continuous key presses
  const activeKeys = gameState.testModeInputs.filter(
    input => input.type === 'down' && input.frame <= currentFrame &&
    !gameState.testModeInputs.some(
      inp => inp.key === input.key && inp.type === 'up' && inp.frame <= currentFrame && inp.frame > input.frame
    )
  );
  
  for (const input of activeKeys) {
    if (input.key === 32) {
      gameState.player.push();
    } else if (input.key === 65) {
      gameState.player.steerLeft();
    } else if (input.key === 68) {
      gameState.player.steerRight();
    }
  }
}