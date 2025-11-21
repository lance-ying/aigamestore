import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { renderStartScreen, renderPauseOverlay, renderGameOver } from './ui.js';

export function render(p) {
  p.background(30);
  
  if (gameState.gamePhase === "START") {
    renderStartScreen(p);
  } else if (gameState.gamePhase === "PLAYING") {
    if (gameState.miniGameState) {
      gameState.miniGameState.render();
    }
  } else if (gameState.gamePhase === "PAUSED") {
    if (gameState.miniGameState) {
      gameState.miniGameState.render();
    }
    renderPauseOverlay(p);
  } else if (gameState.gamePhase.startsWith("GAME_OVER")) {
    if (gameState.miniGameState) {
      gameState.miniGameState.render();
    }
    const isWin = gameState.gamePhase === "GAME_OVER_WIN";
    renderGameOver(p, isWin);
  }
}