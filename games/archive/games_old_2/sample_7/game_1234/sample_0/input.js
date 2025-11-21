// input.js - Input handling

import { gameState, GAME_PHASES, CONTROL_MODES } from './globals.js';
import { performPour, undoMove, shuffleBottles, initializeLevel, checkWinCondition, checkLoseCondition, calculateLevelScore } from './gameLogic.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Global controls
  if (keyCode === 13) { // ENTER
    handleEnterKey(p);
    return;
  }
  
  if (keyCode === 82) { // R
    handleRestartKey(p);
    return;
  }
  
  if (keyCode === 27) { // ESC
    handleEscapeKey(p);
    return;
  }
  
  // Gameplay controls
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    handlePlayingInput(p, keyCode);
  }
}

function handleEnterKey(p) {
  if (gameState.gamePhase === GAME_PHASES.START) {
    initializeLevel(1);
    gameState.gamePhase = GAME_PHASES.PLAYING;
    gameState.totalScore = 0;
    p.logs.game_info.push({
      data: { phase: "PLAYING", level: 1 },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    if (gameState.currentLevel < gameState.maxLevels) {
      const nextLevel = gameState.currentLevel + 1;
      initializeLevel(nextLevel);
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: "PLAYING", level: nextLevel },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
}

function handleRestartKey(p) {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.selectedSourceBottleIndex = null;
  gameState.highlightedBottleIndex = 0;
  gameState.pouringAnimation = null;
  p.logs.game_info.push({
    data: { phase: "START" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function handleEscapeKey(p) {
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
}

function handlePlayingInput(p, keyCode) {
  // Skip if animation is playing
  if (gameState.pouringAnimation) return;
  
  if (keyCode === 37) { // Arrow Left
    gameState.highlightedBottleIndex = (gameState.highlightedBottleIndex - 1 + gameState.bottles.length) % gameState.bottles.length;
  } else if (keyCode === 39) { // Arrow Right
    gameState.highlightedBottleIndex = (gameState.highlightedBottleIndex + 1) % gameState.bottles.length;
  } else if (keyCode === 32) { // Space
    handleSpaceKey(p);
  } else if (keyCode === 90) { // Z - Undo
    undoMove();
  } else if (keyCode === 16) { // Shift - Shuffle
    shuffleBottles(p);
  }
}

function handleSpaceKey(p) {
  if (gameState.selectedSourceBottleIndex === null) {
    // Select source bottle
    const bottle = gameState.bottles[gameState.highlightedBottleIndex];
    if (!bottle.isEmpty) {
      gameState.selectedSourceBottleIndex = gameState.highlightedBottleIndex;
    }
  } else {
    // Try to pour
    if (gameState.selectedSourceBottleIndex !== gameState.highlightedBottleIndex) {
      performPour(gameState.selectedSourceBottleIndex, gameState.highlightedBottleIndex);
    } else {
      // Deselect
      gameState.selectedSourceBottleIndex = null;
    }
  }
}

export function updateGameLogic(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  if (gameState.pouringAnimation) return;
  
  // Check win condition
  if (checkWinCondition()) {
    const levelScore = calculateLevelScore();
    gameState.totalScore += levelScore;
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_WIN", score: gameState.totalScore, level: gameState.currentLevel },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  // Check lose condition
  if (checkLoseCondition()) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_LOSE", score: gameState.totalScore },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function logPlayerInfo(p) {
  // Log player info periodically
  if (p.frameCount % 60 === 0 && gameState.gamePhase === GAME_PHASES.PLAYING) {
    p.logs.player_info.push({
      screen_x: 0,
      screen_y: 0,
      game_x: 0,
      game_y: 0,
      framecount: p.frameCount
    });
  }
}