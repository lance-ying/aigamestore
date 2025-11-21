// renderer.js - Rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, TILE_SIZE, GRID_SIZE, FACILITY_TYPES } from './globals.js';
import { getFacilityTypesList } from './facility.js';

export function renderGame(p) {
  p.background(40, 45, 50);
  
  switch (gameState.gamePhase) {
    case PHASE_START:
      renderStartScreen(p);
      break;
    case PHASE_PLAYING:
      renderPlayingScreen(p);
      break;
    case PHASE_PAUSED:
      renderPlayingScreen(p);
      renderPauseOverlay(p);
      break;
    case PHASE_GAME_OVER_WIN:
    case PHASE_GAME_OVER_LOSE:
      renderGameOverScreen(p);
      break;
  }
}

function renderStartScreen(p) {
  p.push();
  
  // Title
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.text("POCKET ACADEMY 3", CANVAS_WIDTH / 2, 80);
  
  // Description
  p.fill(200, 200, 220);
  p.textSize(14);
  p.text("Build and manage your dream high school!", CANVAS_WIDTH / 2, 130);
  
  // Instructions box
  p.fill(60, 65, 70);
  p.rect(50, 160, CANVAS_WIDTH - 100, 160);
  
  p.fill(255, 255, 255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  
  const instructions = [
    "OBJECTIVE:",
    "• Build facilities to increase school reputation",
    "• Place compatible facilities together for bonuses",
    "• Reach 1000 reputation to win!",
    "",
    "CONTROLS:",
    "Arrow Keys: Move cursor | Space: Place/Select",
    "Shift: Open build menu | Z: Cancel"
  ];
  
  let yPos = 170;
  for (const line of instructions) {
    p.text(line, 60, yPos);
    yPos += 18;
  }
  
  // Start prompt
  p.fill(100, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(16);
  const flash = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(100 * flash, 255 * flash, 100 * flash);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 350);
  
  p.pop();
}

function renderPlayingScreen(p) {
  // Render grid
  renderGrid(p);
  
  // Render facilities
  renderFacilities(p);
  
  // Render cursor
  renderCursor(p);
  
  // Render UI
  renderUI(p);
  
  // Render build menu if open
  if (gameState.buildMenuOpen) {
    renderBuildMenu(p);
  }
}

function renderGrid(p) {
  const offsetX = 50;
  const offsetY = 50;
  
  p.push();
  
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const screenX = offsetX + x * TILE_SIZE;
      const screenY = offsetY + y * TILE_SIZE;
      
      // Grid cell
      p.fill(50, 55, 60);
      p.stroke(70, 75, 80);
      p.strokeWeight(1);
      p.rect(screenX, screenY, TILE_SIZE, TILE_SIZE);
      
      // Grid coordinates (subtle)
      if (x === 0 || y === 0) {
        p.fill(80, 85, 90);
        p.noStroke();
        p.textSize(8);
        p.textAlign(p.CENTER, p.CENTER);
        if (x === 0) {
          p.text(y, offsetX - 15, screenY + TILE_SIZE / 2);
        }
        if (y === 0) {
          p.text(x, screenX + TILE_SIZE / 2, offsetY - 15);
        }
      }
    }
  }
  
  p.pop();
}

function renderFacilities(p) {
  const offsetX = 50;
  const offsetY = 50;
  
  p.push();
  
  for (const entity of gameState.entities) {
    const screenX = offsetX + entity.x * TILE_SIZE;
    const screenY = offsetY + entity.y * TILE_SIZE;
    
    // Facility background
    p.fill(...entity.info.color);
    p.stroke(255, 255, 255);
    p.strokeWeight(2);
    p.rect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4, 4);
    
    // Facility symbol
    p.fill(255, 255, 255);
    p.noStroke();
    p.textSize(20);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(entity.info.symbol, screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
    
    // Popularity indicator (small)
    if (entity.popularity > 0) {
      p.fill(255, 220, 100);
      p.textSize(8);
      p.text(entity.popularity, screenX + TILE_SIZE - 8, screenY + 8);
    }
  }
  
  p.pop();
}

function renderCursor(p) {
  const offsetX = 50;
  const offsetY = 50;
  const screenX = offsetX + gameState.cursorX * TILE_SIZE;
  const screenY = offsetY + gameState.cursorY * TILE_SIZE;
  
  p.push();
  p.noFill();
  p.stroke(255, 255, 100);
  p.strokeWeight(3);
  p.rect(screenX, screenY, TILE_SIZE, TILE_SIZE);
  
  // Corner markers
  const markerSize = 8;
  p.strokeWeight(2);
  // Top-left
  p.line(screenX, screenY, screenX + markerSize, screenY);
  p.line(screenX, screenY, screenX, screenY + markerSize);
  // Top-right
  p.line(screenX + TILE_SIZE, screenY, screenX + TILE_SIZE - markerSize, screenY);
  p.line(screenX + TILE_SIZE, screenY, screenX + TILE_SIZE, screenY + markerSize);
  // Bottom-left
  p.line(screenX, screenY + TILE_SIZE, screenX + markerSize, screenY + TILE_SIZE);
  p.line(screenX, screenY + TILE_SIZE, screenX, screenY + TILE_SIZE - markerSize);
  // Bottom-right
  p.line(screenX + TILE_SIZE, screenY + TILE_SIZE, screenX + TILE_SIZE - markerSize, screenY + TILE_SIZE);
  p.line(screenX + TILE_SIZE, screenY + TILE_SIZE, screenX + TILE_SIZE, screenY + TILE_SIZE - markerSize);
  
  p.pop();
}

function renderUI(p) {
  p.push();
  
  // Top UI panel
  p.fill(30, 35, 40);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 35);
  
  // Stats
  p.fill(255, 255, 255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.CENTER);
  
  p.text(`Budget: $${gameState.budget}`, 10, 17);
  p.text(`Reputation: ${gameState.reputation}/${gameState.targetReputation}`, 150, 17);
  p.text(`Students: ${gameState.students}`, 320, 17);
  p.text(`Year ${gameState.year} - Month ${gameState.month}`, 450, 17);
  
  // Progress bar
  const progressBarX = 370;
  const progressBarY = 380;
  const progressBarWidth = 220;
  const progressBarHeight = 15;
  
  p.fill(30, 35, 40);
  p.rect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);
  
  const progress = gameState.reputation / gameState.targetReputation;
  p.fill(100, 200, 255);
  p.rect(progressBarX, progressBarY, progressBarWidth * progress, progressBarHeight);
  
  p.fill(255, 255, 255);
  p.textSize(10);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(`${Math.floor(progress * 100)}%`, progressBarX + progressBarWidth / 2, progressBarY + progressBarHeight / 2);
  
  // Side info panel
  p.fill(30, 35, 40);
  p.rect(370, 50, 220, 320);
  
  p.fill(255, 220, 100);
  p.textSize(14);
  p.textAlign(p.CENTER, p.TOP);
  p.text("SCHOOL INFO", 480, 60);
  
  p.fill(200, 200, 220);
  p.textSize(11);
  p.textAlign(p.LEFT, p.TOP);
  
  const infoLines = [
    `Facilities: ${gameState.entities.length}`,
    `Tournaments Won: ${gameState.tournaments}`,
    `Total Graduates: ${gameState.graduations}`,
    ``,
    `Current Month: ${gameState.month}/12`,
    `Time until year end:`,
    `${Math.ceil((gameState.framesPerMonth - gameState.frameCounter) / 60)}s`,
    ``,
    `TIPS:`,
    `• Build adjacent facilities`,
    `  for synergy bonuses`,
    `• Classrooms + Libraries`,
    `• Gym + Club Rooms`,
    `• Cafeteria + Clubs`
  ];
  
  let yPos = 85;
  for (const line of infoLines) {
    p.text(line, 380, yPos);
    yPos += 15;
  }
  
  p.pop();
}

function renderBuildMenu(p) {
  p.push();
  
  // Menu background
  const menuX = 60;
  const menuY = 100;
  const menuWidth = 280;
  const menuHeight = 250;
  
  p.fill(20, 25, 30, 240);
  p.stroke(100, 150, 255);
  p.strokeWeight(2);
  p.rect(menuX, menuY, menuWidth, menuHeight, 5);
  
  // Title
  p.fill(255, 220, 100);
  p.noStroke();
  p.textSize(16);
  p.textAlign(p.CENTER, p.TOP);
  p.text("BUILD MENU", menuX + menuWidth / 2, menuY + 10);
  
  // Instructions
  p.fill(180, 180, 200);
  p.textSize(10);
  p.text("Space: Select | Z: Cancel", menuX + menuWidth / 2, menuY + 30);
  
  // Facility list
  const types = getFacilityTypesList();
  let yPos = menuY + 55;
  
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  
  for (let i = 0; i < types.length; i++) {
    const type = types[i];
    const info = FACILITY_TYPES[type];
    const isSelected = gameState.selectedFacilityIndex === i;
    
    // Selection highlight
    if (isSelected) {
      p.fill(100, 150, 255, 100);
      p.noStroke();
      p.rect(menuX + 10, yPos - 2, menuWidth - 20, 25, 3);
    }
    
    // Color indicator
    p.fill(...info.color);
    p.rect(menuX + 15, yPos + 3, 15, 15);
    
    // Facility info
    p.fill(isSelected ? [255, 255, 255] : [200, 200, 220]);
    p.text(`${info.symbol} ${info.name}`, menuX + 40, yPos + 2);
    p.text(`$${info.cost} | Rep: +${info.rep}`, menuX + 40, yPos + 14);
    
    yPos += 32;
  }
  
  p.pop();
}

function renderPauseOverlay(p) {
  p.push();
  p.fill(255, 255, 255);
  p.textSize(14);
  p.textAlign(p.RIGHT, p.TOP);
  p.text("PAUSED", CANVAS_WIDTH - 10, 40);
  p.pop();
}

function renderGameOverScreen(p) {
  p.push();
  
  const isWin = gameState.gamePhase === PHASE_GAME_OVER_WIN;
  
  // Background
  p.fill(40, 45, 50);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Title
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "VICTORY!" : "GAME OVER", CANVAS_WIDTH / 2, 80);
  
  // Stats box
  p.fill(60, 65, 70);
  p.rect(100, 140, CANVAS_WIDTH - 200, 180);
  
  p.fill(255, 255, 255);
  p.textSize(16);
  p.textAlign(p.LEFT, p.TOP);
  
  const stats = [
    `Final Reputation: ${gameState.reputation}`,
    `Total Students: ${gameState.students}`,
    `Years Managed: ${gameState.year - 1}`,
    `Facilities Built: ${gameState.entities.length}`,
    `Tournaments Won: ${gameState.tournaments}`,
    `Total Graduates: ${gameState.graduations}`,
    ``,
    isWin ? "You've built a legendary school!" : "Keep trying to reach the goal!"
  ];
  
  let yPos = 155;
  for (const line of stats) {
    p.textAlign(p.CENTER, p.TOP);
    p.text(line, CANVAS_WIDTH / 2, yPos);
    yPos += 22;
  }
  
  // Restart prompt
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  const flash = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(255 * flash, 220 * flash, 100 * flash);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 360);
  
  p.pop();
}