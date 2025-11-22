// renderer.js - Rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, CARD_WIDTH, CARD_HEIGHT } from './globals.js';
import { LAYOUT, drawEmptyPileOutline, getFoundationPosition, getTableauPosition } from './layout.js';

export function drawStartScreen(p) {
  p.background(20, 80, 40);
  
  // Title
  p.fill(255, 215, 0);
  p.textSize(48);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("SOLITAIRE CASH", CANVAS_WIDTH / 2, 80);
  
  // Instructions
  p.fill(255);
  p.textSize(16);
  p.text("Build foundation piles from Ace to King by suit", CANVAS_WIDTH / 2, 150);
  p.text("Move cards between tableau piles:", CANVAS_WIDTH / 2, 180);
  p.text("Descending rank, alternating colors", CANVAS_WIDTH / 2, 200);
  
  p.textSize(14);
  p.text("Controls:", CANVAS_WIDTH / 2, 240);
  p.text("SPACE: Draw from stockpile | Z: Undo | A: Auto-move", CANVAS_WIDTH / 2, 260);
  p.text("Arrow Keys: Move selection | ENTER: Confirm", CANVAS_WIDTH / 2, 280);
  p.text("ESC: Pause | R: Restart", CANVAS_WIDTH / 2, 300);
  
  // Start prompt
  p.fill(255, 255, 0);
  p.textSize(24);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 350);
}

export function drawPlayingScreen(p) {
  p.background(20, 80, 40);
  
  // Draw empty pile outlines
  drawEmptyPileOutline(p, LAYOUT.STOCKPILE_X, LAYOUT.STOCKPILE_Y);
  drawEmptyPileOutline(p, LAYOUT.WASTE_X, LAYOUT.WASTE_Y);
  
  for (let i = 0; i < 4; i++) {
    const pos = getFoundationPosition(i);
    drawEmptyPileOutline(p, pos.x, pos.y);
  }
  
  for (let i = 0; i < 7; i++) {
    const pos = getTableauPosition(i, 0);
    drawEmptyPileOutline(p, pos.x, pos.y);
  }
  
  // Draw stockpile
  if (gameState.stockpile.length > 0) {
    const card = gameState.stockpile[gameState.stockpile.length - 1];
    card.draw(p);
    
    // Draw count
    p.fill(255);
    p.textSize(10);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.text(gameState.stockpile.length, card.x + 25, card.y - 5);
  }
  
  // Draw waste pile
  for (let i = Math.max(0, gameState.wastePile.length - 3); i < gameState.wastePile.length; i++) {
    gameState.wastePile[i].draw(p);
  }
  
  // Draw foundation piles
  for (let pile of gameState.foundationPiles) {
    if (pile.length > 0) {
      pile[pile.length - 1].draw(p);
    }
  }
  
  // Draw tableau piles
  for (let pile of gameState.tableauPiles) {
    for (let card of pile) {
      card.draw(p);
    }
  }
  
  // Draw selected cards being dragged
  if (gameState.selectedCards && gameState.selectedCards.length > 0) {
    for (let i = 0; i < gameState.selectedCards.length; i++) {
      const card = gameState.selectedCards[i];
      card.draw(p, 200);
    }
  }
  
  // Draw UI
  drawUI(p);
}

export function drawUI(p) {
  // Score
  p.fill(255);
  p.textSize(18);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`SCORE: ${gameState.score}`, 10, 5);
  
  // Level
  p.textAlign(p.LEFT, p.TOP);
  p.text(`LEVEL: ${gameState.level}`, 10, CANVAS_HEIGHT - 25);
  
  // Timer
  const minutes = Math.floor(gameState.timer / 60);
  const seconds = gameState.timer % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  p.textAlign(p.CENTER, p.TOP);
  p.text(`TIME: ${timeStr}`, CANVAS_WIDTH / 2, 5);
  
  // Moves
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`MOVES: ${gameState.moves}`, CANVAS_WIDTH - 10, 5);
  
  // Resets
  p.textAlign(p.RIGHT, p.BOTTOM);
  p.text(`RESETS: ${gameState.numStockpileResets}/${gameState.maxResets}`, CANVAS_WIDTH - 10, CANVAS_HEIGHT - 5);
  
  // Paused indicator
  if (gameState.gamePhase === "PAUSED") {
    p.fill(255, 255, 0);
    p.textAlign(p.RIGHT, p.TOP);
    p.text("PAUSED", CANVAS_WIDTH - 10, 25);
  }
}

export function drawGameOverScreen(p, won) {
  p.background(20, 80, 40);
  
  if (won) {
    p.fill(255, 215, 0);
    p.textSize(48);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("LEVEL COMPLETE!", CANVAS_WIDTH / 2, 120);
    
    p.fill(255);
    p.textSize(24);
    p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);
    p.text(`Moves: ${gameState.moves}`, CANVAS_WIDTH / 2, 210);
    p.text(`Time: ${Math.floor(gameState.timer / 60)}:${(gameState.timer % 60).toString().padStart(2, '0')}`, CANVAS_WIDTH / 2, 240);
    
    p.textSize(20);
    p.fill(255, 255, 0);
    p.text("PRESS ENTER FOR NEXT LEVEL", CANVAS_WIDTH / 2, 300);
  } else {
    p.fill(255, 50, 50);
    p.textSize(48);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 120);
    
    p.fill(255);
    p.textSize(24);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);
    p.text(`Level Reached: ${gameState.level}`, CANVAS_WIDTH / 2, 210);
  }
  
  p.fill(200);
  p.textSize(18);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 350);
}