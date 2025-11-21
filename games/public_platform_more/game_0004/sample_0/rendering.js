// rendering.js - Rendering functions

import { gameState, GAME_PHASES, PLAY_PHASES, GLOBAL_TARGETS, STANDARD_PROJECTS } from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 10, 30);
  
  // Title
  p.fill(255, 100, 50);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.text("TERRAFORMING MARS", p.width / 2, 60);
  
  // Description
  p.fill(200);
  p.textSize(12);
  p.text("Lead your corporation to transform Mars!", p.width / 2, 110);
  p.text("Play cards to increase Temperature, Oxygen, and Oceans", p.width / 2, 130);
  p.text("Win by reaching all global targets!", p.width / 2, 150);
  
  // Instructions
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(11);
  p.fill(180, 220, 255);
  p.text("HOW TO PLAY:", 50, 180);
  p.fill(200);
  p.text("• Arrow Keys: Navigate menus and select cards", 70, 200);
  p.text("• Space: Confirm selection / Play card", 70, 215);
  p.text("• Z: Cancel action / Return to previous state", 70, 230);
  p.text("• Shift: View card details", 70, 245);
  p.text("• ESC: Pause game | R: Restart to title", 70, 260);
  
  // Objectives
  p.fill(100, 255, 150);
  p.text("OBJECTIVES:", 50, 290);
  p.fill(200);
  p.text("Temperature: +8°C | Oxygen: 14% | Oceans: 9", 70, 310);
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  const flash = Math.sin(p.frameCount * 0.1) > 0;
  if (flash) {
    p.text("PRESS ENTER TO START", p.width / 2, 360);
  }
}

export function renderPlayingScreen(p) {
  p.background(100, 50, 30);
  
  // Mars surface gradient
  for (let i = 0; i < p.height; i++) {
    const t = i / p.height;
    p.stroke(100 + t * 50, 50 + t * 30, 30 + t * 20);
    p.line(0, i, p.width, i);
  }
  
  renderGlobalParameters(p);
  renderResources(p);
  renderPhaseIndicator(p);
  
  if (gameState.playPhase === PLAY_PHASES.RESEARCH) {
    renderResearchPhase(p);
  } else if (gameState.playPhase === PLAY_PHASES.ACTION) {
    renderActionPhase(p);
  } else if (gameState.playPhase === PLAY_PHASES.PRODUCTION) {
    renderProductionPhase(p);
  }
  
  // Render player
  if (gameState.player) {
    gameState.player.render(p);
  }
}

export function renderGlobalParameters(p) {
  const startX = 20;
  const startY = 20;
  const spacing = 150;
  
  // Temperature
  renderParameter(p, startX, startY, "TEMP", gameState.temperature, GLOBAL_TARGETS.TEMPERATURE, "°C", -30, 8, 255, 100, 50);
  
  // Oxygen
  renderParameter(p, startX + spacing, startY, "O₂", gameState.oxygen, GLOBAL_TARGETS.OXYGEN, "%", 0, 14, 100, 200, 255);
  
  // Oceans
  renderParameter(p, startX + spacing * 2, startY, "OCEAN", gameState.oceans, GLOBAL_TARGETS.OCEANS, "", 0, 9, 50, 150, 255);
}

function renderParameter(p, x, y, label, value, target, unit, min, max, r, g, b) {
  const width = 120;
  const height = 50;
  
  p.push();
  p.fill(30, 20, 20, 200);
  p.stroke(r, g, b);
  p.strokeWeight(2);
  p.rect(x, y, width, height, 5);
  
  // Label
  p.fill(r, g, b);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(10);
  p.text(label, x + 5, y + 5);
  
  // Value
  p.textSize(16);
  p.textAlign(p.CENTER, p.CENTER);
  const displayValue = unit === "°C" ? (value >= 0 ? `+${value}` : value) : value;
  p.text(`${displayValue}${unit}`, x + width / 2, y + height / 2 + 5);
  
  // Target indicator
  p.textSize(8);
  p.fill(150);
  p.text(`Target: ${target}${unit}`, x + width / 2, y + height - 8);
  
  // Progress bar
  const progress = Math.max(0, Math.min(1, (value - min) / (max - min)));
  p.fill(r * 0.3, g * 0.3, b * 0.3);
  p.noStroke();
  p.rect(x + 5, y + height - 4, width - 10, 2);
  p.fill(r, g, b);
  p.rect(x + 5, y + height - 4, (width - 10) * progress, 2);
  
  p.pop();
}

export function renderResources(p) {
  const x = 470;
  const y = 20;
  
  p.push();
  p.fill(30, 20, 20, 200);
  p.stroke(255, 220, 100);
  p.strokeWeight(2);
  p.rect(x, y, 110, 120, 5);
  
  p.fill(255, 220, 100);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(10);
  p.text("RESOURCES", x + 5, y + 5);
  
  p.textSize(11);
  p.fill(200);
  p.text(`Gen: ${gameState.generation}`, x + 10, y + 25);
  p.text(`TR: ${gameState.tr}`, x + 10, y + 45);
  p.text(`MC: ${gameState.mc}`, x + 10, y + 65);
  p.text(`MC/Gen: +${gameState.mcProduction + gameState.tr}`, x + 10, y + 85);
  p.text(`VP: ${gameState.vp}`, x + 10, y + 105);
  
  p.pop();
}

export function renderPhaseIndicator(p) {
  const x = 20;
  const y = 80;
  
  p.push();
  p.fill(30, 20, 20, 200);
  p.stroke(150, 255, 150);
  p.strokeWeight(2);
  p.rect(x, y, 200, 30, 5);
  
  p.fill(150, 255, 150);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(12);
  
  let phaseText = "";
  if (gameState.playPhase === PLAY_PHASES.RESEARCH) {
    phaseText = "PHASE: RESEARCH";
  } else if (gameState.playPhase === PLAY_PHASES.ACTION) {
    phaseText = "PHASE: ACTION";
  } else if (gameState.playPhase === PLAY_PHASES.PRODUCTION) {
    phaseText = "PHASE: PRODUCTION";
  }
  
  p.text(phaseText, x + 100, y + 15);
  p.pop();
}

export function renderResearchPhase(p) {
  const x = 50;
  const y = 150;
  
  p.push();
  p.fill(30, 20, 20, 230);
  p.stroke(255, 220, 100);
  p.strokeWeight(2);
  p.rect(x, y, 500, 200, 5);
  
  p.fill(255, 220, 100);
  p.noStroke();
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(16);
  p.text("RESEARCH PHASE", x + 250, y + 10);
  
  p.textSize(12);
  p.fill(200);
  p.text("Select cards to add to your hand", x + 250, y + 35);
  p.text(`(${gameState.cardsThisGeneration}/${gameState.maxCardsPerGeneration} selected)`, x + 250, y + 55);
  
  // Display available cards
  if (gameState.hand.length > 0) {
    const cardY = y + 85;
    const cardSpacing = 160;
    
    for (let i = 0; i < Math.min(3, gameState.hand.length); i++) {
      const card = gameState.hand[i];
      const cardX = x + 20 + i * cardSpacing;
      const isSelected = i === gameState.selectedCardIndex;
      
      renderCard(p, cardX, cardY, card, isSelected, false);
    }
  }
  
  p.fill(150, 255, 150);
  p.textSize(11);
  p.text("Arrow Keys: Select | Space: Confirm | Z: Skip", x + 250, y + 180);
  
  p.pop();
}

export function renderActionPhase(p) {
  const x = 20;
  const y = 120;
  
  // Main menu
  if (!gameState.actionType) {
    renderActionMenu(p, x, y);
  } else if (gameState.actionType === "card") {
    renderCardSelection(p, x, y);
  } else if (gameState.actionType === "standard_project") {
    renderStandardProjects(p, x, y);
  }
}

function renderActionMenu(p, x, y) {
  p.push();
  p.fill(30, 20, 20, 230);
  p.stroke(255, 220, 100);
  p.strokeWeight(2);
  p.rect(x, y, 560, 250, 5);
  
  p.fill(255, 220, 100);
  p.noStroke();
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(16);
  p.text("ACTION PHASE - Choose Action", x + 280, y + 10);
  
  const options = [
    { text: "Play Card from Hand", enabled: gameState.hand.length > 0 },
    { text: "Standard Project", enabled: true },
    { text: "End Generation (Production)", enabled: true }
  ];
  
  for (let i = 0; i < options.length; i++) {
    const optY = y + 60 + i * 60;
    const isSelected = i === gameState.menuSelection;
    
    p.fill(isSelected ? 50 : 30, isSelected ? 40 : 20, isSelected ? 30 : 20, 200);
    p.stroke(isSelected ? 255 : 150, isSelected ? 220 : 180, isSelected ? 100 : 80);
    p.strokeWeight(isSelected ? 3 : 2);
    p.rect(x + 80, optY, 400, 45, 5);
    
    p.fill(options[i].enabled ? 200 : 100);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.text(options[i].text, x + 280, optY + 22);
  }
  
  p.fill(150, 255, 150);
  p.textSize(11);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.text("Arrow Keys: Select | Space: Confirm", x + 280, y + 240);
  
  p.pop();
}

function renderCardSelection(p, x, y) {
  p.push();
  p.fill(30, 20, 20, 230);
  p.stroke(255, 220, 100);
  p.strokeWeight(2);
  p.rect(x, y, 560, 250, 5);
  
  p.fill(255, 220, 100);
  p.noStroke();
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(16);
  p.text("Select Card to Play", x + 280, y + 10);
  
  if (gameState.hand.length === 0) {
    p.fill(200);
    p.textSize(14);
    p.text("No cards in hand!", x + 280, y + 100);
  } else {
    const startCardX = x + 30;
    const cardY = y + 45;
    const cardSpacing = 135;
    const cardsPerRow = 4;
    
    for (let i = 0; i < gameState.hand.length; i++) {
      const card = gameState.hand[i];
      const row = Math.floor(i / cardsPerRow);
      const col = i % cardsPerRow;
      const cardX = startCardX + col * cardSpacing;
      const cardYPos = cardY + row * 95;
      const isSelected = i === gameState.selectedCardIndex;
      
      renderCard(p, cardX, cardYPos, card, isSelected, true);
    }
  }
  
  p.fill(150, 255, 150);
  p.textSize(11);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.text("Arrows: Select | Space: Play | Z: Back", x + 280, y + 240);
  
  p.pop();
}

function renderStandardProjects(p, x, y) {
  p.push();
  p.fill(30, 20, 20, 230);
  p.stroke(255, 220, 100);
  p.strokeWeight(2);
  p.rect(x, y, 560, 250, 5);
  
  p.fill(255, 220, 100);
  p.noStroke();
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(16);
  p.text("Standard Projects", x + 280, y + 10);
  
  const projects = [
    { name: "Place Ocean", cost: STANDARD_PROJECTS.OCEAN.cost, key: "OCEAN" },
    { name: "Place Forest", cost: STANDARD_PROJECTS.FOREST.cost, key: "FOREST" },
    { name: "Build City", cost: STANDARD_PROJECTS.CITY.cost, key: "CITY" },
    { name: "Raise Temp", cost: STANDARD_PROJECTS.TEMP.cost, key: "TEMP" },
    { name: "Raise O₂", cost: STANDARD_PROJECTS.OXYGEN.cost, key: "OXYGEN" }
  ];
  
  for (let i = 0; i < projects.length; i++) {
    const proj = projects[i];
    const projY = y + 45 + i * 38;
    const isSelected = i === gameState.menuSelection;
    const canAfford = gameState.mc >= proj.cost;
    
    p.fill(isSelected ? 50 : 30, isSelected ? 40 : 20, isSelected ? 30 : 20, 200);
    p.stroke(isSelected ? 255 : 150, isSelected ? 220 : 180, isSelected ? 100 : 80);
    p.strokeWeight(isSelected ? 3 : 2);
    p.rect(x + 80, projY, 400, 32, 5);
    
    p.fill(canAfford ? 200 : 100);
    p.noStroke();
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(13);
    p.text(proj.name, x + 95, projY + 16);
    
    p.textAlign(p.RIGHT, p.CENTER);
    p.text(`${proj.cost} MC`, x + 465, projY + 16);
  }
  
  p.fill(150, 255, 150);
  p.textSize(11);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.text("Arrows: Select | Space: Build | Z: Back", x + 280, y + 240);
  
  p.pop();
}

function renderCard(p, x, y, card, isSelected, showCost) {
  const width = 120;
  const height = 80;
  
  p.push();
  p.fill(isSelected ? 60 : 40, isSelected ? 50 : 35, isSelected ? 40 : 25, 220);
  p.stroke(isSelected ? 255 : 180, isSelected ? 220 : 160, isSelected ? 100 : 80);
  p.strokeWeight(isSelected ? 3 : 2);
  p.rect(x, y, width, height, 3);
  
  // Card name
  p.fill(255, 220, 100);
  p.noStroke();
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(10);
  p.text(card.name, x + width / 2, y + 5);
  
  // Cost
  if (showCost) {
    p.fill(gameState.mc >= card.cost ? 150 : 255, 
           gameState.mc >= card.cost ? 255 : 100, 
           gameState.mc >= card.cost ? 150 : 100);
    p.textSize(11);
    p.text(`${card.cost} MC`, x + width / 2, y + 20);
  }
  
  // Description
  p.fill(200);
  p.textSize(8);
  p.text(card.description, x + width / 2, y + 40);
  
  // VP
  if (card.vp > 0) {
    p.fill(150, 255, 150);
    p.textSize(9);
    p.text(`${card.vp} VP`, x + width / 2, y + 60);
  }
  
  p.pop();
}

export function renderProductionPhase(p) {
  const x = 100;
  const y = 150;
  
  p.push();
  p.fill(30, 20, 20, 230);
  p.stroke(255, 220, 100);
  p.strokeWeight(2);
  p.rect(x, y, 400, 150, 5);
  
  p.fill(255, 220, 100);
  p.noStroke();
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(16);
  p.text("PRODUCTION PHASE", x + 200, y + 10);
  
  const production = gameState.tr + gameState.mcProduction;
  
  p.fill(200);
  p.textSize(14);
  p.text(`Generating Resources...`, x + 200, y + 45);
  p.text(`+${production} MC`, x + 200, y + 70);
  
  p.fill(150, 255, 150);
  p.textSize(12);
  p.text("Press Space to continue", x + 200, y + 110);
  
  p.pop();
}

export function renderPausedIndicator(p) {
  p.push();
  p.fill(255, 255, 100);
  p.noStroke();
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(12);
  p.text("PAUSED", p.width - 10, 10);
  p.pop();
}

export function renderGameOverScreen(p) {
  p.background(20, 10, 30);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Title
  p.fill(isWin ? 150 : 255, isWin ? 255 : 100, isWin ? 150 : 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.text(isWin ? "MARS TERRAFORMED!" : "GAME OVER", p.width / 2, 80);
  
  // Stats
  p.fill(200);
  p.textSize(14);
  p.text(`Generation: ${gameState.generation}`, p.width / 2, 150);
  p.text(`Final TR: ${gameState.tr}`, p.width / 2, 175);
  p.text(`Cards Played: ${gameState.playedCards.length}`, p.width / 2, 200);
  p.text(`Cities: ${gameState.cities}`, p.width / 2, 225);
  p.text(`Forests: ${gameState.forests}`, p.width / 2, 250);
  
  // Victory Points
  p.fill(150, 255, 150);
  p.textSize(20);
  p.text(`VICTORY POINTS: ${gameState.vp}`, p.width / 2, 290);
  
  // Restart prompt
  p.fill(255, 255, 100);
  p.textSize(18);
  const flash = Math.sin(p.frameCount * 0.1) > 0;
  if (flash) {
    p.text("PRESS R TO RESTART", p.width / 2, 350);
  }
  
  p.pop();
}