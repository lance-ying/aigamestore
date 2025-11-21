import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, CARD_WIDTH, CARD_HEIGHT } from './globals.js';
import { getTableauPosition, getFoundationPosition, getStockpilePosition, getWastePosition } from './layout.js';

export function drawStartScreen(p) {
  p.background(20, 80, 40);
  
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("SOLITAIRE SMASH", CANVAS_WIDTH / 2, 80);
  
  p.fill(255);
  p.textSize(14);
  p.text("Clear all 5 levels by moving cards to foundations", CANVAS_WIDTH / 2, 130);
  p.text("Build foundations from Ace to King, same suit", CANVAS_WIDTH / 2, 150);
  p.text("Stack tableau cards: descending rank, alternating colors", CANVAS_WIDTH / 2, 170);
  
  p.textSize(12);
  p.text("Arrow Keys: Navigate areas", CANVAS_WIDTH / 2, 210);
  p.text("Space: Pick up / Drop cards", CANVAS_WIDTH / 2, 230);
  p.text("Shift: Draw from stockpile", CANVAS_WIDTH / 2, 250);
  p.text("Z: Undo move", CANVAS_WIDTH / 2, 270);
  
  p.fill(100, 255, 100);
  p.textSize(18);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 330);
}

export function drawGameScreen(p) {
  p.background(20, 80, 40);
  
  // Draw empty slots
  p.fill(10, 50, 25);
  p.stroke(50, 150, 80);
  p.strokeWeight(2);
  
  // Stockpile slot
  const stockPos = getStockpilePosition();
  p.rect(stockPos.x, stockPos.y, CARD_WIDTH, CARD_HEIGHT, 4);
  
  // Waste slot
  const wastePos = getWastePosition();
  p.rect(wastePos.x, wastePos.y, CARD_WIDTH, CARD_HEIGHT, 4);
  
  // Foundation slots
  for (let i = 0; i < 4; i++) {
    const pos = getFoundationPosition(i);
    p.rect(pos.x, pos.y, CARD_WIDTH, CARD_HEIGHT, 4);
  }
  
  // Tableau slots
  for (let i = 0; i < 7; i++) {
    const pos = getTableauPosition(i, 0);
    p.rect(pos.x, pos.y, CARD_WIDTH, CARD_HEIGHT, 4);
  }
  
  // Draw cards
  for (let col of gameState.tableau) {
    for (let card of col) {
      card.update();
      card.draw(p);
    }
  }
  
  for (let pile of gameState.foundations) {
    for (let card of pile) {
      card.update();
      card.draw(p);
    }
  }
  
  for (let card of gameState.stockpile) {
    card.update();
    card.draw(p);
  }
  
  for (let card of gameState.waste) {
    card.update();
    card.draw(p);
  }
  
  // Highlight selected area
  drawHighlight(p);
  
  // Draw selected cards with overlay
  if (gameState.selectedCards.length > 0) {
    for (let card of gameState.selectedCards) {
      p.push();
      p.fill(255, 255, 0, 100);
      p.noStroke();
      p.rect(card.x, card.y, CARD_WIDTH, CARD_HEIGHT, 4);
      p.pop();
    }
  }
  
  // UI
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text(`Level: ${gameState.currentLevel}`, 10, 10);
  
  p.textAlign(p.CENTER, p.TOP);
  const minutes = Math.floor(gameState.timeElapsed / 60);
  const seconds = Math.floor(gameState.timeElapsed % 60);
  p.text(`Time: ${minutes}:${seconds.toString().padStart(2, '0')}`, CANVAS_WIDTH / 2, 10);
  
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
  
  if (gameState.gamePhase === "PAUSED") {
    p.fill(255, 255, 0);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(12);
    p.text("PAUSED", CANVAS_WIDTH - 10, 30);
  }
}

function drawHighlight(p) {
  const area = gameState.highlightedArea;
  let pos;
  
  if (area.type === 'tableau') {
    pos = getTableauPosition(area.index, 0);
  } else if (area.type === 'foundation') {
    pos = getFoundationPosition(area.index);
  } else if (area.type === 'stockpile') {
    pos = getStockpilePosition();
  } else if (area.type === 'waste') {
    pos = getWastePosition();
  }
  
  if (pos) {
    p.push();
    p.noFill();
    p.stroke(255, 255, 0);
    p.strokeWeight(3);
    p.rect(pos.x - 3, pos.y - 3, CARD_WIDTH + 6, CARD_HEIGHT + 6, 4);
    p.pop();
  }
}

export function drawGameOverScreen(p, won) {
  p.background(20, 80, 40);
  
  p.fill(won ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  
  if (won) {
    if (gameState.currentLevel === 5) {
      p.text("CONGRATULATIONS!", CANVAS_WIDTH / 2, 100);
      p.textSize(18);
      p.fill(255);
      p.text("You cleared all levels!", CANVAS_WIDTH / 2, 150);
      p.text(`Total Score: ${gameState.totalScore}`, CANVAS_WIDTH / 2, 180);
    } else {
      p.text("LEVEL COMPLETE!", CANVAS_WIDTH / 2, 120);
      p.textSize(18);
      p.fill(255);
      p.text(`Level ${gameState.currentLevel} Score: ${gameState.score}`, CANVAS_WIDTH / 2, 160);
      p.text(`Time: ${Math.floor(gameState.timeElapsed / 60)}:${Math.floor(gameState.timeElapsed % 60).toString().padStart(2, '0')}`, CANVAS_WIDTH / 2, 190);
      p.text(`Moves: ${gameState.moveCount}`, CANVAS_WIDTH / 2, 220);
    }
  } else {
    p.text("GAME OVER", CANVAS_WIDTH / 2, 120);
    p.textSize(18);
    p.fill(255);
    p.text("No more moves available", CANVAS_WIDTH / 2, 160);
    p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 190);
  }
  
  p.fill(200, 200, 100);
  p.textSize(16);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 300);
}