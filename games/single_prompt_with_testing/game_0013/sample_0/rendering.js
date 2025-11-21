// rendering.js - Rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, CELL_SIZE, BOARD_OFFSET_X, BOARD_OFFSET_Y, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';

export function drawStartScreen(p) {
  p.background(40, 35, 50);
  
  // Title
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("TSURO", CANVAS_WIDTH / 2, 80);
  
  // Description
  p.fill(220, 220, 220);
  p.textSize(14);
  p.textAlign(p.CENTER, p.CENTER);
  const desc = "Place path tiles strategically to extend your route.\nSurvive by avoiding the board edges.\nBe the last player standing!";
  p.text(desc, CANVAS_WIDTH / 2, 160);
  
  // Controls
  p.fill(200, 200, 200);
  p.textSize(12);
  p.textAlign(p.LEFT, p.CENTER);
  const controls = [
    "ARROW KEYS - Select tile from hand",
    "SPACE - Rotate selected tile",
    "Z - Place tile (only in highlighted positions)",
    "ESC - Pause game",
    "R - Return to menu"
  ];
  
  let yPos = 240;
  for (let control of controls) {
    p.text(control, 100, yPos);
    yPos += 25;
  }
  
  // Start prompt
  p.fill(100, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
}

export function drawPlayingScreen(p) {
  p.background(60, 55, 70);
  
  // Draw board
  gameState.board.draw(p, CELL_SIZE, BOARD_OFFSET_X, BOARD_OFFSET_Y);
  
  // Highlight valid placements
  if (gameState.currentPlayerIndex === 0) { // Human player
    const player = gameState.players[0];
    const validPlacements = gameState.board.getValidPlacements(player);
    
    p.fill(100, 255, 100, 100);
    p.noStroke();
    for (let pos of validPlacements) {
      const px = BOARD_OFFSET_X + pos.x * CELL_SIZE;
      const py = BOARD_OFFSET_Y + pos.y * CELL_SIZE;
      p.rect(px, py, CELL_SIZE, CELL_SIZE);
    }
  }
  
  // Draw players
  for (let player of gameState.players) {
    player.draw(p, CELL_SIZE, BOARD_OFFSET_X, BOARD_OFFSET_Y);
  }
  
  // Draw tile hand
  drawTileHand(p);
  
  // Draw UI
  drawUI(p);
  
  // Draw paused indicator
  if (gameState.gamePhase === PHASE_PAUSED) {
    p.fill(255, 255, 100);
    p.textSize(16);
    p.textAlign(p.RIGHT, p.TOP);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }
}

function drawTileHand(p) {
  if (gameState.currentPlayerIndex !== 0) return; // Only show for human player
  
  const handX = 380;
  const handY = 80;
  const tileSpacing = 60;
  
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  p.text("Your Tiles:", handX, handY - 25);
  
  for (let i = 0; i < gameState.tileHand.length; i++) {
    const tile = gameState.tileHand[i];
    const x = handX + i * tileSpacing;
    const y = handY;
    
    // Highlight selected tile
    if (i === gameState.selectedTileIndex) {
      p.fill(255, 255, 100, 150);
      p.noStroke();
      p.rect(x - 5, y - 5, 60, 60);
    }
    
    tile.draw(p, x, y, 50);
    
    // Draw selection indicator
    if (i === gameState.selectedTileIndex) {
      p.noFill();
      p.stroke(255, 255, 100);
      p.strokeWeight(3);
      p.rect(x - 2, y - 2, 54, 54);
    }
  }
  
  // Instructions
  p.fill(200);
  p.textSize(11);
  p.textAlign(p.LEFT, p.TOP);
  p.text("Arrows: Select", handX, handY + 65);
  p.text("Space: Rotate", handX, handY + 80);
  p.text("Z: Place", handX, handY + 95);
}

function drawUI(p) {
  // Player status
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  
  let yPos = 10;
  for (let i = 0; i < gameState.players.length; i++) {
    const player = gameState.players[i];
    p.fill(...player.color);
    
    const status = player.isActive ? "Active" : "Eliminated";
    const label = i === 0 ? "You" : `AI ${i}`;
    const current = i === gameState.currentPlayerIndex ? " <-" : "";
    
    p.text(`${label}: ${status}${current}`, 10, yPos);
    yPos += 20;
  }
  
  // Turn count
  p.fill(220);
  p.text(`Turn: ${gameState.turnCount}`, 10, yPos + 10);
}

export function drawGameOverScreen(p) {
  p.background(40, 35, 50);
  
  // Result
  p.textAlign(p.CENTER, p.CENTER);
  if (gameState.gamePhase === PHASE_GAME_OVER_WIN) {
    p.fill(100, 255, 100);
    p.textSize(48);
    p.text("VICTORY!", CANVAS_WIDTH / 2, 120);
    
    p.fill(220);
    p.textSize(20);
    p.text("You survived the longest!", CANVAS_WIDTH / 2, 180);
    p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  } else {
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text("ELIMINATED", CANVAS_WIDTH / 2, 120);
    
    p.fill(220);
    p.textSize(20);
    p.text("Your stone went off the board!", CANVAS_WIDTH / 2, 180);
    p.text(`Turns Survived: ${gameState.turnCount}`, CANVAS_WIDTH / 2, 220);
  }
  
  // Restart prompt
  p.fill(255, 220, 100);
  p.textSize(18);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 320);
}