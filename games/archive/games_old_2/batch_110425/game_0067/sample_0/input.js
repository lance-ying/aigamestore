// input.js - Input handling
import { gameState, KEY_ENTER, KEY_ESC, KEY_R, KEY_SPACE, KEY_Z, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';
import get_automated_testing_action from './automated_testing_controller.js';

export function handleKeyPressed(p) {
  // Log input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  // Phase transitions
  if (p.keyCode === KEY_ENTER && gameState.gamePhase === PHASE_START) {
    gameState.gamePhase = PHASE_PLAYING;
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }

  if (p.keyCode === KEY_ESC && gameState.gamePhase === PHASE_PLAYING) {
    gameState.gamePhase = PHASE_PAUSED;
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }

  if (p.keyCode === KEY_ESC && gameState.gamePhase === PHASE_PAUSED) {
    gameState.gamePhase = PHASE_PLAYING;
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }

  if (p.keyCode === KEY_R && (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE)) {
    gameState.gamePhase = PHASE_START;
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, action: 'restart' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }

  // Gameplay inputs
  if (gameState.gamePhase === PHASE_PLAYING) {
    if (p.keyCode === KEY_SPACE && gameState.player) {
      gameState.player.interact(p);
      gameState.framesSinceLastAction = 0;
    }

    if (p.keyCode === KEY_Z && gameState.player) {
      gameState.player.dropTool();
      gameState.framesSinceLastAction = 0;
    }
  }
}

export function processAutomatedInput(p, action) {
  if (!action) return;

  // Simulate key presses for automated testing
  if (action.keyCode === KEY_SPACE && gameState.player) {
    gameState.player.interact(p);
    gameState.framesSinceLastAction = 0;
  }

  if (action.keyCode === KEY_Z && gameState.player) {
    gameState.player.dropTool();
    gameState.framesSinceLastAction = 0;
  }
}