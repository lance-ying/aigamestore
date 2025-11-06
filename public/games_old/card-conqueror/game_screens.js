import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, MAX_ENERGY } from './globals.js';

// Start screen
export function drawStartScreen(p) {
  p.background(30, 30, 40);
  
  // Title
  p.fill(220, 180, 60);
  p.textSize(40);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("Card Conqueror", CANVAS_WIDTH / 2, 100);
  
  // Instructions
  p.fill(200, 200, 200);
  p.textSize(16);
  p.text("Battle enemies with your deck of cards", CANVAS_WIDTH / 2, 150);
  
  p.textSize(14);
  p.text("• Each turn, play cards using your energy", CANVAS_WIDTH / 2, 190);
  p.text("• Defeat enemies to build your deck", CANVAS_WIDTH / 2, 215);
  p.text("• Reach and defeat the final boss to win", CANVAS_WIDTH / 2, 240);
  
  // Controls
  p.textSize(14);
  p.text("Controls:", CANVAS_WIDTH / 2, 280);
  p.textSize(12);
  p.text("UP/DOWN: Select cards", CANVAS_WIDTH / 2, 305);
  p.text("SPACE: Play selected card", CANVAS_WIDTH / 2, 325);
  p.text("Z: End your turn", CANVAS_WIDTH / 2, 345);
  
  // Start prompt
  p.fill(255);
  p.textSize(18);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 380);
}

// Pause screen
export function drawPauseIndicator(p) {
  p.push();
  p.fill(255);
  p.textSize(16);
  p.textAlign(p.RIGHT, p.TOP);
  p.text("PAUSED", CANVAS_WIDTH - 20, 20);
  p.pop();
}

// Game over screen
export function drawGameOverScreen(p, isWin) {
  p.push();
  p.background(30, 30, 40, 200);
  
  p.fill(isWin ? [60, 220, 120] : [220, 60, 60]);
  p.textSize(40);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(isWin ? "VICTORY!" : "DEFEAT", CANVAS_WIDTH / 2, 150);
  
  p.fill(200, 200, 200);
  p.textSize(20);
  p.text(`Battles won: ${gameState.battleCount}`, CANVAS_WIDTH / 2, 200);
  
  p.fill(255);
  p.textSize(18);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 250);
  p.pop();
}

// UI elements for the battle
export function drawBattleUI(p) {
  p.push();
  
  // Draw energy
  p.fill(60, 100, 220);
  p.stroke(30, 60, 140);
  p.strokeWeight(2);
  p.ellipse(50, 50, 40, 40);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  p.text(`${gameState.energy}/${MAX_ENERGY}`, 50, 50);
  p.textSize(12);
  p.text("ENERGY", 50, 75);
  
  // Draw battle count
  p.fill(200, 200, 200);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(14);
  p.text(`Battle ${gameState.currentEnemyIndex + 1}/${gameState.totalEnemies}`, CANVAS_WIDTH / 2, 20);
  
  // Draw deck counts
  p.fill(180, 180, 180);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text(`Draw: ${gameState.drawPile.length}`, 20, CANVAS_HEIGHT - 40);
  p.text(`Discard: ${gameState.discardPile.length}`, 20, CANVAS_HEIGHT - 20);
  
  // Draw end turn button
  p.fill(gameState.turn === "PLAYER" ? [100, 150, 200] : [70, 70, 70]);
  p.stroke(50, 50, 50);
  p.strokeWeight(1);
  p.rect(CANVAS_WIDTH - 100, CANVAS_HEIGHT - 40, 80, 30, 5);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  p.text("End Turn", CANVAS_WIDTH - 60, CANVAS_HEIGHT - 25);
  
  // Draw viewing pile if active
  if (gameState.viewingPile) {
    drawPileView(p);
  }
  
  p.pop();
}

// Draw the view of draw or discard pile
function drawPileView(p) {
  p.push();
  
  // Background overlay
  p.fill(20, 20, 20, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Title
  p.fill(255);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(20);
  p.text(`${gameState.viewingPile === "DRAW" ? "Draw" : "Discard"} Pile`, CANVAS_WIDTH / 2, 40);
  
  // Get the correct pile
  const pile = gameState.viewingPile === "DRAW" ? gameState.drawPile : gameState.discardPile;
  
  // Show cards in a grid
  const cardsPerRow = 5;
  const cardWidth = 70;
  const cardHeight = 100;
  const startX = (CANVAS_WIDTH - (cardsPerRow * cardWidth)) / 2 + cardWidth / 2;
  const startY = 100;
  
  for (let i = 0; i < pile.length; i++) {
    const row = Math.floor(i / cardsPerRow);
    const col = i % cardsPerRow;
    const x = startX + col * cardWidth;
    const y = startY + row * (cardHeight + 10);
    
    pile[i].draw(p, x - cardWidth/2, y - cardHeight/2, false);
  }
  
  // Instructions
  p.fill(200, 200, 200);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.textSize(14);
  p.text("LEFT/RIGHT: Switch between piles", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20);
  
  p.pop();
}

// Draw reward screen after battle
export function drawRewardScreen(p) {
  p.push();
  
  // Background overlay
  p.fill(20, 20, 30, 230);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Title
  p.fill(220, 180, 60);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(30);
  p.text("Choose a Reward", CANVAS_WIDTH / 2, 50);
  
  // Draw available cards
  const cardSpacing = 120;
  const startX = CANVAS_WIDTH / 2 - ((gameState.availableRewards.length - 1) * cardSpacing) / 2;
  
  for (let i = 0; i < gameState.availableRewards.length; i++) {
    const x = startX + i * cardSpacing;
    const isSelected = i === gameState.selectedRewardIndex;
    
    // Draw highlight for selected card
    if (isSelected) {
      p.fill(60, 120, 200, 100);
      p.noStroke();
      p.rect(x - 50, 100 - 10, 100, 150, 10);
    }
    
    gameState.availableRewards[i].draw(p, x - 40, 100, isSelected);
  }
  
  // Instructions
  p.fill(200, 200, 200);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.textSize(14);
  p.text("UP/DOWN: Navigate", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
  p.text("SPACE: Select card", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
  
  p.pop();
}