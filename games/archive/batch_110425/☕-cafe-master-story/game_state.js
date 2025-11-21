// game_state.js - Game state management

import {
  gameState,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  initializeCafeGrid
} from './globals.js';
import { checkWinCondition } from './cafe_management.js';

export function startGame(p) {
  gameState.gamePhase = PHASE_PLAYING;
  gameState.frameCount = 0;
  gameState.score = 0;
  gameState.popularity = 0;
  gameState.money = 500;
  gameState.atmosphere = 0;
  gameState.furniture = [];
  gameState.menu = [];
  gameState.customers = [];
  gameState.regulars = 0;
  gameState.fiveStarAchieved = false;
  gameState.currentTown = 0;
  gameState.menuOpen = false;
  gameState.selectedMenuTab = 0;
  gameState.selectedRecipeBase = null;
  gameState.selectedRecipeAdditions = [];
  gameState.selectedFurniture = null;
  gameState.placementMode = false;
  gameState.lastCustomerSpawn = 0;
  gameState.testFrameCount = 0;
  gameState.testActionQueue = [];
  
  initializeCafeGrid();
  
  p.logs.game_info.push({
    data: { phase: PHASE_PLAYING, event: "game_started" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function restartGame(p) {
  gameState.gamePhase = PHASE_START;
  
  p.logs.game_info.push({
    data: { phase: PHASE_START, event: "game_restarted" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function togglePause(p) {
  if (gameState.gamePhase === PHASE_PLAYING) {
    gameState.gamePhase = PHASE_PAUSED;
    p.logs.game_info.push({
      data: { phase: PHASE_PAUSED, event: "game_paused" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else if (gameState.gamePhase === PHASE_PAUSED) {
    gameState.gamePhase = PHASE_PLAYING;
    p.logs.game_info.push({
      data: { phase: PHASE_PLAYING, event: "game_resumed" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function checkGameOver(p) {
  if (checkWinCondition()) {
    gameState.gamePhase = PHASE_GAME_OVER_WIN;
    gameState.fiveStarAchieved = true;
    
    p.logs.game_info.push({
      data: { 
        phase: PHASE_GAME_OVER_WIN, 
        event: "game_won",
        finalScore: gameState.score,
        popularity: gameState.popularity
      },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}