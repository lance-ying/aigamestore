// input.js - Input handling

import { gameState, GAME_PHASES } from './globals.js';
import { createLevel } from './levels.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  // Phase transitions
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      startGame(p);
    }
  } else if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      pauseGame(p);
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      resumeGame(p);
    }
  } else if (keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      restartGame(p);
    }
  }
}

function startGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  gameState.currentLevel = 0;
  gameState.score = 0;
  gameState.deaths = 0;
  
  let startPos = createLevel(gameState.currentLevel);
  if (gameState.player) {
    gameState.player.reset(startPos.x, startPos.y);
  }

  p.logs.game_info.push({
    data: { phase: "PLAYING", level: gameState.currentLevel },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function pauseGame(p) {
  gameState.gamePhase = GAME_PHASES.PAUSED;
  p.logs.game_info.push({
    data: { phase: "PAUSED" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function resumeGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  p.logs.game_info.push({
    data: { phase: "PLAYING" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function restartGame(p) {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.currentLevel = 0;
  gameState.score = 0;
  gameState.deaths = 0;
  
  p.logs.game_info.push({
    data: { phase: "START" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function loadNextLevel(p) {
  gameState.currentLevel++;
  
  if (gameState.currentLevel >= gameState.totalLevels) {
    // Won the game
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_WIN", finalScore: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else {
    // Load next level
    let startPos = createLevel(gameState.currentLevel);
    if (gameState.player) {
      gameState.player.reset(startPos.x, startPos.y);
    }
    gameState.levelCompleted = false;
  }
}

export function playerDied(p) {
  if (gameState.hardcoreMode) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
  } else {
    // Respawn at level start
    let startPos = createLevel(gameState.currentLevel);
    if (gameState.player) {
      gameState.player.reset(startPos.x, startPos.y);
    }
  }

  p.logs.game_info.push({
    data: { phase: "PLAYER_DIED", level: gameState.currentLevel },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}