import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, CARD_WIDTH, CARD_HEIGHT } from './globals.js';

export function drawBackground(p) {
  const theme = gameState.levelThemes[gameState.currentLevel - 1];
  
  // Gradient background
  for (let y = 0; y < CANVAS_HEIGHT; y++) {
    const inter = y / CANVAS_HEIGHT;
    const c1 = theme.colors[0];
    const c2 = theme.colors[1];
    const c = [
      p.lerp(c1[0], c2[0], inter),
      p.lerp(c1[1], c2[1], inter),
      p.lerp(c1[2], c2[2], inter)
    ];
    p.stroke(...c);
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Decorative elements
  p.noStroke();
  p.fill(...theme.colors[2], 100);
  for (let i = 0; i < 10; i++) {
    const x = (i * 73 + 50) % CANVAS_WIDTH;
    const y = (i * 97 + 30) % CANVAS_HEIGHT;
    p.ellipse(x, y, 40, 40);
  }
}

export function drawUI(p) {
  // Score
  p.fill(255);
  p.noStroke();
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
  
  // Level
  p.textAlign(p.LEFT, p.TOP);
  p.text(`LEVEL: ${gameState.currentLevel}`, 10, 10);
  
  // Power-up indicator
  if (gameState.gamePhase === 'PLAYING') {
    const powerUpX = 10;
    const powerUpY = CANVAS_HEIGHT - 50;
    
    p.fill(...(gameState.powerUpsRemaining > 0 ? [255, 215, 0] : [100, 100, 100]));
    p.stroke(50);
    p.strokeWeight(2);
    p.rect(powerUpX, powerUpY, 40, 40, 4);
    
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(20);
    p.text('Z', powerUpX + 20, powerUpY + 20);
    
    // Highlight if selected
    const highlighted = gameState.selectableElements[gameState.highlightedIndex];
    if (highlighted && highlighted.type === 'powerup') {
      p.noFill();
      p.stroke(255, 255, 0);
      p.strokeWeight(3);
      p.rect(powerUpX - 2, powerUpY - 2, 44, 44, 4);
    }
  }
  
  // Paused indicator
  if (gameState.gamePhase === 'PAUSED') {
    p.fill(255);
    p.noStroke();
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(14);
    p.text('PAUSED', CANVAS_WIDTH - 10, 35);
  }
}

export function drawStockPile(p) {
  const stockX = CANVAS_WIDTH / 2 - 80;
  const stockY = CANVAS_HEIGHT / 2 + 100;
  
  // Draw stock pile
  if (gameState.stockPile.length > 0) {
    p.fill(80, 40, 120);
    p.stroke(50);
    p.strokeWeight(2);
    p.rect(stockX, stockY, CARD_WIDTH, CARD_HEIGHT, 4);
    
    // Card back pattern
    p.noStroke();
    p.fill(150, 100, 200);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 4; j++) {
        p.ellipse(
          stockX + 10 + i * 15,
          stockY + 10 + j * 15,
          8, 8
        );
      }
    }
    
    // Count
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text(gameState.stockPile.length, stockX + CARD_WIDTH / 2, stockY + CARD_HEIGHT + 15);
    
    // Highlight if selected
    const highlighted = gameState.selectableElements[gameState.highlightedIndex];
    if (highlighted && highlighted.type === 'stock') {
      p.noFill();
      p.stroke(255, 255, 0);
      p.strokeWeight(3);
      p.rect(stockX - 2, stockY - 2, CARD_WIDTH + 4, CARD_HEIGHT + 4, 4);
    }
  } else {
    // Empty stock
    p.noFill();
    p.stroke(100);
    p.strokeWeight(2);
    p.rect(stockX, stockY, CARD_WIDTH, CARD_HEIGHT, 4);
  }
}

export function drawDiscardPile(p) {
  const discardX = CANVAS_WIDTH / 2 + 80;
  const discardY = CANVAS_HEIGHT / 2 + 100;
  
  if (gameState.discardPile) {
    gameState.discardPile.draw(p);
    
    // Label
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text('DISCARD', discardX + CARD_WIDTH / 2, discardY + CARD_HEIGHT + 15);
  }
}

export function drawTableau(p) {
  for (let i = 0; i < gameState.tableauCards.length; i++) {
    const card = gameState.tableauCards[i];
    card.draw(p);
    
    // Highlight if selectable and selected
    const highlighted = gameState.selectableElements[gameState.highlightedIndex];
    if (highlighted && highlighted.type === 'tableau' && highlighted.index === i) {
      if (card.canMatch(gameState.discardPile)) {
        p.noFill();
        p.stroke(0, 255, 0);
        p.strokeWeight(3);
        p.rect(card.x - 2, card.y - 2, CARD_WIDTH + 4, CARD_HEIGHT + 4, 4);
      }
    }
    
    // Highlight valid moves
    if (card.isFaceUp && !card.isCovered && card.canMatch(gameState.discardPile)) {
      p.noFill();
      p.stroke(255, 255, 0, 100);
      p.strokeWeight(2);
      p.rect(card.x - 1, card.y - 1, CARD_WIDTH + 2, CARD_HEIGHT + 2, 4);
    }
  }
}

export function drawStartScreen(p) {
  p.background(40, 20, 60);
  
  // Title
  p.fill(255, 215, 0);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('Disney Solitaire', CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(200);
  p.textSize(18);
  p.text('Tripeaks Adventure', CANVAS_WIDTH / 2, 130);
  
  // Instructions
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    'Clear all cards from three peaks!',
    '',
    'Match cards one rank higher or lower',
    'Arrow Keys: Navigate cards',
    'Space: Play highlighted card',
    'Z: Use power-up (undo last move)',
    '',
    'Create chains for bonus points!'
  ];
  
  let y = 180;
  for (let line of instructions) {
    p.text(line, 80, y);
    y += 20;
  }
  
  // Start prompt
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}

export function drawLevelComplete(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Message
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text('LEVEL COMPLETE!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
  
  p.fill(255);
  p.textSize(20);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
  
  p.fill(200);
  p.textSize(16);
  p.text('PRESS ENTER FOR NEXT LEVEL', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
}

export function drawGameOver(p, won) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  if (won) {
    p.fill(255, 215, 0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(36);
    p.text('YOU WIN!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
    
    p.fill(255);
    p.textSize(20);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
    p.text('All Levels Complete!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  } else {
    p.fill(220, 20, 60);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(36);
    p.text('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
    
    p.fill(255);
    p.textSize(20);
    p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
    p.text('No more moves!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  }
  
  p.fill(200);
  p.textSize(16);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
}