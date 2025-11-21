// input.js - Input handling

import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED } from './globals.js';

export function handleKeyPressed(p) {
  const key = p.key;
  const keyCode = p.keyCode;

  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  // Phase-specific controls
  if (keyCode === 13) { // ENTER
    handleEnterKey(p);
  } else if (keyCode === 27) { // ESC
    handleEscKey(p);
  } else if (keyCode === 82) { // R
    handleRestartKey(p);
  }

  // Gameplay controls (only in PLAYING phase)
  if (gameState.gamePhase === PHASE_PLAYING && gameState.controlMode === "HUMAN") {
    if (keyCode === 38) { // Arrow Up
      gameState.player?.jump();
    } else if (keyCode === 40) { // Arrow Down
      gameState.player?.slide();
    } else if (keyCode === 37) { // Arrow Left
      gameState.player?.changeLane(-1);
    } else if (keyCode === 39) { // Arrow Right
      gameState.player?.changeLane(1);
    }
  }
}

function handleEnterKey(p) {
  if (gameState.gamePhase === PHASE_START) {
    startGame(p);
  } else if (gameState.gamePhase === "LEVEL_COMPLETE" && gameState.currentLevel < 3) {
    nextLevel(p);
  }
}

function handleEscKey(p) {
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
}

function handleRestartKey(p) {
  if (gameState.gamePhase === PHASE_PAUSED || 
      gameState.gamePhase === "GAME_OVER" || 
      gameState.gamePhase === "LEVEL_COMPLETE") {
    resetGame(p);
  }
}

function startGame(p) {
  gameState.gamePhase = PHASE_PLAYING;
  gameState.currentLevel = 1;
  gameState.score = 0;
  gameState.fishCount = 0;
  gameState.lives = gameState.maxLives;
  gameState.distanceTraveled = 0;
  
  // Initialize level
  const { initLevel } = require('./game.js');
  initLevel(p);

  p.logs.game_info.push({
    data: { phase: PHASE_PLAYING, level: 1 },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function nextLevel(p) {
  gameState.currentLevel++;
  gameState.lives = gameState.maxLives;
  gameState.distanceTraveled = 0;
  gameState.gamePhase = PHASE_PLAYING;

  // Initialize next level
  const { initLevel } = require('./game.js');
  initLevel(p);

  p.logs.game_info.push({
    data: { phase: PHASE_PLAYING, level: gameState.currentLevel },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function resetGame(p) {
  gameState.gamePhase = PHASE_START;
  gameState.currentLevel = 1;
  gameState.score = 0;
  gameState.fishCount = 0;
  gameState.lives = gameState.maxLives;
  gameState.distanceTraveled = 0;
  gameState.entities = [];
  gameState.obstacles = [];
  gameState.items = [];
  gameState.powerUp.active = false;
  gameState.invulnerabilityTimer = 0;

  p.logs.game_info.push({
    data: { phase: PHASE_START },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

// Automated testing input handler
export function handleAutomatedInput(p, action) {
  if (!action || gameState.gamePhase !== PHASE_PLAYING) return;

  if (action.jump) {
    gameState.player?.jump();
  }
  if (action.slide) {
    gameState.player?.slide();
  }
  if (action.left) {
    gameState.player?.changeLane(-1);
  }
  if (action.right) {
    gameState.player?.changeLane(1);
  }
}