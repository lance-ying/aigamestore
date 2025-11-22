// gameActions.js - Core game actions

import { gameState } from './globals.js';
import { checkLevelComplete } from './levelManager.js';

export function drawCard(p) {
  if (!gameState.drawPhase) return;
  if (gameState.deck.length === 0) return;
  if (gameState.movesRemaining <= 0) return;
  
  // Draw top card from deck
  const card = gameState.deck.pop();
  gameState.currentCard = card;
  gameState.entities.push(card);
  gameState.drawPhase = false;
  
  // Position the card
  const currentX = 300 - 40;
  const currentY = 80;
  card.setPosition(currentX, currentY, true);
  
  // Use a move
  gameState.movesRemaining--;
  
  // Save state for undo
  gameState.moveHistory.push({
    type: "draw",
    card: card,
    movesRemaining: gameState.movesRemaining + 1
  });
  
  p.logs.game_info.push({
    data: { action: "DRAW_CARD", card: card.text, movesLeft: gameState.movesRemaining },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Check for game over
  if (gameState.movesRemaining === 0 && gameState.deck.length > 0) {
    checkGameOver(p);
  }
}

export function placeCard(p) {
  if (gameState.drawPhase) return;
  if (!gameState.currentCard) return;
  
  const selectedStack = gameState.categoryStacks[gameState.selectedStackIndex];
  
  // Check if card can be placed on selected stack
  if (!selectedStack.canAcceptCard(gameState.currentCard)) {
    // Invalid placement - show feedback but don't place
    return;
  }
  
  // Place card on stack
  const card = gameState.currentCard;
  selectedStack.addCard(card, true);
  
  // Save state for undo
  gameState.moveHistory.push({
    type: "place",
    card: card,
    stackIndex: gameState.selectedStackIndex
  });
  
  gameState.currentCard = null;
  gameState.drawPhase = true;
  
  p.logs.game_info.push({
    data: { action: "PLACE_CARD", card: card.text, stack: selectedStack.categoryName },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Check for level completion
  checkLevelComplete();
  
  if (gameState.levelComplete) {
    gameState.gamePhase = "GAME_OVER_WIN";
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_WIN", level: gameState.level },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else if (gameState.movesRemaining === 0 && gameState.deck.length > 0) {
    checkGameOver(p);
  }
}

export function undoMove(p) {
  if (gameState.moveHistory.length === 0) return;
  
  const lastMove = gameState.moveHistory.pop();
  
  if (lastMove.type === "draw") {
    // Undo draw: put card back in deck
    if (gameState.currentCard) {
      const card = gameState.currentCard;
      gameState.deck.push(card);
      gameState.entities = gameState.entities.filter(e => e !== card);
      gameState.currentCard = null;
      gameState.drawPhase = true;
      gameState.movesRemaining = lastMove.movesRemaining;
      
      // Reposition deck
      const deckX = 20;
      const deckY = 50;
      for (let i = 0; i < gameState.deck.length; i++) {
        gameState.deck[i].setPosition(deckX + i * 0.5, deckY, true);
      }
    }
  } else if (lastMove.type === "place") {
    // Undo place: remove card from stack and make it current
    const stack = gameState.categoryStacks[lastMove.stackIndex];
    const card = stack.removeTopCard();
    if (card) {
      gameState.currentCard = card;
      gameState.drawPhase = false;
      
      // Position the card
      const currentX = 300 - 40;
      const currentY = 80;
      card.setPosition(currentX, currentY, true);
    }
  }
  
  p.logs.game_info.push({
    data: { action: "UNDO" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function selectNextStack() {
  if (gameState.drawPhase) return;
  gameState.selectedStackIndex = (gameState.selectedStackIndex + 1) % gameState.categoryStacks.length;
}

export function selectPrevStack() {
  if (gameState.drawPhase) return;
  gameState.selectedStackIndex--;
  if (gameState.selectedStackIndex < 0) {
    gameState.selectedStackIndex = gameState.categoryStacks.length - 1;
  }
}

function checkGameOver(p) {
  if (gameState.movesRemaining <= 0) {
    let canWin = true;
    
    // Check if current card can still be placed
    if (gameState.currentCard) {
      let canPlace = false;
      for (const stack of gameState.categoryStacks) {
        if (stack.canAcceptCard(gameState.currentCard)) {
          canPlace = true;
          break;
        }
      }
      if (!canPlace) canWin = false;
    }
    
    // Check if there are cards still in deck
    if (gameState.deck.length > 0) {
      canWin = false;
    }
    
    if (!canWin && !gameState.levelComplete) {
      gameState.gamePhase = "GAME_OVER_LOSE";
      p.logs.game_info.push({
        data: { phase: "GAME_OVER_LOSE" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
}