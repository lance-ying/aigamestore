// input_handler.js
import { gameState, GAME_PHASES, GAME_MODES } from './globals.js';
import { startGame, pauseGame, restartGame } from './game_controller.js';
import { handleCastleInput, handleMazeInput } from './mode_handler.js';

export function handleKeyPressed(p, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase-specific controls
  if (gameState.gamePhase === GAME_PHASES.START) {
    if (keyCode === 13) { // ENTER
      startGame();
    }
    return;
  }
  
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    if (keyCode === 27) { // ESC
      pauseGame();
      return;
    }
    
    if (keyCode === 90) { // Z - switch mode
      gameState.currentMode = gameState.currentMode === GAME_MODES.CASTLE ? 
        GAME_MODES.MAZE : GAME_MODES.CASTLE;
      return;
    }
    
    // Mode-specific input
    if (gameState.currentMode === GAME_MODES.CASTLE) {
      handleCastleInput(keyCode);
    } else if (gameState.currentMode === GAME_MODES.MAZE) {
      handleMazeInput(keyCode);
    }
    return;
  }
  
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    if (keyCode === 27) { // ESC
      pauseGame();
    }
    return;
  }
  
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
      gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    if (keyCode === 82) { // R
      restartGame();
    }
    return;
  }
}

export function getActiveKeys(p) {
  return {
    up: p.keyIsDown(38),
    down: p.keyIsDown(40),
    left: p.keyIsDown(37),
    right: p.keyIsDown(39),
    space: p.keyIsDown(32),
    shift: p.keyIsDown(16),
    z: p.keyIsDown(90)
  };
}