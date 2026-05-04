// ui.js - UI rendering functions

import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES } from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 20, 40);
  
  // Title with decoration
  p.fill(255, 200, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("BOXVILLE 2", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(200, 180, 150);
  p.textSize(16);
  p.text("A Mystery Adventure", CANVAS_WIDTH / 2, 120);
  
  // Character illustration
  p.push();
  p.translate(CANVAS_WIDTH / 2, 200);
  p.fill(220, 40, 40);
  p.stroke(150, 20, 20);
  p.strokeWeight(2);
  p.rect(-15, -20, 30, 40, 3);
  p.fill(180, 30, 30);
  p.ellipse(0, -20, 30, 8);
  p.ellipse(0, 20, 30, 8);
  p.fill(255, 240, 220);
  p.noStroke();
  p.rect(-11, -8, 22, 16, 2);
  p.fill(40, 40, 50);
  p.ellipse(-6, -2, 4, 4);
  p.ellipse(6, -2, 4, 4);
  p.noFill();
  p.stroke(40, 40, 50);
  p.strokeWeight(1.5);
  p.arc(0, 2, 12, 8, 0, p.PI);
  p.pop();
  
  // Instructions
  p.fill(220, 220, 240);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    "Help the red can solve puzzles and find their friend!",
    "",
    "Arrow Keys: Move left and right",
    "Space: Interact with objects",
    "Z: Open/close inventory",
    "Shift: Use inventory item on object",
    "ESC: Pause game"
  ];
  
  let yPos = 260;
  for (const line of instructions) {
    p.text(line, 80, yPos);
    yPos += 18;
  }
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  const alpha = p.map(p.sin(p.frameCount * 0.1), -1, 1, 150, 255);
  p.fill(255, 255, 100, alpha);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 380);
}

export function renderPauseOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 255, 255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

export function renderGameOver(p, gameState) {
  p.background(20, 20, 40);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Title
  p.fill(isWin ? 100 : 220, isWin ? 255 : 100, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "MYSTERY SOLVED!" : "GAME OVER", CANVAS_WIDTH / 2, 100);
  
  if (isWin) {
    // Victory message
    p.fill(220, 220, 240);
    p.textSize(18);
    p.text("You helped the red can solve all the puzzles!", CANVAS_WIDTH / 2, 160);
    p.text("The fireworks are fixed and the friend is found!", CANVAS_WIDTH / 2, 190);
    
    // Fireworks animation
    for (let i = 0; i < 5; i++) {
      const x = 100 + i * 100;
      const burst = (p.frameCount + i * 20) % 60;
      if (burst < 30) {
        p.push();
        p.translate(x, 250);
        p.noFill();
        p.strokeWeight(2);
        for (let j = 0; j < 8; j++) {
          const angle = j * p.PI / 4;
          const colors = [[255, 100, 100], [100, 255, 100], [100, 100, 255], [255, 255, 100]];
          const col = colors[i % 4];
          p.stroke(...col);
          const len = burst * 2;
          p.line(0, 0, p.cos(angle) * len, p.sin(angle) * len);
        }
        p.pop();
      }
    }
  } else {
    p.fill(220, 220, 240);
    p.textSize(18);
    p.text("The mystery remains unsolved...", CANVAS_WIDTH / 2, 160);
  }
  
  // Score
  p.fill(255, 255, 200);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 280);
  
  // Restart prompt
  p.fill(255, 255, 100);
  p.textSize(20);
  const alpha = p.map(p.sin(p.frameCount * 0.1), -1, 1, 150, 255);
  p.fill(255, 255, 100, alpha);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 350);
}

export function renderInventory(p, gameState, showInventory) {
  if (!showInventory) return;
  
  const invWidth = 400;
  const invHeight = 120;
  const invX = (CANVAS_WIDTH - invWidth) / 2;
  const invY = (CANVAS_HEIGHT - invHeight) / 2;
  
  // Background
  p.fill(40, 40, 60, 240);
  p.stroke(200, 200, 220);
  p.strokeWeight(2);
  p.rect(invX, invY, invWidth, invHeight, 10);
  
  // Title
  p.fill(255, 255, 255);
  p.noStroke();
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(16);
  p.text("INVENTORY", CANVAS_WIDTH / 2, invY + 10);
  
  // Items
  const itemsPerRow = 6;
  const itemSize = 50;
  const startX = invX + 30;
  const startY = invY + 45;
  
  for (let i = 0; i < gameState.inventory.length; i++) {
    const col = i % itemsPerRow;
    const row = p.floor(i / itemsPerRow);
    const x = startX + col * 60;
    const y = startY + row * 60;
    
    // Slot background
    const isSelected = i === gameState.selectedInventoryIndex;
    p.fill(isSelected ? 80 : 60, isSelected ? 80 : 60, isSelected ? 100 : 80);
    p.stroke(isSelected ? 255 : 150, isSelected ? 255 : 150, isSelected ? 100 : 150);
    p.strokeWeight(isSelected ? 3 : 1);
    p.rect(x - itemSize / 2, y - itemSize / 2, itemSize, itemSize, 5);
    
    // Item icon
    const item = gameState.inventory[i];
    p.push();
    p.translate(x, y);
    p.scale(0.8);
    
    if (item.icon === "gear") {
      p.fill(120, 120, 140);
      p.stroke(80, 80, 100);
      p.strokeWeight(2);
      p.circle(0, 0, 20);
      for (let j = 0; j < 8; j++) {
        const angle = j * p.PI / 4;
        const gx = p.cos(angle) * 10;
        const gy = p.sin(angle) * 10;
        p.rect(gx - 2, gy - 2, 4, 4);
      }
    } else if (item.icon === "key") {
      p.fill(220, 180, 60);
      p.stroke(160, 120, 30);
      p.strokeWeight(2);
      p.circle(-5, 0, 10);
      p.rect(0, -2, 12, 4);
      p.rect(8, -5, 3, 5);
      p.rect(12, -5, 3, 5);
    } else if (item.icon === "wrench") {
      p.fill(140, 140, 150);
      p.stroke(90, 90, 100);
      p.strokeWeight(2);
      p.rect(-6, -2, 16, 4);
      p.circle(-8, 0, 8);
      p.rect(6, -6, 5, 12);
    } else if (item.icon === "fuse") {
      p.fill(200, 50, 50);
      p.stroke(140, 30, 30);
      p.strokeWeight(2);
      p.rect(-5, -2, 10, 4, 2);
      p.fill(180, 180, 190);
      p.rect(-6, -2, 2, 4);
      p.rect(4, -2, 2, 4);
    }
    
    p.pop();
  }
  
  // Instructions
  p.fill(220, 220, 240);
  p.textSize(12);
  p.textAlign(p.CENTER, p.TOP);
  p.text("Arrow keys to select | Shift + Space to use | Z to close", CANVAS_WIDTH / 2, invY + invHeight - 20);
}

export function renderThoughtBubble(p, gameState) {
  if (!gameState.thoughtBubble || gameState.thoughtBubbleTimer <= 0) return;
  
  const bubble = gameState.thoughtBubble;
  const x = bubble.x;
  const y = bubble.y - 60;
  
  // Bubble tail
  p.fill(255, 255, 255);
  p.noStroke();
  p.circle(x - 10, y + 35, 8);
  p.circle(x - 15, y + 42, 5);
  
  // Main bubble
  p.fill(255, 255, 255);
  p.stroke(100, 100, 100);
  p.strokeWeight(2);
  p.ellipse(x, y, 80, 50);
  
  // Icon inside bubble
  p.push();
  p.translate(x, y);
  p.noStroke();
  
  if (bubble.type === "question") {
    p.fill(100, 100, 120);
    p.textSize(32);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("?", 0, 0);
  } else if (bubble.type === "item") {
    // Draw item icon
    p.scale(0.6);
    if (bubble.itemName === "key") {
      p.fill(220, 180, 60);
      p.stroke(160, 120, 30);
      p.strokeWeight(2);
      p.circle(-5, 0, 12);
      p.rect(0, -2, 15, 4);
      p.rect(10, -6, 3, 6);
      p.rect(14, -6, 3, 6);
    }
  } else if (bubble.type === "success") {
    p.fill(100, 200, 100);
    p.stroke(50, 150, 50);
    p.strokeWeight(3);
    p.noFill();
    p.line(-10, 0, -2, 8);
    p.line(-2, 8, 10, -8);
  }
  
  p.pop();
}

export function renderUI(p, gameState) {
  // Score
  p.fill(255, 255, 255);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text(`Score: ${gameState.score}`, 10, 10);
  
  // Scene name
  p.textAlign(p.CENTER, p.TOP);
  p.text(`Scene: ${gameState.currentScene + 1}/4`, CANVAS_WIDTH / 2, 10);
  
  // Inventory count
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`Items: ${gameState.inventory.length}`, CANVAS_WIDTH - 10, 10);
  
  // Hint text
  if (gameState.highlightedObject) {
    p.fill(255, 255, 100);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.textSize(14);
    p.text("Press SPACE to interact", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 10);
  }
}