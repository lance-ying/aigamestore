import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES } from './globals.js'; // Removed ROBOT_MASTERS and WEAPON_DATA as they are unused

export function renderUI(p) {
  // The logic for rendering the start screen was moved to rendering.js::drawStartScreen
  // and is called directly by game.js. This renderStartScreen function in ui.js is dead code.
  // The original conditional `if (gameState.gamePhase === GAME_PHASES.START) { renderStartScreen(p); }`
  // from this file's renderUI function has been removed.
  
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    renderPlayingUI(p);
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    renderPlayingUI(p);
    renderPauseScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
             gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    renderGameOverScreen(p);
  }
}

// Removed renderStartScreen function as it was dead code and not used by the game loop.

function renderPlayingUI(p) {
  // This function would contain elements specific to the playing state,
  // but currently, all UI rendering for PLAYING state is handled by rendering.js::drawUI.
  // This function is effectively a placeholder or might be intended for future expansion.
  // No changes needed here for the current task.
}

function renderPauseScreen(p) {
  // This function would contain elements specific to the paused state.
  // Currently, the pause screen is rendered by rendering.js::drawUI.
  // No changes needed here for the current task.
}

function renderGameOverScreen(p) {
  // This function would contain elements specific to the game over state.
  // Currently, the game over screen is rendered by rendering.js::drawGameOver.
  // No changes needed here for the current task.
}