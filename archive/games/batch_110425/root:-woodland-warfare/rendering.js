// rendering.js - All rendering functions
import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, FACTIONS, gameState } from './globals.js';
import { CLEARING_SUITS, BUILDING_TYPES } from './globals.js';

export function renderStartScreen(p) {
  p.background(40, 30, 20);
  
  // Title with decorative elements
  p.push();
  p.fill(220, 180, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("ROOT", CANVAS_WIDTH / 2, 80);
  
  p.textSize(16);
  p.fill(180, 140, 80);
  p.text("~ Woodland Warfare ~", CANVAS_WIDTH / 2, 115);
  p.pop();
  
  // Description
  p.push();
  p.fill(220, 200, 180);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(13);
  p.text("Lead your faction to victory in the woodland!", CANVAS_WIDTH / 2, 160);
  p.text("Control territories, build structures, and manage resources.", CANVAS_WIDTH / 2, 180);
  p.text("First faction to reach 30 victory points wins!", CANVAS_WIDTH / 2, 200);
  p.pop();
  
  // Instructions
  p.push();
  p.fill(200, 180, 160);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  const instructionX = 80;
  let y = 235;
  p.text("Arrow Keys: Navigate clearings and select units", instructionX, y);
  y += 20;
  p.text("Space: Confirm action / Execute command", instructionX, y);
  y += 20;
  p.text("Z: Cancel selection", instructionX, y);
  y += 20;
  p.text("Shift: Toggle between available actions", instructionX, y);
  p.pop();
  
  // Prompt
  p.push();
  p.fill(255, 220, 150);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  const blink = Math.floor(p.frameCount / 30) % 2 === 0;
  if (blink) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 350);
  }
  p.pop();
}

export function renderGame(p) {
  p.background(65, 50, 35);
  
  // Draw forest background
  renderForest(p);
  
  // Draw paths between clearings
  renderPaths(p);
  
  // Draw clearings
  for (const clearing of gameState.clearings) {
    renderClearing(p, clearing);
  }
  
  // Draw UI
  renderUI(p);
  
  // Draw action panel
  renderActionPanel(p);
  
  // Paused indicator
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.push();
    p.fill(255, 220, 150);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(14);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
    p.pop();
  }
}

function renderForest(p) {
  // Draw stylized trees in background
  p.push();
  p.noStroke();
  for (let i = 0; i < 15; i++) {
    const x = (i * 73 + 20) % CANVAS_WIDTH;
    const y = 30 + (Math.floor(i / 8) * 180);
    p.fill(45, 70, 35, 150);
    p.triangle(x, y, x - 15, y + 30, x + 15, y + 30);
    p.fill(60, 40, 25, 150);
    p.rect(x - 5, y + 30, 10, 15);
  }
  p.pop();
}

function renderPaths(p) {
  p.push();
  p.stroke(90, 70, 50);
  p.strokeWeight(2);
  
  for (const clearing of gameState.clearings) {
    for (const adjId of clearing.adjacentIds) {
      if (adjId > clearing.id) { // Draw each path once
        const adjClearing = gameState.clearings[adjId];
        p.line(clearing.x, clearing.y, adjClearing.x, adjClearing.y);
      }
    }
  }
  p.pop();
}

function renderClearing(p, clearing) {
  const isSelected = gameState.selectedClearing && gameState.selectedClearing.id === clearing.id;
  
  // Clearing circle
  p.push();
  p.strokeWeight(isSelected ? 3 : 2);
  p.stroke(...(isSelected ? [255, 220, 100] : [120, 100, 80]));
  
  // Fill based on suit
  const suitColors = {
    FOX: [220, 100, 60],
    MOUSE: [100, 120, 180],
    RABBIT: [160, 140, 100]
  };
  p.fill(...suitColors[clearing.suit]);
  p.circle(clearing.x, clearing.y, 50);
  p.pop();
  
  // Clearing ID
  p.push();
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(10);
  p.text(clearing.id, clearing.x, clearing.y - 20);
  p.pop();
  
  // Units
  renderUnits(p, clearing);
  
  // Buildings
  renderBuildings(p, clearing);
  
  // Sympathy token
  if (clearing.hasSympathy()) {
    p.push();
    p.fill(100, 200, 100);
    p.noStroke();
    p.circle(clearing.x + 15, clearing.y - 15, 8);
    p.pop();
  }
}

function renderUnits(p, clearing) {
  const factionsPresent = Object.keys(clearing.units);
  let offsetY = 5;
  
  const factionColors = {
    MARQUISE: [200, 60, 60],
    ALLIANCE: [100, 180, 100],
    EYRIE: [80, 120, 200],
    VAGABOND: [200, 160, 80]
  };
  
  for (const faction of factionsPresent) {
    const count = clearing.units[faction];
    if (count > 0) {
      p.push();
      p.fill(...factionColors[faction]);
      p.noStroke();
      p.circle(clearing.x - 12, clearing.y + offsetY, 8);
      
      p.fill(255);
      p.textSize(8);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(count, clearing.x - 12, clearing.y + offsetY);
      offsetY += 10;
      p.pop();
    }
  }
}

function renderBuildings(p, clearing) {
  const buildings = Object.keys(clearing.buildings);
  let offsetX = 10;
  
  for (const faction of buildings) {
    const buildingType = clearing.buildings[faction];
    p.push();
    
    const factionColors = {
      MARQUISE: [200, 60, 60],
      ALLIANCE: [100, 180, 100],
      EYRIE: [80, 120, 200]
    };
    
    p.fill(...factionColors[faction]);
    p.stroke(255);
    p.strokeWeight(1);
    
    if (buildingType === BUILDING_TYPES.WORKSHOP) {
      p.rect(clearing.x + offsetX, clearing.y + 10, 8, 8);
    } else if (buildingType === BUILDING_TYPES.SAWMILL) {
      p.triangle(clearing.x + offsetX, clearing.y + 10, 
                 clearing.x + offsetX + 8, clearing.y + 10,
                 clearing.x + offsetX + 4, clearing.y + 18);
    } else if (buildingType === BUILDING_TYPES.BASE) {
      p.circle(clearing.x + offsetX + 4, clearing.y + 14, 8);
    } else if (buildingType === "ROOST") {
      p.ellipse(clearing.x + offsetX + 4, clearing.y + 14, 10, 8);
    }
    
    offsetX += 12;
    p.pop();
  }
}

function renderUI(p) {
  // Top bar with faction info
  p.push();
  p.fill(30, 25, 20, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 30);
  p.pop();
  
  // Faction VP display
  let x = 10;
  for (let i = 0; i < gameState.factions.length; i++) {
    const faction = gameState.factions[i];
    const isActive = i === gameState.currentFactionIndex;
    
    p.push();
    p.fill(...(isActive ? [255, 220, 150] : [180, 160, 140]));
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(11);
    
    const factionDisplay = {
      MARQUISE: "Cat",
      ALLIANCE: "Alliance",
      EYRIE: "Birds",
      VAGABOND: "Vagabond"
    };
    
    p.text(`${factionDisplay[faction.name]}: ${faction.victoryPoints}VP`, x, 15);
    x += 120;
    p.pop();
  }
}

function renderActionPanel(p) {
  // Bottom panel
  p.push();
  p.fill(30, 25, 20, 220);
  p.noStroke();
  p.rect(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 50);
  p.pop();
  
  // Current turn info
  p.push();
  p.fill(220, 200, 180);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(12);
  
  const currentFaction = gameState.factions[gameState.currentFactionIndex];
  if (currentFaction) {
    const factionDisplay = {
      MARQUISE: "Marquise de Cat",
      ALLIANCE: "Woodland Alliance",
      EYRIE: "Eyrie Dynasties",
      VAGABOND: "Vagabond"
    };
    
    p.text(`Turn: ${factionDisplay[currentFaction.name]}`, 10, CANVAS_HEIGHT - 35);
    p.text(`Phase: ${gameState.turnPhase}`, 10, CANVAS_HEIGHT - 15);
  }
  
  // Selected clearing info
  if (gameState.selectedClearing) {
    const clearing = gameState.selectedClearing;
    p.text(`Clearing ${clearing.id} (${clearing.suit})`, 200, CANVAS_HEIGHT - 35);
    p.text(`Ruler: ${clearing.ruler || "None"}`, 200, CANVAS_HEIGHT - 15);
  }
  
  // Action hints
  p.textAlign(p.RIGHT, p.CENTER);
  p.textSize(10);
  p.text("Arrows: Navigate | Space: Confirm | Z: Cancel | Shift: Toggle", CANVAS_WIDTH - 10, CANVAS_HEIGHT - 25);
  p.pop();
}

export function renderGameOver(p, won) {
  p.background(40, 30, 20);
  
  p.push();
  p.fill(...(won ? [100, 220, 100] : [220, 100, 100]));
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(won ? "VICTORY!" : "DEFEAT", CANVAS_WIDTH / 2, 120);
  p.pop();
  
  // Final scores
  p.push();
  p.fill(220, 200, 180);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(16);
  p.text("Final Scores:", CANVAS_WIDTH / 2, 180);
  
  let y = 210;
  for (const faction of gameState.factions) {
    const factionDisplay = {
      MARQUISE: "Marquise de Cat",
      ALLIANCE: "Woodland Alliance",
      EYRIE: "Eyrie Dynasties",
      VAGABOND: "Vagabond"
    };
    
    p.textSize(14);
    p.fill(...(faction.isPlayer ? [255, 220, 150] : [180, 160, 140]));
    p.text(`${factionDisplay[faction.name]}: ${faction.victoryPoints} VP`, CANVAS_WIDTH / 2, y);
    y += 25;
  }
  p.pop();
  
  // Restart prompt
  p.push();
  p.fill(255, 220, 150);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 340);
  p.pop();
}