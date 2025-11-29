// render.js - Rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, DECK_X, DECK_Y, CARD_WIDTH, CARD_HEIGHT } from './globals.js';
import { DeckCard } from './card.js';
import { getHighScore } from './gameLogic.js';

export function renderStartScreen(p) {
  p.background(20, 30, 50);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  
  // Title
  p.textSize(48);
  p.text("Solitaire Associations", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.textSize(20);
  p.text("Words Edition", CANVAS_WIDTH / 2, 120);
  
  // Description
  p.textSize(14);
  p.fill(200, 220, 255);
  const desc = "Sort word cards into matching categories!\nDraw cards and place them correctly.\nComplete all categories within the move limit.";
  p.text(desc, CANVAS_WIDTH / 2, 180);
  
  // Instructions
  p.textSize(12);
  p.fill(180, 200, 220);
  const instructions = [
    "SPACE: Draw card / Cycle categories",
    "ARROWS: Select category",
    "W: Place card on selected category",
    "ESC/SHIFT: Pause",
    "R: Restart"
  ];
  let y = 250;
  for (const line of instructions) {
    p.text(line, CANVAS_WIDTH / 2, y);
    y += 20;
  }
  
  // High Score
  p.textSize(16);
  p.fill(255, 220, 100);
  p.text(`High Score: ${getHighScore()}`, CANVAS_WIDTH / 2, 345);
  
  // Start prompt
  p.textSize(18);
  p.fill(255, 255, 0);
  const flash = Math.sin(p.frameCount * 0.1) * 0.5 + 0.5;
  p.fill(255, 255, 0, 150 + flash * 105);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 375);
}

export function renderPlaying(p) {
  p.background(40, 60, 80);
  
  // Draw UI
  renderUI(p);
  
  // Draw deck
  if (gameState.deckCards.length > 0) {
    const deckCard = new DeckCard(DECK_X, DECK_Y);
    deckCard.draw(p);
    
    // Draw count
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text(`Deck: ${gameState.deckCards.length}`, DECK_X + CARD_WIDTH / 2, DECK_Y + CARD_HEIGHT + 15);
  }
  
  // Draw category cards
  for (let i = 0; i < gameState.categoryCards.length; i++) {
    const cat = gameState.categoryCards[i];
    const highlighted = (i === gameState.highlightedCategoryIndex && gameState.activeCard !== null);
    cat.draw(p, highlighted);
  }
  
  // Draw animating card
  if (gameState.animatingCard) {
    gameState.animatingCard.draw(p, true);
  }
  
  // Draw active card
  if (gameState.activeCard && !gameState.animatingCard) {
    gameState.activeCard.draw(p, true);
  }
}

export function renderPaused(p) {
  renderPlaying(p);
  
  // Overlay
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Paused text (small, top right as per spec)
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  
  // Resume instructions
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.text("Press ESC or SHIFT to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  p.textSize(16);
  p.text("Press R to restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

export function renderGameOver(p) {
  p.background(20, 30, 50);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  
  if (gameState.gamePhase === "GAME_OVER_WIN") {
    if (gameState.currentLevel >= 3) {
      // Game complete!
      p.textSize(42);
      p.fill(255, 220, 0);
      p.text("CONGRATULATIONS!", CANVAS_WIDTH / 2, 80);
      
      p.textSize(24);
      p.fill(255);
      p.text("You've cleared all levels!", CANVAS_WIDTH / 2, 130);
      
      p.textSize(20);
      p.fill(200, 255, 200);
      p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);
      
      const highScore = getHighScore();
      p.textSize(18);
      p.fill(255, 220, 100);
      p.text(`High Score: ${highScore}`, CANVAS_WIDTH / 2, 210);
      
      if (gameState.score === highScore) {
        p.textSize(16);
        p.fill(255, 200, 0);
        p.text("NEW HIGH SCORE!", CANVAS_WIDTH / 2, 240);
      }
    } else {
      // Level complete
      p.textSize(36);
      p.fill(100, 255, 100);
      p.text(`Level ${gameState.currentLevel} Complete!`, CANVAS_WIDTH / 2, 80);
      
      p.textSize(18);
      p.fill(255);
      p.text(`Level Score: ${gameState.levelScore}`, CANVAS_WIDTH / 2, 140);
      p.text(`Moves Bonus: ${gameState.movesRemaining * 5}`, CANVAS_WIDTH / 2, 170);
      p.text(`Total Score: ${gameState.score}`, CANVAS_WIDTH / 2, 200);
      
      p.textSize(16);
      p.fill(200, 220, 255);
      p.text("Press ENTER to continue to next level", CANVAS_WIDTH / 2, 270);
    }
  } else {
    // Game over - lose
    p.textSize(36);
    p.fill(255, 100, 100);
    p.text("Game Over!", CANVAS_WIDTH / 2, 120);
    
    p.textSize(20);
    p.fill(255);
    p.text(`Level ${gameState.currentLevel}`, CANVAS_WIDTH / 2, 170);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 200);
    
    p.textSize(16);
    p.fill(200, 220, 255);
    p.text("Out of moves!", CANVAS_WIDTH / 2, 250);
  }
  
  // Restart instruction
  p.textSize(18);
  p.fill(255, 255, 0);
  const flash = Math.sin(p.frameCount * 0.1) * 0.5 + 0.5;
  p.fill(255, 255, 0, 150 + flash * 105);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 350);
}

function renderUI(p) {
  // Moves counter (top-left)
  p.fill(255);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(18);
  p.text(`Moves: ${gameState.movesRemaining}`, 10, 10);
  
  // Score (top-right)
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
  
  // Level (top-center)
  p.textAlign(p.CENTER, p.TOP);
  p.text(`Level ${gameState.currentLevel}`, CANVAS_WIDTH / 2, 10);
}