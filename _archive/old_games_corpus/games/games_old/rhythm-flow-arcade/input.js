// input.js - Input handling

import { gameState } from './globals.js';

export function handleKeyPressed(p, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key: p.key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Update key state
  gameState.keyState[keyCode] = true;
  
  // Phase transitions
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === 'START') {
      startGame(p);
    }
  } else if (keyCode === 27) { // ESC
    if (gameState.gamePhase === 'PLAYING') {
      pauseGame(p);
    } else if (gameState.gamePhase === 'PAUSED') {
      resumeGame(p);
    }
  } else if (keyCode === 82) { // R
    if (gameState.gamePhase === 'GAME_OVER' || gameState.gamePhase === 'PAUSED' || gameState.gamePhase === 'LEVEL_COMPLETE') {
      restartGame(p);
    }
  } else if (keyCode === 32) { // SPACE
    if (gameState.gamePhase === 'LEVEL_COMPLETE') {
      nextLevel(p);
    }
  }
}

export function handleKeyReleased(p, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: 'keyReleased',
    data: { key: p.key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  gameState.keyState[keyCode] = false;
}

function startGame(p) {
  gameState.gamePhase = 'PLAYING';
  gameState.score = 0;
  gameState.combo = 0;
  gameState.maxCombo = 0;
  gameState.lifeBar = 100;
  gameState.songTimeElapsed = 0;
  gameState.songStartTime = Date.now();
  gameState.chartIndex = 0;
  gameState.activeNotes = [];
  gameState.accuracyCount = { perfect: 0, great: 0, good: 0, miss: 0 };
  gameState.recentHitFeedback = [];
  gameState.particleEffects = [];
  
  p.logs.game_info.push({
    data: { phase: 'PLAYING', level: gameState.currentLevel },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function pauseGame(p) {
  gameState.gamePhase = 'PAUSED';
  p.logs.game_info.push({
    data: { phase: 'PAUSED' },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function resumeGame(p) {
  gameState.gamePhase = 'PLAYING';
  gameState.songStartTime = Date.now() - gameState.songTimeElapsed;
  p.logs.game_info.push({
    data: { phase: 'PLAYING' },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function restartGame(p) {
  gameState.gamePhase = 'START';
  gameState.currentLevel = 1;
  p.logs.game_info.push({
    data: { phase: 'START' },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function nextLevel(p) {
  if (gameState.currentLevel < gameState.totalLevels) {
    gameState.currentLevel++;
    startGame(p);
  } else {
    restartGame(p);
  }
}