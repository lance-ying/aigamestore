// scene_renderer.js - Scene rendering logic

import { SCENES, CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export function renderScene(p, sceneId) {
  const scene = SCENES[sceneId];
  if (!scene) return;

  // Draw background based on scene type
  drawBackground(p, scene.background.type);

  // Draw hotspots
  scene.hotspots.forEach((hotspot, index) => {
    const isVisible = !hotspot.requires || gameState.puzzlesSolved.includes(hotspot.requires);
    if (isVisible && !hotspot.item || (hotspot.item && !gameState.inventory.includes(hotspot.item))) {
      const isSelected = gameState.selectedHotspot === index && !gameState.showInventory;
      drawHotspot(p, hotspot, isSelected);
    }
  });

  // Draw exits
  scene.exits.forEach((exit) => {
    const isUnlocked = !exit.requires || gameState.puzzlesSolved.includes(exit.requires);
    if (isUnlocked) {
      drawExit(p, exit);
    }
  });

  // Draw scene name
  p.push();
  p.fill(255, 255, 255, 200);
  p.noStroke();
  p.rect(10, 10, 300, 30, 5);
  p.fill(20, 20, 40);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(16);
  p.text(scene.name, 20, 25);
  p.pop();
}

function drawBackground(p, type) {
  switch (type) {
    case "entrance":
      // Stone gates with misty atmosphere
      p.background(80, 90, 100);
      
      // Mist layers
      for (let i = 0; i < 3; i++) {
        p.fill(150, 160, 170, 30);
        p.noStroke();
        p.ellipse(300, 200 + i * 50, 800, 200);
      }
      
      // Gate pillars
      p.fill(60, 60, 70);
      p.rect(100, 50, 80, 300);
      p.rect(420, 50, 80, 300);
      
      // Gate arch
      p.arc(300, 50, 320, 200, p.PI, 0);
      
      // Runes on arch
      p.stroke(100, 200, 255, 150);
      p.strokeWeight(2);
      p.noFill();
      for (let i = 0; i < 5; i++) {
        const x = 180 + i * 50;
        p.circle(x, 80, 20);
      }
      break;

    case "plaza":
      // Central plaza with fountain
      p.background(90, 100, 110);
      
      // Sky gradient
      for (let i = 0; i < 200; i++) {
        p.stroke(90 + i * 0.3, 100 + i * 0.3, 110 + i * 0.3);
        p.line(0, i, CANVAS_WIDTH, i);
      }
      
      // Ground
      p.fill(70, 75, 80);
      p.noStroke();
      p.rect(0, 250, CANVAS_WIDTH, 150);
      
      // Fountain structure
      p.fill(80, 85, 90);
      p.ellipse(300, 220, 140, 60);
      p.rect(270, 180, 60, 40);
      p.ellipse(300, 180, 60, 30);
      
      // Statue on left
      p.fill(90, 85, 80);
      p.rect(145, 200, 10, 80);
      p.ellipse(150, 190, 30, 40);
      break;

    case "market":
      // Market district
      p.background(85, 80, 90);
      
      // Buildings in background
      p.fill(60, 55, 65);
      p.rect(0, 100, 150, 150);
      p.rect(450, 120, 150, 130);
      
      // Market stalls
      p.fill(70, 60, 50);
      p.rect(180, 220, 100, 80);
      p.fill(80, 70, 60);
      p.triangle(180, 220, 230, 180, 280, 220);
      
      p.fill(70, 60, 50);
      p.rect(380, 270, 80, 60);
      
      // Ground
      p.fill(75, 70, 75);
      p.rect(0, 300, CANVAS_WIDTH, 100);
      break;

    case "temple":
      // Sacred temple interior
      p.background(40, 30, 60);
      
      // Ethereal light
      p.fill(150, 100, 200, 80);
      p.noStroke();
      for (let i = 0; i < 5; i++) {
        p.ellipse(300, 100 + i * 30, 400 - i * 50, 150);
      }
      
      // Pillars
      p.fill(80, 70, 100);
      p.rect(80, 100, 40, 250);
      p.rect(480, 100, 40, 250);
      
      // Altar area
      p.fill(60, 50, 80);
      p.rect(250, 200, 100, 60);
      p.fill(100, 80, 120);
      p.rect(260, 190, 80, 10);
      
      // Mural on left
      p.fill(70, 60, 90);
      p.rect(130, 130, 100, 120);
      p.fill(120, 100, 150);
      p.circle(180, 160, 30);
      p.circle(180, 200, 25);
      p.circle(180, 230, 20);
      break;

    case "tower":
      // Celestial tower
      p.background(20, 20, 40);
      
      // Stars
      p.fill(255, 255, 200);
      p.noStroke();
      for (let i = 0; i < 30; i++) {
        const x = (i * 73) % CANVAS_WIDTH;
        const y = (i * 37) % 200;
        p.circle(x, y, 2);
      }
      
      // Tower structure
      p.fill(50, 50, 70);
      p.rect(250, 200, 100, 200);
      p.triangle(250, 200, 300, 120, 350, 200);
      
      // Windows
      p.fill(100, 100, 150);
      p.rect(270, 220, 25, 35);
      p.rect(305, 220, 25, 35);
      
      // Telescope
      p.fill(80, 80, 100);
      p.push();
      p.translate(350, 150);
      p.rotate(-p.PI / 6);
      p.rect(0, -5, 70, 10);
      p.pop();
      
      // Pedestal
      p.fill(70, 70, 90);
      p.rect(285, 240, 30, 40);
      break;
  }
}

function drawHotspot(p, hotspot, isSelected) {
  p.push();
  
  if (isSelected) {
    p.fill(255, 255, 0, 100);
    p.stroke(255, 255, 0);
    p.strokeWeight(3);
  } else {
    p.fill(200, 200, 255, 50);
    p.stroke(200, 200, 255);
    p.strokeWeight(1);
  }
  
  p.rect(hotspot.x - hotspot.w / 2, hotspot.y - hotspot.h / 2, hotspot.w, hotspot.h, 5);
  
  // Label
  if (isSelected) {
    p.fill(255, 255, 255, 230);
    p.noStroke();
    const textW = p.textWidth(hotspot.label) + 20;
    p.rect(hotspot.x - textW / 2, hotspot.y - hotspot.h / 2 - 30, textW, 25, 3);
    p.fill(20, 20, 40);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text(hotspot.label, hotspot.x, hotspot.y - hotspot.h / 2 - 17);
  }
  
  p.pop();
}

function drawExit(p, exit) {
  p.push();
  
  // Arrow indicator
  p.fill(150, 255, 150, 180);
  p.stroke(100, 200, 100);
  p.strokeWeight(2);
  
  const arrowSize = 20;
  p.triangle(
    exit.x, exit.y - arrowSize,
    exit.x - arrowSize / 2, exit.y,
    exit.x + arrowSize / 2, exit.y
  );
  
  // Label
  p.fill(200, 255, 200);
  p.noStroke();
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(11);
  p.text(exit.label, exit.x, exit.y + 5);
  
  p.pop();
}

export function renderUI(p) {
  // Score
  p.push();
  p.fill(255, 255, 255, 200);
  p.noStroke();
  p.rect(CANVAS_WIDTH - 110, 10, 100, 30, 5);
  p.fill(20, 20, 40);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 60, 25);
  p.pop();

  // Inventory bar
  renderInventoryBar(p);

  // Inventory panel
  if (gameState.showInventory) {
    renderInventoryPanel(p);
  }

  // Journal panel
  if (gameState.showJournal) {
    renderJournalPanel(p);
  }

  // Help text
  if (!gameState.showInventory && !gameState.showJournal) {
    p.push();
    p.fill(255, 255, 255, 180);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(10);
    p.text("Z: Inventory | Shift: Journal | Arrows: Select | Space: Interact", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20);
    p.pop();
  }
}

function renderInventoryBar(p) {
  p.push();
  p.fill(40, 40, 60, 220);
  p.noStroke();
  p.rect(10, CANVAS_HEIGHT - 60, CANVAS_WIDTH - 20, 50, 5);
  
  // Draw inventory items
  const itemsPerRow = 8;
  gameState.inventory.forEach((itemId, index) => {
    const x = 25 + (index % itemsPerRow) * 70;
    const y = CANVAS_HEIGHT - 45;
    
    const isSelected = gameState.selectedInventoryItem === index && gameState.showInventory;
    
    if (isSelected) {
      p.fill(255, 255, 0, 150);
      p.stroke(255, 255, 0);
      p.strokeWeight(2);
    } else {
      p.fill(80, 80, 100);
      p.stroke(120, 120, 140);
      p.strokeWeight(1);
    }
    
    p.rect(x, y, 50, 30, 3);
    
    // Item icon
    drawItemIcon(p, itemId, x + 25, y + 15);
  });
  
  p.pop();
}

function renderInventoryPanel(p) {
  p.push();
  p.fill(20, 20, 40, 240);
  p.noStroke();
  p.rect(50, 60, CANVAS_WIDTH - 100, CANVAS_HEIGHT - 140, 10);
  
  p.fill(255, 255, 255);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(18);
  p.text("INVENTORY", CANVAS_WIDTH / 2, 75);
  
  if (gameState.inventory.length === 0) {
    p.textSize(14);
    p.fill(180, 180, 180);
    p.text("No items collected yet", CANVAS_WIDTH / 2, 150);
  } else {
    // Draw items in grid
    const itemsPerRow = 4;
    gameState.inventory.forEach((itemId, index) => {
      const col = index % itemsPerRow;
      const row = Math.floor(index / itemsPerRow);
      const x = 100 + col * 120;
      const y = 120 + row * 80;
      
      const isSelected = gameState.selectedInventoryItem === index;
      
      if (isSelected) {
        p.fill(255, 255, 0, 150);
        p.stroke(255, 255, 0);
        p.strokeWeight(3);
      } else {
        p.fill(60, 60, 80);
        p.stroke(100, 100, 120);
        p.strokeWeight(1);
      }
      
      p.rect(x, y, 100, 60, 5);
      
      // Item icon and name
      drawItemIcon(p, itemId, x + 50, y + 25);
      
      p.fill(255, 255, 255);
      p.noStroke();
      p.textSize(10);
      p.textAlign(p.CENTER, p.TOP);
      p.text(itemId.replace(/_/g, ' ').toUpperCase(), x + 50, y + 45);
    });
  }
  
  p.fill(200, 200, 200);
  p.textSize(12);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.text("Use Arrows to select | Space to use | Z to close", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 90);
  
  p.pop();
}

function renderJournalPanel(p) {
  p.push();
  p.fill(30, 25, 20, 240);
  p.noStroke();
  p.rect(50, 60, CANVAS_WIDTH - 100, CANVAS_HEIGHT - 140, 10);
  
  p.fill(255, 240, 200);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(18);
  p.text("JOURNAL", CANVAS_WIDTH / 2, 75);
  
  if (gameState.journal.length === 0) {
    p.textSize(14);
    p.fill(180, 170, 150);
    p.text("No clues discovered yet", CANVAS_WIDTH / 2, 150);
  } else {
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(12);
    p.fill(240, 230, 210);
    
    gameState.journal.forEach((entry, index) => {
      const y = 110 + index * 35;
      p.text(`• ${entry}`, 70, y);
    });
  }
  
  p.fill(220, 210, 190);
  p.textSize(12);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.text("Press Shift to close", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 90);
  
  p.pop();
}

function drawItemIcon(p, itemId, x, y) {
  p.push();
  p.translate(x, y);
  
  switch (itemId) {
    case "stone_key":
      p.fill(120, 120, 130);
      p.noStroke();
      p.ellipse(0, -3, 8, 8);
      p.rect(-2, -3, 4, 10);
      p.rect(-4, 5, 8, 2);
      break;
    
    case "moon_stone":
      p.fill(200, 220, 255);
      p.stroke(150, 170, 255);
      p.strokeWeight(2);
      p.ellipse(-2, 0, 12, 14);
      p.ellipse(2, 0, 8, 10);
      break;
    
    case "sun_medallion":
      p.fill(255, 215, 0);
      p.stroke(255, 180, 0);
      p.strokeWeight(2);
      p.circle(0, 0, 14);
      p.noStroke();
      for (let i = 0; i < 8; i++) {
        p.push();
        p.rotate((p.PI * 2 * i) / 8);
        p.triangle(0, -8, -2, -10, 2, -10);
        p.pop();
      }
      break;
    
    case "star_gem":
      p.fill(200, 180, 255);
      p.stroke(150, 130, 255);
      p.strokeWeight(2);
      p.beginShape();
      for (let i = 0; i < 5; i++) {
        const angle = (p.PI * 2 * i) / 5 - p.PI / 2;
        const r = i % 2 === 0 ? 8 : 4;
        p.vertex(r * p.cos(angle), r * p.sin(angle));
      }
      p.endShape(p.CLOSE);
      break;
    
    case "silver_key":
      p.fill(200, 200, 210);
      p.noStroke();
      p.ellipse(0, -3, 7, 7);
      p.rect(-1.5, -3, 3, 9);
      p.rect(-3, 4, 6, 2);
      break;
    
    case "power_crystal":
      p.fill(255, 100, 255, 200);
      p.stroke(255, 50, 255);
      p.strokeWeight(2);
      p.beginShape();
      p.vertex(0, -8);
      p.vertex(6, 0);
      p.vertex(0, 8);
      p.vertex(-6, 0);
      p.endShape(p.CLOSE);
      p.fill(255, 200, 255, 150);
      p.noStroke();
      p.circle(0, 0, 6);
      break;
  }
  
  p.pop();
}