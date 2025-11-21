// input_handler.js - Input handling
import { gameState, GAME_PHASES } from './globals.js';
import { initializeLevel } from './game_logic.js';
import { handleCitizenSelection, handleTowerTopple, releaseCitizen } from './game_logic.js';

let previousKeyZ = false;
let previousKeySpace = false;

export function setupInputHandlers(p) {
  // Key pressed handler
  p.keyPressed = function() {
    const keyCode = p.keyCode;
    
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    // Phase transitions
    if (keyCode === 13) { // ENTER
      if (gameState.gamePhase === GAME_PHASES.START) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        initializeLevel(p, gameState.currentLevel);
        p.logs.game_info.push({
          data: { phase: "PLAYING", level: gameState.currentLevel },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (keyCode === 27) { // ESC
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
        p.logs.game_info.push({
          data: { phase: "PAUSED" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        p.logs.game_info.push({
          data: { phase: "PLAYING" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (keyCode === 82) { // R
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        restartGame(p);
      }
    }

    // Gameplay controls
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (keyCode === 37) gameState.keys.left = true;
      if (keyCode === 38) gameState.keys.up = true;
      if (keyCode === 39) gameState.keys.right = true;
      if (keyCode === 40) gameState.keys.down = true;
      if (keyCode === 90) gameState.keys.z = true;
      if (keyCode === 32) gameState.keys.space = true;
      if (keyCode === 16) gameState.keys.shift = true;
    }
  };

  // Key released handler
  p.keyReleased = function() {
    const keyCode = p.keyCode;
    
    // Log input
    p.logs.inputs.push({
      input_type: "keyReleased",
      data: { key: p.key, keyCode: keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    if (keyCode === 37) gameState.keys.left = false;
    if (keyCode === 38) gameState.keys.up = false;
    if (keyCode === 39) gameState.keys.right = false;
    if (keyCode === 40) gameState.keys.down = false;
    if (keyCode === 90) gameState.keys.z = false;
    if (keyCode === 32) gameState.keys.space = false;
    if (keyCode === 16) gameState.keys.shift = false;
  };
}

export function processGameplayInputs(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;

  // Handle Z key for citizen selection (on press, not hold)
  if (gameState.keys.z && !previousKeyZ) {
    handleCitizenSelection(p);
  }
  previousKeyZ = gameState.keys.z;

  // Handle Space key to release citizen (on press, not hold)
  if (gameState.keys.space && !previousKeySpace) {
    releaseCitizen();
  }
  previousKeySpace = gameState.keys.space;

  // Handle tower toppling
  handleTowerTopple();
}

export function restartGame(p) {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.currentLevel = 0;
  gameState.score = 0;
  gameState.citizens = [];
  gameState.entities = [];
  gameState.bridges = [];
  gameState.platforms = [];
  gameState.tower = null;
  gameState.selectedCitizen = null;
  gameState.citizensReachedExit = 0;
  gameState.player = null;
  gameState.exitPortal = null;
  
  // Reset keys
  for (let key in gameState.keys) {
    gameState.keys[key] = false;
  }

  p.logs.game_info.push({
    data: { phase: "START", restart: true },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function logPlayerInfo(p) {
  if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.player) {
    // Log player info every 30 frames
    if (p.frameCount % 30 === 0) {
      p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y,
        game_x: gameState.player.x,
        game_y: gameState.player.y,
        framecount: p.frameCount
      });
    }
  }
}