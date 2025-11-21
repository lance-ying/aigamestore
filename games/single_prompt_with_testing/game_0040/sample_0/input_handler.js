// input_handler.js - Input handling

import { 
  gameState, 
  PHASE_START, 
  PHASE_PLAYING, 
  PHASE_PAUSED,
  PHASE_GAME_OVER_LOSE,
  KEY_ENTER,
  KEY_ESC,
  KEY_R,
  KEY_SPACE,
  KEY_SHIFT,
  KEY_Z
} from './globals.js';
import { initGame, fireProjectile, fireVolley, deployBomber } from './game_logic.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

export function handleKeyPressed(p) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  // Phase transitions
  if (p.keyCode === KEY_ENTER && gameState.gamePhase === PHASE_START) {
    gameState.gamePhase = PHASE_PLAYING;
    initGame(p);
    p.logs.game_info.push({
      data: { message: "Game started", phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }

  if (p.keyCode === KEY_ESC && gameState.gamePhase === PHASE_PLAYING) {
    gameState.gamePhase = PHASE_PAUSED;
    p.logs.game_info.push({
      data: { message: "Game paused", phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }

  if (p.keyCode === KEY_ESC && gameState.gamePhase === PHASE_PAUSED) {
    gameState.gamePhase = PHASE_PLAYING;
    p.logs.game_info.push({
      data: { message: "Game resumed", phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }

  if (p.keyCode === KEY_R && (gameState.gamePhase === PHASE_GAME_OVER_LOSE || gameState.gamePhase === PHASE_PAUSED)) {
    gameState.gamePhase = PHASE_START;
    p.logs.game_info.push({
      data: { message: "Restarted to start screen", phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }

  // Gameplay inputs (only in PLAYING phase)
  if (gameState.gamePhase === PHASE_PLAYING) {
    if (p.keyCode === KEY_Z) {
      fireProjectile(p);
    }
    if (p.keyCode === KEY_SPACE) {
      fireVolley(p);
    }
    if (p.keyCode === KEY_SHIFT) {
      deployBomber(p);
    }
  }
}

export function handleAutomatedTesting(p) {
  if (gameState.controlMode === "HUMAN" || gameState.gamePhase !== PHASE_PLAYING) {
    return;
  }

  const action = get_automated_testing_action(gameState);
  
  if (action) {
    // Update cursor position if provided
    if (action.cursorX !== undefined && action.cursorY !== undefined) {
      gameState.cursor.x = action.cursorX;
      gameState.cursor.y = action.cursorY;
    }

    // Execute actions
    if (action.fire) {
      fireProjectile(p);
    }
    if (action.volley) {
      fireVolley(p);
    }
    if (action.bomber) {
      deployBomber(p);
    }
  }
}