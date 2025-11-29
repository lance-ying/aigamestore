// render.js - Rendering functions

import { gameState, GAME_PHASE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { LEVELS } from './levels.js';
import { checkValidPlacement } from './item.js';

export function renderGame(p) {
  p.background(240, 240, 245);
  
  switch (gameState.gamePhase) {
    case GAME_PHASE.START:
      renderStartScreen(p);
      break;
    case GAME_PHASE.PLAYING:
      renderPlayingScreen(p);
      break;
    case GAME_PHASE.PAUSED:
      renderPlayingScreen(p);
      renderPauseOverlay(p);
      break;
    case GAME_PHASE.LEVEL_COMPLETE:
      renderLevelCompleteScreen(p);
      break;
    case GAME_PHASE.GAME_OVER:
      renderGameOverScreen(p);
      break;
    case GAME_PHASE.WIN:
      renderWinScreen(p);
      break;
  }
}

function renderStartScreen(p) {
  p.fill(50);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("COZY CONSTRUCTOR", CANVAS_WIDTH / 2, 80);
  
  p.textSize(14);
  p.fill(80);
  p.text("Arrange furniture to create perfect living spaces!", CANVAS_WIDTH / 2, 130);
  p.text("Place all items according to the rules before time runs out.", CANVAS_WIDTH / 2, 150);
  
  p.textSize(12);
  p.fill(100);
  p.text("CONTROLS:", CANVAS_WIDTH / 2, 190);
  p.textAlign(p.LEFT, p.CENTER);
  p.text("Arrow Keys: Move held item", 150, 215);
  p.text("SPACE: Place item", 150, 235);
  p.text("Z: Rotate item", 150, 255);
  p.text("SHIFT: Cancel placement", 150, 275);
  
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(16);
  p.fill(0, 100, 200);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 330);
  
  if (gameState.highScore > 0) {
    p.textSize(14);
    p.fill(150, 100, 0);
    p.text(`High Score: ${gameState.highScore}`, CANVAS_WIDTH / 2, 365);
  }
}

function renderPlayingScreen(p) {
  // Draw UI
  renderUI(p);
  
  // Draw grid
  renderGrid(p);
  
  // Draw placed items
  for (let item of gameState.placedItems) {
    renderItem(p, item, false);
  }
  
  // Draw held item
  if (gameState.heldItem) {
    const isValid = checkValidPlacement(gameState.heldItem);
    renderItem(p, gameState.heldItem, true, isValid);
  }
  
  // Draw inventory
  renderInventory(p);
  
  // Draw zone if applicable
  const levelConfig = LEVELS[gameState.currentLevel];
  const zoneRule = levelConfig.rules.find(r => r.type === "IN_ZONE");
  if (zoneRule) {
    renderZone(p, zoneRule);
  }
}

function renderUI(p) {
  p.fill(50);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text(`LEVEL: ${gameState.currentLevel + 1}`, 10, 10);
  
  p.textAlign(p.CENTER, p.TOP);
  p.text(`TIME: ${Math.ceil(gameState.timeRemaining)}s`, CANVAS_WIDTH / 2, 10);
  
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
  
  // Level name
  const levelConfig = LEVELS[gameState.currentLevel];
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.fill(100);
  p.text(levelConfig.name, 10, 35);
  
  // Rules hint
  p.textSize(10);
  p.fill(120);
  p.textAlign(p.LEFT, p.TOP);
  let ruleY = 50;
  for (let rule of levelConfig.rules) {
    if (rule.type !== "ALL_PLACED" && rule.type !== "NO_OVERLAP") {
      p.text(rule.message, 10, ruleY);
      ruleY += 12;
    }
  }
}

function renderGrid(p) {
  const { gridOffsetX, gridOffsetY, cellSize, gridSize } = gameState;
  
  // Grid background
  p.fill(255);
  p.stroke(200);
  p.strokeWeight(1);
  p.rect(gridOffsetX, gridOffsetY, cellSize * gridSize, cellSize * gridSize);
  
  // Grid lines
  p.stroke(230);
  for (let i = 0; i <= gridSize; i++) {
    p.line(gridOffsetX, gridOffsetY + i * cellSize, 
           gridOffsetX + cellSize * gridSize, gridOffsetY + i * cellSize);
    p.line(gridOffsetX + i * cellSize, gridOffsetY, 
           gridOffsetX + i * cellSize, gridOffsetY + cellSize * gridSize);
  }
}

function renderZone(p, zoneRule) {
  const { gridOffsetX, gridOffsetY, cellSize } = gameState;
  const x = gridOffsetX + zoneRule.zoneX * cellSize;
  const y = gridOffsetY + zoneRule.zoneY * cellSize;
  const w = zoneRule.zoneW * cellSize;
  const h = zoneRule.zoneH * cellSize;
  
  p.noFill();
  p.stroke(255, 150, 0);
  p.strokeWeight(2);
  p.rect(x, y, w, h);
}

function renderItem(p, item, isHeld, isValid = true) {
  const { gridOffsetX, gridOffsetY, cellSize } = gameState;
  const cells = item.getOccupiedCells();
  
  // Draw cells
  for (let cell of cells) {
    const x = gridOffsetX + cell.x * cellSize;
    const y = gridOffsetY + cell.y * cellSize;
    
    if (isHeld) {
      p.fill(...(isValid ? [item.color[0], item.color[1], item.color[2], 150] : [255, 100, 100, 150]));
      p.stroke(...(isValid ? [0, 200, 0] : [255, 0, 0]));
      p.strokeWeight(2);
    } else {
      p.fill(...item.color);
      p.stroke(50);
      p.strokeWeight(1);
    }
    
    p.rect(x + 1, y + 1, cellSize - 2, cellSize - 2, 3);
  }
  
  // Draw item name
  if (!isHeld) {
    const bounds = item.getBounds();
    const centerX = gridOffsetX + (bounds.minX + bounds.maxX + 1) * cellSize / 2;
    const centerY = gridOffsetY + (bounds.minY + bounds.maxY + 1) * cellSize / 2;
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(8);
    p.noStroke();
    p.text(item.name, centerX, centerY);
  }
}

function renderInventory(p) {
  const invX = 400;
  const invY = 80;
  const invWidth = 180;
  
  p.fill(240);
  p.stroke(150);
  p.strokeWeight(1);
  p.rect(invX, invY, invWidth, 300);
  
  p.fill(50);
  p.noStroke();
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(12);
  p.text("INVENTORY", invX + invWidth / 2, invY + 5);
  
  let itemY = invY + 25;
  for (let i = 0; i < gameState.inventory.length; i++) {
    const item = gameState.inventory[i];
    
    // Background
    const isSelected = i === gameState.selectedInventoryIndex;
    p.fill(...(isSelected ? [200, 230, 255] : (item.isPlaced ? [200, 255, 200] : [255])));
    p.stroke(150);
    p.strokeWeight(1);
    p.rect(invX + 10, itemY, invWidth - 20, 30, 3);
    
    // Item color indicator
    p.fill(...item.color);
    p.noStroke();
    p.rect(invX + 15, itemY + 5, 20, 20, 2);
    
    // Item name
    p.fill(50);
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(10);
    p.text(item.name, invX + 40, itemY + 15);
    
    // Status
    if (item.isPlaced) {
      p.fill(0, 150, 0);
      p.textAlign(p.RIGHT, p.CENTER);
      p.text("✓", invX + invWidth - 15, itemY + 15);
    }
    
    itemY += 35;
  }
  
  // Instructions
  p.fill(100);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(9);
  p.text("Click item or use arrows\nto select and place", invX + invWidth / 2, invY + 270);
}

function renderPauseOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  
  p.textSize(14);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  p.text("Press R to restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 45);
  
  // Small pause indicator in top right
  p.fill(255, 200, 0);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(12);
  p.text("PAUSED", CANVAS_WIDTH - 10, 30);
}

function renderLevelCompleteScreen(p) {
  p.fill(240, 255, 240);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(0, 150, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("LEVEL COMPLETE!", CANVAS_WIDTH / 2, 100);
  
  const levelConfig = LEVELS[gameState.currentLevel];
  p.fill(50);
  p.textSize(16);
  p.text(`${levelConfig.name}`, CANVAS_WIDTH / 2, 150);
  
  // Score breakdown
  p.textSize(14);
  p.textAlign(p.LEFT, p.CENTER);
  p.text("Level Score:", 200, 200);
  p.text("Time Bonus:", 200, 225);
  p.text("Completion Bonus:", 200, 250);
  
  p.textAlign(p.RIGHT, p.CENTER);
  const timeBonus = Math.max(0, Math.floor(1000 - (gameState.levelTimeLimit - gameState.timeRemaining) * 10));
  p.text(`+${gameState.levelScore}`, 400, 200);
  p.text(`+${timeBonus}`, 400, 225);
  p.text(`+200`, 400, 250);
  
  p.fill(0, 100, 200);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  p.text(`Total Score: ${gameState.score}`, CANVAS_WIDTH / 2, 290);
  
  p.textSize(16);
  const isLastLevel = gameState.currentLevel >= LEVELS.length - 1;
  p.text(isLastLevel ? "PRESS SPACE TO CONTINUE" : "PRESS SPACE FOR NEXT LEVEL", CANVAS_WIDTH / 2, 340);
  p.textSize(12);
  p.fill(100);
  p.text("Press R to restart", CANVAS_WIDTH / 2, 365);
}

function renderGameOverScreen(p) {
  p.fill(255, 240, 240);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(200, 0, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("TIME'S UP!", CANVAS_WIDTH / 2, 120);
  
  p.fill(50);
  p.textSize(18);
  p.text(`Level ${gameState.currentLevel + 1} - ${LEVELS[gameState.currentLevel].name}`, CANVAS_WIDTH / 2, 170);
  
  p.textSize(16);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  
  p.fill(0, 100, 200);
  p.textSize(16);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 280);
}

function renderWinScreen(p) {
  p.fill(255, 250, 220);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(200, 150, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("CONGRATULATIONS!", CANVAS_WIDTH / 2, 100);
  
  p.fill(50);
  p.textSize(18);
  p.text("You've completed all levels!", CANVAS_WIDTH / 2, 150);
  
  p.textSize(24);
  p.fill(0, 100, 200);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 200);
  
  if (gameState.score === gameState.highScore && gameState.score > 0) {
    p.fill(255, 150, 0);
    p.textSize(16);
    p.text("NEW HIGH SCORE!", CANVAS_WIDTH / 2, 240);
  } else if (gameState.highScore > 0) {
    p.fill(100);
    p.textSize(14);
    p.text(`High Score: ${gameState.highScore}`, CANVAS_WIDTH / 2, 240);
  }
  
  p.fill(0, 100, 200);
  p.textSize(16);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 300);
}