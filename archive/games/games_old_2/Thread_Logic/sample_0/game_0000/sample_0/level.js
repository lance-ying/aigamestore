// level.js - Level management
import { gameState, GAME_PHASES } from './globals.js';
import { LEVELS } from './levels.js';
import { Screw } from './screw.js';

export function loadLevel(levelIndex) {
  const levelData = LEVELS[levelIndex];
  
  if (!levelData) {
    console.error('Level not found:', levelIndex);
    return false;
  }
  
  // Clear previous screws
  gameState.screws = [];
  gameState.entities = gameState.entities.filter(e => !(e instanceof Screw));
  
  // Create new screws
  for (let screwConfig of levelData.screws) {
    const screw = new Screw(screwConfig);
    gameState.screws.push(screw);
    gameState.entities.push(screw);
  }
  
  // Reset level state
  gameState.activeScrewId = null;
  gameState.levelMovesCount = 0;
  gameState.levelStartTime = Date.now();
  gameState.levelScore = 0;
  gameState.timeBonus = 0;
  
  return true;
}

export function checkLevelComplete() {
  const allRemoved = gameState.screws.every(s => s.state === "REMOVED");
  
  if (allRemoved) {
    calculateLevelScore();
    gameState.gamePhase = GAME_PHASES.LEVEL_COMPLETE;
    return true;
  }
  
  return false;
}

export function calculateLevelScore() {
  const basePoints = 1000;
  const screwPoints = gameState.screws.length * 50;
  
  const elapsedSeconds = (Date.now() - gameState.levelStartTime) / 1000;
  const timeBonus = Math.max(0, 1000 - Math.floor(elapsedSeconds * 5));
  
  gameState.levelScore = basePoints + screwPoints;
  gameState.timeBonus = timeBonus;
  gameState.totalScore += gameState.levelScore + timeBonus;
}

export function nextLevel() {
  if (gameState.currentLevelIndex < 5) {
    gameState.currentLevelIndex++;
    loadLevel(gameState.currentLevelIndex);
    gameState.gamePhase = GAME_PHASES.PLAYING;
  } else {
    gameState.gamePhase = GAME_PHASES.GAME_OVER;
  }
}