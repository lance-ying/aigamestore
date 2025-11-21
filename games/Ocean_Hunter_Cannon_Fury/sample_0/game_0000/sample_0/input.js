import { gameState, LEVELS } from './globals.js';
import { rotateCannon, fireCannon } from './cannon.js';
import { startGame, togglePause, restartGame } from './gameLogic.js';

export function handleKeyPressed(p) {
  // Log input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // ENTER - Start game
  if (p.keyCode === 13) {
    if (gameState.gamePhase === 'START') {
      startGame(p);
    }
    return;
  }
  
  // ESC - Pause/Unpause
  if (p.keyCode === 27) {
    if (gameState.gamePhase === 'PLAYING' || gameState.gamePhase === 'PAUSED') {
      togglePause(p);
    }
    return;
  }
  
  // R - Restart
  if (p.keyCode === 82) {
    if (gameState.gamePhase === 'GAME_OVER_WIN' || gameState.gamePhase === 'GAME_OVER_LOSE') {
      restartGame(p);
    }
    return;
  }
  
  // Game controls only work during PLAYING
  if (gameState.gamePhase !== 'PLAYING') return;
  
  // Arrow Left - Rotate cannon left
  if (p.keyCode === 37) {
    rotateCannon(-1, p);
  }
  
  // Arrow Right - Rotate cannon right
  if (p.keyCode === 39) {
    rotateCannon(1, p);
  }
  
  // Space - Fire
  if (p.keyCode === 32) {
    fireCannon(p);
  }
}

// For automated testing
export function executeTestAction(action, p) {
  if (action === 'LEFT') {
    rotateCannon(-1, p);
  } else if (action === 'RIGHT') {
    rotateCannon(1, p);
  } else if (action === 'FIRE') {
    fireCannon(p);
  } else if (action === 'START') {
    if (gameState.gamePhase === 'START') {
      startGame(p);
    }
  } else if (action === 'PAUSE') {
    if (gameState.gamePhase === 'PLAYING') {
      togglePause(p);
    }
  } else if (action === 'UNPAUSE') {
    if (gameState.gamePhase === 'PAUSED') {
      togglePause(p);
    }
  } else if (action === 'RESTART') {
    if (gameState.gamePhase === 'GAME_OVER_WIN' || gameState.gamePhase === 'GAME_OVER_LOSE') {
      restartGame(p);
    }
  }
}