import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, ACTION_TYPES } from './globals.js';

export function renderUI(p, scenes) {
  // Top bar with scene name
  p.fill(20, 20, 30);
  p.rect(0, 0, CANVAS_WIDTH, 50);
  p.fill(255);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(20);
  const currentScene = scenes[gameState.currentScene];
  p.text(currentScene.name, 10, 25);
  
  // Score
  p.textAlign(p.RIGHT, p.CENTER);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 25);

  // Bottom bar for current action
  p.fill(20, 20, 30);
  p.rect(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 50);
  p.fill(255, 200, 100);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(16);
  p.text(`Action: ${gameState.currentAction}`, 10, CANVAS_HEIGHT - 25);
  
  // Navigation hints
  p.textAlign(p.RIGHT, p.CENTER);
  p.textSize(12);
  let hints = [];
  currentScene.connections.forEach(conn => {
    hints.push(`${conn.direction.toUpperCase()}`);
  });
  if (hints.length > 0) {
    p.text(`Go: ${hints.join(", ")}`, CANVAS_WIDTH - 10, CANVAS_HEIGHT - 25);
  }

  // Inventory panel
  if (gameState.showInventory) {
    renderInventory(p);
  }

  // Action menu
  if (gameState.actionMenuVisible) {
    renderActionMenu(p);
  }

  // Dialogue
  if (gameState.dialogueActive) {
    renderDialogue(p);
  }

  // Message display
  if (gameState.messageText && gameState.messageTimer > 0) {
    renderMessage(p);
  }
}

function renderInventory(p) {
  const panelX = 100;
  const panelY = 80;
  const panelW = 400;
  const panelH = 240;

  p.push();
  p.fill(40, 40, 60, 240);
  p.stroke(200, 200, 255);
  p.strokeWeight(2);
  p.rect(panelX, panelY, panelW, panelH);
  
  p.fill(255);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  p.text("INVENTORY", panelX + panelW / 2, panelY + 20);
  
  // Items
  const itemSize = 50;
  const cols = 5;
  gameState.inventory.forEach((item, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const x = panelX + 40 + col * 70;
    const y = panelY + 60 + row * 70;
    
    // Background
    const isSelected = gameState.selectedItem === item;
    p.fill(...(isSelected ? [100, 150, 200] : [60, 60, 80]));
    p.rect(x - itemSize / 2, y - itemSize / 2, itemSize, itemSize);
    
    // Item icon
    item.renderIcon(p, x, y, itemSize * 0.6);
    
    // Name
    p.fill(255);
    p.textSize(10);
    p.text(item.name, x, y + itemSize / 2 + 10);
  });
  
  p.textSize(14);
  p.text("Use Arrow Keys to select, Z to choose, Space to close", panelX + panelW / 2, panelY + panelH - 15);
  p.pop();
}

function renderActionMenu(p) {
  const menuX = gameState.actionMenuX;
  const menuY = gameState.actionMenuY;
  const menuW = 120;
  const menuH = gameState.actionMenuOptions.length * 30 + 10;

  p.push();
  p.fill(30, 30, 50, 230);
  p.stroke(200, 200, 255);
  p.strokeWeight(2);
  p.rect(menuX, menuY, menuW, menuH);
  
  gameState.actionMenuOptions.forEach((action, i) => {
    const isHighlighted = i === gameState.selectedActionIndex;
    p.fill(...(isHighlighted ? [255, 200, 100] : [200, 200, 200]));
    p.noStroke();
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(14);
    p.text(action, menuX + 10, menuY + 20 + i * 30);
  });
  p.pop();
}

function renderDialogue(p) {
  const panelX = 50;
  const panelY = 250;
  const panelW = 500;
  const panelH = 120;

  p.push();
  p.fill(20, 20, 40, 240);
  p.stroke(200, 200, 255);
  p.strokeWeight(2);
  p.rect(panelX, panelY, panelW, panelH);
  
  p.fill(255);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  
  gameState.dialogueOptions.forEach((option, i) => {
    const isSelected = i === gameState.selectedDialogueIndex;
    p.fill(...(isSelected ? [255, 200, 100] : [200, 200, 200]));
    p.text(`${i + 1}. ${option.text}`, panelX + 20, panelY + 20 + i * 30);
  });
  
  p.fill(150, 150, 200);
  p.textSize(12);
  p.text("Use Arrow Keys to select, Z to choose", panelX + 20, panelY + panelH - 20);
  p.pop();
}

function renderMessage(p) {
  const panelX = 100;
  const panelY = 150;
  const panelW = 400;
  const panelH = 100;

  p.push();
  p.fill(30, 30, 50, 230);
  p.stroke(200, 200, 255);
  p.strokeWeight(2);
  p.rect(panelX, panelY, panelW, panelH);
  
  p.fill(255);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  
  // Word wrap
  const words = gameState.messageText.split(' ');
  let lines = [];
  let currentLine = '';
  words.forEach(word => {
    const testLine = currentLine + word + ' ';
    if (p.textWidth(testLine) > panelW - 40) {
      lines.push(currentLine);
      currentLine = word + ' ';
    } else {
      currentLine = testLine;
    }
  });
  lines.push(currentLine);
  
  lines.forEach((line, i) => {
    p.text(line, panelX + panelW / 2, panelY + panelH / 2 - 20 + i * 20);
  });
  p.pop();
}

export function renderStartScreen(p) {
  p.background(20, 20, 40);
  
  // Title
  p.fill(255, 200, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("THROTTLE QUEST", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(200, 200, 255);
  p.textSize(18);
  p.text("A Point-and-Click Adventure", CANVAS_WIDTH / 2, 120);
  
  // Instructions
  p.fill(200, 200, 200);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    "You are Ben Throttle, framed for a crime you didn't commit.",
    "Navigate scenes, interact with objects, and solve puzzles.",
    "",
    "CONTROLS:",
    "Arrow Keys - Navigate scenes & select options",
    "Z - Interact with objects",
    "Shift - Cycle through actions (Look, Talk, Use, Take)",
    "Space - Open/Close inventory",
    "",
    "GOAL:",
    "Find evidence, confront the gang leader, clear your name!",
  ];
  
  let y = 160;
  instructions.forEach(line => {
    p.text(line, 80, y);
    y += 20;
  });
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}

export function renderPauseScreen(p) {
  p.push();
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  p.pop();
}

export function renderGameOverScreen(p, won) {
  p.background(20, 20, 40);
  
  p.fill(...(won ? [100, 255, 100] : [255, 100, 100]));
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(won ? "CASE CLOSED!" : "GAME OVER", CANVAS_WIDTH / 2, 120);
  
  if (won) {
    p.fill(200, 200, 255);
    p.textSize(18);
    p.text("You exposed the conspiracy and cleared your name!", CANVAS_WIDTH / 2, 180);
    p.text("The truth always comes to light.", CANVAS_WIDTH / 2, 210);
  } else {
    p.fill(200, 200, 200);
    p.textSize(18);
    p.text("The trail went cold...", CANVAS_WIDTH / 2, 180);
  }
  
  p.fill(255, 255, 100);
  p.textSize(16);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 260);
  p.text(`Puzzles Solved: ${gameState.puzzlesSolved}/${gameState.totalPuzzles}`, CANVAS_WIDTH / 2, 290);
  
  p.fill(255);
  p.textSize(20);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}