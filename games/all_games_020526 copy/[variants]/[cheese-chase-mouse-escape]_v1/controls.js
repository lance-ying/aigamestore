import { gameState, GAME_PHASES } from './globals.js';

/**
 * Resets all core game state variables to their initial values for a new game,
 * and sets the game phase. This is a comprehensive reset.
 * @param {object} p - The p5 instance.
 * @param {string} targetPhase - The GAME_PHASES enum value to set after reset.
 */
function _fullResetAndSetPhase(p, targetPhase) {
  gameState.level = 1;
  gameState.score = 0;
  gameState.lives = 3;
  gameState.entities = [];
  gameState.player = null; // Ensure player is null so loadLevel creates a new one
  gameState.cheeseCollected = 0;
  gameState.totalCheese = 0;
  gameState.mouseHoleActive = false;
  gameState.invulnerable = false;
  gameState.invulnerableTimer = 0;
  gameState.levelTransitionTimer = 0;
  gameState.autoRestartTimer = null; // Always clear auto-restart timer on any full reset
  gameState.gamePhase = targetPhase; // Set the desired phase

  p.logs.game_info.push({
    event: 'game_state_reset',
    data: { targetPhase: targetPhase },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  // ENTER - Start game
  if (keyCode === 13) {
    if (gameState.gamePhase === GAME_PHASES.START) {
      startGame(p);
    }
  }

  // ESC - Pause/Unpause
  if (keyCode === 27) {
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        event: 'game_paused',
        data: {},
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        event: 'game_resumed',
        data: {},
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }

  // R - Restart to Start Screen
  if (keyCode === 82) {
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE ||
        gameState.gamePhase === GAME_PHASES.PAUSED) {
      resetToStartScreen(p); // Call the new function to go to start screen
    }
  }

  // Gameplay controls
  if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.player) {
    if (keyCode === 38) { // Arrow Up
      gameState.player.jump();
    }
  }
}

export function handleKeyReleased(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: 'keyReleased',
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function handlePlayerMovement(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING || !gameState.player) return;

  // Only human control mode is available
  if (p.keyIsDown(37)) { // Arrow Left
    gameState.player.moveLeft();
  } else if (p.keyIsDown(39)) { // Arrow Right
    gameState.player.moveRight();
  } else {
    gameState.player.stopMove();
  }
}

/**
 * Starts a new game from the initial START phase.
 * Performs a full game reset and transitions to PLAYING.
 * @param {object} p - The p5 instance.
 */
export function startGame(p) {
  _fullResetAndSetPhase(p, GAME_PHASES.PLAYING);
  
  p.logs.game_info.push({
    event: 'game_started',
    data: {},
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Level will be loaded in the main update loop as gameState.player is null
}

/**
 * Resets the game to the START screen, clearing all game progress.
 * This is typically called on manual restart (e.g., 'R' key).
 * @param {object} p - The p5 instance.
 */
export function resetToStartScreen(p) {
  _fullResetAndSetPhase(p, GAME_PHASES.START);
}

/**
 * Restarts the game directly into the PLAYING phase, clearing all game progress.
 * This is typically called for automatic restarts after game over.
 * @param {object} p - The p5 instance.
 */
export function restartGamePlaying(p) {
  _fullResetAndSetPhase(p, GAME_PHASES.PLAYING);
}