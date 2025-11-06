// rendering.js - All rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, SEASONS, SEASON_COLORS, UI_STATE_SELECT_ACTION, UI_STATE_SELECT_LOCATION, UI_STATE_SELECT_CARD, ACTION_PLACE_WORKER, ACTION_PLAY_CARD, ACTION_PREPARE_SEASON } from './globals.js';
import { getAvailableActions } from './gameLogic.js';
import { canAffordCard } from './cards.js';

export function renderStartScreen(p) {
  p.background(40, 60, 40);
  
  // Title
  p.fill(255, 240, 200);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("EVERDELL", CANVAS_WIDTH / 2, 80);
  
  // Description
  p.textSize(12);
  p.fill(220, 220, 220);
  const lines = [
    "Build your woodland city across four seasons!",
    "Place workers to collect resources.",
    "Play cards to construct buildings and recruit critters.",
    "Create powerful synergies to maximize victory points.",
    "",
    "City limit: 15 cards | Goal: Highest score after Winter"
  ];
  
  let y = 140;
  lines.forEach(line => {
    p.text(line, CANVAS_WIDTH / 2, y);
    y += 18;
  });
  
  // Controls
  y += 20;
  p.textSize(11);
  p.fill(200, 255, 200);
  const controls = [
    "ARROW KEYS: Navigate",
    "SPACE: Confirm action",
    "Z: Cancel selection",
    "ESC: Pause | R: Restart"
  ];
  
  controls.forEach(ctrl => {
    p.text(ctrl, CANVAS_WIDTH / 2, y);
    y += 16;
  });
  
  // Start prompt
  p.textSize(16);
  p.fill(255, 255, 150);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}

export function renderGameScreen(p) {
  // Background with season color
  const seasonColor = SEASON_COLORS[SEASONS[gameState.currentSeason]];
  p.background(seasonColor[0] * 0.3, seasonColor[1] * 0.3, seasonColor[2] * 0.3);
  
  // Season indicator
  renderSeasonBar(p);
  
  // Resources
  renderResources(p);
  
  // Main game area
  if (gameState.uiState === UI_STATE_SELECT_ACTION) {
    renderActionSelection(p);
  } else if (gameState.uiState === UI_STATE_SELECT_LOCATION) {
    renderLocationSelection(p);
  } else if (gameState.uiState === UI_STATE_SELECT_CARD) {
    renderCardSelection(p);
  }
  
  // City display (always visible)
  renderCity(p);
  
  // Message
  if (gameState.messageTimer > 0) {
    renderMessage(p);
  }
  
  // Pause indicator
  if (gameState.gamePhase === PHASE_PAUSED) {
    p.fill(255);
    p.textSize(14);
    p.textAlign(p.RIGHT, p.TOP);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }
}

export function renderSeasonBar(p) {
  const barWidth = CANVAS_WIDTH;
  const barHeight = 30;
  
  // Background
  p.fill(20, 20, 30);
  p.noStroke();
  p.rect(0, 0, barWidth, barHeight);
  
  // Season indicators
  const seasonWidth = barWidth / 4;
  for (let i = 0; i < 4; i++) {
    const x = i * seasonWidth;
    const color = SEASON_COLORS[SEASONS[i]];
    
    if (i === gameState.currentSeason) {
      p.fill(color[0], color[1], color[2]);
    } else if (i < gameState.currentSeason) {
      p.fill(color[0] * 0.4, color[1] * 0.4, color[2] * 0.4);
    } else {
      p.fill(60, 60, 70);
    }
    
    p.rect(x + 2, 5, seasonWidth - 4, 20);
    
    // Season name
    p.fill(i === gameState.currentSeason ? 0 : 200);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.text(SEASONS[i], x + seasonWidth / 2, 15);
  }
  
  // Workers available
  p.fill(255);
  p.textAlign(p.RIGHT, p.CENTER);
  p.textSize(10);
  p.text(`Workers: ${gameState.availableWorkers}`, barWidth - 10, 15);
}

export function renderResources(p) {
  const startX = 10;
  const startY = 35;
  const spacing = 70;
  
  const resources = [
    { name: "Berry", key: "BERRY", color: [255, 100, 100] },
    { name: "Twig", key: "TWIG", color: [150, 100, 50] },
    { name: "Resin", key: "RESIN", color: [255, 200, 100] },
    { name: "Pebble", key: "PEBBLE", color: [150, 150, 160] }
  ];
  
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(10);
  
  resources.forEach((res, i) => {
    const x = startX + i * spacing;
    const y = startY;
    
    // Icon
    p.fill(...res.color);
    p.circle(x + 8, y, 12);
    
    // Amount
    p.fill(255);
    p.text(`${res.name}: ${gameState.resources[res.key]}`, x + 18, y);
  });
}

export function renderActionSelection(p) {
  const startY = 70;
  const actions = getAvailableActions();
  
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text("Select Action:", 20, startY);
  
  const actionNames = {
    [ACTION_PLACE_WORKER]: "Place Worker",
    [ACTION_PLAY_CARD]: "Play Card",
    [ACTION_PREPARE_SEASON]: "Prepare for Next Season"
  };
  
  actions.forEach((action, i) => {
    const y = startY + 30 + i * 25;
    
    if (i === gameState.selectedActionIndex) {
      p.fill(255, 255, 150);
      p.rect(15, y - 2, 200, 20);
      p.fill(0);
    } else {
      p.fill(200);
    }
    
    p.textSize(12);
    p.text(`> ${actionNames[action]}`, 20, y);
  });
}

export function renderLocationSelection(p) {
  const startY = 70;
  
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text("Select Location:", 20, startY);
  
  let index = 0;
  gameState.locations.forEach((location, i) => {
    if (!location.canPlaceWorker()) return;
    
    const y = startY + 30 + index * 30;
    
    if (index === gameState.selectedLocationIndex) {
      p.fill(255, 255, 150);
      p.rect(15, y - 2, 250, 25);
      p.fill(0);
    } else {
      p.fill(200);
    }
    
    p.textSize(11);
    const rewardStr = Object.entries(location.reward)
      .map(([type, amt]) => `${amt} ${type}`)
      .join(", ");
    p.text(`> ${location.name}: ${rewardStr}`, 20, y);
    
    index++;
  });
  
  // Cancel hint
  p.fill(150);
  p.textSize(10);
  p.text("Press Z to cancel", 20, startY + 30 + index * 30 + 20);
}

export function renderCardSelection(p) {
  const startX = 10;
  const startY = 70;
  
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text("Select Card to Play:", startX, startY);
  
  let affordableIndex = 0;
  gameState.hand.forEach((card, i) => {
    const canAfford = canAffordCard(card, gameState.resources);
    if (!canAfford) return;
    
    const y = startY + 30 + affordableIndex * 40;
    
    if (affordableIndex === gameState.selectedCardIndex) {
      p.fill(255, 255, 150);
      p.rect(startX, y - 2, 280, 35);
    } else {
      p.fill(80, 80, 100);
      p.rect(startX, y - 2, 280, 35);
    }
    
    // Card type color
    const typeColor = card.type === "CONSTRUCTION" ? [200, 150, 100] : [150, 200, 150];
    p.fill(...typeColor);
    p.rect(startX + 2, y, 8, 31);
    
    // Card name
    p.fill(255);
    p.textSize(11);
    p.text(card.name, startX + 15, y + 2);
    
    // Cost
    p.textSize(9);
    p.fill(255, 200, 100);
    const costStr = Object.entries(card.cost)
      .map(([type, amt]) => `${amt}${type[0]}`)
      .join(" ");
    p.text(costStr, startX + 15, y + 16);
    
    // VP
    p.fill(255, 255, 150);
    p.text(`VP: ${card.victoryPoints}`, startX + 180, y + 16);
    
    affordableIndex++;
  });
  
  // Cancel hint
  p.fill(150);
  p.textSize(10);
  p.text("Press Z to cancel", startX, startY + 30 + affordableIndex * 40 + 20);
}

export function renderCity(p) {
  const startX = 310;
  const startY = 70;
  const cardWidth = 35;
  const cardHeight = 45;
  const spacing = 2;
  const cols = 8;
  
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text(`City (${gameState.city.length}/15):`, startX, startY - 20);
  
  gameState.city.forEach((card, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * (cardWidth + spacing);
    const y = startY + row * (cardHeight + spacing);
    
    // Card background
    const typeColor = card.type === "CONSTRUCTION" ? [160, 120, 80] : [100, 160, 100];
    p.fill(...typeColor);
    p.rect(x, y, cardWidth, cardHeight);
    
    // VP indicator
    p.fill(255, 255, 150);
    p.textSize(10);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(card.victoryPoints, x + cardWidth / 2, y + cardHeight / 2);
  });
  
  // Score
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  const currentScore = gameState.city.reduce((sum, card) => sum + card.victoryPoints, 0);
  p.text(`Score: ${currentScore}`, startX, startY + 200);
}

export function renderMessage(p) {
  p.fill(0, 0, 0, 150);
  p.rect(CANVAS_WIDTH / 2 - 150, CANVAS_HEIGHT - 60, 300, 30);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(12);
  p.text(gameState.message, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 45);
}

export function renderGameOverScreen(p) {
  p.background(40, 40, 60);
  
  p.fill(255, 240, 200);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("GAME OVER", CANVAS_WIDTH / 2, 80);
  
  p.textSize(24);
  p.fill(255, 255, 150);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 140);
  
  p.textSize(14);
  p.fill(200, 200, 200);
  p.text(`Cards in City: ${gameState.city.length}`, CANVAS_WIDTH / 2, 180);
  
  // Score breakdown
  p.textSize(12);
  p.fill(180, 180, 180);
  const cardPoints = gameState.city.reduce((sum, card) => sum + card.victoryPoints, 0);
  const resourcePoints = Math.floor(Object.values(gameState.resources).reduce((sum, val) => sum + val, 0) / 3);
  const bonusPoints = gameState.score - cardPoints - resourcePoints;
  
  p.text(`Card Points: ${cardPoints}`, CANVAS_WIDTH / 2, 210);
  p.text(`Resource Points: ${resourcePoints}`, CANVAS_WIDTH / 2, 230);
  p.text(`Bonus Points: ${bonusPoints}`, CANVAS_WIDTH / 2, 250);
  
  p.textSize(16);
  p.fill(255, 255, 150);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}