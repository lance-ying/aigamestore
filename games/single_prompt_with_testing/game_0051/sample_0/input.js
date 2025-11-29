// input.js - Input handling

import { gameState, KEY_LEFT, KEY_UP, KEY_RIGHT, KEY_DOWN, KEY_SPACE, KEY_SHIFT, KEY_Z, KEY_ENTER, KEY_ESC, KEY_R, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Player, Enemy } from './entities.js';

export function handleKeyPress(p) {
  gameState.keys[p.keyCode] = true;
  
  // Log input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key: p.key, keyCode: p.keyCode },
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });
  
  // Phase controls
  if (p.keyCode === KEY_ENTER) {
    if (gameState.gamePhase === "START") {
      startGame(p);
    }
  }
  
  if (p.keyCode === KEY_ESC) {
    if (gameState.gamePhase === "PLAYING") {
      gameState.gamePhase = "PAUSED";
      p.logs.game_info.push({
        data: { gamePhase: "PAUSED" },
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === "PAUSED") {
      gameState.gamePhase = "PLAYING";
      p.logs.game_info.push({
        data: { gamePhase: "PLAYING" },
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  if (p.keyCode === KEY_R) {
    if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
      resetGame(p);
    }
  }
  
  // Gameplay controls (only in PLAYING phase)
  if (gameState.gamePhase === "PLAYING") {
    if (p.keyCode === KEY_SPACE && gameState.player) {
      gameState.player.attack();
    }
    
    if (p.keyCode === KEY_SHIFT && gameState.player) {
      gameState.player.startDash();
    }
    
    if (p.keyCode === KEY_Z && gameState.player) {
      gameState.player.startBlock();
    }
  }
}

export function handleKeyRelease(p) {
  gameState.keys[p.keyCode] = false;
  
  // Log input
  p.logs.inputs.push({
    input_type: 'keyReleased',
    data: { key: p.key, keyCode: p.keyCode },
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });
  
  if (p.keyCode === KEY_Z && gameState.player) {
    gameState.player.stopBlock();
  }
}

export function handlePlayerInput(p) {
  if (!gameState.player || gameState.gamePhase !== "PLAYING") return;
  
  // Movement
  if (isKeyPressed(KEY_LEFT)) {
    gameState.player.moveLeft();
  }
  if (isKeyPressed(KEY_RIGHT)) {
    gameState.player.moveRight();
  }
  if (isKeyPressed(KEY_UP)) {
    gameState.player.moveUp();
  }
  if (isKeyPressed(KEY_DOWN)) {
    gameState.player.moveDown();
  }
}

export function isKeyPressed(keyCode) {
  return gameState.keys[keyCode] === true;
}

function startGame(p) {
  gameState.gamePhase = "PLAYING";
  gameState.score = 0;
  gameState.wave = 1;
  gameState.enemiesDefeated = 0;
  gameState.totalDamageDealt = 0;
  gameState.totalDamageTaken = 0;
  gameState.partsLost = 0;
  gameState.powerUpsCollected = 0;
  
  // Clear arrays
  gameState.entities = [];
  gameState.enemies = [];
  gameState.particles = [];
  gameState.powerUps = [];
  gameState.bodyParts = [];
  
  // Create player
  gameState.player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  // Start first wave
  gameState.waveTimer = 60;
  gameState.enemiesInWave = 2;
  gameState.enemiesSpawned = 0;
  
  p.logs.game_info.push({
    data: { gamePhase: "PLAYING", wave: 1 },
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });
}

function resetGame(p) {
  gameState.gamePhase = "START";
  gameState.player = null;
  gameState.entities = [];
  gameState.enemies = [];
  gameState.particles = [];
  gameState.powerUps = [];
  gameState.bodyParts = [];
  
  p.logs.game_info.push({
    data: { gamePhase: "START" },
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });
}