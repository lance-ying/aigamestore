// input.js - Input handling

import { gameState, GAME_PHASES } from './globals.js';

export function getPlayerActions(p) {
  const actions = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
    interact: false,
    toggleFlashlight: false
  };

  if (gameState.controlMode === "HUMAN") {
    actions.forward = p.keyIsDown(38); // UP
    actions.backward = p.keyIsDown(40); // DOWN
    actions.left = p.keyIsDown(37); // LEFT
    actions.right = p.keyIsDown(39); // RIGHT
    actions.sprint = p.keyIsDown(16); // SHIFT
    // interact and toggleFlashlight handled in keyPressed
  } else {
    // Automated testing
    const testAction = window.get_automated_testing_action(gameState);
    if (testAction) {
      actions.forward = testAction.forward || false;
      actions.backward = testAction.backward || false;
      actions.left = testAction.left || false;
      actions.right = testAction.right || false;
      actions.sprint = testAction.sprint || false;
      actions.interact = testAction.interact || false;
      actions.toggleFlashlight = testAction.toggleFlashlight || false;
    }
  }

  return actions;
}

export function handleKeyPressed(p) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  // Game phase transitions
  if (p.keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }

  if (p.keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }

  if (p.keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      gameState.gamePhase = GAME_PHASES.START;
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase, action: "restart" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }

  // Gameplay controls (only during PLAYING)
  if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.controlMode === "HUMAN") {
    if (p.keyCode === 32) { // SPACE
      if (gameState.nearbyObject) {
        gameState.player.interactWithObject(gameState.nearbyObject);
      }
    }
    
    if (p.keyCode === 90) { // Z
      gameState.flashlightOn = !gameState.flashlightOn;
    }
  }
}

export function handleKeyReleased(p) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyReleased",
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}