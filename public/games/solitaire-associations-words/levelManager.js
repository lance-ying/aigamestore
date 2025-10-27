// levelManager.js - Level initialization and management

import { gameState, LEVEL_DEFINITIONS, DECK_X, DECK_Y, ACTIVE_CARD_X, ACTIVE_CARD_Y } from './globals.js';
import { CategoryCard, WordCard } from './card.js';

export function initializeLevel(p, levelNumber) {
  const levelDef = LEVEL_DEFINITIONS[levelNumber - 1];
  if (!levelDef) {
    console.error("Level not found:", levelNumber);
    return false;
  }
  
  gameState.currentLevel = levelNumber;
  gameState.movesRemaining = levelDef.moves;
  gameState.levelData = levelDef;
  gameState.levelScore = 0;
  gameState.completedCategories.clear();
  
  // Create category cards
  gameState.categoryCards = [];
  for (const catDef of levelDef.categories) {
    const cat = new CategoryCard(catDef.name, catDef.x, catDef.y);
    gameState.categoryCards.push(cat);
  }
  
  // Create word cards deck
  gameState.deckCards = [];
  const shuffledWords = [...levelDef.words];
  // Shuffle using p5's random (seeded)
  for (let i = shuffledWords.length - 1; i > 0; i--) {
    const j = Math.floor(p.random() * (i + 1));
    [shuffledWords[i], shuffledWords[j]] = [shuffledWords[j], shuffledWords[i]];
  }
  
  for (const wordDef of shuffledWords) {
    const wordCard = new WordCard(wordDef.word, wordDef.category, DECK_X, DECK_Y);
    gameState.deckCards.push(wordCard);
  }
  
  gameState.activeCard = null;
  gameState.highlightedCategoryIndex = 0;
  gameState.animatingCard = null;
  gameState.animationProgress = 0;
  
  return true;
}

export function checkLevelComplete() {
  // Check if all words are sorted
  const totalWords = gameState.levelData.words.length;
  let placedWords = 0;
  
  for (const cat of gameState.categoryCards) {
    placedWords += cat.words.length;
  }
  
  return placedWords === totalWords;
}

export function getWordsPerCategory(categoryName) {
  return gameState.levelData.words.filter(w => w.category === categoryName).length;
}