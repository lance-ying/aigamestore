// rendering.js
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 15, 30);
  
  // Title with glow effect
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(180, 140, 80, 100);
  p.textSize(48);
  p.text("THE HOUSE OF", p.width / 2 + 2, p.height / 2 - 82);
  p.text("DA VINCI III", p.width / 2 + 2, p.height / 2 - 42);
  
  p.fill(220, 180, 100);
  p.textSize(48);
  p.text("THE HOUSE OF", p.width / 2, p.height / 2 - 80);
  p.text("DA VINCI III", p.width / 2, p.height / 2 - 40);
  p.pop();
  
  // Description
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(200, 190, 170);
  p.textSize(14);
  p.text("Solve mechanical puzzles across three rooms", p.width / 2, p.height / 2 + 20);
  p.text("Use the Oculus Perpetua to alter the past", p.width / 2, p.height / 2 + 40);
  p.pop();
  
  // Controls
  p.push();
  p.textAlign(p.LEFT, p.TOP);
  p.fill(180, 170, 150);
  p.textSize(12);
  const startX = 50;
  let startY = p.height / 2 + 80;
  p.text("Arrow Keys: Rotate camera view", startX, startY);
  p.text("Space: Interact with object", startX, startY + 20);
  p.text("Z: Toggle Oculus Perpetua (past/present)", startX, startY + 40);
  p.text("Shift: Examine object", startX, startY + 60);
  p.text("1-3: Select inventory item", startX, startY + 80);
  p.pop();
  
  // Prompt
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  const pulseAlpha = 150 + Math.sin(p.frameCount * 0.1) * 100;
  p.fill(220, 200, 120, pulseAlpha);
  p.textSize(20);
  p.text("PRESS ENTER TO START", p.width / 2, p.height - 40);
  p.pop();
}

export function renderGame(p) {
  // Background with perspective
  const bgColor = gameState.oculusActive ? [40, 30, 50] : [30, 25, 35];
  p.background(...bgColor);
  
  // Draw room environment
  drawRoom(p);
  
  // Draw objects in current room
  drawObjects(p);
  
  // Draw UI
  drawUI(p);
  
  // Draw examination overlay
  if (gameState.examinedObject) {
    drawExaminationOverlay(p);
  }
}

function drawRoom(p) {
  // Floor
  p.push();
  p.fill(40, 35, 30);
  p.rect(0, p.height * 0.65, p.width, p.height * 0.35);
  
  // Floor pattern
  p.stroke(50, 45, 40);
  p.strokeWeight(1);
  for (let i = 0; i < p.width; i += 40) {
    p.line(i, p.height * 0.65, i, p.height);
  }
  p.pop();
  
  // Walls based on camera angle
  drawWalls(p);
  
  // Oculus effect
  if (gameState.oculusActive) {
    p.push();
    p.noFill();
    p.stroke(150, 100, 200, 100);
    p.strokeWeight(3);
    const pulse = Math.sin(gameState.animationFrame * 0.1) * 10;
    p.ellipse(p.width / 2, p.height / 2, 300 + pulse, 300 + pulse);
    p.pop();
  }
}

function drawWalls(p) {
  // Simple wall representation
  p.push();
  p.fill(50, 45, 40);
  p.noStroke();
  
  // Back wall
  p.rect(50, 50, p.width - 100, p.height * 0.5);
  
  // Wall decorations
  p.fill(60, 55, 50);
  p.rect(100, 80, 80, 120);
  p.rect(p.width - 180, 80, 80, 120);
  
  // Shadow
  p.fill(0, 0, 0, 30);
  p.rect(50, p.height * 0.6, p.width - 100, 20);
  p.pop();
}

function drawObjects(p) {
  const currentRoomObjects = gameState.entities.filter(obj => 
    obj.roomId === gameState.currentRoom && !obj.collected
  );
  
  for (const obj of currentRoomObjects) {
    const pos = obj.getScreenPosition(p, gameState.cameraAngle);
    if (!pos) continue;
    
    // Skip if in wrong timeline for Oculus objects
    if (obj.pastState) {
      if (gameState.oculusActive && obj.pastState.visible === false) continue;
      if (!gameState.oculusActive && obj.presentState && obj.presentState.visible === false) continue;
    }
    
    const isHighlighted = gameState.highlightedObject === obj;
    
    p.push();
    
    // Draw object based on type
    switch (obj.type) {
      case "item":
        drawItem(p, obj, pos, isHighlighted);
        break;
      case "mechanism":
        drawMechanism(p, obj, pos, isHighlighted);
        break;
      case "door":
        drawDoor(p, obj, pos, isHighlighted);
        break;
      case "examine":
        drawExaminable(p, obj, pos, isHighlighted);
        break;
    }
    
    // Highlight glow
    if (isHighlighted) {
      p.noFill();
      p.stroke(200, 180, 100, 150);
      p.strokeWeight(3);
      const glowSize = 60 * pos.scale;
      p.ellipse(pos.x, pos.y, glowSize, glowSize);
    }
    
    p.pop();
  }
}

function drawItem(p, obj, pos, isHighlighted) {
  const size = 30 * pos.scale;
  const color = isHighlighted ? [220, 200, 100] : [180, 160, 80];
  
  if (obj.id === "gear1") {
    // Draw gear
    p.fill(...color);
    p.stroke(100, 90, 60);
    p.strokeWeight(2);
    p.push();
    p.translate(pos.x, pos.y);
    p.rotate(gameState.animationFrame * 0.02);
    drawGear(p, 0, 0, size);
    p.pop();
  } else if (obj.id === "key1") {
    // Draw key
    p.fill(...color);
    p.stroke(100, 90, 60);
    p.strokeWeight(2);
    p.ellipse(pos.x, pos.y - size * 0.3, size * 0.4, size * 0.4);
    p.rect(pos.x - size * 0.1, pos.y, size * 0.2, size * 0.6);
    p.rect(pos.x - size * 0.2, pos.y + size * 0.4, size * 0.1, size * 0.1);
  } else if (obj.id === "lens1") {
    // Draw lens
    p.fill(150, 200, 255, 150);
    p.stroke(100, 150, 200);
    p.strokeWeight(2);
    p.ellipse(pos.x, pos.y, size, size);
    p.noFill();
    p.ellipse(pos.x, pos.y, size * 0.7, size * 0.7);
  }
}

function drawMechanism(p, obj, pos, isHighlighted) {
  const size = 50 * pos.scale;
  const color = isHighlighted ? [200, 180, 140] : [140, 120, 80];
  
  if (obj.id === "mech1") {
    // Clock mechanism
    p.fill(...color);
    p.stroke(80, 70, 50);
    p.strokeWeight(2);
    p.rect(pos.x - size * 0.5, pos.y - size * 0.5, size, size);
    
    // Gears inside
    if (obj.activated) {
      p.push();
      p.translate(pos.x, pos.y);
      p.rotate(gameState.animationFrame * 0.05);
      drawGear(p, 0, 0, size * 0.4);
      p.pop();
    } else if (gameState.rooms[1].puzzleState.mechanismFixed) {
      // Fixed but no gear yet
      p.fill(100, 90, 70);
      p.ellipse(pos.x, pos.y, size * 0.3, size * 0.3);
    }
  } else if (obj.id === "chest1") {
    // Chest
    p.fill(...color);
    p.stroke(60, 50, 40);
    p.strokeWeight(2);
    p.rect(pos.x - size * 0.6, pos.y - size * 0.4, size * 1.2, size * 0.8);
    
    if (obj.activated) {
      // Open chest
      p.fill(80, 70, 60);
      p.quad(
        pos.x - size * 0.6, pos.y - size * 0.4,
        pos.x + size * 0.6, pos.y - size * 0.4,
        pos.x + size * 0.5, pos.y - size * 0.8,
        pos.x - size * 0.5, pos.y - size * 0.8
      );
    }
  } else if (obj.id === "device1") {
    // Ancient device
    p.fill(...color);
    p.stroke(60, 50, 70);
    p.strokeWeight(2);
    p.ellipse(pos.x, pos.y, size * 1.2, size * 1.2);
    
    if (obj.activated) {
      // Activated with light rays
      for (let i = 0; i < 8; i++) {
        p.push();
        p.stroke(150, 200, 255, 100);
        p.strokeWeight(3);
        p.translate(pos.x, pos.y);
        p.rotate(i * p.PI / 4 + gameState.animationFrame * 0.03);
        p.line(0, 0, size * 0.8, 0);
        p.pop();
      }
    }
  } else if (obj.id === "pedestal1") {
    // Pedestal
    p.fill(...color);
    p.stroke(80, 70, 60);
    p.strokeWeight(2);
    p.rect(pos.x - size * 0.4, pos.y - size * 0.2, size * 0.8, size * 0.5);
    p.rect(pos.x - size * 0.5, pos.y + size * 0.3, size, size * 0.3);
    
    if (obj.activated) {
      // Gear on pedestal
      p.push();
      p.translate(pos.x, pos.y);
      p.rotate(gameState.animationFrame * 0.03);
      drawGear(p, 0, 0, size * 0.3);
      p.pop();
    }
  }
}

function drawDoor(p, obj, pos, isHighlighted) {
  const size = 80 * pos.scale;
  const room = gameState.rooms[obj.roomId];
  const color = room.doorUnlocked ? [100, 180, 100] : (isHighlighted ? [180, 150, 120] : [120, 100, 80]);
  
  p.fill(...color);
  p.stroke(60, 50, 40);
  p.strokeWeight(3);
  p.rect(pos.x - size * 0.4, pos.y - size * 0.8, size * 0.8, size * 1.2);
  
  // Door handle
  p.fill(180, 160, 100);
  p.ellipse(pos.x + size * 0.2, pos.y, size * 0.1, size * 0.1);
  
  if (!room.doorUnlocked) {
    // Lock indicator
    p.fill(150, 50, 50);
    p.rect(pos.x - size * 0.1, pos.y - size * 0.1, size * 0.2, size * 0.2);
  }
}

function drawExaminable(p, obj, pos, isHighlighted) {
  const size = 40 * pos.scale;
  const color = isHighlighted ? [180, 160, 140] : [140, 120, 100];
  
  if (obj.id === "paint1") {
    // Painting frame
    p.fill(...color);
    p.stroke(80, 70, 60);
    p.strokeWeight(3);
    p.rect(pos.x - size * 0.6, pos.y - size * 0.8, size * 1.2, size * 1.4);
    p.fill(60, 50, 40);
    p.rect(pos.x - size * 0.5, pos.y - size * 0.7, size, size * 1.2);
  } else if (obj.id === "book1") {
    // Book
    p.fill(...color);
    p.stroke(60, 50, 40);
    p.strokeWeight(2);
    p.rect(pos.x - size * 0.5, pos.y - size * 0.3, size, size * 0.6);
    p.line(pos.x, pos.y - size * 0.3, pos.x, pos.y + size * 0.3);
  }
}

function drawGear(p, x, y, size) {
  const teeth = 8;
  p.push();
  p.translate(x, y);
  
  // Draw teeth
  for (let i = 0; i < teeth; i++) {
    p.rotate(p.TWO_PI / teeth);
    p.rect(-size * 0.15, -size * 0.5, size * 0.3, size * 0.2);
  }
  
  // Center circle
  p.fill(100, 90, 70);
  p.ellipse(0, 0, size * 0.4, size * 0.4);
  p.fill(60, 50, 40);
  p.ellipse(0, 0, size * 0.2, size * 0.2);
  p.pop();
}

function drawUI(p) {
  // Room indicator
  p.push();
  p.textAlign(p.LEFT, p.TOP);
  p.fill(200, 180, 150);
  p.textSize(16);
  p.text(`Room ${gameState.currentRoom}`, 10, 10);
  p.pop();
  
  // Score
  p.push();
  p.textAlign(p.RIGHT, p.TOP);
  p.fill(200, 180, 150);
  p.textSize(16);
  p.text(`Score: ${gameState.score}`, p.width - 10, 10);
  p.pop();
  
  // Oculus indicator
  if (gameState.oculusActive) {
    p.push();
    p.textAlign(p.CENTER, p.TOP);
    p.fill(180, 140, 200);
    p.textSize(14);
    p.text("OCULUS ACTIVE - Viewing Past", p.width / 2, 10);
    p.pop();
  }
  
  // Inventory
  drawInventory(p);
  
  // Interaction hint
  if (gameState.highlightedObject) {
    p.push();
    p.textAlign(p.CENTER, p.BOTTOM);
    p.fill(220, 200, 150);
    p.textSize(14);
    p.text(`[SPACE] ${gameState.highlightedObject.name}`, p.width / 2, p.height - 10);
    p.text(`[SHIFT] Examine`, p.width / 2, p.height - 30);
    p.pop();
  }
}

function drawInventory(p) {
  const startX = 10;
  const startY = 40;
  const slotSize = 50;
  const gap = 5;
  
  p.push();
  
  for (let i = 0; i < MAX_INVENTORY_SIZE; i++) {
    const x = startX + i * (slotSize + gap);
    const y = startY;
    
    // Slot background
    const isSelected = i === gameState.selectedItemIndex;
    p.fill(...(isSelected ? [80, 70, 50] : [40, 35, 30]));
    p.stroke(...(isSelected ? [200, 180, 120] : [60, 55, 50]));
    p.strokeWeight(2);
    p.rect(x, y, slotSize, slotSize);
    
    // Item
    if (i < gameState.inventory.length) {
      const item = gameState.inventory[i];
      p.fill(180, 160, 100);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(10);
      p.text(item.name.substring(0, 8), x + slotSize / 2, y + slotSize / 2);
    }
    
    // Number label
    p.fill(150, 140, 120);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(10);
    p.text(i + 1, x + 2, y + 2);
  }
  
  p.pop();
}

function drawExaminationOverlay(p) {
  const obj = gameState.examinedObject;
  
  // Semi-transparent overlay
  p.push();
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, p.width, p.height);
  p.pop();
  
  // Examination box
  p.push();
  p.fill(40, 35, 30);
  p.stroke(120, 100, 80);
  p.strokeWeight(3);
  const boxW = 400;
  const boxH = 250;
  const boxX = (p.width - boxW) / 2;
  const boxY = (p.height - boxH) / 2;
  p.rect(boxX, boxY, boxW, boxH);
  
  // Title
  p.fill(220, 200, 150);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(20);
  p.text(obj.name, p.width / 2, boxY + 20);
  
  // Description
  p.fill(180, 170, 150);
  p.textSize(14);
  p.text(obj.description, p.width / 2, boxY + 60, boxW - 40, boxH - 100);
  
  // Close instruction
  p.fill(150, 140, 120);
  p.textSize(12);
  p.text("[SHIFT] Close", p.width / 2, boxY + boxH - 30);
  p.pop();
}

export function renderPausedScreen(p) {
  renderGame(p);
  
  // Pause overlay
  p.push();
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, p.width, p.height);
  p.pop();
  
  p.push();
  p.textAlign(p.RIGHT, p.TOP);
  p.fill(220, 200, 150);
  p.textSize(18);
  p.text("PAUSED", p.width - 10, 10);
  p.pop();
}

export function renderGameOverScreen(p) {
  p.background(20, 15, 30);
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  // Title
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(isWin ? [100, 200, 100] : [200, 100, 100]);
  p.textSize(48);
  p.text(isWin ? "VICTORY!" : "GAME OVER", p.width / 2, p.height / 2 - 80);
  p.pop();
  
  // Message
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(200, 190, 170);
  p.textSize(18);
  if (isWin) {
    p.text("You have unlocked the secrets of Da Vinci!", p.width / 2, p.height / 2 - 20);
    p.text("All puzzles solved across three rooms.", p.width / 2, p.height / 2 + 10);
  }
  p.pop();
  
  // Score
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(220, 200, 150);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, p.width / 2, p.height / 2 + 60);
  p.pop();
  
  // Restart prompt
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  const pulseAlpha = 150 + Math.sin(p.frameCount * 0.1) * 100;
  p.fill(220, 200, 120, pulseAlpha);
  p.textSize(20);
  p.text("PRESS R TO RESTART", p.width / 2, p.height - 40);
  p.pop();
}

const MAX_INVENTORY_SIZE = 5;