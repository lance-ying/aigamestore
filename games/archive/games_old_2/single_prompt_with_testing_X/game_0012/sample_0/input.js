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
      pauseGame(p);
    } else if (gameState.gamePhase === "PAUSED") {
      resumeGame(p);
    }
    return;
  }

  if (keyCode === 82) { // R
    if (gameState.gamePhase.startsWith("GAME_OVER")) {
      restartGame(p);
    }
    return;
  }

  // Gameplay controls (only in PLAYING phase)
  if (gameState.gamePhase === "PLAYING" && gameState.player) {
    if (keyCode === 37) { // LEFT
      gameState.player.moveLeft();
    } else if (keyCode === 39) { // RIGHT
      gameState.player.moveRight();
    } else if (keyCode === 38) { // UP
      gameState.player.jump();
    } else if (keyCode === 40) { // DOWN
      gameState.player.duck();
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

  // Gameplay controls
  if (gameState.gamePhase === "PLAYING" && gameState.player) {
    if (keyCode === 40) { // DOWN released
      gameState.player.stopDucking();
    }
  }
}

function startGame(p) {
  gameState.gamePhase = "PLAYING";
  
  // Import Player class
  import('./entities.js').then(module => {
    const { Player } = module;
    const startX = 300;
    const startY = 300;
    gameState.player = new Player(startX, startY);
  });
  
  p.logs.game_info.push({
    event: "game_started",
    data: { phase: "PLAYING" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function pauseGame(p) {
  gameState.gamePhase = "PAUSED";
  p.noLoop();
  
  p.logs.game_info.push({
    event: "game_paused",
    data: { phase: "PAUSED" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function resumeGame(p) {
  gameState.gamePhase = "PLAYING";
  p.loop();
  
  p.logs.game_info.push({
    event: "game_resumed",
    data: { phase: "PLAYING" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function restartGame(p) {
  // Reset game state
  gameState.gamePhase = "START";
  gameState.player = null;
  gameState.entities = [];
  gameState.obstacles = [];
  gameState.rings = [];
  gameState.score = 0;
  gameState.distance = 0;
  gameState.neckLength = 5;
  gameState.currentSpeed = 3;
  gameState.playerColor = 0;
  gameState.keys = 0;
  gameState.gems = 0;
  gameState.framesSinceStart = 0;
  gameState.lastSpawnDistance = 0;
  
  p.logs.game_info.push({
    event: "game_restarted",
    data: { phase: "START" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}