// game_logic.js - Core game logic

import { gameState, PHASE_PLAYING, PHASE_GAME_OVER_WIN, initializeGrid } from './globals.js';
import { Entity, WordBlock } from './entities.js';
import { parseRules, hasProperty, getObjectsWithProperty } from './rules.js';
import { LEVELS } from './levels.js';

export function loadLevel(levelIndex) {
  if (levelIndex < 0 || levelIndex >= LEVELS.length) {
    return false;
  }

  const level = LEVELS[levelIndex];
  
  // Clear existing entities
  gameState.entities = [];
  gameState.wordBlocks = [];
  initializeGrid();
  gameState.moves = 0;

  // Create entities
  for (const entityData of level.entities) {
    const entity = new Entity(entityData.type, entityData.x, entityData.y);
    gameState.entities.push(entity);
  }

  // Create word blocks
  for (const wordData of level.wordBlocks) {
    const word = new WordBlock(wordData.wordType, wordData.word, wordData.x, wordData.y);
    gameState.wordBlocks.push(word);
  }

  // Parse initial rules
  parseRules();

  // Set player reference
  for (const entity of gameState.entities) {
    if (gameState.playerControlledTypes.includes(entity.type)) {
      gameState.player = entity;
      break;
    }
  }

  return true;
}

export function checkWinCondition() {
  const winTypes = getObjectsWithProperty("WIN");
  
  if (winTypes.length === 0) {
    return false;
  }

  // Check if any player-controlled entity is on a WIN object
  for (const entity of gameState.entities) {
    if (!entity.deleted && gameState.playerControlledTypes.includes(entity.type)) {
      // Check if there's a WIN object at this position
      for (const otherEntity of gameState.entities) {
        if (!otherEntity.deleted && 
            otherEntity !== entity &&
            otherEntity.gridX === entity.gridX &&
            otherEntity.gridY === entity.gridY &&
            winTypes.includes(otherEntity.type)) {
          return true;
        }
      }
    }
  }

  return false;
}

export function checkLoseCondition() {
  // Lose if no player-controlled entities exist
  let hasPlayerEntity = false;
  for (const entity of gameState.entities) {
    if (!entity.deleted && gameState.playerControlledTypes.includes(entity.type)) {
      hasPlayerEntity = true;
      break;
    }
  }

  return !hasPlayerEntity;
}

export function updateGame() {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return;
  }

  // Update all entities
  for (const entity of gameState.entities) {
    if (!entity.deleted) {
      entity.update();
    }
  }

  // Update all word blocks
  for (const word of gameState.wordBlocks) {
    if (!word.deleted) {
      word.update();
    }
  }

  // Remove deleted entities
  gameState.entities = gameState.entities.filter(e => !e.deleted);
  gameState.wordBlocks = gameState.wordBlocks.filter(w => !w.deleted);

  // Check win/lose conditions
  if (checkWinCondition()) {
    gameState.gamePhase = PHASE_GAME_OVER_WIN;
    gameState.score += 1000 + (100 - gameState.moves) * 10;
  } else if (checkLoseCondition()) {
    // Reset level if player is lost
    loadLevel(gameState.level - 1);
  }
}

export function nextLevel() {
  gameState.level++;
  if (gameState.level > gameState.maxLevel) {
    gameState.level = gameState.maxLevel;
    return false;
  }
  loadLevel(gameState.level - 1);
  return true;
}

export function restartLevel() {
  loadLevel(gameState.level - 1);
}