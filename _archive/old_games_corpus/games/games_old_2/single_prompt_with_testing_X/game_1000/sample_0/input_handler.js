import { gameState } from './globals.js';
import { resetGame } from './game_logic.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  // Game phase transitions
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === 'START') {
      gameState.gamePhase = 'PLAYING';
      resetGame(p);
      p.logs.game_info.push({
        data: { phase: 'PLAYING' },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else if (keyCode === 27) { // ESC
    if (gameState.gamePhase === 'PLAYING') {
      gameState.gamePhase = 'PAUSED';
      p.logs.game_info.push({
        data: { phase: 'PAUSED' },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === 'PAUSED') {
      gameState.gamePhase = 'PLAYING';
      p.logs.game_info.push({
        data: { phase: 'PLAYING' },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else if (keyCode === 82) { // R
    if (gameState.gamePhase.startsWith('GAME_OVER')) {
      gameState.gamePhase = 'START';
      resetGame(p);
      p.logs.game_info.push({
        data: { phase: 'START' },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }

  // Gameplay controls (only in PLAYING phase)
  if (gameState.gamePhase === 'PLAYING' && gameState.controlMode === 'HUMAN') {
    handleGameplayInput(keyCode);
  }
}

function handleGameplayInput(keyCode) {
  if (!gameState.player) return;

  if (keyCode === 37) { // LEFT
    gameState.player.moveLeft();
  } else if (keyCode === 39) { // RIGHT
    gameState.player.moveRight();
  } else if (keyCode === 38 || keyCode === 32) { // UP or SPACE
    gameState.player.jump();
  } else if (keyCode === 40) { // DOWN
    gameState.player.slide();
  }
}

export function processAutomatedInput(p) {
  if (gameState.gamePhase !== 'PLAYING' || gameState.controlMode === 'HUMAN') {
    return;
  }

  // Get action from automated testing
  if (typeof window.get_automated_testing_action === 'function') {
    const action = window.get_automated_testing_action(gameState);
    
    if (action && gameState.player) {
      if (action.left) {
        gameState.player.moveLeft();
      }
      if (action.right) {
        gameState.player.moveRight();
      }
      if (action.jump) {
        gameState.player.jump();
      }
      if (action.slide) {
        gameState.player.slide();
      }
    }
  }
}