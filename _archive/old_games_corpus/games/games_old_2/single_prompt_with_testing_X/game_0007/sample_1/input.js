// input.js - Input handling
import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED } from './globals.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // ENTER - Start game
  if (keyCode === 13 && gameState.gamePhase === PHASE_START) {
    startGame();
    return;
  }
  
  // ESC - Pause/Unpause
  if (keyCode === 27 && (gameState.gamePhase === PHASE_PLAYING || gameState.gamePhase === PHASE_PAUSED)) {
    togglePause();
    return;
  }
  
  // R - Restart
  if (keyCode === 82) {
    restartGame();
    return;
  }
}

export function handleGameplayInput(p) {
  if (gameState.gamePhase !== PHASE_PLAYING || !gameState.player) return;
  
  if (gameState.controlMode === "HUMAN") {
    // Human input
    if (p.keyIsDown(37)) { // Left arrow
      gameState.player.moveLeft();
    }
    if (p.keyIsDown(39)) { // Right arrow
      gameState.player.moveRight();
    }
  } else {
    // Automated testing input
    const action = window.get_automated_testing_action(gameState);
    if (action && action.key) {
      if (action.key === 'ArrowLeft') {
        gameState.player.moveLeft();
      } else if (action.key === 'ArrowRight') {
        gameState.player.moveRight();
      }
    }
  }
}

function startGame() {
  gameState.gamePhase = PHASE_PLAYING;
  
  // Log phase change
  window.gameInstance.logs.game_info.push({
    data: { phase: gameState.gamePhase, action: "start_game" },
    framecount: window.gameInstance.frameCount,
    timestamp: Date.now()
  });
}

function togglePause() {
  if (gameState.gamePhase === PHASE_PLAYING) {
    gameState.gamePhase = PHASE_PAUSED;
  } else if (gameState.gamePhase === PHASE_PAUSED) {
    gameState.gamePhase = PHASE_PLAYING;
  }
  
  // Log phase change
  window.gameInstance.logs.game_info.push({
    data: { phase: gameState.gamePhase, action: "toggle_pause" },
    framecount: window.gameInstance.frameCount,
    timestamp: Date.now()
  });
}

function restartGame() {
  // Reset to start screen
  gameState.gamePhase = PHASE_START;
  
  // Log phase change
  window.gameInstance.logs.game_info.push({
    data: { phase: gameState.gamePhase, action: "restart" },
    framecount: window.gameInstance.frameCount,
    timestamp: Date.now()
  });
}