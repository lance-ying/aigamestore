import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, MAX_ENERGY } from './globals.js';

// Start screen
export function drawStartScreen(p) {
  p.background(30, 30, 40);
  
  // Title with glow effect
  p.push();
  p.drawingContext.shadowBlur = 20;
  p.drawingContext.shadowColor = 'rgba(220, 180, 60, 0.5)';
  p.fill(220, 180, 60);
  p.textSize(60);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("Card Conqueror", CANVAS_WIDTH / 2, 120);
  p.pop();
  
  // Instructions
  p.fill(200, 200, 200);
  p.textSize(18);
  p.text("Battle through 10 enemies with your deck of cards!", CANVAS_WIDTH / 2, 200);
  
  p.textSize(16);
  p.fill(180, 180, 180);
  p.text("• Each turn, play cards using your energy", CANVAS_WIDTH / 2, 240);
  p.text("• Defeat enemies to add new cards to your deck", CANVAS_WIDTH / 2, 270);
  p.text("• Reach and defeat the final boss to win!", CANVAS_WIDTH / 2, 300);
  
  // Controls box
  p.push();
  p.fill(40, 40, 50);
  p.stroke(80, 80, 100);
  p.strokeWeight(2);
  p.rect(CANVAS_WIDTH / 2 - 250, 350, 500, 200, 10);
  
  p.fill(220, 180, 60);
  p.textSize(20);
  p.text("Controls", CANVAS_WIDTH / 2, 380);
  
  p.fill(200, 200, 200);
  p.textSize(16);
  p.textAlign(p.LEFT, p.CENTER);
  const controlX = CANVAS_WIDTH / 2 - 220;
  p.text("↑↓ UP/DOWN: Select cards in hand", controlX, 420);
  p.text("SPACE: Play selected card", controlX, 450);
  p.text("Z: End your turn", controlX, 480);
  p.text("SHIFT: View draw pile  |  → RIGHT: View discard", controlX, 510);
  p.pop();
  
  // Start prompt with pulsing effect
  p.push();
  const pulse = p.sin(p.frameCount * 0.05) * 0.3 + 0.7;
  p.fill(255, 255, 255, pulse * 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 590);
  p.pop();
}

// Pause screen
export function drawPauseIndicator(p) {
  p.push();
  p.fill(255);
  p.textSize(18);
  p.textAlign(p.RIGHT, p.TOP);
  p.text("⏸ PAUSED (ESC to resume)", CANVAS_WIDTH - 20, 20);
  p.pop();
}

// Game over screen
export function drawGameOverScreen(p, isWin) {
  p.push();
  p.background(30, 30, 40, 220);
  
  // Glow effect
  p.drawingContext.shadowBlur = 30;
  p.drawingContext.shadowColor = isWin ? 'rgba(60, 220, 120, 0.8)' : 'rgba(220, 60, 60, 0.8)';
  
  p.fill(isWin ? [60, 220, 120] : [220, 60, 60]);
  p.textSize(60);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(isWin ? "VICTORY!" : "DEFEAT", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
  
  p.drawingContext.shadowBlur = 0;
  
  p.fill(200, 200, 200);
  p.textSize(24);
  p.text(`Battles won: ${gameState.battleCount}/${gameState.totalEnemies}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  
  p.fill(255);
  p.textSize(20);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
  p.pop();
}

// UI elements for the battle
export function drawBattleUI(p) {
  p.push();
  
  // Draw energy orb with glow
  p.push();
  p.drawingContext.shadowBlur = 15;
  p.drawingContext.shadowColor = 'rgba(60, 100, 220, 0.6)';
  p.fill(60, 100, 220);
  p.stroke(30, 60, 140);
  p.strokeWeight(3);
  p.ellipse(70, 70, 60, 60);
  p.pop();
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  p.text(`${gameState.energy}`, 70, 65);
  p.textSize(14);
  p.text(`/${MAX_ENERGY}`, 70, 82);
  p.textSize(12);
  p.text("ENERGY", 70, 110);
  
  // Draw battle progress
  p.fill(220, 180, 60);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(18);
  p.text(`Battle ${gameState.currentEnemyIndex + 1} of ${gameState.totalEnemies}`, CANVAS_WIDTH / 2, 25);
  
  // Draw pile box (on the left)
  p.push();
  p.fill(50, 50, 80);
  p.stroke(100, 100, 150);
  p.strokeWeight(2);
  p.rect(20, CANVAS_HEIGHT - 100, 120, 80, 5);
  
  p.fill(150, 180, 255);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(14);
  p.text("📚 DRAW", 80, CANVAS_HEIGHT - 95);
  
  p.fill(255);
  p.textSize(32);
  p.text(gameState.drawPile.length, 80, CANVAS_HEIGHT - 65);
  
  p.textSize(10);
  p.fill(180, 180, 180);
  p.text("Press SHIFT", 80, CANVAS_HEIGHT - 30);
  p.pop();
  
  // Discard pile box (on the right)
  p.push();
  p.fill(60, 40, 40);
  p.stroke(120, 80, 80);
  p.strokeWeight(2);
  p.rect(CANVAS_WIDTH - 140, CANVAS_HEIGHT - 100, 120, 80, 5);
  
  p.fill(255, 150, 150);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(14);
  p.text("🗑️ DISCARD", CANVAS_WIDTH - 80, CANVAS_HEIGHT - 95);
  
  p.fill(255);
  p.textSize(32);
  p.text(gameState.discardPile.length, CANVAS_WIDTH - 80, CANVAS_HEIGHT - 65);
  
  p.textSize(10);
  p.fill(180, 180, 180);
  p.text("Press →", CANVAS_WIDTH - 80, CANVAS_HEIGHT - 30);
  p.pop();
  
  // Draw end turn button with better visuals
  const btnActive = gameState.turn === "PLAYER";
  p.push();
  if (btnActive) {
    p.drawingContext.shadowBlur = 10;
    p.drawingContext.shadowColor = 'rgba(100, 150, 200, 0.8)';
  }
  p.fill(btnActive ? [100, 150, 200] : [50, 50, 50]);
  p.stroke(btnActive ? [150, 200, 255] : [80, 80, 80]);
  p.strokeWeight(2);
  p.rect(CANVAS_WIDTH / 2 - 60, CANVAS_HEIGHT - 40, 120, 30, 8);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(16);
  p.text("END TURN (Z)", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 25);
  p.pop();
  
  // Show control hints during gameplay
  if (gameState.turn === "PLAYER" && gameState.hand.length > 0) {
    p.push();
    p.fill(200, 200, 200, 180);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(12);
    p.text("↑↓ Select Card  |  SPACE Play Card  |  Z End Turn", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 200);
    p.pop();
  }
  
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
  p.fill(20, 20, 20, 230);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Title box
  p.fill(40, 40, 50);
  p.stroke(100, 100, 120);
  p.strokeWeight(3);
  p.rect(CANVAS_WIDTH / 2 - 200, 30, 400, 60, 10);
  
  const isDraw = gameState.viewingPile === "DRAW";
  p.fill(isDraw ? [150, 200, 255] : [255, 150, 150]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(28);
  p.text(isDraw ? "📚 Draw Pile" : "🗑️ Discard Pile", CANVAS_WIDTH / 2, 60);
  
  // Get the correct pile
  const pile = isDraw ? gameState.drawPile : gameState.discardPile;
  
  if (pile.length === 0) {
    p.fill(150, 150, 150);
    p.textSize(20);
    p.text("Empty", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  } else {
    // Show cards in a grid
    const cardsPerRow = 6;
    const cardWidth = 110;
    const cardHeight = 130;
    const startX = (CANVAS_WIDTH - (cardsPerRow * (cardWidth + 10))) / 2 + cardWidth / 2;
    const startY = 140;
    
    for (let i = 0; i < pile.length; i++) {
      const row = Math.floor(i / cardsPerRow);
      const col = i % cardsPerRow;
      const x = startX + col * (cardWidth + 10);
      const y = startY + row * (cardHeight + 15);
      
      if (y + cardHeight < CANVAS_HEIGHT - 80) {
        pile[i].draw(p, x - cardWidth/2, y - cardHeight/2, false);
      }
    }
  }
  
  // Instructions box at bottom
  p.fill(40, 40, 50);
  p.stroke(100, 100, 120);
  p.strokeWeight(2);
  p.rect(CANVAS_WIDTH / 2 - 250, CANVAS_HEIGHT - 60, 500, 40, 8);
  
  p.fill(200, 200, 200);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(16);
  p.text("Press SHIFT or → to switch pile  |  Any other key to close", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  
  p.pop();
}

// Draw reward screen after battle
export function drawRewardScreen(p) {
  p.push();
  
  // Background overlay
  p.fill(20, 20, 30, 240);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Title with glow
  p.push();
  p.drawingContext.shadowBlur = 20;
  p.drawingContext.shadowColor = 'rgba(220, 180, 60, 0.8)';
  p.fill(220, 180, 60);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(40);
  p.text("⭐ Choose Your Reward! ⭐", CANVAS_WIDTH / 2, 80);
  p.pop();
  
  // Draw available cards
  const cardSpacing = 200;
  const startX = CANVAS_WIDTH / 2 - ((gameState.availableRewards.length - 1) * cardSpacing) / 2;
  
  for (let i = 0; i < gameState.availableRewards.length; i++) {
    const x = startX + i * cardSpacing;
    const isSelected = i === gameState.selectedRewardIndex;
    
    // Draw highlight for selected card with animation
    if (isSelected) {
      p.push();
      const pulse = p.sin(p.frameCount * 0.1) * 10;
      p.drawingContext.shadowBlur = 20 + pulse;
      p.drawingContext.shadowColor = 'rgba(100, 200, 255, 0.8)';
      p.fill(60, 120, 200, 150);
      p.noStroke();
      p.rect(x - 75, 180 - 15, 150, 190, 15);
      p.pop();
    }
    
    gameState.availableRewards[i].draw(p, x - 55, 180, isSelected);
  }
  
  // Instructions box at bottom
  p.fill(40, 40, 50);
  p.stroke(100, 100, 120);
  p.strokeWeight(2);
  p.rect(CANVAS_WIDTH / 2 - 250, CANVAS_HEIGHT - 100, 500, 60, 10);
  
  p.fill(200, 200, 200);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  p.text("↑↓ Navigate Cards", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 80);
  p.textSize(18);
  p.text("SPACE Select Card", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 55);
  
  p.pop();
}