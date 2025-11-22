// input_handler.js - Input handling

import {
  gameState,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  MODE_BUILD,
  MODE_RESEARCH,
  MODE_EXPAND,
  initializeGrid,
  ATTRACTIONS,
  RESEARCH_TREE,
  GRID_COLS,
  GRID_ROWS
} from './globals.js';
import { 
  placeAttraction, 
  performResearch, 
  expandLand, 
  scoutMascot,
  canScoutMascot
} from './game_logic.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  gameState.lastKeyPressed = keyCode;
  gameState.framesSinceLastAction = 0;
  
  // Phase-specific controls
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
    if (gameState.gamePhase === PHASE_GAME_OVER_WIN || 
        gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      resetGame(p);
    }
    return;
  }
  
  // Gameplay controls (only during PLAYING phase)
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  // Mode switching
  if (keyCode === 16) { // SHIFT
    const modes = [MODE_BUILD, MODE_RESEARCH, MODE_EXPAND];
    const currentIndex = modes.indexOf(gameState.currentMode);
    gameState.currentMode = modes[(currentIndex + 1) % modes.length];
    gameState.menuScroll = 0;
    gameState.selectedResearch = Object.keys(RESEARCH_TREE)[0];
    return;
  }
  
  // Mode-specific controls
  if (gameState.currentMode === MODE_BUILD) {
    handleBuildInput(p, keyCode);
  } else if (gameState.currentMode === MODE_RESEARCH) {
    handleResearchInput(p, keyCode);
  } else if (gameState.currentMode === MODE_EXPAND) {
    handleExpandInput(p, keyCode);
  }
}

function handleBuildInput(p, keyCode) {
  if (keyCode === 37) { // LEFT
    gameState.cursorX = Math.max(0, gameState.cursorX - 1);
  } else if (keyCode === 39) { // RIGHT
    gameState.cursorX = Math.min(GRID_COLS - 1, gameState.cursorX + 1);
  } else if (keyCode === 38) { // UP
    const attractionKeys = Object.keys(ATTRACTIONS);
    const currentIndex = attractionKeys.indexOf(gameState.selectedAttractionType);
    const newIndex = Math.max(0, currentIndex - 1);
    gameState.selectedAttractionType = attractionKeys[newIndex];
    
    if (newIndex < gameState.menuScroll) {
      gameState.menuScroll = newIndex;
    }
  } else if (keyCode === 40) { // DOWN
    const attractionKeys = Object.keys(ATTRACTIONS);
    const currentIndex = attractionKeys.indexOf(gameState.selectedAttractionType);
    const newIndex = Math.min(attractionKeys.length - 1, currentIndex + 1);
    gameState.selectedAttractionType = attractionKeys[newIndex];
    
    if (newIndex > gameState.menuScroll + 5) {
      gameState.menuScroll = newIndex - 5;
    }
  } else if (keyCode === 32) { // SPACE
    placeAttraction(p, gameState.selectedAttractionType, gameState.cursorX, gameState.cursorY);
  }
}

function handleResearchInput(p, keyCode) {
  const researchKeys = Object.keys(RESEARCH_TREE);
  
  if (keyCode === 38) { // UP
    const currentIndex = researchKeys.indexOf(gameState.selectedResearch);
    const newIndex = Math.max(0, currentIndex - 1);
    gameState.selectedResearch = researchKeys[newIndex];
    
    if (newIndex < gameState.menuScroll) {
      gameState.menuScroll = newIndex;
    }
  } else if (keyCode === 40) { // DOWN
    const currentIndex = researchKeys.indexOf(gameState.selectedResearch);
    const newIndex = Math.min(researchKeys.length - 1, currentIndex + 1);
    gameState.selectedResearch = researchKeys[newIndex];
    
    if (newIndex > gameState.menuScroll + 6) {
      gameState.menuScroll = newIndex - 6;
    }
  } else if (keyCode === 32) { // SPACE
    performResearch(gameState.selectedResearch);
  }
}

function handleExpandInput(p, keyCode) {
  if (keyCode === 32) { // SPACE
    // Try mascot scouting first
    if (gameState.canScoutMascot && gameState.mascots.length < 4) {
      scoutMascot(p, gameState.mascots.length);
    } else {
      // Otherwise try land expansion
      expandLand();
    }
  }
}

function startGame(p) {
  gameState.gamePhase = PHASE_PLAYING;
  
  p.logs.game_info.push({
    data: { phase: PHASE_PLAYING, event: "game_start" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function resetGame(p) {
  // Reset all game state
  gameState.gamePhase = PHASE_START;
  gameState.money = 500;
  gameState.satisfaction = 0;
  gameState.popularity = 0;
  gameState.rank = 10;
  gameState.attractions = [];
  gameState.guests = [];
  gameState.mascots = [];
  gameState.researchedItems = [];
  gameState.year = 1;
  gameState.canScoutMascot = true;
  gameState.dayCounter = 0;
  gameState.efficiencyLevel = 0;
  gameState.capacityLevel = 0;
  gameState.maxGuests = 10;
  gameState.guestSpawnTimer = 0;
  gameState.gridWidth = 5;
  gameState.gridHeight = 5;
  gameState.currentMode = MODE_BUILD;
  gameState.selectedAttractionType = "COFFEE_CUPS";
  gameState.selectedResearch = Object.keys(RESEARCH_TREE)[0];
  gameState.cursorX = 0;
  gameState.cursorY = 0;
  gameState.menuScroll = 0;
  
  // Reset attraction unlocks
  for (const key in ATTRACTIONS) {
    ATTRACTIONS[key].unlocked = (key === "COFFEE_CUPS" || key === "TRAMPOLINE");
  }
  
  initializeGrid();
  
  p.logs.game_info.push({
    data: { phase: PHASE_START, event: "game_reset" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}