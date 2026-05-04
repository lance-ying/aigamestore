// renderer.js - Renders game graphics

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { getCurrentLocation, getVisibleHotspots } from './location_manager.js';

export function renderGame(p) {
  p.background(20, 25, 35);
  
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
    case GAME_PHASES.GAME_OVER_LOSE:
      renderGameOver(p);
      break;
  }
}

function renderStartScreen(p) {
  // Background gradient
  for (let i = 0; i < CANVAS_HEIGHT; i++) {
    const inter = p.map(i, 0, CANVAS_HEIGHT, 0, 1);
    const c = p.lerpColor(p.color(40, 50, 80), p.color(20, 25, 35), inter);
    p.stroke(c);
    p.line(0, i, CANVAS_WIDTH, i);
  }
  
  // Decorative island silhouette
  p.fill(10, 15, 25, 150);
  p.noStroke();
  p.beginShape();
  p.vertex(0, 350);
  p.vertex(100, 320);
  p.vertex(150, 280);
  p.vertex(200, 290);
  p.vertex(300, 250);
  p.vertex(400, 280);
  p.vertex(500, 300);
  p.vertex(600, 320);
  p.vertex(600, 400);
  p.vertex(0, 400);
  p.endShape(p.CLOSE);
  
  // Title
  p.fill(255, 220, 180);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("Lost Island 2", CANVAS_WIDTH / 2, 80);
  
  p.textSize(18);
  p.fill(180, 160, 140);
  p.text("The Ashes of Time", CANVAS_WIDTH / 2, 115);
  
  // Instructions
  p.textSize(14);
  p.fill(200, 200, 200);
  p.textAlign(p.CENTER, p.TOP);
  p.text("Explore the mysterious island and solve intricate puzzles", CANVAS_WIDTH / 2, 160);
  p.text("to uncover its ancient secrets.", CANVAS_WIDTH / 2, 180);
  
  p.textSize(12);
  p.fill(150, 150, 150);
  p.text("Arrow Keys: Navigate hotspots", CANVAS_WIDTH / 2, 220);
  p.text("Space: Interact with selected hotspot", CANVAS_WIDTH / 2, 240);
  p.text("Shift: Cycle through inventory", CANVAS_WIDTH / 2, 260);
  p.text("Z: Examine selected item", CANVAS_WIDTH / 2, 280);
  
  // Start prompt
  p.textSize(16);
  p.fill(255, 200, 100, 150 + 100 * p.sin(p.frameCount * 0.05));
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 340);
}

function renderGameplay(p) {
  const location = getCurrentLocation();
  
  // Draw location background
  renderLocationBackground(p, gameState.currentLocation);
  
  // Draw hotspots
  const visibleHotspots = getVisibleHotspots();
  visibleHotspots.forEach((hotspot, index) => {
    const isSelected = index === gameState.selectedHotspotIndex;
    renderHotspot(p, hotspot, isSelected);
  });
  
  // Draw UI
  renderUI(p, location);
  
  // Draw inventory
  renderInventory(p);
}

function renderLocationBackground(p, locationKey) {
  const backgrounds = {
    beach: () => {
      // Sky
      for (let i = 0; i < 250; i++) {
        const c = p.lerpColor(p.color(135, 206, 235), p.color(100, 150, 200), i / 250);
        p.stroke(c);
        p.line(0, i, CANVAS_WIDTH, i);
      }
      // Sand
      p.fill(238, 214, 175);
      p.noStroke();
      p.rect(0, 250, CANVAS_WIDTH, 150);
      // Water
      p.fill(70, 130, 180, 150);
      p.rect(0, 0, CANVAS_WIDTH, 100);
      // Waves
      for (let i = 0; i < 3; i++) {
        p.stroke(255, 255, 255, 100);
        p.strokeWeight(2);
        p.noFill();
        p.arc(100 + i * 200, 80, 100, 30, 0, p.PI);
      }
    },
    forest: () => {
      // Sky gradient
      for (let i = 0; i < 150; i++) {
        const c = p.lerpColor(p.color(100, 150, 200), p.color(60, 100, 140), i / 150);
        p.stroke(c);
        p.line(0, i, CANVAS_WIDTH, i);
      }
      // Ground
      p.fill(34, 139, 34);
      p.noStroke();
      p.rect(0, 150, CANVAS_WIDTH, 250);
      // Trees
      p.fill(101, 67, 33);
      for (let i = 0; i < 5; i++) {
        const x = 100 + i * 120;
        p.rect(x - 10, 100, 20, 150);
        p.fill(34, 139, 34);
        p.ellipse(x, 100, 80, 80);
        p.fill(101, 67, 33);
      }
    },
    lighthouse: () => {
      // Sky
      for (let i = 0; i < CANVAS_HEIGHT; i++) {
        const c = p.lerpColor(p.color(100, 120, 160), p.color(60, 80, 120), i / CANVAS_HEIGHT);
        p.stroke(c);
        p.line(0, i, CANVAS_WIDTH, i);
      }
      // Ground
      p.fill(100, 100, 100);
      p.noStroke();
      p.rect(0, 300, CANVAS_WIDTH, 100);
      // Lighthouse structure
      p.fill(200, 200, 200);
      p.rect(250, 100, 100, 200);
      p.fill(180, 180, 180);
      p.triangle(250, 100, 350, 100, 300, 50);
      // Windows
      p.fill(255, 255, 150, 150);
      p.rect(280, 150, 40, 40);
      p.rect(280, 220, 40, 40);
    },
    temple: () => {
      // Sky
      for (let i = 0; i < CANVAS_HEIGHT; i++) {
        const c = p.lerpColor(p.color(80, 100, 140), p.color(40, 50, 80), i / CANVAS_HEIGHT);
        p.stroke(c);
        p.line(0, i, CANVAS_WIDTH, i);
      }
      // Ground
      p.fill(120, 100, 80);
      p.noStroke();
      p.rect(0, 250, CANVAS_WIDTH, 150);
      // Temple structure
      p.fill(160, 140, 120);
      p.rect(200, 120, 200, 180);
      p.fill(140, 120, 100);
      p.triangle(200, 120, 400, 120, 300, 60);
      // Pillars
      p.fill(130, 110, 90);
      p.rect(220, 150, 30, 150);
      p.rect(350, 150, 30, 150);
      // Door
      p.fill(80, 60, 40);
      p.rect(270, 200, 60, 100);
    },
    cave: () => {
      // Dark cave background
      for (let i = 0; i < CANVAS_HEIGHT; i++) {
        const c = p.lerpColor(p.color(30, 30, 50), p.color(10, 10, 30), i / CANVAS_HEIGHT);
        p.stroke(c);
        p.line(0, i, CANVAS_WIDTH, i);
      }
      // Cave walls
      p.fill(60, 60, 80);
      p.noStroke();
      p.beginShape();
      p.vertex(0, 0);
      p.vertex(200, 100);
      p.vertex(250, 200);
      p.vertex(200, 300);
      p.vertex(0, CANVAS_HEIGHT);
      p.endShape(p.CLOSE);
      
      p.beginShape();
      p.vertex(CANVAS_WIDTH, 0);
      p.vertex(400, 100);
      p.vertex(350, 200);
      p.vertex(400, 300);
      p.vertex(CANVAS_WIDTH, CANVAS_HEIGHT);
      p.endShape(p.CLOSE);
      
      // Glowing crystals
      for (let i = 0; i < 5; i++) {
        const x = 150 + i * 80;
        const y = 150 + (i % 2) * 100;
        p.fill(100, 150, 255, 100);
        p.ellipse(x, y, 30, 30);
        p.fill(150, 200, 255, 200);
        p.ellipse(x, y, 15, 15);
      }
    }
  };
  
  if (backgrounds[locationKey]) {
    backgrounds[locationKey]();
  }
}

function renderHotspot(p, hotspot, isSelected) {
  p.push();
  
  // Highlight selected hotspot
  if (isSelected) {
    p.fill(255, 255, 100, 100);
    p.stroke(255, 255, 0);
    p.strokeWeight(2);
  } else {
    p.fill(200, 200, 200, 50);
    p.stroke(150, 150, 150);
    p.strokeWeight(1);
  }
  
  p.ellipse(hotspot.x, hotspot.y, hotspot.radius * 2);
  
  // Draw icon based on type
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(12);
  p.fill(255);
  p.noStroke();
  
  const icons = {
    item: "▣",
    exit: "→",
    puzzle: "⚙",
    codePuzzle: "#"
  };
  
  p.text(icons[hotspot.type] || "?", hotspot.x, hotspot.y);
  
  p.pop();
}

function renderUI(p, location) {
  // Top bar
  p.fill(20, 20, 30, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 60);
  
  // Location name
  p.fill(255, 220, 180);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(18);
  p.text(location.name, 15, 20);
  
  // Score
  p.textAlign(p.RIGHT, p.CENTER);
  p.textSize(14);
  p.fill(200, 200, 200);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 15, 20);
  
  // Description
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(11);
  p.fill(180, 180, 180);
  p.text(location.description, 15, 45);
}

function renderInventory(p) {
  const invY = CANVAS_HEIGHT - 70;
  
  // Inventory background
  p.fill(20, 20, 30, 200);
  p.noStroke();
  p.rect(0, invY, CANVAS_WIDTH, 70);
  
  // Inventory label
  p.fill(200, 200, 200);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text("Inventory:", 10, invY + 5);
  
  // Draw inventory items
  const startX = 10;
  const startY = invY + 25;
  const slotSize = 35;
  const spacing = 5;
  
  for (let i = 0; i < 8; i++) {
    const x = startX + i * (slotSize + spacing);
    const y = startY;
    
    // Slot background
    if (i === gameState.selectedInventoryIndex) {
      p.fill(100, 150, 200);
      p.stroke(150, 200, 255);
    } else {
      p.fill(40, 40, 50);
      p.stroke(60, 60, 70);
    }
    p.strokeWeight(2);
    p.rect(x, y, slotSize, slotSize);
    
    // Item
    if (i < gameState.inventory.length) {
      p.fill(255, 255, 255);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(10);
      const itemName = gameState.inventory[i];
      p.text(itemName.substring(0, 8), x + slotSize / 2, y + slotSize / 2);
    }
  }
  
  // Selected item description
  if (gameState.selectedInventoryIndex >= 0 && gameState.selectedInventoryIndex < gameState.inventory.length) {
    p.fill(200, 200, 200);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(10);
    const itemName = gameState.inventory[gameState.selectedInventoryIndex];
    p.text(`Selected: ${itemName}`, 320, invY + 5);
  }
  
  // Item count
  p.fill(150, 150, 150);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(10);
  p.text(`${gameState.inventory.length}/8`, CANVAS_WIDTH - 10, invY + 5);
}

function renderPauseOverlay(p) {
  p.fill(0, 0, 0, 100);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 255, 255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

function renderGameOver(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Win/Lose message
  p.fill(255, 220, 180);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    p.text("Victory!", CANVAS_WIDTH / 2, 120);
    p.textSize(18);
    p.fill(200, 200, 200);
    p.text("You have uncovered the island's secrets!", CANVAS_WIDTH / 2, 170);
  } else {
    p.text("Game Over", CANVAS_WIDTH / 2, 120);
  }
  
  // Stats
  p.textSize(16);
  p.fill(180, 180, 180);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  p.text(`Items Collected: ${gameState.itemsCollected}`, CANVAS_WIDTH / 2, 250);
  p.text(`Puzzles Solved: ${gameState.puzzlesCompleted}`, CANVAS_WIDTH / 2, 280);
  
  // Restart prompt
  p.textSize(16);
  p.fill(255, 200, 100, 150 + 100 * p.sin(p.frameCount * 0.05));
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 340);
}