// input.js - Input handling
import { gameState } from './globals.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
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
    } else if (keyCode === 82) { // R
      restartGame(p);
    }
  } else if (gameState.gamePhase === "PAUSED") {
    if (keyCode === 27) { // ESC
      unpauseGame(p);
    } else if (keyCode === 82) { // R
      restartGame(p);
    }
  } else if (gameState.gamePhase === "GAME_OVER" || gameState.gamePhase === "LEVEL_COMPLETE") {
    if (keyCode === 82) { // R
      restartGame(p);
    } else if (keyCode === 13) { // ENTER
      if (gameState.gamePhase === "LEVEL_COMPLETE") {
        nextLevel(p);
      }
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
}

function startGame(p) {
  import('./game.js').then(module => {
    module.initLevel(p, gameState.level);
    gameState.gamePhase = "PLAYING";
    gameState.levelStartTime = Date.now();
    p.logs.game_info.push({
      data: { phase: "PLAYING", level: gameState.level },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
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
    data: { phase: "PLAYING" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function restartGame(p) {
  gameState.gamePhase = "START";
  gameState.level = 1;
  gameState.score = 0;
  gameState.timer = 180;
  p.logs.game_info.push({
    data: { phase: "START" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function nextLevel(p) {
  import('./game.js').then(module => {
    gameState.level++;
    if (gameState.level > gameState.maxLevel) {
      gameState.gamePhase = "GAME_OVER";
      gameState.gameOverReason = "WIN";
      if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        import('./globals.js').then(g => g.saveHighScore());
      }
    } else {
      module.initLevel(p, gameState.level);
      gameState.gamePhase = "PLAYING";
      gameState.levelStartTime = Date.now();
    }
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, level: gameState.level },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  });
}