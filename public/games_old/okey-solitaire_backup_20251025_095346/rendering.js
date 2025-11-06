import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, TILE_WIDTH, TILE_HEIGHT, TILE_SPACING } from './globals.js';

export function drawStartScreen(p) {
  p.background(20, 60, 40);
  
  // Title
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('OKEY SOLITAIRE', CANVAS_WIDTH / 2, 80);
  
  // Description
  p.fill(220);
  p.textSize(14);
  p.text('Form sets and runs to complete your hand!', CANVAS_WIDTH / 2, 140);
  
  // Instructions
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    'Arrow Keys: Navigate tiles',
    'Space: Draw/Pick/Place tile',
    'D: Discard picked tile',
    'Z: Declare Okey (win)',
    '',
    'Sets: 3-4 same numbers, different colors',
    'Runs: 3+ consecutive numbers, same color'
  ];
  
  let y = 180;
  for (const line of instructions) {
    p.text(line, 100, y);
    y += 18;
  }
  
  // High score
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(16);
  p.text(`HIGH SCORE: ${gameState.highScore}`, CANVAS_WIDTH / 2, 320);
  
  // Start prompt
  p.fill(150, 255, 150);
  p.textSize(20);
  const flash = Math.floor(p.frameCount / 30) % 2 === 0;
  if (flash) {
    p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 360);
  }
}

export function drawGameplay(p) {
  p.background(30, 70, 50);
  
  // Draw score and level
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text(`LEVEL: ${gameState.level}`, 10, 10);
  
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
  
  // Draw center draw pile
  const centerX = CANVAS_WIDTH / 2 - TILE_WIDTH / 2;
  const centerY = CANVAS_HEIGHT / 2 - TILE_HEIGHT / 2;
  
  if (gameState.drawPile.length > 0) {
    for (let i = 0; i < Math.min(3, gameState.drawPile.length); i++) {
      const tile = gameState.drawPile[gameState.drawPile.length - 1 - i];
      tile.x = centerX + i * 2;
      tile.y = centerY + i * 2;
      tile.draw(p, false, true);
    }
    
    // Highlight if focused
    if (gameState.focusMode === 'DRAW_CENTER' && gameState.currentPlayer === 0 && !gameState.hasDrawn) {
      p.noFill();
      p.stroke(255, 255, 0);
      p.strokeWeight(3);
      p.rect(centerX - 5, centerY - 5, TILE_WIDTH + 10, TILE_HEIGHT + 10, 5);
    }
    
    // Draw count
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text(`${gameState.drawPile.length}`, centerX + TILE_WIDTH / 2, centerY - 20);
  }
  
  // Draw Okey indicator
  if (gameState.okeyTile) {
    const okeyX = centerX - 60;
    const okeyY = centerY;
    
    p.fill(255, 215, 0);
    p.noStroke();
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(10);
    p.text('OKEY:', okeyX + TILE_WIDTH / 2, okeyY - 25);
    
    gameState.okeyTile.x = okeyX;
    gameState.okeyTile.y = okeyY;
    gameState.okeyTile.draw(p, true, false);
  }
  
  // Draw players
  drawPlayerArea(p, 0, 'PLAYER', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 80, true);
  drawPlayerArea(p, 1, 'AI 1', CANVAS_WIDTH / 2, 50, false);
  drawPlayerArea(p, 2, 'AI 2', 80, CANVAS_HEIGHT / 2, false);
  drawPlayerArea(p, 3, 'AI 3', CANVAS_WIDTH - 80, CANVAS_HEIGHT / 2, false);
  
  // Draw paused indicator
  if (gameState.gamePhase === 'PAUSED') {
    p.fill(255);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.text('PAUSED', CANVAS_WIDTH - 10, 40);
  }
}

function drawPlayerArea(p, playerIndex, name, centerX, centerY, isHuman) {
  const hand = gameState.players[playerIndex];
  const discardPile = gameState.discardPiles[playerIndex];
  
  if (!hand) return;
  
  // Draw name
  p.fill(gameState.currentPlayer === playerIndex ? [255, 255, 100] : [200, 200, 200]);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(12);
  p.text(name, centerX, centerY - 35);
  
  // Draw hand
  const startX = centerX - (hand.length * (TILE_WIDTH + TILE_SPACING)) / 2;
  
  for (let i = 0; i < hand.length; i++) {
    const tile = hand[i];
    const x = startX + i * (TILE_WIDTH + TILE_SPACING);
    const y = centerY;
    
    tile.x = x;
    tile.y = y;
    
    const isSelected = isHuman && i === gameState.selectedTileIndex;
    const isPickedUp = isHuman && i === gameState.pickedUpTileIndex;
    const isOkey = tile.isJoker || (gameState.okeyTile && tile.color === gameState.okeyTile.color && tile.number === gameState.okeyTile.number);
    
    tile.draw(p, isOkey, !isHuman, isSelected, isPickedUp);
  }
  
  // Draw discard pile
  if (discardPile.length > 0) {
    const discardX = centerX + (hand.length * (TILE_WIDTH + TILE_SPACING)) / 2 + 20;
    const discardY = centerY;
    
    const topDiscard = discardPile[discardPile.length - 1];
    topDiscard.x = discardX;
    topDiscard.y = discardY;
    
    const isOkey = topDiscard.isJoker || (gameState.okeyTile && topDiscard.color === gameState.okeyTile.color && topDiscard.number === gameState.okeyTile.number);
    
    topDiscard.draw(p, isOkey, false);
    
    // Highlight if can draw
    if (playerIndex !== 0 && gameState.currentPlayer === 0 && !gameState.hasDrawn && gameState.focusMode === 'DRAW_DISCARD') {
      const prevPlayer = (gameState.currentPlayer + 3) % 4;
      if (playerIndex === prevPlayer) {
        p.noFill();
        p.stroke(255, 255, 0);
        p.strokeWeight(3);
        p.rect(discardX - 5, discardY - 5, TILE_WIDTH + 10, TILE_HEIGHT + 10, 5);
      }
    }
  }
}

export function drawGameOver(p, isWin) {
  p.background(isWin ? [20, 60, 20] : [60, 20, 20]);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? 'YOU WIN!' : 'GAME OVER', CANVAS_WIDTH / 2, 100);
  
  p.textSize(24);
  p.text(`FINAL SCORE: ${gameState.score}`, CANVAS_WIDTH / 2, 180);
  
  if (gameState.score > gameState.highScore) {
    p.fill(255, 215, 0);
    p.textSize(20);
    p.text('NEW HIGH SCORE!', CANVAS_WIDTH / 2, 220);
  }
  
  p.fill(200);
  p.textSize(18);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 300);
}

export function drawLevelComplete(p) {
  p.background(20, 40, 60);
  
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.text(`LEVEL ${gameState.level - 1} COMPLETE!`, CANVAS_WIDTH / 2, 120);
  
  p.fill(255);
  p.textSize(24);
  p.text(`Round Score: ${gameState.roundScore}`, CANVAS_WIDTH / 2, 180);
  p.text(`Total Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  
  p.fill(150, 255, 150);
  p.textSize(18);
  const flash = Math.floor(p.frameCount / 30) % 2 === 0;
  if (flash) {
    p.text('PRESS ENTER FOR NEXT LEVEL', CANVAS_WIDTH / 2, 300);
  }
}