// ui.js - UI rendering

import { CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_START, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';

export function drawStartScreen(p, gameState) {
  p.background(20, 15, 15);
  
  // Title
  p.fill(200, 50, 50);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("THE BINDING", CANVAS_WIDTH / 2, 80);
  p.textSize(36);
  p.text("OF ISAAC", CANVAS_WIDTH / 2, 120);
  
  // Subtitle
  p.fill(150, 150, 150);
  p.textSize(14);
  p.text("A Rogue-like Dungeon Crawler", CANVAS_WIDTH / 2, 160);
  
  // Description
  p.fill(200, 200, 200);
  p.textSize(12);
  p.textAlign(p.CENTER, p.TOP);
  const desc = [
    "Escape into the basement and face",
    "droves of enemies and bosses.",
    "Collect items to gain powers and",
    "survive through multiple floors."
  ];
  for (let i = 0; i < desc.length; i++) {
    p.text(desc[i], CANVAS_WIDTH / 2, 190 + i * 18);
  }
  
  // Controls
  p.fill(200, 200, 100);
  p.textSize(11);
  p.textAlign(p.LEFT, p.TOP);
  const controls = [
    "ARROW KEYS - Move Isaac",
    "SPACE - Shoot tears",
    "SHIFT - Sprint (uses stamina)",
    "Z - Use special ability",
    "ESC - Pause game",
    "R - Return to menu"
  ];
  let yPos = 280;
  for (const ctrl of controls) {
    p.text(ctrl, 50, yPos);
    yPos += 16;
  }
  
  // Start prompt
  p.fill(255, 255, 255);
  p.textSize(16);
  p.textAlign(p.CENTER, p.CENTER);
  if (Math.floor(p.frameCount / 30) % 2 === 0) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  }
}

export function drawPausedIndicator(p) {
  p.fill(255, 255, 255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

export function drawGameOverScreen(p, gameState) {
  p.background(20, 15, 15, 200);
  
  const isWin = gameState.gamePhase === PHASE_GAME_OVER_WIN;
  
  // Title
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "ESCAPED!" : "YOU DIED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
  
  // Message
  p.fill(200, 200, 200);
  p.textSize(16);
  if (isWin) {
    p.text("You escaped the basement!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  } else {
    p.text("Your journey ends here...", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  }
  
  // Score
  p.fill(255, 255, 100);
  p.textSize(24);
  p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  
  // Stats
  p.fill(150, 150, 150);
  p.textSize(14);
  p.text(`Floor: ${gameState.currentFloor + 1}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
  p.text(`Rooms Cleared: ${gameState.roomsCleared}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
  
  // Restart prompt
  p.fill(255, 255, 255);
  p.textSize(16);
  if (Math.floor(p.frameCount / 30) % 2 === 0) {
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  }
}

export function drawHUD(p, gameState) {
  // Score
  p.fill(255, 255, 255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 50);
  
  // Floor
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Floor: ${gameState.currentFloor + 1}`, 10, 50);
  
  // Mini map
  drawMiniMap(p, gameState);
}

function drawMiniMap(p, gameState) {
  const mapX = CANVAS_WIDTH - 90;
  const mapY = 70;
  const cellSize = 12;
  const dungeon = gameState.dungeon;
  
  if (!dungeon) return;
  
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(mapX - 5, mapY - 5, cellSize * 5 + 10, cellSize * 5 + 10);
  
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 5; x++) {
      const room = dungeon.getRoom(x, y);
      if (room && room.visited) {
        if (x === gameState.currentRoom.x && y === gameState.currentRoom.y) {
          p.fill(255, 255, 100);
        } else if (room.type === 'boss') {
          p.fill(255, 100, 100);
        } else if (room.type === 'treasure') {
          p.fill(255, 255, 100);
        } else if (room.cleared) {
          p.fill(100, 255, 100);
        } else {
          p.fill(150, 150, 150);
        }
        p.rect(mapX + x * cellSize, mapY + y * cellSize, cellSize - 2, cellSize - 2);
      }
    }
  }
}