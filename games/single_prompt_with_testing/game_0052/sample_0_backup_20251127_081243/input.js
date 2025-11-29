// input.js - Input handling

import { 
  gameState, 
  KEY_LEFT, 
  KEY_UP, 
  KEY_RIGHT, 
  KEY_DOWN,
  KEY_SPACE,
  KEY_SHIFT,
  KEY_Z,
  KEY_ENTER,
  KEY_ESC,
  KEY_R,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  GEARBOY_COOLDOWN,
  GEARBOY_DURATION
} from './globals.js';

// Keyboard state
const keys = {};

export function handleKeyPress(p, keyCode) {
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
  
  // Gameplay controls (only during PLAYING phase)
  if (gameState.gamePhase === PHASE_PLAYING) {
    if (keyCode === KEY_Z && gameState.player) {
      gameState.player.interact();
    }
    
    if (keyCode === KEY_SPACE) {
      activateGearBoy();
    }
  }
}

export function handleKeyRelease(p, keyCode) {
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

export function handlePlayerInput() {
  if (!gameState.player || gameState.gamePhase !== PHASE_PLAYING) return;
  
  let dx = 0;
  let dy = 0;
  
  if (isKeyPressed(KEY_LEFT)) dx -= 1;
  if (isKeyPressed(KEY_RIGHT)) dx += 1;
  if (isKeyPressed(KEY_UP)) dy -= 1;
  if (isKeyPressed(KEY_DOWN)) dy += 1;
  
  const isSprinting = isKeyPressed(KEY_SHIFT);
  
  if (dx !== 0 || dy !== 0) {
    gameState.player.move(dx, dy, isSprinting);
  }
}

function activateGearBoy() {
  if (gameState.gearBoyCooldown > 0) return;
  if (gameState.gearBoyActive) return;
  
  gameState.gearBoyActive = true;
  gameState.gearBoyDuration = GEARBOY_DURATION;
  gameState.gearBoyCooldown = GEARBOY_COOLDOWN;
}

export function updateGearBoy() {
  if (gameState.gearBoyActive) {
    gameState.gearBoyDuration--;
    if (gameState.gearBoyDuration <= 0) {
      gameState.gearBoyActive = false;
    }
  }
  
  if (gameState.gearBoyCooldown > 0) {
    gameState.gearBoyCooldown--;
  }
}

function resetGame(p) {
  // Clear arrays
  gameState.entities = [];
  gameState.enemies = [];
  gameState.clues = [];
  gameState.doors = [];
  gameState.furniture = [];
  gameState.particles = [];
  gameState.ghosts = [];
  
  // Reset state
  gameState.player = null;
  gameState.score = 0;
  gameState.cluesCollected = 0;
  gameState.evidenceCollected = [];
  gameState.unlockedDoors = [];
  gameState.gearBoyActive = false;
  gameState.gearBoyCooldown = 0;
  gameState.gearBoyDuration = 0;
  gameState.mysteryLevel = 0;
  gameState.finalRevelationTriggered = false;
  gameState.cameraX = 0;
  gameState.cameraY = 0;
  
  // Reset to start screen
  gameState.gamePhase = PHASE_START;
  
  if (p.logs && p.logs.game_info) {
    p.logs.game_info.push({
      data: { gamePhase: PHASE_START, action: 'reset' },
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
}