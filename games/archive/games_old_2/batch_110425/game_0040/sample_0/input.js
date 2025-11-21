// input.js - Input handling

import { gameState } from './globals.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  // Game phase transitions
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === "START") {
      startGame(p);
    }
    return;
  }

  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === "PLAYING") {
      gameState.gamePhase = "PAUSED";
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      p.noLoop();
    } else if (gameState.gamePhase === "PAUSED") {
      gameState.gamePhase = "PLAYING";
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      p.loop();
    }
    return;
  }

  if (keyCode === 82) { // R
    if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE" || gameState.gamePhase === "PAUSED") {
      resetGame(p);
    }
    return;
  }

  // Gameplay controls
  if (gameState.gamePhase === "PLAYING" && gameState.player && gameState.player.alive) {
    if (keyCode === 32) { // SPACE
      gameState.player.jump();
    } else if (keyCode === 90) { // Z
      gameState.player.grab();
    }
  }
}

export function handleKeyReleased(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyReleased",
    data: { key: key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  if (gameState.gamePhase === "PLAYING" && gameState.player) {
    if (keyCode === 90) { // Z
      gameState.player.releaseGrab();
    }
  }
}

export function handleContinuousInput(p) {
  if (gameState.gamePhase !== "PLAYING" || !gameState.player || !gameState.player.alive) {
    return;
  }

  if (p.keyIsDown(37)) { // LEFT
    gameState.player.moveLeft();
  } else if (p.keyIsDown(39)) { // RIGHT
    gameState.player.moveRight();
  }
}

function startGame(p) {
  gameState.gamePhase = "PLAYING";
  p.logs.game_info.push({
    data: { gamePhase: gameState.gamePhase },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  p.loop();
}

function resetGame(p) {
  gameState.gamePhase = "START";
  gameState.currentCheckpoint = 0;
  gameState.deathCount = 0;
  gameState.cameraOffsetX = 0;
  
  p.logs.game_info.push({
    data: { gamePhase: gameState.gamePhase, action: "reset" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  p.loop();
}