// rendering.js - All rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GRID_START_X, GRID_START_Y, CELL_SIZE, ORDER_ZONE_X, ORDER_ZONE_Y, ORDER_ZONE_WIDTH, ORDER_ZONE_HEIGHT, LEVEL_CONFIG } from './globals.js';
import { getAllItems } from './grid.js';

export function renderStartScreen(p) {
  p.background(30, 40, 60);
  
  // Title
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("HARBOR MERGE MYSTERY", CANVAS_WIDTH / 2, 80);
  
  // Description
  p.fill(220);
  p.textSize(14);
  p.text("Restore the harbor restaurant by merging items", CANVAS_WIDTH / 2, 140);
  p.text("and fulfilling customer orders!", CANVAS_WIDTH / 2, 160);
  
  // Instructions
  p.fill(200);
  p.textSize(12);
  p.textAlign(p.LEFT, p.CENTER);
  const instructions = [
    "• ARROW KEYS: Navigate grid",
    "• SPACE: Select/drop item",
    "• Z: Confirm merge/order",
    "• ESC: Pause game",
    "• R: Return to menu"
  ];
  
  for (let i = 0; i < instructions.length; i++) {
    p.text(instructions[i], 150, 200 + i * 20);
  }
  
  // Objective
  p.fill(200, 255, 200);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(13);
  p.text("Merge identical items to level them up!", CANVAS_WIDTH / 2, 310);
  p.text("Drag items to Order Zone to fulfill orders", CANVAS_WIDTH / 2, 330);
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textSize(18);
  const flash = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(255, 255, 100, flash * 255);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
}

export function renderGamePlay(p) {
  p.background(40, 50, 70);
  
  // Draw grid
  drawGrid(p);
  
  // Draw items
  const items = getAllItems();
  for (const item of items) {
    if (item !== gameState.draggedItem) {
      item.update(p);
      const isSelected = gameState.selectedItem === item;
      item.draw(p, isSelected, false);
    }
  }
  
  // Draw dragged item on top
  if (gameState.draggedItem) {
    gameState.draggedItem.update(p);
    gameState.draggedItem.draw(p, true, true, p.mouseX, p.mouseY);
  }
  
  // Draw order zone
  drawOrderZone(p);
  
  // Draw orders
  drawOrders(p);
  
  // Draw UI
  drawUI(p);
  
  // Draw keyboard cursor if not in mouse mode
  if (gameState.controlMode !== 'HUMAN' || !p.mouseIsPressed) {
    drawKeyboardCursor(p);
  }
}

export function drawGrid(p) {
  p.push();
  
  for (let row = 0; row < gameState.gridSize; row++) {
    for (let col = 0; col < gameState.gridSize; col++) {
      const x = GRID_START_X + col * CELL_SIZE;
      const y = GRID_START_Y + row * CELL_SIZE;
      
      p.fill(50, 50, 50);
      p.stroke(100, 100, 100);
      p.strokeWeight(1);
      p.rect(x, y, CELL_SIZE, CELL_SIZE);
    }
  }
  
  p.pop();
}

export function drawOrderZone(p) {
  p.push();
  
  const pulse = Math.sin(p.frameCount * 0.05) * 10;
  p.fill(60, 80, 100, 100);
  p.stroke(120, 160, 200, 200 + pulse);
  p.strokeWeight(2);
  p.rect(ORDER_ZONE_X, ORDER_ZONE_Y, ORDER_ZONE_WIDTH, ORDER_ZONE_HEIGHT, 8);
  
  p.fill(150, 180, 200);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(12);
  p.text("ORDER", ORDER_ZONE_X + ORDER_ZONE_WIDTH / 2, ORDER_ZONE_Y + 15);
  p.text("ZONE", ORDER_ZONE_X + ORDER_ZONE_WIDTH / 2, ORDER_ZONE_Y + 30);
  
  p.pop();
}

export function drawOrders(p) {
  p.push();
  
  const startY = ORDER_ZONE_Y + 50;
  const spacing = 60;
  
  for (let i = 0; i < gameState.orders.length; i++) {
    const order = gameState.orders[i];
    const y = startY + i * spacing;
    
    if (y + 50 > ORDER_ZONE_Y + ORDER_ZONE_HEIGHT) break;
    
    // Order background
    p.fill(70, 90, 110);
    p.stroke(120);
    p.strokeWeight(1);
    p.rect(ORDER_ZONE_X + 5, y, ORDER_ZONE_WIDTH - 10, 50, 4);
    
    // Item icon (simplified)
    const iconSize = 30;
    const iconX = ORDER_ZONE_X + 25;
    const iconY = y + 25;
    
    drawOrderIcon(p, order, iconX, iconY, iconSize);
    
    // Order details
    p.fill(255);
    p.noStroke();
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(10);
    p.text(`Lv${order.level}`, ORDER_ZONE_X + 50, y + 15);
    p.textSize(14);
    p.text(`x${order.quantity}`, ORDER_ZONE_X + 50, y + 35);
  }
  
  p.pop();
}

export function drawOrderIcon(p, order, x, y, size) {
  p.push();
  
  const colors = getItemBaseColor(order.itemType);
  const [r, g, b] = colors;
  
  p.fill(r, g, b);
  p.stroke(100);
  p.strokeWeight(1);
  
  switch (order.itemType) {
    case 'COFFEE':
      p.ellipse(x, y, size, size);
      break;
    case 'SANDWICH':
      p.rect(x - size * 0.4, y - size * 0.3, size * 0.8, size * 0.6, 2);
      break;
    case 'PASTRY':
      p.triangle(x, y - size * 0.4, x - size * 0.4, y + size * 0.3, x + size * 0.4, y + size * 0.3);
      break;
    case 'JUICE':
      p.beginShape();
      p.vertex(x - size * 0.25, y - size * 0.4);
      p.vertex(x + size * 0.25, y - size * 0.4);
      p.vertex(x + size * 0.35, y + size * 0.4);
      p.vertex(x - size * 0.35, y + size * 0.4);
      p.endShape(p.CLOSE);
      break;
    case 'SALAD':
      p.ellipse(x, y, size, size * 0.8);
      break;
    case 'BURGER':
      p.arc(x, y - size * 0.15, size * 0.8, size * 0.5, p.PI, 0, p.CHORD);
      p.rect(x - size * 0.4, y + size * 0.1, size * 0.8, size * 0.2, 0, 0, 2, 2);
      break;
  }
  
  p.pop();
}

export function getItemBaseColor(itemType) {
  const baseColors = {
    COFFEE: [139, 90, 43],
    SANDWICH: [230, 200, 140],
    PASTRY: [255, 220, 180],
    JUICE: [255, 180, 50],
    SALAD: [120, 200, 120],
    BURGER: [200, 150, 100]
  };
  return baseColors[itemType] || [150, 150, 150];
}

export function drawUI(p) {
  p.push();
  
  // Score
  p.fill(255, 255, 100);
  p.noStroke();
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
  
  // High Score
  p.fill(200, 200, 255);
  p.textSize(12);
  p.text(`HIGH: ${gameState.highScore}`, CANVAS_WIDTH - 10, 30);
  
  // Level
  p.fill(150, 255, 150);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text(`Level ${gameState.currentLevel + 1} / 5`, 10, 10);
  
  // Orders completed
  const config = LEVEL_CONFIG[gameState.currentLevel];
  p.fill(200, 220, 255);
  p.textSize(12);
  p.text(`Orders: ${gameState.ordersCompleted} / ${config.ordersToComplete}`, 10, 30);
  
  p.pop();
}

export function drawKeyboardCursor(p) {
  if (gameState.controlMode === 'HUMAN') return;
  
  p.push();
  const x = GRID_START_X + gameState.cursorX * CELL_SIZE + CELL_SIZE / 2;
  const y = GRID_START_Y + gameState.cursorY * CELL_SIZE + CELL_SIZE / 2;
  
  p.noFill();
  p.stroke(255, 255, 0, 200);
  p.strokeWeight(3);
  p.rect(x - CELL_SIZE / 2, y - CELL_SIZE / 2, CELL_SIZE, CELL_SIZE);
  
  p.pop();
}

export function renderPausedScreen(p) {
  renderGamePlay(p);
  
  // Semi-transparent overlay
  p.push();
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Paused text
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  
  p.fill(220);
  p.textSize(16);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  p.text("Press R to return to menu", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 45);
  
  p.pop();
}

export function renderLevelTransition(p) {
  p.background(30, 40, 60);
  
  const config = LEVEL_CONFIG[gameState.currentLevel];
  
  p.push();
  
  // Level complete message
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("LEVEL COMPLETE!", CANVAS_WIDTH / 2, 100);
  
  // Bonus points
  p.fill(150, 255, 150);
  p.textSize(24);
  p.text("+500 BONUS POINTS", CANVAS_WIDTH / 2, 150);
  
  // Story snippet
  p.fill(220);
  p.textSize(14);
  p.textAlign(p.CENTER, p.CENTER);
  const words = config.story.split(' ');
  let line = '';
  let y = 220;
  
  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' ';
    const testWidth = p.textWidth(testLine);
    
    if (testWidth > 500 && i > 0) {
      p.text(line, CANVAS_WIDTH / 2, y);
      line = words[i] + ' ';
      y += 20;
    } else {
      line = testLine;
    }
  }
  p.text(line, CANVAS_WIDTH / 2, y);
  
  // Progress indicator
  p.fill(200);
  p.textSize(12);
  p.text("Loading next level...", CANVAS_WIDTH / 2, 340);
  
  p.pop();
}

export function renderGameOverScreen(p, isWin) {
  p.background(30, 40, 60);
  
  p.push();
  
  if (isWin) {
    p.fill(150, 255, 150);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(36);
    p.text("CONGRATULATIONS!", CANVAS_WIDTH / 2, 80);
    
    p.fill(255, 220, 100);
    p.textSize(20);
    p.text("You Restored Gossip Harbor!", CANVAS_WIDTH / 2, 130);
    
    p.fill(220);
    p.textSize(14);
    p.text("The mystery is solved and the restaurant thrives!", CANVAS_WIDTH / 2, 170);
  } else {
    p.fill(255, 100, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(36);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 100);
    
    p.fill(220);
    p.textSize(16);
    p.text("The board is full and no merges are possible!", CANVAS_WIDTH / 2, 150);
  }
  
  // Final score
  p.fill(255, 255, 100);
  p.textSize(24);
  p.text(`FINAL SCORE: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  
  if (gameState.score >= gameState.highScore) {
    p.fill(255, 200, 100);
    p.textSize(18);
    p.text("NEW HIGH SCORE!", CANVAS_WIDTH / 2, 250);
  }
  
  // Instructions
  p.fill(200);
  p.textSize(16);
  p.text("Press R to return to menu", CANVAS_WIDTH / 2, 320);
  
  p.pop();
}