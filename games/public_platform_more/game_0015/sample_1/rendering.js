// rendering.js - Rendering functions

import { gameState, LOCATIONS, ITEMS, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Hotspot, InventoryItem } from './entities.js';

export function renderStartScreen(p) {
  p.background(20, 30, 50);
  
  // Title with glow effect
  p.push();
  p.textAlign(p.CENTER);
  
  // Glow
  for (let i = 0; i < 3; i++) {
    p.fill(100, 150, 255, 30);
    p.textSize(44 + i * 2);
    p.text("Die drei ???", CANVAS_WIDTH / 2, 80);
  }
  
  p.fill(255, 255, 100);
  p.textSize(42);
  p.text("Die drei ???", CANVAS_WIDTH / 2, 80);
  
  p.fill(200, 200, 255);
  p.textSize(20);
  p.text("Ruf der Trolle", CANVAS_WIDTH / 2, 110);
  
  // Description
  p.fill(220);
  p.textSize(13);
  p.textAlign(p.LEFT);
  const desc = [
    "A mysterious troll-themed threat has struck Rocky Beach!",
    "Navigate locations, examine objects, and interview witnesses.",
    "Collect clues and solve puzzles to uncover the truth."
  ];
  
  for (let i = 0; i < desc.length; i++) {
    p.text(desc[i], 50, 160 + i * 20);
  }
  
  // Controls
  p.fill(150, 200, 255);
  p.textSize(14);
  p.textAlign(p.LEFT);
  p.text("CONTROLS:", 50, 240);
  
  p.fill(220);
  p.textSize(12);
  const controls = [
    "Arrow Keys: Navigate hotspots and menu options",
    "SPACE: Interact, advance dialogue, confirm",
    "Z: Open/close inventory, combine items",
    "SHIFT: Examine selected inventory item",
    "ESC: Pause game | R: Restart"
  ];
  
  for (let i = 0; i < controls.length; i++) {
    p.text(controls[i], 70, 260 + i * 18);
  }
  
  // Start prompt with pulse
  const pulse = Math.sin(p.frameCount * 0.1) * 20 + 235;
  p.fill(pulse, 255, 100);
  p.textSize(16);
  p.textAlign(p.CENTER);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
  
  p.pop();
}

export function renderGameScreen(p) {
  // Background - location dependent
  drawLocationBackground(p);
  
  // Draw hotspots
  drawHotspots(p);
  
  // Draw player
  if (gameState.player) {
    gameState.player.draw(p);
  }
  
  // Draw UI
  drawUI(p);
  
  // Draw dialogue box
  if (gameState.currentDialogue) {
    drawDialogueBox(p);
  }
  
  // Draw inventory overlay
  if (gameState.showInventory) {
    drawInventoryOverlay(p);
  }
  
  // Draw messages
  drawMessages(p);
  
  // Log player info
  if (gameState.player && p.frameCount % 60 === 0) {
    p.logs.player_info.push({
      screen_x: gameState.player.x,
      screen_y: gameState.player.y,
      game_x: gameState.player.x,
      game_y: gameState.player.y,
      framecount: p.frameCount
    });
  }
}

function drawLocationBackground(p) {
  const location = LOCATIONS[gameState.currentLocation];
  
  if (gameState.currentLocation === "office") {
    // Office background
    p.background(60, 50, 45);
    
    // Floor
    p.fill(80, 70, 60);
    p.rect(0, 250, CANVAS_WIDTH, 150);
    
    // Wall
    p.fill(90, 80, 70);
    p.rect(0, 0, CANVAS_WIDTH, 250);
    
    // Window
    p.fill(120, 150, 200);
    p.rect(400, 50, 150, 120);
    p.stroke(40);
    p.strokeWeight(4);
    p.line(475, 50, 475, 170);
    p.line(400, 110, 550, 110);
    p.noStroke();
    
  } else if (gameState.currentLocation === "park") {
    // Park background
    p.background(100, 180, 100);
    
    // Sky
    p.fill(120, 180, 255);
    p.rect(0, 0, CANVAS_WIDTH, 200);
    
    // Grass
    p.fill(80, 160, 80);
    p.rect(0, 200, CANVAS_WIDTH, 200);
    
    // Path
    p.fill(160, 140, 100);
    p.rect(200, 150, 200, 250);
    
    // Trees
    for (let i = 0; i < 3; i++) {
      const x = 100 + i * 200;
      p.fill(80, 60, 40);
      p.rect(x - 10, 80, 20, 80);
      p.fill(60, 140, 60);
      p.ellipse(x, 80, 80, 80);
    }
    
  } else if (gameState.currentLocation === "dock") {
    // Dock background
    p.background(100, 150, 200);
    
    // Water
    p.fill(60, 100, 180);
    p.rect(0, 150, CANVAS_WIDTH, 250);
    
    // Dock
    p.fill(120, 90, 60);
    p.rect(0, 250, CANVAS_WIDTH, 80);
    
    // Planks
    p.stroke(100, 70, 40);
    p.strokeWeight(2);
    for (let i = 0; i < 10; i++) {
      p.line(i * 60, 250, i * 60, 330);
    }
    p.noStroke();
    
    // Sky
    p.fill(150, 180, 220);
    p.rect(0, 0, CANVAS_WIDTH, 150);
    
  } else if (gameState.currentLocation === "warehouse") {
    // Warehouse background
    p.background(40, 40, 50);
    
    // Ground
    p.fill(60, 60, 70);
    p.rect(0, 300, CANVAS_WIDTH, 100);
    
    // Warehouse wall
    p.fill(70, 60, 60);
    p.rect(150, 100, 300, 250);
    
    // Roof
    p.fill(50, 40, 40);
    p.triangle(150, 100, 300, 50, 450, 100);
    
    // Shadows
    p.fill(30, 30, 40, 100);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }
  
  // Location name
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, 30);
  p.fill(255);
  p.textAlign(p.LEFT);
  p.textSize(14);
  p.text(location.name, 10, 20);
}

function drawHotspots(p) {
  const location = LOCATIONS[gameState.currentLocation];
  
  if (!location || !location.hotspots) return;
  
  location.hotspots.forEach((hotspotData, index) => {
    const hotspot = new Hotspot(hotspotData, gameState.currentLocation);
    const isHovered = index === gameState.hoveredHotspot;
    hotspot.draw(p, isHovered);
  });
}

function drawUI(p) {
  // Score
  p.fill(0, 0, 0, 150);
  p.rect(CANVAS_WIDTH - 120, 0, 120, 30);
  p.fill(255, 255, 100);
  p.textAlign(p.RIGHT);
  p.textSize(14);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 20);
  
  // Inventory indicator
  p.fill(0, 0, 0, 150);
  p.rect(CANVAS_WIDTH - 200, CANVAS_HEIGHT - 30, 200, 30);
  p.fill(150, 200, 255);
  p.textAlign(p.RIGHT);
  p.textSize(12);
  p.text(`Inventory (Z): ${gameState.inventory.length} items`, CANVAS_WIDTH - 10, CANVAS_HEIGHT - 10);
  
  // Instructions hint
  if (!gameState.currentDialogue && !gameState.showInventory) {
    p.fill(0, 0, 0, 100);
    p.rect(10, CANVAS_HEIGHT - 50, 250, 40);
    p.fill(200, 200, 255);
    p.textAlign(p.LEFT);
    p.textSize(11);
    p.text("Arrows: Navigate | Space: Interact", 15, CANVAS_HEIGHT - 30);
    p.text("Z: Inventory | ESC: Pause", 15, CANVAS_HEIGHT - 15);
  }
}

function drawDialogueBox(p) {
  const dialogue = gameState.currentDialogue;
  if (!dialogue) return;
  
  // Semi-transparent background
  p.fill(0, 0, 0, 180);
  p.rect(0, CANVAS_HEIGHT - 150, CANVAS_WIDTH, 150);
  
  // Speaker name
  p.fill(255, 255, 100);
  p.textAlign(p.LEFT);
  p.textSize(14);
  p.text(dialogue.data.speaker, 20, CANVAS_HEIGHT - 125);
  
  // Dialogue line
  p.fill(255);
  p.textSize(12);
  const line = dialogue.data.lines[dialogue.lineIndex];
  const wrappedText = wrapText(p, line, CANVAS_WIDTH - 40);
  
  let yPos = CANVAS_HEIGHT - 105;
  wrappedText.forEach(textLine => {
    p.text(textLine, 20, yPos);
    yPos += 16;
  });
  
  // Choices (if at end of dialogue)
  if (dialogue.lineIndex >= dialogue.data.lines.length - 1) {
    p.fill(150, 200, 255);
    p.textSize(11);
    p.text("Choose:", 20, CANVAS_HEIGHT - 50);
    
    dialogue.data.choices.forEach((choice, index) => {
      const isSelected = index === dialogue.choiceIndex;
      p.fill(isSelected ? [255, 255, 100] : [200, 200, 255]);
      p.text(`${isSelected ? '>' : ' '} ${choice.text}`, 30, CANVAS_HEIGHT - 35 + index * 15);
    });
  } else {
    // Continue indicator
    const pulse = Math.sin(p.frameCount * 0.15) * 10 + 245;
    p.fill(pulse, pulse, 100);
    p.textAlign(p.RIGHT);
    p.textSize(11);
    p.text("Space to continue...", CANVAS_WIDTH - 20, CANVAS_HEIGHT - 10);
  }
}

function drawInventoryOverlay(p) {
  // Semi-transparent background
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Title
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER);
  p.textSize(18);
  p.text("INVENTORY", CANVAS_WIDTH / 2, 40);
  
  if (gameState.inventory.length === 0) {
    p.fill(200);
    p.textSize(14);
    p.text("No items collected yet", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    p.textSize(12);
    p.fill(150, 200, 255);
    p.text("Press Z to close", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
    return;
  }
  
  // Draw items
  const itemSize = 60;
  const spacing = 20;
  const startX = (CANVAS_WIDTH - (gameState.inventory.length * (itemSize + spacing))) / 2;
  const startY = 100;
  
  gameState.inventory.forEach((itemId, index) => {
    const item = ITEMS[itemId];
    const inventoryItem = new InventoryItem(itemId, item);
    const x = startX + index * (itemSize + spacing);
    const isSelected = index === gameState.selectedInventoryIndex;
    
    inventoryItem.draw(p, x, startY, itemSize, isSelected);
    
    // Item name
    p.fill(255);
    p.textAlign(p.CENTER);
    p.textSize(10);
    p.text(item.name, x + itemSize / 2, startY + itemSize + 15);
  });
  
  // Instructions
  p.fill(150, 200, 255);
  p.textAlign(p.CENTER);
  p.textSize(12);
  p.text("Left/Right: Select | Shift: Examine | Space: Combine", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 80);
  p.text("Z: Close Inventory", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 60);
  
  // Show selected item details
  if (gameState.selectedInventoryIndex >= 0) {
    const itemId = gameState.inventory[gameState.selectedInventoryIndex];
    const item = ITEMS[itemId];
    
    p.fill(0, 0, 0, 180);
    p.rect(50, CANVAS_HEIGHT - 130, CANVAS_WIDTH - 100, 60);
    
    p.fill(255, 255, 100);
    p.textSize(13);
    p.textAlign(p.LEFT);
    p.text(item.name, 60, CANVAS_HEIGHT - 110);
    
    p.fill(255);
    p.textSize(11);
    const wrappedDesc = wrapText(p, item.description, CANVAS_WIDTH - 120);
    wrappedDesc.forEach((line, i) => {
      p.text(line, 60, CANVAS_HEIGHT - 92 + i * 14);
    });
  }
}

function drawMessages(p) {
  const currentTime = Date.now();
  const messageDuration = 3000; // 3 seconds
  
  // Filter out old messages
  gameState.messageQueue = gameState.messageQueue.filter(msg => 
    currentTime - msg.time < messageDuration
  );
  
  // Draw active messages
  gameState.messageQueue.forEach((msg, index) => {
    const age = currentTime - msg.time;
    const alpha = Math.max(0, 255 * (1 - age / messageDuration));
    
    p.fill(0, 0, 0, alpha * 0.7);
    p.rect(10, 50 + index * 35, CANVAS_WIDTH - 20, 30, 5);
    
    p.fill(255, 255, 100, alpha);
    p.textAlign(p.LEFT);
    p.textSize(12);
    p.text(msg.text, 20, 70 + index * 35);
  });
}

export function renderPauseScreen(p) {
  renderGameScreen(p);
  
  // Pause overlay
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 255, 100);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  
  p.fill(200);
  p.textAlign(p.CENTER);
  p.textSize(14);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
}

export function renderGameOverScreen(p) {
  p.background(20, 20, 40);
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  // Title
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER);
  p.textSize(36);
  p.text(isWin ? "CASE SOLVED!" : "GAME OVER", CANVAS_WIDTH / 2, 100);
  
  // Message
  p.fill(255);
  p.textSize(14);
  
  if (isWin) {
    const messages = [
      "Excellent detective work!",
      "You uncovered the troll mystery and identified the culprit.",
      "The threatening messages were just a cover for treasure hunting!",
      "",
      `Final Score: ${gameState.score}`
    ];
    
    messages.forEach((msg, i) => {
      p.text(msg, CANVAS_WIDTH / 2, 160 + i * 25);
    });
  }
  
  // Restart prompt
  const pulse = Math.sin(p.frameCount * 0.1) * 20 + 235;
  p.fill(pulse, 255, 100);
  p.textSize(16);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
}

// Helper function
function wrapText(p, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  
  words.forEach(word => {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const testWidth = p.textWidth(testLine);
    
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}