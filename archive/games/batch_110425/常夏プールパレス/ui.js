// ui.js - UI rendering

import { gameState, FACILITY_TYPES, CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE } from './globals.js';

export function renderStartScreen(p) {
  p.background(50, 150, 200);
  
  // Title
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("常夏プールパレス", CANVAS_WIDTH / 2, 60);
  
  p.textSize(18);
  p.fill(255);
  p.text("Tropical Pool Resort", CANVAS_WIDTH / 2, 95);
  
  // Description
  p.textSize(12);
  p.fill(255, 255, 200);
  const desc = [
    "Build and manage your tropical pool resort!",
    "Place facilities to attract customers and earn money.",
    "Keep satisfaction high and reach 1000 SNS Buzz to win!",
    "",
    "CONTROLS:",
    "Arrow Keys: Navigate menu/select tiles",
    "Space: Place facility / Confirm",
    "Z: Cancel / Go back",
    "Shift: Upgrade facility (hover over placed)",
    "ESC: Pause    R: Restart"
  ];
  
  desc.forEach((line, i) => {
    p.text(line, CANVAS_WIDTH / 2, 140 + i * 18);
  });
  
  // Start prompt
  p.textSize(20);
  p.fill(255, 255, 100);
  const flash = Math.sin(p.frameCount * 0.1) > 0;
  if (flash) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
  }
}

export function renderGameOverScreen(p) {
  p.background(0, 0, 0, 180);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  
  if (gameState.gameOverReason === "WIN") {
    p.fill(100, 255, 100);
    p.text("RESORT COMPLETE!", CANVAS_WIDTH / 2, 140);
    p.textSize(18);
    p.fill(255, 255, 100);
    p.text("You reached 1000 SNS Buzz!", CANVAS_WIDTH / 2, 180);
  } else {
    p.fill(255, 100, 100);
    p.text("RESORT CLOSED", CANVAS_WIDTH / 2, 140);
    p.textSize(18);
    p.fill(255);
    p.text("Satisfaction dropped too low...", CANVAS_WIDTH / 2, 180);
  }
  
  p.textSize(14);
  p.fill(255);
  p.text(`Final Money: $${gameState.money}`, CANVAS_WIDTH / 2, 220);
  p.text(`SNS Buzz: ${gameState.snsBuzz}`, CANVAS_WIDTH / 2, 245);
  p.text(`Research: ${gameState.researchPoints}`, CANVAS_WIDTH / 2, 270);
  
  p.textSize(18);
  p.fill(255, 255, 100);
  const flash = Math.sin(p.frameCount * 0.1) > 0;
  if (flash) {
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 330);
  }
}

export function renderMenu(p) {
  const menuWidth = 150;
  p.fill(40, 40, 60, 230);
  p.stroke(200);
  p.strokeWeight(2);
  p.rect(CANVAS_WIDTH - menuWidth, 0, menuWidth, CANVAS_HEIGHT);
  
  p.fill(255, 255, 100);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text("BUILD MENU", CANVAS_WIDTH - menuWidth + 10, 10);
  
  let yPos = 40;
  Object.keys(FACILITY_TYPES).forEach(type => {
    const config = FACILITY_TYPES[type];
    const unlocked = gameState.unlockedFacilities.includes(type);
    
    if (!unlocked) {
      p.fill(100);
    } else if (gameState.selectedFacilityType === type) {
      p.fill(100, 200, 255);
    } else {
      p.fill(200);
    }
    
    p.textSize(11);
    p.text(config.name, CANVAS_WIDTH - menuWidth + 10, yPos);
    p.text(`$${config.cost}`, CANVAS_WIDTH - menuWidth + 10, yPos + 15);
    
    if (!unlocked) {
      p.fill(255, 100, 100);
      p.textSize(9);
      p.text("LOCKED", CANVAS_WIDTH - menuWidth + 10, yPos + 30);
    }
    
    yPos += 50;
  });
}

export function renderHUD(p) {
  // Top bar
  p.fill(40, 40, 60, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 30);
  
  p.fill(255, 255, 100);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(12);
  p.text(`Money: $${gameState.money}`, 10, 15);
  p.text(`Satisfaction: ${Math.floor(gameState.satisfaction)}%`, 120, 15);
  p.text(`SNS Buzz: ${gameState.snsBuzz}`, 270, 15);
  p.text(`Research: ${gameState.researchPoints}`, 390, 15);
  
  // Paused indicator
  if (gameState.paused) {
    p.fill(255, 100, 100);
    p.textAlign(p.RIGHT, p.CENTER);
    p.text("PAUSED", CANVAS_WIDTH - 160, 15);
  }
}

export function renderGrid(p) {
  p.stroke(100, 150, 200, 100);
  p.strokeWeight(1);
  for (let i = 0; i <= 12; i++) {
    p.line(i * GRID_SIZE, 0, i * GRID_SIZE, CANVAS_HEIGHT);
  }
  for (let i = 0; i <= 8; i++) {
    p.line(0, i * GRID_SIZE, CANVAS_WIDTH - 150, i * GRID_SIZE);
  }
}

export function renderCursor(p) {
  if (gameState.menuOpen && gameState.selectedFacilityType) {
    const config = FACILITY_TYPES[gameState.selectedFacilityType];
    const unlocked = gameState.unlockedFacilities.includes(gameState.selectedFacilityType);
    const canAfford = gameState.money >= config.cost;
    
    const x = gameState.cursorX * GRID_SIZE;
    const y = gameState.cursorY * GRID_SIZE;
    
    if (unlocked && canAfford) {
      p.fill(...config.color, 150);
    } else {
      p.fill(255, 100, 100, 150);
    }
    p.stroke(255);
    p.strokeWeight(2);
    p.rect(x + 2, y + 2, GRID_SIZE - 4, GRID_SIZE - 4, 5);
  }
}