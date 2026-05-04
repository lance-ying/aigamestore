// input_handler.js - Input handling for human and automated testing

import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, CONTROL_HUMAN } from './globals.js';
import { initializeLevel, fireUnit, useChampionAbility, swapChampion } from './game_logic.js';
import get_automated_testing_action from './automated_testing_controller.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase-specific controls
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === PHASE_START) {
      gameState.gamePhase = PHASE_PLAYING;
      initializeLevel(gameState.level);
      
      p.logs.game_info.push({
        data: { phase: PHASE_PLAYING, level: gameState.level },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN) {
      gameState.level++;
      gameState.gamePhase = PHASE_PLAYING;
      initializeLevel(gameState.level);
      
      p.logs.game_info.push({
        data: { phase: PHASE_PLAYING, level: gameState.level },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
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
    return;
  }
  
  if (keyCode === 82) { // R
    gameState.gamePhase = PHASE_START;
    gameState.level = 1;
    p.logs.game_info.push({
      data: { phase: PHASE_START, restart: true },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  // Gameplay controls
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  gameState.keys[keyCode] = true;
  
  // Single press actions
  if (keyCode === 32) { // SPACE - start stream
    gameState.streamFiring = true;
    gameState.streamTimer = UNIT_STREAM_DELAY; // Fire immediately
  } else if (keyCode === 90) { // Z - restart level
    initializeLevel(gameState.level);
  } else if (keyCode === 81) { // Q - champion ability
    useChampionAbility();
  } else if (keyCode === 69) { // E - swap champion
    swapChampion();
  }
}

export function handleKeyReleased(p, key, keyCode) {
  p.logs.inputs.push({
    input_type: "keyReleased",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  gameState.keys[keyCode] = false;
  
  if (keyCode === 32) { // SPACE
    gameState.streamFiring = false;
  }
}

export function processInputs() {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  // Handle automated testing
  if (gameState.controlMode !== CONTROL_HUMAN) {
    const action = get_automated_testing_action(gameState);
    applyAction(action);
    return;
  }
  
  // Human controls
  const cannon = gameState.cannon;
  
  // Slow motion
  gameState.slowMotion = gameState.keys[16]; // Shift
  
  // Aim controls
  if (gameState.keys[37]) { // LEFT
    cannon.rotateBy(-0.03);
  }
  if (gameState.keys[39]) { // RIGHT
    cannon.rotateBy(0.03);
  }
  if (gameState.keys[65]) { // A - fine aim left
    cannon.rotateBy(-0.01);
  }
  if (gameState.keys[68]) { // D - fine aim right
    cannon.rotateBy(0.01);
  }
}

export function applyAction(action) {
  if (!action) return;
  
  const cannon = gameState.cannon;
  
  if (action.aimLeft) {
    cannon.rotateBy(-0.03);
  }
  if (action.aimRight) {
    cannon.rotateBy(0.03);
  }
  if (action.fineAimLeft) {
    cannon.rotateBy(-0.01);
  }
  if (action.fineAimRight) {
    cannon.rotateBy(0.01);
  }
  if (action.fire) {
    if (!gameState.streamFiring) {
      gameState.streamFiring = true;
      gameState.streamTimer = UNIT_STREAM_DELAY;
    }
  } else {
    gameState.streamFiring = false;
  }
  if (action.ability) {
    useChampionAbility();
  }
  if (action.swapChampion) {
    swapChampion();
  }
}