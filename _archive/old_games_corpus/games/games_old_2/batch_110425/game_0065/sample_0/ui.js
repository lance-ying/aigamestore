// ui.js - UI rendering and message system

import { gameState } from './globals.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN } from './globals.js';
import { ITEM_DESCRIPTIONS } from './room_data.js';

const MESSAGE_DURATION = 180; // 3 seconds at 60 FPS

export function addMessage(text) {
  gameState.messages.push(text);
  gameState.messageTimer = MESSAGE_DURATION;
}

export function updateMessages() {
  if (gameState.messageTimer > 0) {
    gameState.messageTimer--;
    if (gameState.messageTimer === 0) {
      gameState.messages.shift();
      if (gameState.messages.length > 0) {
        gameState.messageTimer = MESSAGE_DURATION;
      }
    }
  }
}

export function drawUI(p) {
  p.push();

  // Draw score and progress
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text(`Score: ${gameState.score}`, 10, 10);
  p.text(`Puzzles: ${gameState.puzzlesSolved}/${gameState.totalPuzzles}`, 10, 30);

  // Draw current room name
  if (gameState.rooms[gameState.currentRoom]) {
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(16);
    p.fill(255, 255, 150);
    p.text(gameState.rooms[gameState.currentRoom].name, CANVAS_WIDTH / 2, 10);
  }

  // Draw inventory indicator
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(12);
  p.fill(200, 200, 255);
  p.text(`Inventory: ${gameState.inventory.length} items`, CANVAS_WIDTH - 10, 10);
  p.text('[Z] to open', CANVAS_WIDTH - 10, 25);

  // Draw selected item indicator
  if (gameState.selectedItem) {
    p.fill(255, 255, 100);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(12);
    p.text(`Using: ${ITEM_DESCRIPTIONS[gameState.selectedItem] || gameState.selectedItem}`, CANVAS_WIDTH - 10, 45);
  }

  // Draw messages
  if (gameState.messages.length > 0 && gameState.messageTimer > 0) {
    const alpha = gameState.messageTimer < 60 ? (gameState.messageTimer / 60) * 255 : 255;
    p.fill(255, 255, 255, alpha);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16);
    p.text(gameState.messages[0], CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
  }

  // Draw inventory menu
  if (gameState.showInventory) {
    drawInventoryMenu(p);
  }

  // Draw pause indicator
  if (gameState.gamePhase === PHASE_PAUSED) {
    p.fill(255, 255, 255);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(14);
    p.text('PAUSED', CANVAS_WIDTH - 10, 65);
  }

  p.pop();
}

function drawInventoryMenu(p) {
  p.push();

  // Draw semi-transparent background
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(100, 80, 400, 240);

  // Draw border
  p.stroke(255, 255, 150);
  p.strokeWeight(2);
  p.noFill();
  p.rect(100, 80, 400, 240);

  // Draw title
  p.fill(255, 255, 150);
  p.noStroke();
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(18);
  p.text('INVENTORY', 300, 95);

  // Draw instructions
  p.textSize(12);
  p.fill(200, 200, 200);
  p.text('Arrow Keys: Navigate | Space: Select | Z: Close', 300, 120);

  // Draw items
  if (gameState.inventory.length === 0) {
    p.fill(150, 150, 150);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.text('No items collected yet', 300, 200);
  } else {
    const itemsPerRow = 3;
    const itemWidth = 110;
    const itemHeight = 50;
    const startX = 130;
    const startY = 150;

    gameState.inventory.forEach((item, index) => {
      const row = Math.floor(index / itemsPerRow);
      const col = index % itemsPerRow;
      const x = startX + col * itemWidth;
      const y = startY + row * itemHeight;

      // Draw item box
      const isSelected = index === gameState.inventoryIndex;
      p.stroke(isSelected ? [255, 255, 100] : [150, 150, 150]);
      p.strokeWeight(isSelected ? 3 : 1);
      p.fill(isSelected ? [60, 60, 80] : [40, 40, 60]);
      p.rect(x, y, itemWidth - 10, itemHeight - 10, 5);

      // Draw item icon
      p.fill(255, 215, 0);
      p.noStroke();
      p.ellipse(x + 20, y + (itemHeight - 10) / 2, 15);

      // Draw item name
      p.fill(255);
      p.textAlign(p.LEFT, p.CENTER);
      p.textSize(10);
      const description = ITEM_DESCRIPTIONS[item] || item;
      const shortDesc = description.length > 15 ? description.substring(0, 12) + '...' : description;
      p.text(shortDesc, x + 35, y + (itemHeight - 10) / 2);
    });
  }

  p.pop();
}

export function drawStartScreen(p) {
  p.push();

  // Background
  p.background(20, 15, 30);

  // Title
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text('EXIT', CANVAS_WIDTH / 2, 80);

  p.fill(200, 180, 150);
  p.textSize(20);
  p.text('Die Prüfung des Greifen', CANVAS_WIDTH / 2, 120);

  // Description
  p.fill(200, 200, 200);
  p.textSize(14);
  p.textAlign(p.CENTER, p.CENTER);
  const descLines = [
    'Escape from a haunted castle by solving',
    '20 interconnected puzzles!',
    '',
    'Explore rooms, examine objects, collect items,',
    'and combine them to unlock new areas.',
    'Each puzzle builds on the last.'
  ];
  descLines.forEach((line, i) => {
    p.text(line, CANVAS_WIDTH / 2, 160 + i * 20);
  });

  // Controls
  p.fill(150, 200, 255);
  p.textSize(13);
  p.textAlign(p.CENTER, p.CENTER);
  const controlLines = [
    'CONTROLS:',
    'Arrow Keys: Navigate hotspots',
    'Space: Examine/Interact',
    'Z: Open/Close inventory',
    'Shift + Arrows: Select inventory item',
    'ESC: Pause | R: Restart'
  ];
  controlLines.forEach((line, i) => {
    p.text(line, CANVAS_WIDTH / 2, 290 + i * 18);
  });

  // Start prompt
  p.fill(255, 255, 100);
  p.textSize(18);
  const flash = Math.floor(p.frameCount / 30) % 2 === 0;
  if (flash) {
    p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 395);
  }

  p.pop();
}

export function drawGameOverScreen(p) {
  p.push();

  // Background
  p.background(20, 30, 20);

  // Title
  const isWin = gameState.gamePhase === PHASE_GAME_OVER_WIN;
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? 'VICTORY!' : 'GAME OVER', CANVAS_WIDTH / 2, 120);

  // Message
  p.fill(200, 200, 200);
  p.textSize(18);
  if (isWin) {
    p.text('You escaped the haunted castle!', CANVAS_WIDTH / 2, 170);
    p.text('The Griffin\'s trial is complete.', CANVAS_WIDTH / 2, 195);
  } else {
    p.text('The castle keeps its secrets...', CANVAS_WIDTH / 2, 170);
  }

  // Stats
  p.fill(255, 255, 150);
  p.textSize(16);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 240);
  p.text(`Puzzles Solved: ${gameState.puzzlesSolved}/${gameState.totalPuzzles}`, CANVAS_WIDTH / 2, 265);

  // Restart prompt
  p.fill(255, 255, 100);
  p.textSize(18);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 330);

  p.pop();
}