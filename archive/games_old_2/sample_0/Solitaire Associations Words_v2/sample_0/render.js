// render.js - Rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, CARD_WIDTH, CARD_HEIGHT, COLORS } from './globals.js';

export function drawStartScreen(p) {
  p.background(...COLORS.background);
  
  p.fill(...COLORS.ui);
  p.textAlign(p.CENTER, p.CENTER);
  
  // Title
  p.textSize(36);
  p.text("SOLITAIRE", CANVAS_WIDTH / 2, 80);
  p.text("ASSOCIATIONS", CANVAS_WIDTH / 2, 120);
  
  // Subtitle
  p.textSize(14);
  p.text("Words Edition", CANVAS_WIDTH / 2, 155);
  
  // Instructions
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    "Match word cards to their category cards!",
    "",
    "• Press SPACE to draw a card from the deck",
    "• Use LEFT/RIGHT arrows to select a category stack",
    "• Press SPACE again to place the card",
    "• Press Z to undo your last move",
    "• Complete all stacks within the move limit",
    "",
    "Each level has more categories and fewer moves!"
  ];
  
  let y = 190;
  for (const line of instructions) {
    p.text(line, 80, y);
    y += 18;
  }
  
  // Start prompt
  p.textSize(16);
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(255, 200, 100);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
}

export function drawPlayingScreen(p) {
  p.background(...COLORS.background);
  
  // Draw UI
  drawUI(p);
  
  // Draw deck
  drawDeck(p);
  
  // Draw current card area
  drawCurrentCardArea(p);
  
  // Draw category stacks
  for (let i = 0; i < gameState.categoryStacks.length; i++) {
    const stack = gameState.categoryStacks[i];
    const isSelected = !gameState.drawPhase && i === gameState.selectedStackIndex;
    stack.draw(p, isSelected);
  }
  
  // Draw current card
  if (gameState.currentCard) {
    gameState.currentCard.draw(p, true);
  }
  
  // Update card animations
  for (const entity of gameState.entities) {
    if (entity.update) {
      entity.update();
    }
  }
  for (const card of gameState.deck) {
    card.update();
  }
  
  // Draw phase indicator
  drawPhaseIndicator(p);
  
  // Show level complete animation
  if (gameState.showingLevelComplete) {
    drawLevelCompleteAnimation(p);
    gameState.levelCompleteTimer++;
    
    if (gameState.levelCompleteTimer > 90) {
      gameState.showingLevelComplete = false;
      // Advance to next level will happen in game loop
    }
  }
}

export function drawPausedScreen(p) {
  drawPlayingScreen(p);
  
  // Overlay
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Paused text (small, top right)
  p.fill(255, 255, 255);
  p.textSize(14);
  p.textAlign(p.RIGHT, p.TOP);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

export function drawGameOverScreen(p, won) {
  p.background(...COLORS.background);
  
  p.fill(...COLORS.ui);
  p.textAlign(p.CENTER, p.CENTER);
  
  // Result
  p.textSize(48);
  if (won) {
    p.fill(100, 255, 100);
    p.text("LEVEL COMPLETE!", CANVAS_WIDTH / 2, 120);
  } else {
    p.fill(255, 100, 100);
    p.text("OUT OF MOVES", CANVAS_WIDTH / 2, 120);
  }
  
  // Stats
  p.fill(...COLORS.ui);
  p.textSize(20);
  p.text(`Level: ${gameState.level}`, CANVAS_WIDTH / 2, 180);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 210);
  
  if (won) {
    p.textSize(16);
    p.text(`Moves Remaining: ${gameState.movesRemaining}`, CANVAS_WIDTH / 2, 240);
    p.text(`Bonus: +${gameState.movesRemaining * 10}`, CANVAS_WIDTH / 2, 265);
  } else {
    p.textSize(16);
    p.fill(255, 150, 150);
    p.text("Try planning your moves more carefully!", CANVAS_WIDTH / 2, 250);
  }
  
  // Restart prompt
  p.fill(255, 200, 100);
  p.textSize(18);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 350);
}

function drawUI(p) {
  p.fill(...COLORS.ui);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  
  // Level and score
  p.text(`Level: ${gameState.level}`, 10, 10);
  p.text(`Score: ${gameState.score}`, 120, 10);
  
  // Moves remaining
  const movesColor = gameState.movesRemaining <= 3 ? COLORS.danger : COLORS.ui;
  p.fill(...movesColor);
  p.text(`Moves: ${gameState.movesRemaining}/${gameState.maxMoves}`, CANVAS_WIDTH - 110, 10);
  
  // Instructions
  p.fill(...COLORS.ui);
  p.textSize(10);
  p.textAlign(p.RIGHT, p.TOP);
  p.text("SPACE: Draw/Place | ARROWS: Select | Z: Undo", CANVAS_WIDTH - 10, CANVAS_HEIGHT - 20);
}

function drawDeck(p) {
  const deckX = 20;
  const deckY = 50;
  
  // Draw deck background/placeholder
  p.stroke(...COLORS.cardBorder);
  p.strokeWeight(2);
  p.fill(50, 50, 60);
  p.rect(deckX, deckY, CARD_WIDTH, CARD_HEIGHT, 5);
  
  // Draw card count
  p.fill(...COLORS.ui);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(16);
  p.text(`${gameState.deck.length}`, deckX + CARD_WIDTH / 2, deckY + CARD_HEIGHT / 2);
  
  // Label
  p.textSize(10);
  p.text("DECK", deckX + CARD_WIDTH / 2, deckY - 10);
}

function drawCurrentCardArea(p) {
  const currentX = 300 - 40;
  const currentY = 80;
  
  // Draw placeholder if no current card
  if (!gameState.currentCard) {
    p.stroke(...COLORS.cardBorder);
    p.strokeWeight(2);
    p.noFill();
    p.rect(currentX, currentY, CARD_WIDTH, CARD_HEIGHT, 5);
  }
  
  // Label
  p.fill(...COLORS.ui);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(10);
  p.text("CURRENT CARD", currentX + CARD_WIDTH / 2, currentY - 10);
}

function drawPhaseIndicator(p) {
  p.fill(...COLORS.ui);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(12);
  
  const indicatorY = 145;
  if (gameState.drawPhase) {
    p.text("Press SPACE to draw a card", CANVAS_WIDTH / 2, indicatorY);
  } else {
    p.text("Select stack (←/→) and press SPACE to place", CANVAS_WIDTH / 2, indicatorY);
  }
}

function drawLevelCompleteAnimation(p) {
  const alpha = Math.min(255, gameState.levelCompleteTimer * 8);
  
  // Background overlay
  p.fill(0, 0, 0, alpha * 0.5);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Success message
  p.fill(100, 255, 100, alpha);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("LEVEL COMPLETE!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  
  p.textSize(20);
  p.text(`+${gameState.movesRemaining * 10} Bonus`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
}