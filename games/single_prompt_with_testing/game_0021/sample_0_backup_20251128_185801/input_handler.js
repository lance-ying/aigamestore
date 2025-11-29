// input_handler.js
import { gameState, DIRECTIONS } from './globals.js';
import { tryMove, tryPush } from './game_logic.js';

export function handleKeyPressed(p, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  if (gameState.gamePhase === "START") {
    if (keyCode === 13) { // ENTER
      startGame(p);
    }
  } else if (gameState.gamePhase === "PLAYING") {
    if (keyCode === 27) { // ESC
      pauseGame(p);
    } else if (keyCode === 38) { // UP
      tryMove(DIRECTIONS.UP);
    } else if (keyCode === 40) { // DOWN
      tryMove(DIRECTIONS.DOWN);
    } else if (keyCode === 37) { // LEFT
      tryMove(DIRECTIONS.LEFT);
    } else if (keyCode === 39) { // RIGHT
      tryMove(DIRECTIONS.RIGHT);
    } else if (keyCode === 32) { // SPACE
      tryPush();
    }
  } else if (gameState.gamePhase === "PAUSED") {
    if (keyCode === 27) { // ESC
      unpauseGame(p);
    }
  } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
    if (keyCode === 82) { // R
      restartGame(p);
    }
  }
  
  // Log player info after input
  if (gameState.player && gameState.gamePhase === "PLAYING") {
    logPlayerInfo(p);
  }
}

function startGame(p) {
  gameState.gamePhase = "PLAYING";
  p.logs.game_info.push({
    data: { phase: "PLAYING", action: "start" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function pauseGame(p) {
  gameState.gamePhase = "PAUSED";
  p.logs.game_info.push({
    data: { phase: "PAUSED" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function unpauseGame(p) {
  gameState.gamePhase = "PLAYING";
  p.logs.game_info.push({
    data: { phase: "PLAYING", action: "unpause" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function restartGame(p) {
  // Reset to start screen
  gameState.gamePhase = "START";
  gameState.currentLevel = 0;
  gameState.score = 0;
  gameState.demonsCollected = 0;
  gameState.levelComplete = false;
  
  p.logs.game_info.push({
    data: { phase: "START", action: "restart" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function logPlayerInfo(p) {
  p.logs.player_info.push({
    screen_x: gameState.player.getScreenX(),
    screen_y: gameState.player.getScreenY(),
    game_x: gameState.player.gridX,
    game_y: gameState.player.gridY,
    framecount: p.frameCount
  });
}