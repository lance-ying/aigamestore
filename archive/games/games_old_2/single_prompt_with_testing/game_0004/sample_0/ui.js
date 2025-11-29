import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, MINI_GAMES } from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 20, 40);
  
  // Title
  p.fill(255, 200, 50);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("ARCADIA SPORTS", CANVAS_WIDTH / 2, 50);
  
  // Subtitle
  p.fill(200);
  p.textSize(16);
  p.text("12 Sports Mini-Games Collection", CANVAS_WIDTH / 2, 95);
  
  // Menu grid
  const cols = 4;
  const rows = 3;
  const cellWidth = 120;
  const cellHeight = 70;
  const startX = (CANVAS_WIDTH - cols * cellWidth) / 2;
  const startY = 130;
  
  for (let i = 0; i < MINI_GAMES.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * cellWidth;
    const y = startY + row * cellHeight;
    
    // Highlight selected
    if (i === gameState.menuSelection) {
      p.fill(100, 150, 255);
    } else {
      p.fill(60, 60, 80);
    }
    p.rect(x, y, cellWidth - 10, cellHeight - 10, 5);
    
    // Game icon (using emoji-like shapes)
    p.fill(255);
    p.textSize(24);
    p.text(MINI_GAMES[i].icon, x + (cellWidth - 10) / 2, y + 20);
    
    // Game name
    p.textSize(10);
    p.text(MINI_GAMES[i].name, x + (cellWidth - 10) / 2, y + 45);
  }
  
  // Instructions
  p.fill(200);
  p.textSize(14);
  p.text("Arrow Keys: Navigate | SPACE: Select", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  p.fill(100, 255, 100);
  p.textSize(16);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 15);
}

export function renderPauseOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

export function renderGameOver(p, isWin) {
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.textAlign(p.CENTER, p.CENTER);
  if (isWin) {
    p.fill(100, 255, 100);
    p.textSize(48);
    p.text("VICTORY!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
  } else {
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text("GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
  }
  
  p.fill(255);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  p.textSize(18);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
}