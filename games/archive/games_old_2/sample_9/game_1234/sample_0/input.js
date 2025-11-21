// input.js - Input handling

import { gameState, GAME_PHASES } from './globals.js';

export function handleKeyPressed(p) {
  // Log input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // ENTER - Start game
  if (p.keyCode === 13) {
    if (gameState.gamePhase === GAME_PHASES.START) {
      startGame(p);
    }
  }
  
  // ESC - Pause/Unpause
  if (p.keyCode === 27) {
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      pauseGame(p);
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      unpauseGame(p);
    }
  }
  
  // R - Restart
  if (p.keyCode === 82) {
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE ||
        gameState.gamePhase === GAME_PHASES.PAUSED) {
      restartGame(p);
    }
  }
}

export function handleKeyReleased(p) {
  p.logs.inputs.push({
    input_type: 'keyReleased',
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function getPlayerMovement(p) {
  if (gameState.controlMode !== 'HUMAN') return { dx: 0, dy: 0 };
  
  let dx = 0;
  let dy = 0;
  
  if (p.keyIsDown(37)) dx -= 1; // Left arrow
  if (p.keyIsDown(39)) dx += 1; // Right arrow
  if (p.keyIsDown(38)) dy -= 1; // Up arrow
  if (p.keyIsDown(40)) dy += 1; // Down arrow
  
  return { dx, dy };
}

function startGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  gameState.levelStartTime = Date.now();
  
  p.logs.game_info.push({
    data: { phase: 'PLAYING', level: gameState.currentLevel },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function pauseGame(p) {
  gameState.gamePhase = GAME_PHASES.PAUSED;
  
  p.logs.game_info.push({
    data: { phase: 'PAUSED' },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function unpauseGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  // Adjust timer to account for pause
  const pausedTime = Date.now() - gameState.levelStartTime - (120 - gameState.levelTimer) * 1000;
  gameState.levelStartTime += pausedTime;
  
  p.logs.game_info.push({
    data: { phase: 'PLAYING' },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function restartGame(p) {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.score = 0;
  gameState.currentLevel = 1;
  
  p.logs.game_info.push({
    data: { phase: 'START', action: 'restart' },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}