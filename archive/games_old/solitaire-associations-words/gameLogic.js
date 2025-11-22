// gameLogic.js - Core game logic

import { gameState, DECK_X, DECK_Y, ACTIVE_CARD_X, ACTIVE_CARD_Y } from './globals.js';
import { checkLevelComplete, getWordsPerCategory } from './levelManager.js';

export function drawCard(p) {
  if (gameState.deckCards.length === 0) return;
  if (gameState.activeCard) return; // Already have an active card
  
  const card = gameState.deckCards.pop();
  card.x = DECK_X;
  card.y = DECK_Y;
  
  // Animate to active card slot
  gameState.animatingCard = card;
  gameState.animationProgress = 0;
  
  gameState.movesRemaining--;
  
  p.logs.game_info.push({
    data: { action: "draw_card", word: card.word, movesRemaining: gameState.movesRemaining },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function updateAnimation(p) {
  if (gameState.animatingCard) {
    gameState.animationProgress += 0.1;
    
    if (gameState.animationProgress >= 1) {
      // Animation complete
      gameState.activeCard = gameState.animatingCard;
      gameState.activeCard.x = ACTIVE_CARD_X;
      gameState.activeCard.y = ACTIVE_CARD_Y;
      gameState.animatingCard = null;
      gameState.animationProgress = 0;
    } else {
      // Interpolate position
      const t = gameState.animationProgress;
      gameState.animatingCard.x = p.lerp(DECK_X, ACTIVE_CARD_X, t);
      gameState.animatingCard.y = p.lerp(DECK_Y, ACTIVE_CARD_Y, t);
    }
  }
}

export function placeActiveCard(p, targetCategory) {
  if (!gameState.activeCard) return;
  
  const card = gameState.activeCard;
  
  // Check if matches
  if (card.category === targetCategory.name) {
    // Correct placement
    targetCategory.addWord(card);
    gameState.activeCard = null;
    
    // Award points
    gameState.score += 10;
    gameState.levelScore += 10;
    
    // Check if category is now complete
    const wordsNeeded = getWordsPerCategory(targetCategory.name);
    if (targetCategory.words.length === wordsNeeded && !gameState.completedCategories.has(targetCategory.name)) {
      gameState.completedCategories.add(targetCategory.name);
      gameState.score += 50;
      gameState.levelScore += 50;
      
      p.logs.game_info.push({
        data: { action: "category_complete", category: targetCategory.name },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    gameState.movesRemaining--;
    
    p.logs.game_info.push({
      data: { action: "place_card", word: card.word, category: targetCategory.name, correct: true, movesRemaining: gameState.movesRemaining },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Check win condition
    if (checkLevelComplete()) {
      handleLevelComplete(p);
    } else if (gameState.movesRemaining <= 0) {
      handleGameOver(p);
    }
  } else {
    // Incorrect placement - return to active slot
    card.x = ACTIVE_CARD_X;
    card.y = ACTIVE_CARD_Y;
    
    p.logs.game_info.push({
      data: { action: "place_card", word: card.word, category: targetCategory.name, correct: false },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function selectNextCategory() {
  if (gameState.categoryCards.length === 0) return;
  gameState.highlightedCategoryIndex = (gameState.highlightedCategoryIndex + 1) % gameState.categoryCards.length;
}

export function selectPrevCategory() {
  if (gameState.categoryCards.length === 0) return;
  gameState.highlightedCategoryIndex = (gameState.highlightedCategoryIndex - 1 + gameState.categoryCards.length) % gameState.categoryCards.length;
}

function handleLevelComplete(p) {
  // Award level completion bonus
  gameState.score += 100;
  gameState.levelScore += 100;
  
  // Award remaining moves bonus
  const movesBonus = gameState.movesRemaining * 5;
  gameState.score += movesBonus;
  gameState.levelScore += movesBonus;
  
  p.logs.game_info.push({
    data: { action: "level_complete", level: gameState.currentLevel, levelScore: gameState.levelScore, totalScore: gameState.score },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  gameState.gamePhase = "GAME_OVER_WIN";
  
  // Check if this was the last level
  if (gameState.currentLevel >= 3) {
    // Game complete!
    updateHighScore();
  }
}

function handleGameOver(p) {
  p.logs.game_info.push({
    data: { action: "game_over", level: gameState.currentLevel, score: gameState.score },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  gameState.gamePhase = "GAME_OVER_LOSE";
}

function updateHighScore() {
  const currentHigh = localStorage.getItem('solitaireAssociationsHighScore') || 0;
  if (gameState.score > parseInt(currentHigh)) {
    localStorage.setItem('solitaireAssociationsHighScore', gameState.score.toString());
  }
}

export function getHighScore() {
  return parseInt(localStorage.getItem('solitaireAssociationsHighScore') || 0);
}