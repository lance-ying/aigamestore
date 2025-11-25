// input_handler.js - Input handling

import { gameState, GAME_PHASES } from './globals.js';
import { initializeGame } from './game_logic.js';
import get_automated_testing_action from './automated_testing_controller.js';

export function getInputs(p) {
  if (gameState.controlMode === "HUMAN") {
    return getHumanInputs(p);
  } else {
    return getAutomatedInputs(p);
  }
}

function getHumanInputs(p) {
  return {
    left: p.keyIsDown(37),
    right: p.keyIsDown(39),
    up: p.keyIsDown(38),
    down: p.keyIsDown(40),
    shoot: p.keyIsDown(32),
    sprint: p.keyIsDown(16),
    switchWeapon: false // Handled in keyPressed
  };
}

function getAutomatedInputs(p) {
  const action = get_automated_testing_action(gameState);
  
  return {
    left: action.left || false,
    right: action.right || false,
    up: action.up || false,
    down: action.down || false,
    shoot: action.shoot || false,
    sprint: action.sprint || false,
    switchWeapon: action.switchWeapon || false
  };
}

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Game phase transitions
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      initializeGame(p);
    }
  } else if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { phase: "PAUSED" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else if (keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE ||
        gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.START;
      p.logs.game_info.push({
        data: { phase: "START" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  // Gameplay inputs
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    if (keyCode === 90) { // Z - Switch weapon
      return { switchWeapon: true };
    }
  }
  
  return { switchWeapon: false };
}

export function handleKeyReleased(p, key, keyCode) {
  p.logs.inputs.push({
    input_type: "keyReleased",
    data: { key: key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}