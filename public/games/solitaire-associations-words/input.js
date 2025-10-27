// input.js - Input handling

import { gameState, DECK_X, DECK_Y, CARD_WIDTH, CARD_HEIGHT, ACTIVE_CARD_X, ACTIVE_CARD_Y } from './globals.js';
import { drawCard, placeActiveCard, selectNextCategory, selectPrevCategory } from './gameLogic.js';

export function handleKeyPressed(p) {
  const key = p.key;
  const keyCode = p.keyCode;
  
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // ENTER - Start game
  if (keyCode === 13) {
    if (gameState.gamePhase === "START") {
      gameState.gamePhase = "PLAYING";
      p.logs.game_info.push({
        data: { phase: "PLAYING", level: gameState.currentLevel },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
      // This shouldn't happen per spec, but handle gracefully
    }
  }
  
  // ESC or SHIFT - Pause/Unpause
  if (keyCode === 27 || keyCode === 16) {
    if (gameState.gamePhase === "PLAYING") {
      gameState.gamePhase = "PAUSED";
      p.logs.game_info.push({
        data: { phase: "PAUSED" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === "PAUSED") {
      gameState.gamePhase = "PLAYING";
      p.logs.game_info.push({
        data: { phase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  // R - Restart (go back to START screen)
  if (keyCode === 82) {
    if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE" || gameState.gamePhase === "PAUSED") {
      gameState.gamePhase = "START";
      gameState.currentLevel = 1;
      gameState.score = 0;
      p.logs.game_info.push({
        data: { phase: "START", action: "restart" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  // Gameplay controls (only in PLAYING phase)
  if (gameState.gamePhase === "PLAYING") {
    // SPACE - Draw card or cycle category
    if (keyCode === 32) {
      if (!gameState.activeCard && gameState.deckCards.length > 0) {
        drawCard(p);
      } else if (gameState.activeCard) {
        selectNextCategory();
      }
    }
    
    // Arrow keys - Select category
    if (keyCode === 39) { // Right arrow
      selectNextCategory();
    }
    if (keyCode === 37) { // Left arrow
      selectPrevCategory();
    }
    
    // W - Place card
    if (keyCode === 87 || keyCode === 119) { // W or w
      if (gameState.activeCard && gameState.categoryCards.length > 0) {
        const targetCategory = gameState.categoryCards[gameState.highlightedCategoryIndex];
        placeActiveCard(p, targetCategory);
      }
    }
  }
}

export function handleMousePressed(p) {
  if (gameState.gamePhase !== "PLAYING") return;
  
  const mx = p.mouseX;
  const my = p.mouseY;
  
  // Check if clicking on deck
  if (mx >= DECK_X && mx <= DECK_X + CARD_WIDTH &&
      my >= DECK_Y && my <= DECK_Y + CARD_HEIGHT) {
    if (!gameState.activeCard && gameState.deckCards.length > 0) {
      drawCard(p);
    }
  }
  
  // Check if clicking on active card to start drag
  if (gameState.activeCard && gameState.activeCard.contains(mx, my)) {
    gameState.activeCard.startDrag(mx, my);
  }
}

export function handleMouseDragged(p) {
  if (gameState.gamePhase !== "PLAYING") return;
  
  if (gameState.activeCard && gameState.activeCard.isDragging) {
    gameState.activeCard.updateDrag(p.mouseX, p.mouseY);
  }
}

export function handleMouseReleased(p) {
  if (gameState.gamePhase !== "PLAYING") return;
  
  if (gameState.activeCard && gameState.activeCard.isDragging) {
    gameState.activeCard.stopDrag();
    
    // Check if released over a category
    const mx = p.mouseX;
    const my = p.mouseY;
    
    for (const cat of gameState.categoryCards) {
      if (cat.contains(mx, my)) {
        placeActiveCard(p, cat);
        return;
      }
    }
    
    // Return to active card slot if not placed
    gameState.activeCard.x = ACTIVE_CARD_X;
    gameState.activeCard.y = ACTIVE_CARD_Y;
  }
}