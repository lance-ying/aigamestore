// input.js
import { gameState } from './globals.js';

export function handleKeyPressed(p, keyCode, key) {
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
      gameState.gamePhase = "PLAYING";
      p.logs.game_info.push({
        data: { phase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else if (keyCode === 27) { // ESC
    if (gameState.gamePhase === "PLAYING") {
      gameState.gamePhase = "PAUSED";
      p.logs.game_info.push({
        data: { phase: "PAUSED" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === "PAUSED") {
      gameState.gamePhase = "PLAYING";
      p.logs.game_info.push({
        data: { phase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else if (keyCode === 82) { // R
    if (gameState.gamePhase.startsWith("GAME_OVER")) {
      gameState.gamePhase = "START";
      p.logs.game_info.push({
        data: { phase: "START" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }

  // Gameplay controls (only in PLAYING phase)
  if (gameState.gamePhase === "PLAYING" && gameState.player) {
    if (keyCode === 38) { // UP arrow
      gameState.player.jump();
    } else if (keyCode === 32) { // SPACE
      gameState.player.dash();
    } else if (keyCode === 90) { // Z
      gameState.player.groundPound();
    }
  }
}

export function handleContinuousInput(p) {
  if (gameState.gamePhase !== "PLAYING" || !gameState.player) return;

  // Reset horizontal velocity if no keys pressed
  if (!p.keyIsDown(37) && !p.keyIsDown(39) && !gameState.player.dashing) {
    gameState.player.velX *= 0.8;
  }

  if (p.keyIsDown(37)) { // LEFT arrow
    gameState.player.moveLeft();
  }
  if (p.keyIsDown(39)) { // RIGHT arrow
    gameState.player.moveRight();
  }
}