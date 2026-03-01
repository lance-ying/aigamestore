// input.js - Input handling and control

import {
  gameState,
  KEY_LEFT,
  KEY_RIGHT,
  KEY_UP,
  KEY_SPACE,
  KEY_Z,
  KEY_ENTER,
  KEY_ESC,
  KEY_R,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE
} from './globals.js';

// Key state tracking
const keys = {};

export function handleKeyPressed(p, keyCode) {
  keys[keyCode] = true;
  
  // Log input
  if (p.logs && p.logs.inputs) {
    p.logs.inputs.push({
      input_type: 'keyPressed',
      data: { key: p.key, keyCode: keyCode },
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Phase controls
  if (keyCode === KEY_ENTER && gameState.gamePhase === PHASE_START) {
    gameState.gamePhase = PHASE_PLAYING;
    if (p.logs && p.logs.game_info) {
      p.logs.game_info.push({
        data: { gamePhase: PHASE_PLAYING },
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  if (keyCode === KEY_ESC) {
    if (gameState.gamePhase === PHASE_PLAYING) {
      gameState.gamePhase = PHASE_PAUSED;
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      gameState.gamePhase = PHASE_PLAYING;
    }
  }
  
  if (keyCode === KEY_R) {
    if (gameState.gamePhase === PHASE_GAME_OVER_WIN || 
        gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      resetGame(p);
    }
  }
}

export function handleKeyReleased(p, keyCode) {
  keys[keyCode] = false;
  
  // Log input
  if (p.logs && p.logs.inputs) {
    p.logs.inputs.push({
      input_type: 'keyReleased',
      data: { key: p.key, keyCode: keyCode },
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
}

export function isKeyPressed(keyCode) {
  return keys[keyCode] === true;
}

export function updatePlayerInput() {
  if (!gameState.player || !gameState.player.active) return;
  
  // Handle automated testing
  if (gameState.controlMode !== "HUMAN") {
    const action = window.get_automated_testing_action?.(gameState);
    if (action && action.keyCode) {
      handleAutomatedAction(action.keyCode);
    }
    return;
  }
  
  // Movement
  if (isKeyPressed(KEY_LEFT)) {
    gameState.player.moveLeft();
  }
  if (isKeyPressed(KEY_RIGHT)) {
    gameState.player.moveRight();
  }
  
  // Jump
  if (isKeyPressed(KEY_UP)) {
    gameState.player.jump();
  }
  
  // Shoot
  if (isKeyPressed(KEY_SPACE)) {
    gameState.player.shoot();
  }
  
  // Dash
  if (isKeyPressed(KEY_Z)) {
    gameState.player.dash();
  }
}

function handleAutomatedAction(keyCode) {
  if (!gameState.player) return;
  
  switch(keyCode) {
    case KEY_LEFT:
      gameState.player.moveLeft();
      break;
    case KEY_RIGHT:
      gameState.player.moveRight();
      break;
    case KEY_UP:
      gameState.player.jump();
      break;
    case KEY_SPACE:
      gameState.player.shoot();
      break;
    case KEY_Z:
      gameState.player.dash();
      break;
  }
}

function resetGame(p) {
  // Clear all entities
  gameState.entities = [];
  gameState.enemies = [];
  gameState.projectiles = [];
  gameState.particles = [];
  gameState.platforms = [];
  gameState.items = [];
  
  // Reset game state
  gameState.player = null;
  gameState.teleporter = null;
  gameState.boss = null;
  gameState.teleporterActivated = false;
  gameState.score = 0;
  gameState.difficulty = 1.0;
  gameState.gameTime = 0;
  gameState.enemySpawnTimer = 0;
  gameState.itemSpawnTimer = 0;
  gameState.gamePhase = PHASE_START;
  
  // Reset item counts
  for (const key in gameState.itemCounts) {
    gameState.itemCounts[key] = 0;
  }
  
  // Log reset
  if (p.logs && p.logs.game_info) {
    p.logs.game_info.push({
      data: { gamePhase: PHASE_START, event: 'game_reset' },
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
}