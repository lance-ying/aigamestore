// input.js - Input handling
import { gameState, GAME_PHASE } from './globals.js';
import { useWeapon } from './weapons.js';

export function handleKeyPressed(p, Matter, buddy, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // ENTER - Start game
  if (keyCode === 13) {
    if (gameState.gamePhase === GAME_PHASE.START) {
      startGame(p);
    }
  }
  
  // ESC - Pause/Unpause
  if (keyCode === 27) {
    if (gameState.gamePhase === GAME_PHASE.PLAYING) {
      gameState.gamePhase = GAME_PHASE.PAUSED;
      p.logs.game_info.push({
        data: { gamePhase: GAME_PHASE.PAUSED },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASE.PAUSED) {
      gameState.gamePhase = GAME_PHASE.PLAYING;
      p.logs.game_info.push({
        data: { gamePhase: GAME_PHASE.PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  // R - Restart
  if (keyCode === 82) {
    if (gameState.gamePhase === GAME_PHASE.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASE.GAME_OVER_LOSE) {
      resetToStart(p);
    }
  }
  
  if (gameState.gamePhase === GAME_PHASE.PLAYING) {
    // Arrow keys - Cycle weapons
    if (keyCode === 37) { // LEFT
      gameState.selectedWeaponIndex = (gameState.selectedWeaponIndex - 1 + 5) % 5;
    }
    if (keyCode === 39) { // RIGHT
      gameState.selectedWeaponIndex = (gameState.selectedWeaponIndex + 1) % 5;
    }
    
    // Shift - Precision mode
    if (keyCode === 16) {
      gameState.isPrecisionMode = true;
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
  
  if (keyCode === 16) {
    gameState.isPrecisionMode = false;
  }
}

export function handleGameplayInput(p, Matter, buddy) {
  if (gameState.controlMode !== "HUMAN") return;
  
  // Space - Kick
  if (p.keyIsDown(32)) {
    if (p.frameCount % 10 === 0) { // Rate limit
      useWeapon(p, Matter, buddy, p.mouseX, p.mouseY);
    }
  }
  
  // Z - Use weapon
  if (p.keyIsDown(90)) {
    if (p.frameCount % 15 === 0) { // Rate limit
      useWeapon(p, Matter, buddy, p.mouseX, p.mouseY);
    }
  }
}

function startGame(p) {
  gameState.gamePhase = GAME_PHASE.PLAYING;
  gameState.currentLevel = 1;
  gameState.score = 0;
  gameState.timeRemaining = 60;
  gameState.lastFrameTime = Date.now();
  
  p.logs.game_info.push({
    data: { gamePhase: GAME_PHASE.PLAYING, level: 1 },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function resetToStart(p) {
  gameState.gamePhase = GAME_PHASE.START;
  gameState.currentLevel = 1;
  gameState.score = 0;
  gameState.coins = 0;
  gameState.timeRemaining = 60;
  
  p.logs.game_info.push({
    data: { gamePhase: GAME_PHASE.START },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}