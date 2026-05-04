import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, LEVEL_CONFIGS, CARD_WIDTH, CARD_HEIGHT, TABLEAU_START_X, TABLEAU_START_Y } from './globals.js';

export function drawStartScreen(p) {
  p.background(20, 80, 40);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("Spider Stack Solitaire", CANVAS_WIDTH / 2, 80);
  
  p.textSize(14);
  p.fill(200);
  const desc = "Clear 104 cards by building 8 complete King-to-Ace\nsequences of the same suit. Move cards strategically!";
  p.text(desc, CANVAS_WIDTH / 2, 140);
  
  p.textSize(12);
  p.fill(180);
  p.text("CONTROLS:", CANVAS_WIDTH / 2, 200);
  p.textSize(11);
  p.fill(220);
  p.text("Arrow Keys: Navigate cards | Space: Auto-move | Z: Undo", CANVAS_WIDTH / 2, 220);
  p.text("ESC: Pause | R: Restart", CANVAS_WIDTH / 2, 235);
  
  p.textSize(16);
  p.fill(255, 255, 0);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 280);
  
  p.textSize(12);
  p.fill(150);
  const level = LEVEL_CONFIGS[gameState.currentLevelIdx];
  p.text(`Level: ${level.name} (${level.suits} suit${level.suits > 1 ? 's' : ''})`, CANVAS_WIDTH / 2, 320);
}

export function drawPlayingScreen(p) {
  p.background(20, 80, 40);
  
  drawUI(p);
  drawTableau(p);
  drawFoundations(p);
  drawStockPile(p);
  
  if (gameState.isPaused) {
    drawPausedOverlay(p);
  }
}

export function drawUI(p) {
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text(`SCORE: ${gameState.score}`, 10, 10);
  p.text(`MOVES: ${gameState.movesCount}`, 10, 25);
  
  p.textAlign(p.RIGHT, p.TOP);
  const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  p.text(`TIME: ${mins}:${secs.toString().padStart(2, '0')}`, CANVAS_WIDTH - 10, 10);
  p.text(`DEALS: ${gameState.stockDealsRemaining}`, CANVAS_WIDTH - 10, 25);
  
  p.textAlign(p.CENTER, p.TOP);
  const level = LEVEL_CONFIGS[gameState.currentLevelIdx];
  p.text(`LEVEL: ${level.name}`, CANVAS_WIDTH / 2, 10);
  
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(10);
  p.fill(200);
  p.text(`Foundations: ${gameState.foundations.length}/8`, CANVAS_WIDTH / 2, 25);
  
  if (gameState.isPaused) {
    p.fill(255, 255, 0);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(14);
    p.text("PAUSED", CANVAS_WIDTH - 10, 45);
  }
}

export function drawTableau(p) {
  for (let col = 0; col < gameState.tableau.length; col++) {
    const column = gameState.tableau[col];
    
    p.stroke(100, 150, 100);
    p.strokeWeight(1);
    p.noFill();
    const colX = TABLEAU_START_X + col * 55;
    p.rect(colX, TABLEAU_START_Y, CARD_WIDTH, CARD_HEIGHT, 4);
    
    for (let i = 0; i < column.length; i++) {
      const card = column[i];
      card.updatePosition(p);
      
      const isSelected = gameState.selectedCardData && 
                        gameState.selectedCardData.column === col && 
                        gameState.selectedCardData.cardIdx === i;
      
      const isHinted = gameState.autoMoveHint &&
                      gameState.autoMoveHint.fromCol === col &&
                      gameState.autoMoveHint.cardIdx === i;
      
      const isDragging = gameState.draggedCards &&
                        gameState.draggedCards.fromCol === col &&
                        gameState.draggedCards.cardIdx === i;
      
      card.draw(p, isSelected || isHinted, isDragging);
    }
  }
}

export function drawFoundations(p) {
  const startX = CANVAS_WIDTH - 200;
  const startY = 60;
  
  for (let i = 0; i < 8; i++) {
    const x = startX + (i % 4) * 48;
    const y = startY + Math.floor(i / 4) * 68;
    
    p.stroke(150, 200, 150);
    p.strokeWeight(2);
    p.fill(30, 100, 50);
    p.rect(x, y, 40, 55, 3);
    
    if (i < gameState.foundations.length) {
      p.fill(200, 220, 200);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(10);
      p.text("K-A", x + 20, y + 27);
    }
  }
}

export function drawStockPile(p) {
  const x = CANVAS_WIDTH - 60;
  const y = 210;
  
  p.stroke(200, 200, 100);
  p.strokeWeight(2);
  p.fill(80, 120, 180);
  p.rect(x, y, 50, 70, 4);
  
  p.fill(255);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(10);
  p.text("DEAL", x + 25, y + 25);
  p.textSize(14);
  p.text(gameState.stockDealsRemaining, x + 25, y + 45);
}

export function drawPausedOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  
  p.textSize(14);
  p.text("Press ESC to Resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
  p.text("Press R to Restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

export function drawGameOverScreen(p) {
  p.background(20, 80, 40);
  
  const isWin = gameState.foundations.length === 8;
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text(isWin ? "LEVEL COMPLETE!" : "GAME OVER", CANVAS_WIDTH / 2, 100);
  
  p.textSize(16);
  p.fill(200);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 150);
  p.text(`Moves: ${gameState.movesCount}`, CANVAS_WIDTH / 2, 175);
  
  const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  p.text(`Time: ${mins}:${secs.toString().padStart(2, '0')}`, CANVAS_WIDTH / 2, 200);
  
  p.textSize(14);
  p.fill(255, 255, 0);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 260);
  
  if (isWin && gameState.currentLevelIdx < 3) {
    p.fill(150, 255, 150);
    p.text("Next level available!", CANVAS_WIDTH / 2, 290);
  }
}