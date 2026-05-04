// renderer.js - Rendering functions

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { LEVEL_DATA } from './levels.js';
import { Tree } from './entities.js';

let tree = null;

export function initializeRenderer() {
  tree = new Tree(300, 250);
}

export function renderGame(p) {
  p.background(20, 15, 30);
  
  switch (gameState.gamePhase) {
    case GAME_PHASES.START:
      renderStartScreen(p);
      break;
    case GAME_PHASES.PLAYING:
      renderGameplay(p);
      break;
    case GAME_PHASES.PAUSED:
      renderGameplay(p);
      renderPauseOverlay(p);
      break;
    case GAME_PHASES.GAME_OVER_WIN:
      renderGameOverScreen(p, true);
      break;
    case GAME_PHASES.GAME_OVER_LOSE:
      renderGameOverScreen(p, false);
      break;
  }
}

function renderStartScreen(p) {
  p.push();
  
  // Background
  p.fill(30, 20, 40);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Decorative tree silhouette
  p.fill(50, 40, 60, 150);
  p.noStroke();
  p.ellipse(300, 180, 200, 250);
  p.rect(280, 180, 40, 120);
  
  // Title
  p.fill(220, 200, 150);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("VANDERBOOM LEGACY", CANVAS_WIDTH/2, 80);
  
  // Subtitle
  p.textSize(16);
  p.fill(180, 160, 120);
  p.text("Unravel the Family Mysteries", CANVAS_WIDTH/2, 120);
  
  // Instructions
  p.textSize(14);
  p.fill(200, 180, 140);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    "Explore scenes and solve puzzles to unlock",
    "the secrets of the Vanderboom family tree.",
    "",
    "Arrow Keys: Navigate between objects",
    "Space: Interact with selected object",
    "Z: Cycle through inventory items",
    "Shift: Examine selected item",
    "",
    "Complete all 5 generations to win!"
  ];
  
  let y = 180;
  instructions.forEach(line => {
    p.text(line, 80, y);
    y += 20;
  });
  
  // Start prompt
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  p.fill(255, 220, 100);
  const pulse = Math.sin(p.frameCount * 0.1) * 20 + 235;
  p.fill(pulse, 200, 100);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, 370);
  
  p.pop();
}

function renderGameplay(p) {
  p.push();
  
  // Game background
  renderGameBackground(p);
  
  // Render tree (background element)
  if (tree) {
    tree.render(p, gameState.currentLevel);
  }
  
  // Render hotspots
  gameState.currentHotspots.forEach((hotspot, index) => {
    const isSelected = index === gameState.selectedHotspotIndex;
    hotspot.render(p, isSelected);
  });
  
  // Render player character
  if (gameState.player) {
    gameState.player.render(p);
  }
  
  // Render UI
  renderUI(p);
  
  p.pop();
}

function renderGameBackground(p) {
  // Sky gradient
  for (let y = 0; y < CANVAS_HEIGHT; y++) {
    const inter = p.map(y, 0, CANVAS_HEIGHT, 0, 1);
    const c = p.lerpColor(p.color(40, 30, 60), p.color(80, 60, 100), inter);
    p.stroke(c);
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Ground
  p.fill(60, 50, 40);
  p.noStroke();
  p.rect(0, 320, CANVAS_WIDTH, 80);
  
  // Ground details
  p.fill(70, 60, 50);
  for (let i = 0; i < 20; i++) {
    const x = (i * 30 + p.frameCount * 0.1) % CANVAS_WIDTH;
    p.ellipse(x, 340, 40, 10);
  }
}

function renderUI(p) {
  // Top bar
  p.fill(20, 15, 30, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 50);
  
  // Level info
  const levelData = LEVEL_DATA[gameState.currentLevel];
  if (levelData) {
    p.fill(220, 200, 150);
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(14);
    p.text(`${levelData.name} (${levelData.year})`, 10, 15);
    p.textSize(11);
    p.fill(180, 160, 120);
    p.text(levelData.character, 10, 35);
  }
  
  // Score
  p.fill(220, 200, 150);
  p.textAlign(p.RIGHT, p.CENTER);
  p.textSize(14);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 15);
  p.text(`Secrets: ${gameState.secretsFound}`, CANVAS_WIDTH - 10, 35);
  
  // Progress
  p.fill(200, 180, 140);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(12);
  p.text(`Level ${gameState.completedLevels + 1}/${gameState.totalLevels}`, CANVAS_WIDTH/2, 25);
  
  // Inventory display
  renderInventory(p);
  
  // Family tree progress (bottom)
  renderFamilyTree(p);
}

function renderInventory(p) {
  if (gameState.inventory.length === 0) return;
  
  p.push();
  
  const startX = 10;
  const startY = 60;
  const slotSize = 45;
  
  gameState.inventory.forEach((item, index) => {
    const x = startX + index * (slotSize + 5);
    const y = startY;
    
    // Slot background
    const isSelected = index === gameState.selectedInventoryIndex;
    p.fill(isSelected ? 100 : 60, isSelected ? 80 : 50, isSelected ? 40 : 30, 200);
    p.stroke(isSelected ? 255 : 150, isSelected ? 220 : 130, isSelected ? 100 : 80);
    p.strokeWeight(isSelected ? 3 : 2);
    p.rect(x, y, slotSize, slotSize, 5);
    
    // Item name
    p.fill(255, 240, 200);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(9);
    p.text(item.substring(0, 8), x + slotSize/2, y + slotSize/2);
  });
  
  p.pop();
}

function renderFamilyTree(p) {
  if (gameState.familyTreeUnlocked.length === 0) return;
  
  p.push();
  
  const startX = 150;
  const startY = CANVAS_HEIGHT - 30;
  const spacing = 50;
  
  p.fill(220, 200, 150);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(11);
  p.text("Family Tree:", 10, startY);
  
  gameState.familyTreeUnlocked.forEach((character, index) => {
    const x = startX + index * spacing;
    
    // Portrait
    p.fill(100, 80, 60);
    p.stroke(150, 130, 100);
    p.strokeWeight(2);
    p.rect(x, startY - 10, 40, 20, 3);
    
    // Initial
    p.fill(220, 200, 150);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text(character.charAt(0), x + 20, startY);
  });
  
  p.pop();
}

function renderPauseOverlay(p) {
  p.push();
  
  // Semi-transparent overlay
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Pause text
  p.fill(255, 255, 255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  
  p.pop();
}

function renderGameOverScreen(p, isWin) {
  p.push();
  
  // Background
  p.fill(20, 15, 30);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Results
  p.fill(220, 200, 150);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(42);
  p.text(isWin ? "LEGACY COMPLETE" : "GAME OVER", CANVAS_WIDTH/2, 100);
  
  if (isWin) {
    p.textSize(18);
    p.fill(180, 160, 120);
    p.text("You have unraveled the Vanderboom mysteries", CANVAS_WIDTH/2, 160);
  }
  
  // Stats
  p.textSize(16);
  p.fill(200, 180, 140);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, 220);
  p.text(`Levels Completed: ${gameState.completedLevels}/${gameState.totalLevels}`, CANVAS_WIDTH/2, 250);
  p.text(`Secrets Found: ${gameState.secretsFound}`, CANVAS_WIDTH/2, 280);
  
  // Family tree visualization
  if (gameState.familyTreeUnlocked.length > 0) {
    p.textSize(14);
    p.fill(180, 160, 120);
    p.text("Family Tree Unlocked:", CANVAS_WIDTH/2, 320);
    
    gameState.familyTreeUnlocked.forEach((character, index) => {
      p.textSize(12);
      p.fill(220, 200, 150);
      p.text(character, CANVAS_WIDTH/2, 345 + index * 18);
    });
  }
  
  // Restart prompt
  p.textSize(18);
  p.fill(255, 220, 100);
  const pulse = Math.sin(p.frameCount * 0.1) * 20 + 235;
  p.fill(pulse, 200, 100);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH/2, CANVAS_HEIGHT - 40);
  
  p.pop();
}