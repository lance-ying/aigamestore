// input_handler.js - Input handling

import { gameState, GAME_PHASES } from './globals.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  // Game phase transitions
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }

  if (keyCode === 27) { // ESC
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
    return;
  }

  if (keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      gameState.gamePhase = GAME_PHASES.START;
      p.logs.game_info.push({
        data: { phase: "START" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }

  // Gameplay controls
  if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.player) {
    handleGameplayInput(keyCode);
  }
}

function handleGameplayInput(keyCode) {
  const player = gameState.player;

  switch (keyCode) {
    case 37: // Left arrow
      player.moveLeft();
      break;
    case 38: // Up arrow
      player.moveUp();
      break;
    case 39: // Right arrow
      player.moveRight();
      break;
    case 40: // Down arrow
      player.moveDown();
      break;
    case 90: // Z
      player.changeExpression();
      break;
    case 32: // Space
      player.performAction();
      break;
    case 16: // Shift
      player.toggleZoom();
      break;
  }
}

export function processAutomatedInput(p) {
  if (gameState.controlMode === "HUMAN") {
    return;
  }

  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return;
  }

  try {
    const action = window.get_automated_testing_action(gameState);
    if (action && action.keyCode) {
      handleGameplayInput(action.keyCode);
    }
  } catch (e) {
    console.error("Automated testing error:", e);
  }
}