// rendering.js - All rendering functions
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, CARD_WIDTH, CARD_HEIGHT } from './globals.js';
import { STOCK_X, STOCK_Y, WASTE_X, WASTE_Y, getFoundationX, FOUNDATION_Y, getTableauX, TABLEAU_Y } from './layout.js';

export function drawStartScreen(p) {
  p.background(20, 80, 40);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text('Klondike Classic', CANVAS_WIDTH / 2, 80);
  
  p.textSize(14);
  p.fill(220);
  p.text('Move all cards to the four foundation piles', CANVAS_WIDTH / 2, 130);
  p.text('Build foundations by suit from Ace to King', CANVAS_WIDTH / 2, 150);
  p.text('Move cards in tableau in descending rank, alternating colors', CANVAS_WIDTH / 2, 170);
  
  p.textSize(12);
  p.fill(180);
  p.text('SPACE: Draw from stock | Z: Undo | SHIFT: Hint', CANVAS_WIDTH / 2, 210);
  p.text('ESC: Pause | R: Restart', CANVAS_WIDTH / 2, 230);
  
  p.textSize(16);
  p.fill(255, 255, 100);
  p.text(`Level ${gameState.currentLevel} selected`, CANVAS_WIDTH / 2, 270);
  
  p.textSize(20);
  p.fill(100, 255, 100);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 330);
}

export function drawPlayingScreen(p) {
  p.background(20, 80, 40);
  
  // Draw pile outlines
  drawPileOutline(p, STOCK_X, STOCK_Y);
  drawPileOutline(p, WASTE_X, WASTE_Y);
  
  for (let i = 0; i < 4; i++) {
    drawPileOutline(p, getFoundationX(i), FOUNDATION_Y);
  }
  
  for (let i = 0; i < 7; i++) {
    drawPileOutline(p, getTableauX(i), TABLEAU_Y);
  }
  
  // Draw cards
  const { stockPile, wastePile, foundations, tableau, selectedCards } = gameState;
  
  // Stock pile
  if (stockPile.length > 0) {
    const topStock = stockPile[stockPile.length - 1];
    topStock.draw();
  }
  
  // Waste pile
  wastePile.forEach((card, i) => {
    if (i >= wastePile.length - 3) {
      card.draw();
    }
  });
  
  // Foundations
  foundations.forEach(pile => {
    if (pile.length > 0) {
      pile[pile.length - 1].draw();
    }
  });
  
  // Tableau
  tableau.forEach(column => {
    column.forEach(card => {
      if (!selectedCards || !selectedCards.includes(card)) {
        card.draw();
      }
    });
  });
  
  // Draw selected cards being dragged
  if (selectedCards && selectedCards.length > 0) {
    p.push();
    p.translate(0, 0);
    selectedCards.forEach((card, i) => {
      p.push();
      p.translate(card.x, card.y);
      p.fill(255, 255, 255, 200);
      p.stroke(100, 200, 255);
      p.strokeWeight(3);
      p.rect(0, 0, CARD_WIDTH, CARD_HEIGHT, 4);
      p.pop();
      card.draw();
    });
    p.pop();
  }
  
  // Draw hint
  if (gameState.hintActive && gameState.hintCard) {
    const card = gameState.hintCard;
    p.push();
    p.noFill();
    p.stroke(255, 255, 0);
    p.strokeWeight(3);
    p.rect(card.x, card.y, CARD_WIDTH, CARD_HEIGHT, 4);
    p.pop();
    
    if (gameState.hintTarget === 'foundation') {
      const x = getFoundationX(gameState.hintTargetIndex);
      p.push();
      p.noFill();
      p.stroke(100, 255, 100);
      p.strokeWeight(3);
      p.rect(x, FOUNDATION_Y, CARD_WIDTH, CARD_HEIGHT, 4);
      p.pop();
    } else if (gameState.hintTarget === 'tableau') {
      const x = getTableauX(gameState.hintTargetIndex);
      const y = TABLEAU_Y + tableau[gameState.hintTargetIndex].length * 20;
      p.push();
      p.noFill();
      p.stroke(100, 255, 100);
      p.strokeWeight(3);
      p.rect(x, y, CARD_WIDTH, CARD_HEIGHT, 4);
      p.pop();
    }
  }
  
  // UI
  drawUI(p);
}

function drawPileOutline(p, x, y) {
  p.push();
  p.noFill();
  p.stroke(100, 150, 100, 100);
  p.strokeWeight(2);
  p.rect(x, y, CARD_WIDTH, CARD_HEIGHT, 4);
  p.pop();
}

function drawUI(p) {
  p.fill(255);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text(`SCORE: ${gameState.score}`, 10, 5);
  
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`LEVEL: ${gameState.currentLevel}`, CANVAS_WIDTH - 10, 5);
  
  p.textAlign(p.CENTER, p.TOP);
  
  if (gameState.currentLevel >= 3 && gameState.timeRemaining !== null) {
    const minutes = Math.floor(gameState.timeRemaining / 60);
    const seconds = Math.floor(gameState.timeRemaining % 60);
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    p.text(`TIME: ${timeStr}`, CANVAS_WIDTH / 2, 5);
  } else {
    p.text(`MOVES: ${gameState.moves}`, CANVAS_WIDTH / 2, 5);
  }
  
  if (gameState.gamePhase === 'PAUSED') {
    p.textAlign(p.RIGHT, p.TOP);
    p.fill(255, 200, 100);
    p.textSize(16);
    p.text('PAUSED', CANVAS_WIDTH - 10, 25);
  }
}

export function drawGameOverScreen(p, won) {
  p.background(20, 80, 40);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  
  if (won) {
    p.textSize(32);
    p.fill(100, 255, 100);
    p.text('LEVEL COMPLETE!', CANVAS_WIDTH / 2, 100);
    
    p.textSize(16);
    p.fill(255);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 160);
    p.text(`Moves: ${gameState.moves}`, CANVAS_WIDTH / 2, 190);
    
    if (gameState.currentLevel < 4) {
      p.textSize(20);
      p.fill(100, 255, 100);
      p.text('PRESS ENTER FOR NEXT LEVEL', CANVAS_WIDTH / 2, 260);
    } else {
      p.textSize(20);
      p.fill(255, 255, 100);
      p.text('ALL LEVELS COMPLETE!', CANVAS_WIDTH / 2, 260);
    }
    
    p.textSize(16);
    p.fill(200);
    p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 320);
  } else {
    p.textSize(32);
    p.fill(255, 100, 100);
    p.text('TIME\'S UP!', CANVAS_WIDTH / 2, 150);
    
    p.textSize(20);
    p.fill(200);
    p.text('PRESS ENTER TO TRY AGAIN', CANVAS_WIDTH / 2, 240);
    p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 280);
  }
}

export function drawPausedOverlay(p) {
  p.push();
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  
  p.textSize(16);
  p.text('Press ESC to resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  p.text('Press R to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
  p.pop();
}