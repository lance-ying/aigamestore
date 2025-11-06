// input_handler.js
import { gameState, GAME_PHASES } from './globals.js';
import { initGame, selectAbility } from './game_logic.js';

export function getPlayerInputs(p) {
  const inputs = {
    up: false,
    down: false,
    left: false,
    right: false,
    special: false
  };

  if (gameState.controlMode === 'HUMAN') {
    inputs.up = p.keyIsDown(38);
    inputs.down = p.keyIsDown(40);
    inputs.left = p.keyIsDown(37);
    inputs.right = p.keyIsDown(39);
    inputs.special = p.keyIsDown(32);
  } else {
    // Automated testing mode
    if (typeof window.get_automated_testing_action === 'function') {
      const action = window.get_automated_testing_action(gameState);
      if (action) {
        inputs.up = action.up || false;
        inputs.down = action.down || false;
        inputs.left = action.left || false;
        inputs.right = action.right || false;
        inputs.special = action.special || false;
      }
    }
  }

  return inputs;
}

export function handleKeyPress(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  // Game phase transitions
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      initGame(p);
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: GAME_PHASES.PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { phase: GAME_PHASES.PAUSED },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: GAME_PHASES.PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else if (keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      gameState.gamePhase = GAME_PHASES.START;
      p.logs.game_info.push({
        data: { phase: GAME_PHASES.START },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }

  // Level up ability selection
  if (gameState.levelUpPending && gameState.gamePhase === GAME_PHASES.PLAYING) {
    if (keyCode === 49) { // 1
      selectAbility(p, 0);
    } else if (keyCode === 50) { // 2
      selectAbility(p, 1);
    } else if (keyCode === 51) { // 3
      selectAbility(p, 2);
    }
  }
}