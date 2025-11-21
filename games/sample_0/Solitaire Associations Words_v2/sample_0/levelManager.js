// levelManager.js - Level initialization and management

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, CARD_WIDTH, CARD_HEIGHT, CARD_SPACING } from './globals.js';
import { getLevelData } from './levels.js';
import { Card } from './card.js';
import { CategoryStack } from './categoryStack.js';

export function initializeLevel(p, levelNum) {
  const levelData = getLevelData(levelNum);
  
  // Reset game state
  gameState.level = levelNum;
  gameState.maxMoves = levelData.moves;
  gameState.movesRemaining = levelData.moves;
  gameState.deck = [];
  gameState.currentCard = null;
  gameState.categoryStacks = [];
  gameState.selectedStackIndex = 0;
  gameState.drawPhase = true;
  gameState.moveHistory = [];
  gameState.categories = levelData.categories;
  gameState.entities = [];
  gameState.levelComplete = false;
  gameState.showingLevelComplete = false;
  gameState.levelCompleteTimer = 0;
  
  // Create deck with all cards
  const allCards = [];
  
  // Add word cards to deck
  for (const category of levelData.categories) {
    const words = levelData.words[category];
    for (const word of words) {
      const card = new Card(word, false, category);
      allCards.push(card);
    }
  }
  
  // Shuffle deck (using p5's random which is seeded)
  for (let i = allCards.length - 1; i > 0; i--) {
    const j = Math.floor(p.random(i + 1));
    [allCards[i], allCards[j]] = [allCards[j], allCards[i]];
  }
  
  gameState.deck = allCards;
  
  // Create category stacks based on initialBoard
  const boardLayout = levelData.initialBoard;
  const stackSpacing = (CANVAS_WIDTH - 40) / boardLayout.length;
  const startY = 180;
  
  for (let i = 0; i < boardLayout.length; i++) {
    const x = 20 + i * stackSpacing;
    const item = boardLayout[i];
    
    if (item !== null) {
      // This is a category card
      const stack = new CategoryStack(item, x, startY);
      const categoryCard = new Card(item, true, item);
      stack.cards.push(categoryCard);
      stack.maxWords = levelData.words[item].length;
      gameState.categoryStacks.push(stack);
      gameState.entities.push(categoryCard);
    } else {
      // Empty stack slot
      const stack = new CategoryStack(null, x, startY);
      gameState.categoryStacks.push(stack);
    }
  }
  
  // Position all cards initially
  updateAllCardPositions(false);
  
  // Log level start
  p.logs.game_info.push({
    data: { phase: "LEVEL_START", level: levelNum, moves: levelData.moves },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function updateAllCardPositions(animate = true) {
  // Update stack positions
  for (const stack of gameState.categoryStacks) {
    stack.updateCardPositions(animate);
  }
  
  // Update deck position
  const deckX = 20;
  const deckY = 50;
  for (let i = 0; i < gameState.deck.length; i++) {
    gameState.deck[i].setPosition(deckX + i * 0.5, deckY, animate);
  }
  
  // Update current card position
  if (gameState.currentCard) {
    const currentX = CANVAS_WIDTH / 2 - CARD_WIDTH / 2;
    const currentY = 80;
    gameState.currentCard.setPosition(currentX, currentY, animate);
  }
}

export function checkLevelComplete() {
  if (gameState.levelComplete) return;
  
  let allComplete = true;
  for (const stack of gameState.categoryStacks) {
    if (stack.cards.length > 0 && !stack.complete) {
      allComplete = false;
      break;
    }
  }
  
  if (allComplete && gameState.deck.length === 0 && !gameState.currentCard) {
    gameState.levelComplete = true;
    gameState.showingLevelComplete = true;
    gameState.levelCompleteTimer = 0;
  }
}

export function advanceToNextLevel(p) {
  gameState.score += gameState.movesRemaining * 10;
  initializeLevel(p, gameState.level + 1);
}