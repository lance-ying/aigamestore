// input.js
import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, CONTROL_HUMAN, WORLD_MATERIAL, WORLD_ENERGY } from './globals.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  // Phase transitions
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === PHASE_START) {
      gameState.gamePhase = PHASE_PLAYING;
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }

  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === PHASE_PLAYING) {
      gameState.gamePhase = PHASE_PAUSED;
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      gameState.gamePhase = PHASE_PLAYING;
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }

  if (keyCode === 82) { // R
    if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      resetGame();
      gameState.gamePhase = PHASE_START;
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase, action: "restart" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }

  // Gameplay controls (only in PLAYING phase and HUMAN mode)
  if (gameState.gamePhase === PHASE_PLAYING && gameState.controlMode === CONTROL_HUMAN) {
    if (keyCode === 37) { // LEFT
      gameState.keys.left = true;
    } else if (keyCode === 39) { // RIGHT
      gameState.keys.right = true;
    } else if (keyCode === 32) { // SPACE
      gameState.keys.jump = true;
    } else if (keyCode === 90) { // Z
      // Toggle world
      gameState.currentWorld = gameState.currentWorld === WORLD_MATERIAL ? WORLD_ENERGY : WORLD_MATERIAL;
      p.logs.game_info.push({
        data: { action: "worldShift", currentWorld: gameState.currentWorld },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
}

export function handleKeyReleased(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyReleased",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  if (gameState.controlMode === CONTROL_HUMAN) {
    if (keyCode === 37) { // LEFT
      gameState.keys.left = false;
    } else if (keyCode === 39) { // RIGHT
      gameState.keys.right = false;
    } else if (keyCode === 32) { // SPACE
      gameState.keys.jump = false;
    }
  }
}

function resetGame() {
  gameState.player = null;
  gameState.entities = [];
  gameState.platforms = [];
  gameState.enemies = [];
  gameState.spirit = null;
  gameState.score = 0;
  gameState.lives = 3;
  gameState.currentLevel = 0;
  gameState.currentWorld = WORLD_MATERIAL;
  gameState.levelComplete = false;
  gameState.keys = {
    left: false,
    right: false,
    jump: false,
    shift: false
  };
}