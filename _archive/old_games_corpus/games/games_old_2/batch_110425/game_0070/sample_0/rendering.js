// rendering.js - Rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN } from './globals.js';
import { getRoomData } from './rooms.js';
import { getItemData } from './items.js';

let p;

export function initRenderer(p5Instance) {
  p = p5Instance;
}

export function renderGame() {
  if (gameState.gamePhase === PHASE_START) {
    renderStartScreen();
  } else if (gameState.gamePhase === PHASE_PLAYING) {
    renderGamePlay();
    if (gameState.inventoryOpen) {
      renderInventory();
    }
    if (gameState.mapOpen) {
      renderMap();
    }
  } else if (gameState.gamePhase === PHASE_PAUSED) {
    renderGamePlay();
    renderPauseOverlay();
  } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN) {
    renderGameOverScreen(true);
  }
}

function renderStartScreen() {
  p.background(20, 15, 25);
  
  // Castle silhouette background
  p.fill(40, 30, 45);
  p.noStroke();
  p.rect(150, 250, 80, 150);
  p.rect(370, 250, 80, 150);
  p.rect(200, 200, 200, 200);
  p.triangle(190, 200, 250, 150, 310, 200);
  p.triangle(290, 200, 350, 150, 410, 200);
  
  // Title
  p.fill(220, 200, 150);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.text("BLACKTHORN CASTLE", CANVAS_WIDTH / 2, 80);
  
  p.textSize(20);
  p.fill(180, 160, 130);
  p.text("Mystery Adventure", CANVAS_WIDTH / 2, 120);
  
  // Instructions
  p.textSize(14);
  p.fill(200, 190, 170);
  p.textAlign(p.LEFT);
  const instructions = [
    "Navigate the castle and solve puzzles to progress.",
    "Arrow Keys: Move cursor",
    "Space: Interact with highlighted objects",
    "Z: Open/close inventory",
    "Shift: Take photo of current room (max 10)",
    "ESC: Pause | R: Restart"
  ];
  
  let yPos = 160;
  instructions.forEach(line => {
    p.text(line, 50, yPos);
    yPos += 20;
  });
  
  // Objective
  p.textSize(16);
  p.fill(220, 180, 100);
  p.textAlign(p.CENTER);
  p.text("Find the secret of the throne room!", CANVAS_WIDTH / 2, 320);
  
  // Start prompt
  p.textSize(18);
  p.fill(255, 220, 100);
  const pulse = p.sin(p.frameCount * 0.05) * 20 + 235;
  p.fill(pulse, 200, 80);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
}

function renderGamePlay() {
  const room = getRoomData(gameState.currentRoom);
  
  // Background
  const bgColor = room.background.color;
  p.background(bgColor[0], bgColor[1], bgColor[2]);
  
  // Room elements
  drawRoomBackground(room);
  
  // Hotspots
  room.hotspots.forEach(hotspot => {
    if (hotspot.hidden) return;
    if (hotspot.type === "item" && hotspot.collected) return;
    
    drawHotspot(hotspot);
  });
  
  // Cursor
  drawCursor();
  
  // UI elements
  drawUI();
}

function drawRoomBackground(room) {
  p.push();
  
  // Draw floor
  p.fill(50, 45, 40);
  p.rect(0, 300, CANVAS_WIDTH, 100);
  
  // Room-specific decorations
  if (room.name === "Castle Courtyard") {
    // Fountain
    p.fill(100, 100, 120);
    p.ellipse(300, 220, 80, 60);
    p.fill(80, 80, 100);
    p.ellipse(300, 230, 60, 40);
  } else if (room.name === "Library") {
    // Bookshelves
    p.fill(80, 60, 40);
    p.rect(50, 100, 100, 200);
    p.rect(450, 100, 100, 200);
    for (let i = 0; i < 10; i++) {
      p.fill(60 + i * 5, 40, 30);
      p.rect(55 + i * 10, 110 + (i % 3) * 20, 8, 15);
    }
  } else if (room.name === "Throne Room") {
    // Red carpet
    p.fill(120, 20, 20);
    p.rect(200, 250, 200, 150);
    // Throne
    p.fill(180, 150, 50);
    p.rect(330, 180, 80, 100);
    p.rect(340, 160, 60, 30);
  }
  
  p.pop();
}

function drawHotspot(hotspot) {
  const isHovered = gameState.hoveredHotspot === hotspot.id;
  
  p.push();
  
  // Highlight if hovered
  if (isHovered) {
    p.fill(255, 255, 100, 100);
    p.noStroke();
    p.rect(hotspot.x - 5, hotspot.y - 5, hotspot.w + 10, hotspot.h + 10, 5);
  }
  
  // Draw hotspot based on type
  if (hotspot.type === "door") {
    const locked = hotspot.locked;
    p.fill(locked ? 100 : 120, locked ? 60 : 80, locked ? 40 : 50);
    p.stroke(80, 60, 40);
    p.strokeWeight(2);
    p.rect(hotspot.x, hotspot.y, hotspot.w, hotspot.h, 10);
    
    // Door handle
    p.fill(180, 150, 100);
    p.noStroke();
    p.ellipse(hotspot.x + hotspot.w - 15, hotspot.y + hotspot.h / 2, 8, 8);
    
    if (locked) {
      // Lock icon
      p.fill(150, 100, 50);
      p.rect(hotspot.x + hotspot.w / 2 - 5, hotspot.y + hotspot.h / 2, 10, 8);
      p.ellipse(hotspot.x + hotspot.w / 2, hotspot.y + hotspot.h / 2 - 3, 8, 8);
    }
  } else if (hotspot.type === "item") {
    const item = getItemData(hotspot.item);
    if (item) {
      drawItem(item, hotspot.x + hotspot.w / 2, hotspot.y + hotspot.h / 2, 1.5);
    }
  } else if (hotspot.type === "examine") {
    p.fill(100, 100, 100, 150);
    p.noStroke();
    p.rect(hotspot.x, hotspot.y, hotspot.w, hotspot.h, 5);
    p.fill(255);
    p.textSize(10);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("?", hotspot.x + hotspot.w / 2, hotspot.y + hotspot.h / 2);
  } else if (hotspot.type === "container") {
    p.fill(120, 80, 40);
    p.stroke(80, 60, 30);
    p.strokeWeight(2);
    p.rect(hotspot.x, hotspot.y, hotspot.w, hotspot.h, 5);
    
    if (hotspot.locked) {
      p.fill(150, 100, 50);
      p.noStroke();
      p.rect(hotspot.x + hotspot.w / 2 - 5, hotspot.y + 10, 10, 8);
    }
  } else if (hotspot.type === "puzzle") {
    p.fill(150, 100, 100);
    p.stroke(100, 70, 70);
    p.strokeWeight(2);
    p.rect(hotspot.x, hotspot.y, hotspot.w, hotspot.h, 5);
    p.fill(255);
    p.noStroke();
    p.textSize(12);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("⚙", hotspot.x + hotspot.w / 2, hotspot.y + hotspot.h / 2);
  }
  
  // Show name on hover
  if (isHovered) {
    p.fill(0, 0, 0, 180);
    p.noStroke();
    const nameText = hotspot.type === "item" ? getItemData(hotspot.item)?.name || "Item" : 
                     hotspot.type === "door" ? "Door" : "Examine";
    const textW = p.textWidth(nameText) + 10;
    p.rect(hotspot.x + hotspot.w / 2 - textW / 2, hotspot.y - 25, textW, 20, 5);
    p.fill(255);
    p.textSize(12);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(nameText, hotspot.x + hotspot.w / 2, hotspot.y - 15);
  }
  
  p.pop();
}

function drawItem(item, x, y, scale = 1) {
  p.push();
  p.translate(x, y);
  p.scale(scale);
  
  if (item.visual.type === "key") {
    p.fill(item.visual.color);
    p.noStroke();
    p.ellipse(0, -5, 8, 8);
    p.rect(-2, -5, 4, 12);
    p.rect(-4, 5, 2, 2);
    p.rect(2, 5, 2, 2);
  } else if (item.visual.type === "torch") {
    p.fill(120, 80, 40);
    p.rect(-2, -5, 4, 15);
    p.fill(220, 100, 20);
    p.triangle(-4, -8, 4, -8, 0, -15);
    p.fill(255, 200, 50);
    p.triangle(-2, -10, 2, -10, 0, -13);
  } else if (item.visual.type === "scroll") {
    p.fill(item.visual.color);
    p.rect(-6, -8, 12, 16, 2);
    p.fill(180, 160, 120);
    for (let i = 0; i < 3; i++) {
      p.rect(-4, -5 + i * 4, 8, 1);
    }
  } else if (item.visual.type === "shield") {
    p.fill(item.visual.color);
    p.ellipse(0, 0, 14, 16);
    p.fill(180, 180, 200);
    p.ellipse(0, 0, 6, 6);
  } else if (item.visual.type === "gear") {
    p.fill(item.visual.color);
    p.ellipse(0, 0, 12, 12);
    for (let i = 0; i < 6; i++) {
      p.push();
      p.rotate(i * p.PI / 3);
      p.rect(-1, -8, 2, 4);
      p.pop();
    }
    p.fill(60, 60, 60);
    p.ellipse(0, 0, 4, 4);
  }
  
  p.pop();
}

function drawCursor() {
  p.push();
  p.stroke(255, 220, 100);
  p.strokeWeight(2);
  p.noFill();
  p.ellipse(gameState.cursorX, gameState.cursorY, 12, 12);
  p.line(gameState.cursorX - 8, gameState.cursorY, gameState.cursorX - 4, gameState.cursorY);
  p.line(gameState.cursorX + 4, gameState.cursorY, gameState.cursorX + 8, gameState.cursorY);
  p.line(gameState.cursorX, gameState.cursorY - 8, gameState.cursorX, gameState.cursorY - 4);
  p.line(gameState.cursorX, gameState.cursorY + 4, gameState.cursorX, gameState.cursorY + 8);
  p.pop();
}

function drawUI() {
  // Top bar
  p.fill(20, 15, 15, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 30);
  
  // Room name
  const room = getRoomData(gameState.currentRoom);
  p.fill(220, 200, 180);
  p.textSize(14);
  p.textAlign(p.LEFT, p.CENTER);
  p.text(room.name, 10, 15);
  
  // Score and stats
  p.textAlign(p.RIGHT, p.CENTER);
  p.text(`Puzzles: ${gameState.puzzlesSolved} | Rooms: ${gameState.visitedRooms.size}`, CANVAS_WIDTH - 10, 15);
  
  // UI buttons on bottom
  drawUIButtons();
}

function drawUIButtons() {
  const buttons = [
    { id: "inventory", x: 20, y: 360, w: 80, h: 25, label: "Inv (Z)" },
    { id: "map", x: 110, y: 360, w: 80, h: 25, label: "Map" },
    { id: "camera", x: 200, y: 360, w: 100, h: 25, label: `Cam (${gameState.photos.length}/10)` },
    { id: "hint", x: 310, y: 360, w: 80, h: 25, label: "Hint" }
  ];
  
  buttons.forEach(btn => {
    const isHovered = gameState.hoveredButton === btn.id;
    const isActive = (btn.id === "inventory" && gameState.inventoryOpen) || 
                     (btn.id === "map" && gameState.mapOpen);
    
    p.fill(isActive ? 100 : (isHovered ? 80 : 60), isActive ? 80 : (isHovered ? 60 : 40), isActive ? 60 : (isHovered ? 40 : 20), 200);
    p.stroke(isHovered ? 200 : 150, isHovered ? 180 : 130, isHovered ? 100 : 80);
    p.strokeWeight(2);
    p.rect(btn.x, btn.y, btn.w, btn.h, 5);
    
    p.fill(isHovered ? 255 : 220, isHovered ? 240 : 200, isHovered ? 180 : 160);
    p.noStroke();
    p.textSize(12);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2);
  });
  
  // Hint cooldown indicator
  if (gameState.hintCooldown > 0) {
    const progress = gameState.hintCooldown / gameState.hintCooldownMax;
    p.fill(255, 100, 100, 150);
    p.noStroke();
    p.rect(310, 360, 80 * (1 - progress), 25, 5);
  }
}

function renderInventory() {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Inventory panel
  const panelX = 100;
  const panelY = 50;
  const panelW = 400;
  const panelH = 300;
  
  p.fill(40, 35, 30);
  p.stroke(120, 100, 80);
  p.strokeWeight(3);
  p.rect(panelX, panelY, panelW, panelH, 10);
  
  // Title
  p.fill(220, 200, 150);
  p.noStroke();
  p.textSize(18);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("INVENTORY", panelX + panelW / 2, panelY + 20);
  
  // Item slots
  const slotSize = 60;
  const slotsPerRow = 4;
  const startX = panelX + 30;
  const startY = panelY + 50;
  
  for (let i = 0; i < gameState.maxInventorySize; i++) {
    const col = i % slotsPerRow;
    const row = Math.floor(i / slotsPerRow);
    const x = startX + col * (slotSize + 10);
    const y = startY + row * (slotSize + 10);
    
    const isSelected = i === gameState.selectedInventoryIndex;
    
    p.fill(isSelected ? 80 : 60, isSelected ? 70 : 50, isSelected ? 50 : 40);
    p.stroke(isSelected ? 200 : 100, isSelected ? 180 : 90, isSelected ? 100 : 70);
    p.strokeWeight(2);
    p.rect(x, y, slotSize, slotSize, 5);
    
    if (i < gameState.inventory.length) {
      const itemId = gameState.inventory[i];
      const item = getItemData(itemId);
      if (item) {
        drawItem(item, x + slotSize / 2, y + slotSize / 2, 2);
      }
    }
  }
  
  // Selected item info
  if (gameState.selectedInventoryIndex >= 0 && gameState.selectedInventoryIndex < gameState.inventory.length) {
    const itemId = gameState.inventory[gameState.selectedInventoryIndex];
    const item = getItemData(itemId);
    
    if (item) {
      p.fill(220, 200, 180);
      p.textSize(14);
      p.textAlign(p.CENTER);
      p.text(item.name, panelX + panelW / 2, panelY + panelH - 40);
      p.textSize(12);
      p.fill(180, 160, 140);
      p.text(item.description, panelX + panelW / 2, panelY + panelH - 20);
    }
  }
  
  // Close instruction
  p.fill(200, 180, 160);
  p.textSize(12);
  p.textAlign(p.CENTER);
  p.text("Press Z to close | Arrows to select | Space to use", panelX + panelW / 2, panelY + panelH - 5);
}

function renderMap() {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Map panel
  const panelX = 100;
  const panelY = 50;
  const panelW = 400;
  const panelH = 300;
  
  p.fill(40, 35, 30);
  p.stroke(120, 100, 80);
  p.strokeWeight(3);
  p.rect(panelX, panelY, panelW, panelH, 10);
  
  // Title
  p.fill(220, 200, 150);
  p.noStroke();
  p.textSize(18);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("CASTLE MAP", panelX + panelW / 2, panelY + 20);
  
  // Map visualization
  const mapRooms = {
    entrance: { x: 200, y: 250, label: "Entrance" },
    courtyard: { x: 200, y: 180, label: "Courtyard" },
    hall: { x: 200, y: 110, label: "Hall" },
    library: { x: 130, y: 110, label: "Library" },
    armory: { x: 270, y: 110, label: "Armory" },
    tower: { x: 270, y: 50, label: "Tower" },
    throne: { x: 340, y: 50, label: "Throne" }
  };
  
  // Draw connections
  p.stroke(80, 70, 60);
  p.strokeWeight(2);
  p.line(panelX + mapRooms.entrance.x, panelY + mapRooms.entrance.y, 
         panelX + mapRooms.courtyard.x, panelY + mapRooms.courtyard.y);
  p.line(panelX + mapRooms.courtyard.x, panelY + mapRooms.courtyard.y, 
         panelX + mapRooms.hall.x, panelY + mapRooms.hall.y);
  p.line(panelX + mapRooms.hall.x, panelY + mapRooms.hall.y, 
         panelX + mapRooms.library.x, panelY + mapRooms.library.y);
  p.line(panelX + mapRooms.hall.x, panelY + mapRooms.hall.y, 
         panelX + mapRooms.armory.x, panelY + mapRooms.armory.y);
  p.line(panelX + mapRooms.armory.x, panelY + mapRooms.armory.y, 
         panelX + mapRooms.tower.x, panelY + mapRooms.tower.y);
  p.line(panelX + mapRooms.tower.x, panelY + mapRooms.tower.y, 
         panelX + mapRooms.throne.x, panelY + mapRooms.throne.y);
  
  // Draw rooms
  Object.keys(mapRooms).forEach(roomId => {
    const room = mapRooms[roomId];
    const visited = gameState.visitedRooms.has(roomId);
    const current = gameState.currentRoom === roomId;
    
    p.fill(visited ? (current ? 150 : 100) : 50, 
           visited ? (current ? 130 : 80) : 40, 
           visited ? (current ? 80 : 60) : 30);
    p.stroke(current ? 220 : (visited ? 150 : 80), 
             current ? 200 : (visited ? 130 : 70), 
             current ? 100 : (visited ? 80 : 50));
    p.strokeWeight(current ? 3 : 2);
    p.ellipse(panelX + room.x, panelY + room.y, 20, 20);
    
    if (visited) {
      p.fill(220, 200, 180);
      p.noStroke();
      p.textSize(10);
      p.textAlign(p.CENTER);
      p.text(room.label, panelX + room.x, panelY + room.y + 20);
    }
  });
  
  // Close instruction
  p.fill(200, 180, 160);
  p.textSize(12);
  p.textAlign(p.CENTER);
  p.text("Press Space or click Map button to close", panelX + panelW / 2, panelY + panelH - 10);
}

function renderPauseOverlay() {
  p.fill(200, 180, 160);
  p.textSize(16);
  p.textAlign(p.RIGHT, p.TOP);
  p.text("PAUSED", CANVAS_WIDTH - 10, 35);
}

function renderGameOverScreen(win) {
  p.background(20, 15, 25);
  
  // Victory decoration
  if (win) {
    p.fill(220, 180, 50, 100);
    for (let i = 0; i < 5; i++) {
      const x = 100 + i * 100;
      const y = 150 + p.sin(p.frameCount * 0.05 + i) * 20;
      p.ellipse(x, y, 30, 30);
    }
  }
  
  // Title
  p.fill(win ? 220 : 180, win ? 180 : 100, win ? 50 : 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.text(win ? "VICTORY!" : "GAME OVER", CANVAS_WIDTH / 2, 100);
  
  // Message
  p.textSize(18);
  p.fill(200, 190, 170);
  if (win) {
    p.text("You've uncovered the secrets of Blackthorn Castle!", CANVAS_WIDTH / 2, 160);
  }
  
  // Stats
  p.textSize(16);
  p.fill(180, 170, 150);
  p.text(`Puzzles Solved: ${gameState.puzzlesSolved}`, CANVAS_WIDTH / 2, 220);
  p.text(`Rooms Explored: ${gameState.visitedRooms.size}`, CANVAS_WIDTH / 2, 250);
  p.text(`Photos Taken: ${gameState.photos.length}`, CANVAS_WIDTH / 2, 280);
  p.text(`Hints Used: ${gameState.hintsUsed}`, CANVAS_WIDTH / 2, 310);
  
  // Restart prompt
  p.textSize(18);
  const pulse = p.sin(p.frameCount * 0.05) * 20 + 235;
  p.fill(pulse, 200, 80);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 360);
}