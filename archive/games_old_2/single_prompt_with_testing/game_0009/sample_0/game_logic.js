// game_logic.js - Core game logic and state management

import {
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  DESIGN_PHASE,
  SIMULATE_PHASE,
  gameState
} from './globals.js';

import { getLevelData } from './levels.js';
import { initializeDesignPhase } from './design_phase.js';
import { initializeSimulation } from './simulation_phase.js';

export function startGame(p) {
  gameState.gamePhase = PHASE_PLAYING;
  gameState.currentLevel = 1;
  gameState.score = 0;
  
  loadLevel(p, gameState.currentLevel);
  
  p.logs.game_info.push({
    data: { event: "game_started", level: gameState.currentLevel },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function loadLevel(p, levelId) {
  gameState.levelData = getLevelData(levelId);
  gameState.entryPoints = gameState.levelData.entryPoints;
  gameState.exitPoints = gameState.levelData.exitPoints;
  
  initializeDesignPhase(p);
  
  p.logs.game_info.push({
    data: { event: "level_loaded", level: levelId },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function restartGame(p) {
  gameState.gamePhase = PHASE_START;
  gameState.currentLevel = 1;
  gameState.score = 0;
  gameState.vehicles = [];
  gameState.entities = [];
  gameState.roadSegments = [];
  
  p.logs.game_info.push({
    data: { event: "game_restarted" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function togglePause(p) {
  if (gameState.gamePhase === PHASE_PLAYING) {
    gameState.gamePhase = PHASE_PAUSED;
    p.noLoop();
  } else if (gameState.gamePhase === PHASE_PAUSED) {
    gameState.gamePhase = PHASE_PLAYING;
    p.loop();
  }
  
  p.logs.game_info.push({
    data: { event: "pause_toggled", phase: gameState.gamePhase },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function advanceToNextLevel(p) {
  if (gameState.gamePhase === PHASE_GAME_OVER_WIN) {
    gameState.currentLevel++;
    if (gameState.currentLevel <= 4) {
      loadLevel(p, gameState.currentLevel);
      gameState.gamePhase = PHASE_PLAYING;
    }
  }
}