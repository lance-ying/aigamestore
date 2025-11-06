// ui.js - UI rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function drawStartScreen(p) {
  p.background(20, 30, 45);
  
  // Title with decorative border
  p.push();
  p.stroke(180, 150, 100);
  p.strokeWeight(3);
  p.noFill();
  p.rect(100, 40, 400, 80);
  p.pop();
  
  p.fill(220, 200, 150);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(28);
  p.text("TEMPLAR CONSPIRACY", CANVAS_WIDTH / 2, 80);
  
  p.textSize(14);
  p.fill(180, 180, 200);
  p.text("A Point-and-Click Mystery Adventure", CANVAS_WIDTH / 2, 110);
  
  // Description
  p.textSize(12);
  p.fill(200, 200, 210);
  p.textAlign(p.LEFT, p.TOP);
  const desc = [
    "Uncover a hidden Templar conspiracy in Paris.",
    "",
    "Explore locations, examine objects, collect items,",
    "and solve environmental puzzles to progress.",
    "",
    "Combine items in your inventory and use them",
    "on hotspots to unlock new areas."
  ];
  
  let y = 150;
  for (let line of desc) {
    p.text(line, 80, y);
    y += 18;
  }
  
  // Controls
  p.fill(220, 200, 150);
  p.textSize(13);
  y += 10;
  p.text("CONTROLS:", 80, y);
  y += 20;
  
  p.textSize(11);
  p.fill(200, 200, 210);
  const controls = [
    "Arrow Keys - Navigate hotspots/menus",
    "Space - Interact with selected hotspot",
    "Z - Open/Close inventory",
    "Shift - Combine selected inventory items",
    "ESC - Pause game",
    "R - Restart to menu"
  ];
  
  for (let ctrl of controls) {
    p.text(ctrl, 100, y);
    y += 16;
  }
  
  // Start prompt
  p.fill(255, 220, 100);
  p.textSize(16);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
}

export function drawPausedIndicator(p) {
  p.fill(255, 255, 100);
  p.textSize(14);
  p.textAlign(p.RIGHT, p.TOP);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

export function drawGameOverScreen(p, win) {
  p.background(20, 20, 30);
  
  p.textAlign(p.CENTER, p.CENTER);
  
  if (win) {
    p.fill(100, 255, 100);
    p.textSize(32);
    p.text("CONSPIRACY REVEALED!", CANVAS_WIDTH / 2, 120);
    
    p.fill(200, 200, 220);
    p.textSize(14);
    p.text("You've successfully uncovered the Templar plot", CANVAS_WIDTH / 2, 170);
    p.text("and exposed their secret operations.", CANVAS_WIDTH / 2, 190);
    
    p.fill(220, 220, 150);
    p.textSize(16);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 230);
    p.text(`Puzzles Solved: ${gameState.puzzlesSolved.length}`, CANVAS_WIDTH / 2, 255);
  } else {
    p.fill(255, 100, 100);
    p.textSize(32);
    p.text("INVESTIGATION FAILED", CANVAS_WIDTH / 2, 150);
    
    p.fill(200, 200, 220);
    p.textSize(14);
    p.text("The conspiracy remains hidden...", CANVAS_WIDTH / 2, 200);
  }
  
  p.fill(255, 220, 100);
  p.textSize(16);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 340);
}

export function drawHUD(p, location) {
  // Top bar
  p.fill(20, 20, 30, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 35);
  
  p.fill(220, 200, 150);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  p.text(location.name, 10, 10);
  
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
  
  // Message display
  if (gameState.messageTimer > 0) {
    p.fill(40, 40, 50, 220);
    p.rect(50, 50, CANVAS_WIDTH - 100, 60);
    p.fill(220, 220, 240);
    p.textSize(12);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(gameState.message, CANVAS_WIDTH / 2, 80);
  }
  
  // Inventory indicator
  if (gameState.inventory.length > 0) {
    p.fill(100, 80, 60);
    p.rect(10, CANVAS_HEIGHT - 45, 80, 35);
    p.fill(220, 200, 150);
    p.textSize(10);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(`Items: ${gameState.inventory.length}`, 50, CANVAS_HEIGHT - 32);
    p.text("(Press Z)", 50, CANVAS_HEIGHT - 18);
  }
}

export function drawInventoryMenu(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 180);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Inventory panel
  p.fill(40, 40, 50);
  p.stroke(180, 150, 100);
  p.strokeWeight(2);
  p.rect(100, 80, 400, 280);
  
  p.fill(220, 200, 150);
  p.noStroke();
  p.textSize(16);
  p.textAlign(p.CENTER, p.TOP);
  p.text("INVENTORY", CANVAS_WIDTH / 2, 95);
  
  // Draw items
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  
  const itemsPerRow = 2;
  const itemWidth = 180;
  const itemHeight = 60;
  const startX = 120;
  const startY = 130;
  
  for (let i = 0; i < gameState.inventory.length; i++) {
    const item = gameState.inventory[i];
    const row = Math.floor(i / itemsPerRow);
    const col = i % itemsPerRow;
    const x = startX + col * (itemWidth + 20);
    const y = startY + row * (itemHeight + 10);
    
    // Item box
    const isSelected = i === gameState.selectedInventoryItem;
    p.fill(isSelected ? 80 : 60, isSelected ? 70 : 50, isSelected ? 50 : 40);
    p.stroke(isSelected ? 220 : 120, isSelected ? 200 : 100, isSelected ? 150 : 80);
    p.strokeWeight(isSelected ? 3 : 1);
    p.rect(x, y, itemWidth, itemHeight);
    
    // Item text
    p.fill(220, 220, 240);
    p.noStroke();
    p.textSize(11);
    p.text(item.id.replace(/_/g, ' ').toUpperCase(), x + 10, y + 10);
    
    p.textSize(9);
    p.fill(180, 180, 200);
    const desc = item.description.substring(0, 45);
    p.text(desc + (item.description.length > 45 ? '...' : ''), x + 10, y + 30, itemWidth - 20);
  }
  
  // Instructions
  p.fill(200, 200, 220);
  p.textSize(11);
  p.textAlign(p.CENTER, p.TOP);
  p.text("Arrow Keys: Select | Space: Use | Shift: Combine | Z: Close", CANVAS_WIDTH / 2, 340);
}

export function drawLocation(p, location) {
  // Background gradient
  const c1 = p.color(location.bgColor[0], location.bgColor[1], location.bgColor[2]);
  const c2 = p.color(
    location.bgColor[0] + 20,
    location.bgColor[1] + 20,
    location.bgColor[2] + 30
  );
  
  for (let y = 35; y < CANVAS_HEIGHT; y++) {
    const inter = p.map(y, 35, CANVAS_HEIGHT, 0, 1);
    const c = p.lerpColor(c1, c2, inter);
    p.stroke(c);
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Draw hotspots
  const availableHotspots = getAvailableHotspots(location);
  
  for (let i = 0; i < availableHotspots.length; i++) {
    const hotspotIndex = availableHotspots[i];
    const hotspot = location.hotspots[hotspotIndex];
    const isSelected = hotspotIndex === gameState.selectedHotspot;
    
    // Hotspot visual
    p.push();
    if (isSelected) {
      p.stroke(255, 220, 100);
      p.strokeWeight(3);
      p.fill(255, 220, 100, 50);
    } else {
      p.stroke(180, 180, 200, 150);
      p.strokeWeight(1);
      p.fill(100, 100, 120, 30);
    }
    
    p.rect(hotspot.x, hotspot.y, hotspot.width, hotspot.height);
    p.pop();
    
    // Hotspot icon
    drawHotspotIcon(p, hotspot, isSelected);
    
    // Label
    if (isSelected) {
      p.fill(255, 255, 255);
      p.textSize(11);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(hotspot.name, hotspot.x + hotspot.width / 2, hotspot.y + hotspot.height / 2);
    }
  }
  
  // Location description at bottom
  p.fill(220, 220, 240);
  p.textSize(11);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.text(location.description, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 10);
}

function drawHotspotIcon(p, hotspot, isSelected) {
  const cx = hotspot.x + hotspot.width / 2;
  const cy = hotspot.y + hotspot.height / 2;
  const size = 30;
  
  p.push();
  p.strokeWeight(2);
  p.stroke(isSelected ? 255 : 200, isSelected ? 220 : 200, isSelected ? 100 : 220);
  p.noFill();
  
  switch (hotspot.type) {
    case 'examine':
      // Magnifying glass
      p.circle(cx - 5, cy - 5, size * 0.6);
      p.line(cx + 8, cy + 8, cx + 15, cy + 15);
      break;
    case 'item':
      // Box/package
      p.rect(cx - size * 0.4, cy - size * 0.3, size * 0.8, size * 0.6);
      p.line(cx - size * 0.4, cy, cx + size * 0.4, cy);
      break;
    case 'use':
      // Hand/gear
      p.circle(cx, cy, size * 0.7);
      p.line(cx, cy - size * 0.35, cx, cy + size * 0.35);
      p.line(cx - size * 0.35, cy, cx + size * 0.35, cy);
      break;
    case 'exit':
      // Arrow
      p.line(cx - size * 0.3, cy, cx + size * 0.3, cy);
      p.line(cx + size * 0.1, cy - size * 0.2, cx + size * 0.3, cy);
      p.line(cx + size * 0.1, cy + size * 0.2, cx + size * 0.3, cy);
      break;
    case 'dialogue':
      // Speech bubble
      p.ellipse(cx, cy - 5, size * 0.9, size * 0.7);
      p.triangle(cx - 8, cy + 8, cx - 3, cy + 3, cx + 2, cy + 8);
      break;
  }
  p.pop();
}

function getAvailableHotspots(location) {
  const hotspots = [];
  for (let i = 0; i < location.hotspots.length; i++) {
    const hotspot = location.hotspots[i];
    if (hotspot.type === 'item' && hotspot.collected) continue;
    if (hotspot.type === 'use' && hotspot.solved) continue;
    
    if (hotspot.data.requires) {
      const req = hotspot.data.requires;
      if (typeof req === 'string') {
        if (!gameState.puzzlesSolved.includes(req)) continue;
      }
    }
    
    hotspots.push(i);
  }
  return hotspots;
}

export function showMessage(message, duration = 120) {
  gameState.message = message;
  gameState.messageTimer = duration;
}