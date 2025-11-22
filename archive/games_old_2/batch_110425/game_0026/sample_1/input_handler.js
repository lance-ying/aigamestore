// input_handler.js - Input handling for human and automated control

import { gameState, GAME_PHASES, ATTRACTION_TYPES, RESEARCH_TREE, MASCOTS, GRID_SIZE } from './globals.js';
import { placeAttraction, removeAttraction, purchaseResearch, recruitMascot } from './game_logic.js';

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
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.noLoop();
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.loop();
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      resetGame(p);
    }
    return;
  }
  
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  // Menu handling
  if (keyCode === 32) { // SPACE
    if (!gameState.menuOpen) {
      gameState.menuOpen = true;
      gameState.menuIndex = 0;
    } else {
      handleMenuSelection(p);
    }
    return;
  }
  
  if (keyCode === 90) { // Z
    if (gameState.menuOpen) {
      gameState.menuOpen = false;
    } else if (gameState.hoveredCell.x >= 0 && gameState.hoveredCell.y >= 0) {
      removeAttraction(p, gameState.hoveredCell.x, gameState.hoveredCell.y);
    }
    return;
  }
  
  // Arrow key navigation
  if (gameState.menuOpen) {
    const totalItems = Object.keys(ATTRACTION_TYPES).length + RESEARCH_TREE.length + 
                      (gameState.year >= 2 ? MASCOTS.length : 0);
    
    if (keyCode === 38) { // UP
      gameState.menuIndex = Math.max(0, gameState.menuIndex - 1);
    } else if (keyCode === 40) { // DOWN
      gameState.menuIndex = Math.min(totalItems - 1, gameState.menuIndex + 1);
    }
  } else if (gameState.selectedAttractionType) {
    // Move cursor
    if (keyCode === 37) gameState.hoveredCell.x = Math.max(0, gameState.hoveredCell.x - 1); // LEFT
    if (keyCode === 39) gameState.hoveredCell.x = Math.min(14, gameState.hoveredCell.x + 1); // RIGHT
    if (keyCode === 38) gameState.hoveredCell.y = Math.max(0, gameState.hoveredCell.y - 1); // UP
    if (keyCode === 40) gameState.hoveredCell.y = Math.min(9, gameState.hoveredCell.y + 1); // DOWN
  } else {
    // Camera movement
    if (keyCode === 37) gameState.cameraOffsetX = Math.max(0, gameState.cameraOffsetX - 20); // LEFT
    if (keyCode === 39) gameState.cameraOffsetX = Math.min(100, gameState.cameraOffsetX + 20); // RIGHT
    if (keyCode === 38) gameState.cameraOffsetY = Math.max(0, gameState.cameraOffsetY - 20); // UP
    if (keyCode === 40) gameState.cameraOffsetY = Math.min(100, gameState.cameraOffsetY + 20); // DOWN
  }
}

function handleMenuSelection(p) {
  const attractionKeys = Object.keys(ATTRACTION_TYPES);
  const numAttractions = attractionKeys.length;
  const numResearch = RESEARCH_TREE.length;
  const numMascots = gameState.year >= 2 ? MASCOTS.length : 0;
  
  if (gameState.menuIndex < numAttractions) {
    // Select attraction to place
    const key = attractionKeys[gameState.menuIndex];
    if (gameState.unlockedAttractions.includes(key)) {
      gameState.selectedAttractionType = key;
      gameState.menuOpen = false;
      gameState.hoveredCell = { x: 2, y: 2 };
    }
  } else if (gameState.menuIndex < numAttractions + numResearch) {
    // Purchase research
    const researchIndex = gameState.menuIndex - numAttractions;
    const research = RESEARCH_TREE[researchIndex];
    if (purchaseResearch(p, research.id)) {
      gameState.menuOpen = false;
    }
  } else if (gameState.menuIndex < numAttractions + numResearch + numMascots) {
    // Recruit mascot
    const mascotIndex = gameState.menuIndex - numAttractions - numResearch;
    const mascot = MASCOTS[mascotIndex];
    if (recruitMascot(p, mascot.id)) {
      gameState.menuOpen = false;
    }
  }
}

export function handlePlacementMode(p) {
  if (!gameState.selectedAttractionType) return;
  
  if (p.keyIsDown(32)) { // SPACE to confirm
    if (placeAttraction(p, gameState.selectedAttractionType, 
                       gameState.hoveredCell.x, gameState.hoveredCell.y)) {
      gameState.selectedAttractionType = null;
      gameState.hoveredCell = { x: -1, y: -1 };
    }
  }
  
  if (p.keyIsDown(90)) { // Z to cancel
    gameState.selectedAttractionType = null;
    gameState.hoveredCell = { x: -1, y: -1 };
  }
}

export function resetGame(p) {
  gameState.attractions = [];
  gameState.guests = [];
  gameState.money = 500;
  gameState.satisfaction = 0;
  gameState.popularity = 0;
  gameState.ranking = 10;
  gameState.day = 1;
  gameState.year = 1;
  gameState.score = 0;
  gameState.gamePhase = GAME_PHASES.START;
  gameState.selectedAttractionType = null;
  gameState.menuOpen = false;
  gameState.menuIndex = 0;
  gameState.researchedItems = [];
  gameState.unlockedAttractions = ["COFFEE_CUP", "TRAMPOLINE"];
  gameState.availableLandCells = 50;
  gameState.mascots = [];
  gameState.cameraOffsetX = 0;
  gameState.cameraOffsetY = 0;
  gameState.incomeMultiplier = 1.0;
  gameState.lastGuestSpawnFrame = 0;
  gameState.hoveredCell = { x: -1, y: -1 };
  gameState.timescale = 1.0;
  gameState.framesSinceStart = 0;
  gameState.snsMessages = [];
  
  // Reset grid
  const { Grid } = require('./grid.js');
  gameState.grid = new Grid();
  
  if (gameState.gamePhase === GAME_PHASES.START) {
    p.loop();
  }
}