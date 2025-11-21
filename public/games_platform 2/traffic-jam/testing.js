import { gameState, GAME_PHASES } from './globals.js';
import { Vehicle } from './vehicle.js';
import { loadLevel } from './input.js';

export function getTestingAction(p) {
  if (gameState.controlMode === "TEST_1") {
    return getTest1Action(p);
  } else if (gameState.controlMode === "TEST_2") {
    return getTest2Action(p);
  }
  return null;
}

function getTest1Action(p) {
  // Basic testing: Start game, select vehicles, grab and move
  const frame = p.frameCount;

  if (gameState.gamePhase === GAME_PHASES.START && frame === 30) {
    return { keyCode: 13 }; // ENTER to start
  }

  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    if (frame === 60) return { keyCode: 39 }; // RIGHT to select
    if (frame === 90) return { keyCode: 40 }; // DOWN to select
    if (frame === 120) return { keyCode: 32 }; // SPACE to grab
    if (frame === 150) return { keyCode: 39 }; // RIGHT to move
    if (frame === 180) return { keyCode: 39 }; // RIGHT to move
    if (frame === 210) return { keyCode: 32 }; // SPACE to release
    if (frame === 240) return { keyCode: 27 }; // ESC to pause
    if (frame === 270) return { keyCode: 27 }; // ESC to unpause
  }

  return null;
}

function getTest2Action(p) {
  // Win test: Complete level 1
  const frame = p.frameCount;

  if (gameState.gamePhase === GAME_PHASES.START && frame === 30) {
    return { keyCode: 13 }; // Start
  }

  if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.currentLevel === 0) {
    // Level 1 solution: Move blocking vehicles then move bus
    if (frame === 60) return { keyCode: 39 }; // Select vehicle
    if (frame === 70) return { keyCode: 32 }; // Grab
    if (frame === 80) return { keyCode: 40 }; // Move down
    if (frame === 90) return { keyCode: 40 }; // Move down
    if (frame === 100) return { keyCode: 32 }; // Release
    
    if (frame === 120) return { keyCode: 37 }; // Select left
    if (frame === 130) return { keyCode: 32 }; // Grab bus
    if (frame === 140) return { keyCode: 39 }; // Move right
    if (frame === 150) return { keyCode: 39 }; // Move right
    if (frame === 160) return { keyCode: 39 }; // Move right
    if (frame === 170) return { keyCode: 39 }; // Move right (exit)
  }

  return null;
}

export function applyTestingAction(p, action) {
  if (!action) return;

  // Simulate keyPressed event
  p.keyCode = action.keyCode;
  p.key = String.fromCharCode(action.keyCode);
  
  if (p.keyPressed) {
    p.keyPressed();
  }
}