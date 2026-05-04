// input_handler.js - Handle all keyboard inputs

import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';
import { tapNumber, sliceNumber } from './game_logic.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Track key state
  gameState.keysPressed[keyCode] = true;
  
  // Phase-independent controls
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === PHASE_START) {
      startGame(p);
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === PHASE_PLAYING) {
      gameState.gamePhase = PHASE_PAUSED;
      p.logs.game_info.push({
        data: { phase: PHASE_PAUSED },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      gameState.gamePhase = PHASE_PLAYING;
      p.logs.game_info.push({
        data: { phase: PHASE_PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      resetGame(p);
    }
    return;
  }
  
  // Gameplay controls (only in PLAYING phase)
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  if (keyCode === 32) { // SPACE - tap number
    tapNumber(p);
  }
  
  if (keyCode === 90) { // Z - start slice
    if (gameState.player) {
      gameState.sliceStartPos = { x: gameState.player.x, y: gameState.player.y - 30 };
    }
  }
}

export function handleKeyReleased(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: 'keyReleased',
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Track key state
  gameState.keysPressed[keyCode] = false;
  
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  if (keyCode === 90) { // Z - complete slice
    if (gameState.sliceStartPos && gameState.player) {
      const sliceLine = {
        x1: gameState.sliceStartPos.x,
        y1: gameState.sliceStartPos.y,
        x2: gameState.player.x,
        y2: gameState.player.y - 30
      };
      
      sliceNumber(p, sliceLine);
      gameState.sliceStartPos = null;
      gameState.slicingLine = null;
    }
  }
}

function startGame(p) {
  gameState.gamePhase = PHASE_PLAYING;
  gameState.score = 0;
  gameState.currentLevel = 1;
  gameState.timeRemaining = 90;
  gameState.gameStartTime = Date.now() / 1000;
  gameState.lastSpawnTime = Date.now() / 1000;
  gameState.entities = [gameState.player];
  gameState.slicingLine = null;
  gameState.sliceStartPos = null;
  
  p.logs.game_info.push({
    data: { phase: PHASE_PLAYING, message: "Game started" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function resetGame(p) {
  gameState.gamePhase = PHASE_START;
  gameState.score = 0;
  gameState.currentLevel = 1;
  gameState.timeRemaining = 90;
  gameState.entities = [gameState.player];
  gameState.slicingLine = null;
  gameState.sliceStartPos = null;
  gameState.keysPressed = {};
  
  p.logs.game_info.push({
    data: { phase: PHASE_START, message: "Game reset" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}