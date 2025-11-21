// rendering.js - All rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, CARD_WIDTH, CARD_HEIGHT, SUITS } from './globals.js';
import { LEVEL_CONFIG } from './levelManager.js';

export function drawStartScreen(p) {
  p.background(20, 80, 40);
  
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("KLONDIKE SOLITAIRE", CANVAS_WIDTH / 2, 80);
  
  p.textSize(14);
  p.fill(255);
  p.text("Build foundation piles from Ace to King by suit", CANVAS_WIDTH / 2, 130);
  p.text("Build tableau down by alternating colors", CANVAS_WIDTH / 2, 150);
  
  p.textSize(12);
  p.fill(200, 255, 200);
  p.text("CONTROLS:", CANVAS_WIDTH / 2, 190);
  p.fill(255);
  p.text("← → Navigate piles | ↑ ↓ Select cards", CANVAS_WIDTH / 2, 210);
  p.text("SPACE: Pick/Drop card | W: Draw | Z: Undo", CANVAS_WIDTH / 2, 230);
  p.text("SHIFT: Toggle Draw Mode | S: Auto-move", CANVAS_WIDTH / 2, 250);
  p.text("A: Auto-complete | ESC: Pause | R: Restart", CANVAS_WIDTH / 2, 270);
  
  p.textSize(16);
  p.fill(255, 255, 100);
  p.text(`CURRENT LEVEL: ${gameState.level} - ${LEVEL_CONFIG[gameState.level].name}`, CANVAS_WIDTH / 2, 310);
  
  p.textSize(18);
  p.fill(100, 255, 100);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 350);
}

export function drawPlayingScreen(p) {
  p.background(20, 80, 40);
  
  // Draw UI
  drawUI(p);
  
  // Draw foundations (top right)
  for (let i = 0; i < 4; i++) {
    drawFoundation(p, i);
  }
  
  // Draw stock and waste (top left)
  drawStock(p);
  drawWaste(p);
  
  // Draw tableau
  for (let i = 0; i < 7; i++) {
    drawTableauColumn(p, i);
  }
  
  // Draw picked up cards
  if (gameState.pickedUpCards) {
    drawPickedUpCards(p);
  }
  
  // Draw selection highlight
  drawSelection(p);
  
  // Draw paused indicator
  if (gameState.gamePhase === "PAUSED") {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.fill(255);
    p.textSize(32);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    p.textSize(14);
    p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  }
}

export function drawGameOverScreen(p, won) {
  p.background(20, 80, 40);
  
  p.fill(won ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.text(won ? "YOU WIN!" : "GAME OVER", CANVAS_WIDTH / 2, 100);
  
  p.fill(255);
  p.textSize(18);
  p.text(`FINAL SCORE: ${gameState.score}`, CANVAS_WIDTH / 2, 160);
  p.text(`MOVES: ${gameState.moves}`, CANVAS_WIDTH / 2, 190);
  p.text(`TIME: ${formatTime(gameState.elapsedTime)}`, CANVAS_WIDTH / 2, 220);
  
  if (won) {
    const level = gameState.level;
    const config = LEVEL_CONFIG[level];
    const progress = gameState.levelProgress[level];
    
    p.textSize(14);
    p.text(`Level ${level} Progress: ${progress.wins}/${config.winsRequired} wins`, CANVAS_WIDTH / 2, 260);
    
    if (progress.wins >= config.winsRequired) {
      const avgScore = progress.totalScore / progress.wins;
      if (avgScore >= config.scoreRequired) {
        if (level < 5) {
          p.fill(255, 255, 100);
          p.textSize(16);
          p.text("LEVEL COMPLETE! Starting next level...", CANVAS_WIDTH / 2, 300);
        } else {
          p.fill(255, 215, 0);
          p.textSize(20);
          p.text("GRAND MASTER ACHIEVED!", CANVAS_WIDTH / 2, 300);
        }
      }
    }
  }
  
  p.fill(200);
  p.textSize(16);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 360);
}

function drawUI(p) {
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text(`SCORE: ${gameState.score}`, 10, 10);
  p.text(`MOVES: ${gameState.moves}`, 10, 25);
  p.text(`TIME: ${formatTime(gameState.elapsedTime)}`, 10, 40);
  
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`LEVEL: ${gameState.level}`, CANVAS_WIDTH - 10, 10);
  p.text(`DRAW: ${gameState.drawMode}`, CANVAS_WIDTH - 10, 25);
  
  const config = LEVEL_CONFIG[gameState.level];
  if (config.timeLimit) {
    const timeLeft = config.timeLimit - gameState.elapsedTime;
    const color = timeLeft < 60 ? [255, 100, 100] : [255, 255, 255];
    p.fill(...color);
    p.text(`TIME LEFT: ${formatTime(Math.max(0, timeLeft))}`, CANVAS_WIDTH - 10, 40);
  }
}

function drawCard(p, card, x, y, highlight = false) {
  p.push();
  
  if (highlight) {
    p.fill(255, 255, 100);
    p.rect(x - 2, y - 2, CARD_WIDTH + 4, CARD_HEIGHT + 4, 5);
  }
  
  if (card.faceUp) {
    p.fill(255);
    p.stroke(0);
    p.strokeWeight(2);
    p.rect(x, y, CARD_WIDTH, CARD_HEIGHT, 5);
    
    const color = card.isRed() ? [220, 20, 20] : [0, 0, 0];
    p.fill(...color);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16);
    p.text(card.rank, x + CARD_WIDTH / 2, y + 15);
    p.textSize(14);
    p.text(card.suit, x + CARD_WIDTH / 2, y + CARD_HEIGHT - 15);
  } else {
    p.fill(50, 100, 200);
    p.stroke(30, 60, 120);
    p.strokeWeight(2);
    p.rect(x, y, CARD_WIDTH, CARD_HEIGHT, 5);
    
    p.fill(100, 150, 255);
    p.noStroke();
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 4; j++) {
        p.rect(x + 10 + i * 15, y + 10 + j * 15, 8, 8);
      }
    }
  }
  
  p.pop();
}

function drawFoundation(p, index) {
  const x = CANVAS_WIDTH - 70 - (3 - index) * 60;
  const y = 70;
  
  const isSelected = gameState.selectedPile && 
                     gameState.selectedPile.type === 'foundation' && 
                     gameState.selectedPile.index === index;
  
  if (isSelected) {
    p.fill(255, 255, 100);
    p.rect(x - 2, y - 2, CARD_WIDTH + 4, CARD_HEIGHT + 4, 5);
  }
  
  p.noFill();
  p.stroke(200);
  p.strokeWeight(2);
  p.rect(x, y, CARD_WIDTH, CARD_HEIGHT, 5);
  
  const pile = gameState.foundations[index];
  if (pile.length > 0) {
    drawCard(p, pile[pile.length - 1], x, y);
  } else {
    p.fill(150);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(20);
    p.text(SUITS[index], x + CARD_WIDTH / 2, y + CARD_HEIGHT / 2);
  }
}

function drawStock(p) {
  const x = 20;
  const y = 70;
  
  const isSelected = gameState.selectedPile && gameState.selectedPile.type === 'stock';
  
  if (isSelected) {
    p.fill(255, 255, 100);
    p.rect(x - 2, y - 2, CARD_WIDTH + 4, CARD_HEIGHT + 4, 5);
  }
  
  if (gameState.stock.length > 0) {
    drawCard(p, gameState.stock[gameState.stock.length - 1], x, y);
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.text(gameState.stock.length, x + CARD_WIDTH / 2, y + CARD_HEIGHT + 10);
  } else {
    p.noFill();
    p.stroke(200);
    p.strokeWeight(2);
    p.rect(x, y, CARD_WIDTH, CARD_HEIGHT, 5);
    
    p.fill(150);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(20);
    p.text("↻", x + CARD_WIDTH / 2, y + CARD_HEIGHT / 2);
  }
}

function drawWaste(p) {
  const x = 90;
  const y = 70;
  
  const isSelected = gameState.selectedPile && gameState.selectedPile.type === 'waste';
  
  if (isSelected) {
    p.fill(255, 255, 100);
    p.rect(x - 2, y - 2, CARD_WIDTH + 4, CARD_HEIGHT + 4, 5);
  }
  
  p.noFill();
  p.stroke(200);
  p.strokeWeight(2);
  p.rect(x, y, CARD_WIDTH, CARD_HEIGHT, 5);
  
  if (gameState.waste.length > 0) {
    const displayCount = Math.min(3, gameState.waste.length);
    for (let i = 0; i < displayCount; i++) {
      const card = gameState.waste[gameState.waste.length - displayCount + i];
      drawCard(p, card, x + i * 5, y);
    }
  }
}

function drawTableauColumn(p, colIndex) {
  const x = 20 + colIndex * 80;
  const y = 170;
  
  const isSelected = gameState.selectedPile && 
                     gameState.selectedPile.type === 'tableau' && 
                     gameState.selectedPile.index === colIndex;
  
  p.noFill();
  p.stroke(200);
  p.strokeWeight(2);
  p.rect(x, y, CARD_WIDTH, CARD_HEIGHT, 5);
  
  const column = gameState.tableau[colIndex];
  for (let i = 0; i < column.length; i++) {
    const card = column[i];
    const cardY = y + i * 20;
    const highlight = isSelected && gameState.selectedCardIndex === i;
    drawCard(p, card, x, cardY, highlight);
  }
}

function drawPickedUpCards(p) {
  // Draw at mouse-like position (use selected position as proxy)
  if (!gameState.selectedPile) return;
  
  const { cards } = gameState.pickedUpCards;
  const baseX = CANVAS_WIDTH / 2 - CARD_WIDTH / 2;
  const baseY = CANVAS_HEIGHT / 2 - CARD_HEIGHT / 2;
  
  for (let i = 0; i < cards.length; i++) {
    drawCard(p, cards[i], baseX, baseY + i * 20);
  }
}

function drawSelection(p) {
  if (!gameState.selectedPile) return;
  
  const { type, index } = gameState.selectedPile;
  let x, y;
  
  if (type === 'stock') {
    x = 20;
    y = 70;
  } else if (type === 'waste') {
    x = 90;
    y = 70;
  } else if (type === 'foundation') {
    x = CANVAS_WIDTH - 70 - (3 - index) * 60;
    y = 70;
  } else if (type === 'tableau') {
    x = 20 + index * 80;
    y = 170;
    if (gameState.selectedCardIndex !== null) {
      y += gameState.selectedCardIndex * 20;
    }
  }
  
  p.noFill();
  p.stroke(255, 255, 100);
  p.strokeWeight(3);
  p.rect(x - 3, y - 3, CARD_WIDTH + 6, CARD_HEIGHT + 6, 5);
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}