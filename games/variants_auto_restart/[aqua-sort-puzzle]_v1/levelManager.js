// levelManager.js - Level loading and management

import { gameState, LEVELS, GAME_PHASES, CANVAS_WIDTH } from './globals.js';
import { Tube } from './tube.js';

export function loadLevel(levelNumber, p) {
  if (levelNumber < 1 || levelNumber > LEVELS.length) {
    return false;
  }
  
  const levelConfig = LEVELS[levelNumber - 1];
  
  gameState.currentLevel = levelNumber;
  gameState.levelMaxMoves = levelConfig.maxMoves;
  gameState.levelMovesMade = 0;
  gameState.levelUndoCount = 0;
  gameState.selectedTubeIndex = -1;
  gameState.highlightedTubeIndex = 0;
  gameState.previousStates = [];
  gameState.isAnimating = false;
  
  // Create tubes
  gameState.tubes = [];
  const numTubes = levelConfig.tubes.length;
  
  // Use different layout for more than 5 tubes
  if (numTubes > 5) {
    // Multiple rows with smaller tubes
    const tubeWidth = 40;
    const tubeHeight = 160;
    const spacing = 55;
    
    // Distribute tubes across 2 rows
    const tubesPerRow1 = Math.ceil(numTubes / 2);
    const tubesPerRow2 = numTubes - tubesPerRow1;
    
    // Row 1
    const row1Width = tubesPerRow1 * spacing - (spacing - tubeWidth);
    const row1StartX = (CANVAS_WIDTH - row1Width) / 2;
    const row1Y = 100;
    
    for (let i = 0; i < tubesPerRow1; i++) {
      const tubeConfig = levelConfig.tubes[i];
      const tube = new Tube(
        tubeConfig.capacity,
        tubeConfig.colors,
        row1StartX + i * spacing,
        row1Y,
        tubeWidth,
        tubeHeight,
        p
      );
      gameState.tubes.push(tube);
    }
    
    // Row 2
    const row2Width = tubesPerRow2 * spacing - (spacing - tubeWidth);
    const row2StartX = (CANVAS_WIDTH - row2Width) / 2;
    const row2Y = 100 + tubeHeight + 40; // Add gap between rows
    
    for (let i = 0; i < tubesPerRow2; i++) {
      const tubeConfig = levelConfig.tubes[tubesPerRow1 + i];
      const tube = new Tube(
        tubeConfig.capacity,
        tubeConfig.colors,
        row2StartX + i * spacing,
        row2Y,
        tubeWidth,
        tubeHeight,
        p
      );
      gameState.tubes.push(tube);
    }
  } else {
    // Single row layout for 5 or fewer tubes
    const tubeWidth = 50;
    const tubeHeight = 200;
    const spacing = 70;
    const startX = (CANVAS_WIDTH - (numTubes * spacing - 20)) / 2;
    const tubeY = 150;
    
    for (let i = 0; i < numTubes; i++) {
      const tubeConfig = levelConfig.tubes[i];
      const tube = new Tube(
        tubeConfig.capacity,
        tubeConfig.colors,
        startX + i * spacing,
        tubeY,
        tubeWidth,
        tubeHeight,
        p
      );
      gameState.tubes.push(tube);
    }
  }
  
  return true;
}

export function checkLevelComplete() {
  // Check if all tubes are sorted
  return gameState.tubes.every(tube => tube.isSorted());
}

export function calculateLevelScore() {
  const baseScore = 100;
  const moveBonus = Math.max(0, (gameState.levelMaxMoves - gameState.levelMovesMade) * 5);
  const undoBonus = gameState.levelUndoCount === 0 ? 50 : 0;
  
  return baseScore + moveBonus + undoBonus;
}

export function advanceToNextLevel(p) {
  if (gameState.currentLevel < LEVELS.length) {
    loadLevel(gameState.currentLevel + 1, p);
    gameState.gamePhase = GAME_PHASES.PLAYING;
    return true;
  } else {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    return false;
  }
}