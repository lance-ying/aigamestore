// gameLogic.js - Core game logic

import { gameState, GAME_PHASES } from './globals.js';
import { Bottle } from './bottle.js';
import { getLevelConfig } from './levels.js';

export function initializeLevel(levelNumber) {
  const config = getLevelConfig(levelNumber);
  if (!config) return false;
  
  gameState.currentLevel = levelNumber;
  gameState.levelMovesMade = 0;
  gameState.levelStartTime = Date.now();
  gameState.undoUsesLeft = 3;
  gameState.shuffleUsesLeft = 3;
  gameState.moveHistory = [];
  gameState.selectedSourceBottleIndex = null;
  gameState.highlightedBottleIndex = 0;
  gameState.pouringAnimation = null;
  
  // Create bottles
  gameState.bottles = [];
  const startX = 50;
  const spacing = 80;
  
  for (let i = 0; i < config.bottleCount; i++) {
    const x = startX + i * spacing;
    const y = 150;
    const contents = config.bottles[i] ? [...config.bottles[i]] : [];
    const bottle = new Bottle(x, y, config.capacity, contents);
    gameState.bottles.push(bottle);
  }
  
  return true;
}

export function checkWinCondition() {
  // All non-empty bottles must be uniform and full OR empty
  for (const bottle of gameState.bottles) {
    if (!bottle.isEmpty && !bottle.isUniform()) {
      return false;
    }
  }
  
  // Check that all colors are properly sorted
  const filledBottles = gameState.bottles.filter(b => !b.isEmpty);
  const emptyBottles = gameState.bottles.filter(b => b.isEmpty);
  
  // Each filled bottle should have a unique color
  const colors = new Set();
  for (const bottle of filledBottles) {
    if (bottle.contents.length > 0) {
      const color = bottle.contents[0];
      if (colors.has(color)) {
        // Same color in multiple bottles - check if both are full
        const bottlesWithColor = gameState.bottles.filter(b => 
          b.contents.length > 0 && b.contents[0] === color
        );
        // Allow multiple bottles of same color only if sorting in progress
        if (bottlesWithColor.some(b => !b.isFull || !b.isUniform())) {
          return false;
        }
      }
      colors.add(color);
    }
  }
  
  return true;
}

export function checkLoseCondition() {
  // Check if there are any valid moves available
  for (let i = 0; i < gameState.bottles.length; i++) {
    for (let j = 0; j < gameState.bottles.length; j++) {
      if (i !== j && gameState.bottles[i].canPourInto(gameState.bottles[j])) {
        return false; // Valid move exists
      }
    }
  }
  
  // No valid moves and no resources left
  return gameState.undoUsesLeft <= 0 && gameState.shuffleUsesLeft <= 0;
}

export function saveGameState() {
  const state = {
    bottles: gameState.bottles.map(b => ({
      contents: [...b.contents]
    })),
    levelMovesMade: gameState.levelMovesMade,
    undoUsesLeft: gameState.undoUsesLeft,
    shuffleUsesLeft: gameState.shuffleUsesLeft
  };
  
  gameState.moveHistory.push(state);
  if (gameState.moveHistory.length > 15) {
    gameState.moveHistory.shift();
  }
}

export function performPour(sourceIndex, destIndex) {
  if (sourceIndex === destIndex) return false;
  if (sourceIndex < 0 || sourceIndex >= gameState.bottles.length) return false;
  if (destIndex < 0 || destIndex >= gameState.bottles.length) return false;
  
  const source = gameState.bottles[sourceIndex];
  const dest = gameState.bottles[destIndex];
  
  if (!source.canPourInto(dest)) return false;
  
  // Save state for undo
  saveGameState();
  
  const amountToPour = source.pourInto(dest);
  const topColor = source.getTopColor();
  
  // Create pouring animation
  gameState.pouringAnimation = {
    sourceIndex,
    destIndex,
    color: topColor,
    amount: amountToPour,
    progress: 0,
    duration: 30 // frames
  };
  
  // Actually move the water
  for (let i = 0; i < amountToPour; i++) {
    const color = source.contents.pop();
    dest.contents.push(color);
  }
  
  gameState.levelMovesMade++;
  gameState.selectedSourceBottleIndex = null;
  
  return true;
}

export function undoMove() {
  if (gameState.moveHistory.length === 0) return false;
  if (gameState.undoUsesLeft <= 0) return false;
  
  const previousState = gameState.moveHistory.pop();
  
  // Restore bottle contents
  for (let i = 0; i < gameState.bottles.length; i++) {
    gameState.bottles[i].contents = [...previousState.bottles[i].contents];
  }
  
  gameState.levelMovesMade = previousState.levelMovesMade;
  gameState.undoUsesLeft--;
  gameState.totalScore -= 5;
  
  return true;
}

export function shuffleBottles(p) {
  if (gameState.shuffleUsesLeft <= 0) return false;
  
  // Randomize bottle positions
  const positions = [];
  const startX = 50;
  const spacing = 80;
  
  for (let i = 0; i < gameState.bottles.length; i++) {
    positions.push({ x: startX + i * spacing, y: 150 });
  }
  
  // Fisher-Yates shuffle
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(p.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  
  // Assign new target positions
  for (let i = 0; i < gameState.bottles.length; i++) {
    gameState.bottles[i].targetX = positions[i].x;
    gameState.bottles[i].targetY = positions[i].y;
  }
  
  gameState.shuffleUsesLeft--;
  gameState.totalScore -= 10;
  
  return true;
}

export function calculateLevelScore() {
  const config = getLevelConfig(gameState.currentLevel);
  if (!config) return 0;
  
  let score = 100; // Base completion bonus
  
  // Moves efficiency bonus
  const movesBonus = Math.max(0, (config.maxMoves - gameState.levelMovesMade) * 5);
  score += movesBonus;
  
  // Time efficiency bonus
  const timeElapsed = (Date.now() - gameState.levelStartTime) / 1000;
  const timeBonus = Math.max(0, Math.floor((config.maxTime - timeElapsed) * 2));
  score += timeBonus;
  
  return score;
}