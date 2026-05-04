// ui.js - User interface rendering

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderUI(p) {
  // Top bar with chapter and location
  p.push();
  p.fill(20, 20, 30);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 60);
  
  p.fill(255, 220, 100);
  p.textSize(18);
  p.textAlign(p.LEFT, p.CENTER);
  p.text(`Chapter ${gameState.currentChapter}`, 20, 20);
  
  p.textSize(14);
  p.fill(200, 200, 220);
  const locationName = getCurrentLocationName();
  p.text(locationName, 20, 40);
  
  // Clue count
  p.textAlign(p.RIGHT, p.CENTER);
  p.text(`Clues: ${gameState.inventory.length}`, CANVAS_WIDTH - 20, 20);
  p.text(`Deductions: ${gameState.deductions.length}`, CANVAS_WIDTH - 20, 40);
  
  p.pop();
  
  // Bottom control hint
  p.push();
  p.fill(20, 20, 30, 200);
  p.noStroke();
  p.rect(0, CANVAS_HEIGHT - 40, CANVAS_WIDTH, 40);
  
  p.fill(180, 180, 200);
  p.textSize(12);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("ARROWS: Navigate | SPACE: Interact | Z: Inventory/Deductions | SHIFT: Skip Text", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20);
  
  p.pop();
  
  // Paused indicator
  if (gameState.gamePhase === "PAUSED") {
    p.push();
    p.fill(255, 200, 0);
    p.textSize(16);
    p.textAlign(p.RIGHT, p.TOP);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
    p.pop();
  }
}

function getCurrentLocationName() {
  const locationMap = {
    "TOWN_SQUARE": "Town Square",
    "MANOR": "Redhorn Manor",
    "MARKET": "Market District",
    "CHURCH": "Old Church",
    "DOCKS": "Harbor Docks"
  };
  return locationMap[gameState.currentLocation] || "Unknown";
}

export function renderDialogue(p, dialogue) {
  if (!dialogue) return;
  
  p.push();
  
  // Dialogue box
  p.fill(20, 20, 30, 230);
  p.stroke(255, 220, 100);
  p.strokeWeight(3);
  p.rect(50, CANVAS_HEIGHT - 150, CANVAS_WIDTH - 100, 100);
  
  // Speaker name
  p.fill(255, 220, 100);
  p.noStroke();
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  p.text(dialogue.speaker, 70, CANVAS_HEIGHT - 140);
  
  // Dialogue text
  p.fill(255);
  p.textSize(12);
  const lines = wrapText(p, dialogue.text, CANVAS_WIDTH - 140);
  let yOffset = CANVAS_HEIGHT - 115;
  for (let line of lines) {
    p.text(line, 70, yOffset);
    yOffset += 16;
  }
  
  // Continue indicator
  p.fill(255, 220, 100);
  p.textSize(10);
  p.textAlign(p.RIGHT, p.BOTTOM);
  p.text("SPACE to continue", CANVAS_WIDTH - 70, CANVAS_HEIGHT - 60);
  
  p.pop();
}

export function renderInventory(p) {
  p.push();
  
  // Inventory panel
  p.fill(20, 20, 40, 240);
  p.stroke(100, 150, 200);
  p.strokeWeight(3);
  p.rect(100, 80, 400, 280);
  
  // Title
  p.fill(100, 150, 200);
  p.noStroke();
  p.textSize(18);
  p.textAlign(p.CENTER, p.TOP);
  p.text("CLUES & DEDUCTIONS", 300, 95);
  
  // Tab selection
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  p.fill(gameState.menuSelection === 0 ? 255 : 150);
  p.text("Clues", 120, 120);
  p.fill(gameState.menuSelection === 1 ? 255 : 150);
  p.text("Deductions", 220, 120);
  
  // Content area
  if (gameState.menuSelection === 0) {
    renderCluesList(p);
  } else {
    renderDeductionsList(p);
  }
  
  // Controls
  p.fill(180);
  p.textSize(11);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.text("ARROWS: Navigate | SPACE: Select | Z: Close", 300, 345);
  
  p.pop();
}

function renderCluesList(p) {
  p.fill(200);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  
  if (gameState.inventory.length === 0) {
    p.text("No clues collected yet.", 120, 150);
    return;
  }
  
  let yOffset = 150;
  for (let i = 0; i < gameState.inventory.length; i++) {
    const clue = gameState.inventory[i];
    p.fill(255, 220, 100);
    p.text(`• ${clue.name}`, 120, yOffset);
    p.fill(200);
    const descLines = wrapText(p, clue.description, 350);
    yOffset += 18;
    for (let line of descLines) {
      p.text(line, 135, yOffset);
      yOffset += 14;
    }
    yOffset += 8;
  }
}

function renderDeductionsList(p) {
  p.fill(200);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  
  if (gameState.deductions.length === 0) {
    p.text("No deductions made yet.", 120, 150);
    p.fill(180);
    p.text("Collect clues to unlock deductions.", 120, 170);
    return;
  }
  
  let yOffset = 150;
  for (let deduction of gameState.deductions) {
    p.fill(100, 255, 100);
    p.text(`✓ ${deduction.name}`, 120, yOffset);
    yOffset += 20;
  }
}

function wrapText(p, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  
  for (let word of words) {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const testWidth = p.textWidth(testLine);
    
    if (testWidth > maxWidth && currentLine !== '') {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

export function renderStartScreen(p) {
  p.push();
  p.background(20, 20, 30);
  
  // Title
  p.fill(255, 220, 100);
  p.textSize(32);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("レッドホーン家の探偵", CANVAS_WIDTH / 2, 80);
  
  p.textSize(24);
  p.fill(200, 180, 150);
  p.text("REDHORN FAMILY DETECTIVE", CANVAS_WIDTH / 2, 115);
  
  // Story intro
  p.fill(200);
  p.textSize(13);
  const storyLines = [
    "A murder has shocked the town of Ashford.",
    "Lord Redhorn, patriarch of the wealthy Redhorn family,",
    "has been found dead in his manor.",
    "",
    "As Detective Edward, you must investigate the crime scene,",
    "interview suspects, collect clues, and piece together",
    "the truth to solve this dark mystery."
  ];
  
  let yOffset = 160;
  for (let line of storyLines) {
    p.text(line, CANVAS_WIDTH / 2, yOffset);
    yOffset += 20;
  }
  
  // Controls
  p.fill(150, 180, 200);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  yOffset += 10;
  const controls = [
    "ARROW KEYS - Navigate locations and menus",
    "SPACE - Interact with objects and people",
    "Z - Open inventory and make deductions",
    "SHIFT - Skip dialogue text",
    "ESC - Pause game"
  ];
  
  for (let control of controls) {
    p.text(control, 100, yOffset);
    yOffset += 22;
  }
  
  // Start prompt
  p.fill(255, 220, 100);
  p.textSize(18);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  
  p.pop();
}

export function renderGameOver(p, won) {
  p.push();
  p.background(20, 20, 30);
  
  if (won) {
    p.fill(100, 255, 100);
    p.textSize(36);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("CASE SOLVED!", CANVAS_WIDTH / 2, 100);
    
    p.fill(200);
    p.textSize(14);
    const winLines = [
      "Through careful investigation and logical deduction,",
      "you have uncovered the truth behind the murder.",
      "",
      "The killer was Lord Redhorn's nephew, driven by greed",
      "and the promise of inheritance. The family secrets",
      "have been exposed, and justice will be served.",
      "",
      "The town of Ashford can rest easy once more."
    ];
    
    let yOffset = 160;
    for (let line of winLines) {
      p.text(line, CANVAS_WIDTH / 2, yOffset);
      yOffset += 22;
    }
  } else {
    p.fill(255, 100, 100);
    p.textSize(36);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("CASE UNSOLVED", CANVAS_WIDTH / 2, 100);
    
    p.fill(200);
    p.textSize(14);
    p.text("The mystery remains unsolved.", CANVAS_WIDTH / 2, 180);
    p.text("Try again to uncover the truth.", CANVAS_WIDTH / 2, 210);
  }
  
  p.fill(255, 220, 100);
  p.textSize(18);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  
  p.pop();
}