// ui.js - User interface rendering

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES } from './globals.js';

export function renderUI(p) {
  // Score and info bar
  p.push();
  p.fill(0, 0, 0, 180);
  p.rect(0, 0, CANVAS_WIDTH, 30);
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.LEFT, p.CENTER);
  p.text(`Score: ${gameState.score}`, 10, 15);
  p.text(`Scene: ${gameState.currentScene}`, 150, 15);
  p.textAlign(p.RIGHT, p.CENTER);
  p.text(`Items: ${gameState.inventory.length}`, CANVAS_WIDTH - 10, 15);
  p.pop();
  
  // Dialogue box
  if (gameState.dialogueActive) {
    renderDialogue(p);
  }
  
  // Inventory UI
  if (gameState.inventoryOpen) {
    renderInventory(p);
  }
  
  // Paused indicator
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.push();
    p.fill(255);
    p.textSize(16);
    p.textAlign(p.RIGHT, p.TOP);
    p.text("PAUSED", CANVAS_WIDTH - 10, 35);
    p.pop();
  }
  
  // Scene transition effect
  if (gameState.transitioning) {
    const alpha = (1 - gameState.transitionTimer / 30) * 255;
    p.push();
    p.fill(0, 0, 0, alpha);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.pop();
  }
}

export function renderDialogue(p) {
  p.push();
  p.fill(0, 0, 0, 200);
  p.rect(20, CANVAS_HEIGHT - 100, CANVAS_WIDTH - 40, 80);
  p.stroke(200, 180, 100);
  p.strokeWeight(2);
  p.noFill();
  p.rect(20, CANVAS_HEIGHT - 100, CANVAS_WIDTH - 40, 80);
  
  p.fill(255);
  p.noStroke();
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  p.text(gameState.dialogueText, 35, CANVAS_HEIGHT - 90, CANVAS_WIDTH - 70);
  p.pop();
}

export function renderInventory(p) {
  const invWidth = 400;
  const invHeight = 250;
  const invX = (CANVAS_WIDTH - invWidth) / 2;
  const invY = (CANVAS_HEIGHT - invHeight) / 2;
  
  p.push();
  
  // Background
  p.fill(40, 40, 50, 240);
  p.rect(invX, invY, invWidth, invHeight);
  p.stroke(200, 180, 100);
  p.strokeWeight(3);
  p.noFill();
  p.rect(invX, invY, invWidth, invHeight);
  
  // Title
  p.fill(255);
  p.noStroke();
  p.textSize(18);
  p.textAlign(p.CENTER, p.TOP);
  p.text("INVENTORY", invX + invWidth / 2, invY + 10);
  
  // Instructions
  p.textSize(12);
  p.text("Arrow Keys: Select | SPACE: Use | SHIFT: Examine | Z: Close", invX + invWidth / 2, invY + 35);
  
  // Item grid
  const itemSize = 60;
  const itemsPerRow = 5;
  const startX = invX + 30;
  const startY = invY + 70;
  
  for (let i = 0; i < gameState.inventory.length; i++) {
    const item = gameState.inventory[i];
    const col = i % itemsPerRow;
    const row = Math.floor(i / itemsPerRow);
    const x = startX + col * (itemSize + 15);
    const y = startY + row * (itemSize + 15);
    
    const selected = i === gameState.selectedInventoryIndex;
    item.render(p, x, y, itemSize, selected);
    
    // Item name
    if (selected) {
      p.fill(255, 255, 100);
      p.textSize(11);
      p.textAlign(p.CENTER, p.TOP);
      p.text(item.name, x + itemSize / 2, y + itemSize + 5);
    }
  }
  
  // Selected item description
  if (gameState.selectedInventoryIndex >= 0 && gameState.selectedInventoryIndex < gameState.inventory.length) {
    const selectedItem = gameState.inventory[gameState.selectedInventoryIndex];
    p.fill(255);
    p.textSize(11);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.text(selectedItem.description, invX + invWidth / 2, invY + invHeight - 15, invWidth - 40);
  }
  
  p.pop();
}

export function renderStartScreen(p) {
  p.push();
  
  // Background gradient
  for (let i = 0; i < CANVAS_HEIGHT; i++) {
    const inter = i / CANVAS_HEIGHT;
    const col = p.lerpColor(p.color(20, 30, 60), p.color(80, 60, 100), inter);
    p.stroke(col);
    p.line(0, i, CANVAS_WIDTH, i);
  }
  
  // Title
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("BROKEN SWORD", CANVAS_WIDTH / 2, 70);
  p.textSize(24);
  p.text("Reforged", CANVAS_WIDTH / 2, 105);
  
  // Decorative elements
  p.noFill();
  p.stroke(255, 220, 100);
  p.strokeWeight(2);
  p.line(150, 130, 450, 130);
  
  // Description
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.CENTER, p.TOP);
  const desc = "Guide George Stobbart through a mysterious investigation.\nExplore scenes, collect items, and solve clever puzzles.\nCombine items and interact with the environment to uncover the truth!";
  p.text(desc, CANVAS_WIDTH / 2, 160);
  
  // Instructions
  p.fill(200, 220, 255);
  p.textSize(13);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    "Arrow Keys - Move George left/right or navigate scenes",
    "Space - Interact with highlighted objects/NPCs",
    "Z - Open/close inventory menu",
    "Shift - Examine selected inventory item",
    "ESC - Pause game | R - Restart"
  ];
  
  let yPos = 240;
  for (const inst of instructions) {
    p.text("• " + inst, 80, yPos);
    yPos += 22;
  }
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textSize(18);
  p.textAlign(p.CENTER, p.CENTER);
  const flash = Math.sin(p.frameCount * 0.1) * 0.5 + 0.5;
  p.fill(255, 255, 100, 150 + flash * 105);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
  
  p.pop();
}

export function renderGameOverScreen(p) {
  p.push();
  
  // Background
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Result
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "MYSTERY SOLVED!" : "GAME OVER", CANVAS_WIDTH / 2, 100);
  
  // Score
  p.fill(255);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 160);
  
  // Achievements
  if (gameState.achievements.length > 0) {
    p.textSize(18);
    p.text("Achievements:", CANVAS_WIDTH / 2, 210);
    p.textSize(14);
    let yPos = 240;
    for (const achievement of gameState.achievements) {
      p.text("★ " + achievement, CANVAS_WIDTH / 2, yPos);
      yPos += 25;
    }
  }
  
  // Restart prompt
  p.fill(255, 255, 100);
  p.textSize(18);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  
  p.pop();
}