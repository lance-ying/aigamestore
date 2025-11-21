// rendering.js - All rendering functions

import { gameState, GAME_PHASES, COLOR_VALUES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
  p.background(30, 40, 60);
  
  // Title
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("TICKET TO RIDE", CANVAS_WIDTH/2, 80);
  
  // Description
  p.fill(200, 220, 240);
  p.textSize(14);
  p.text("Build railway routes to connect cities", CANVAS_WIDTH/2, 140);
  p.text("Complete destination tickets to earn points", CANVAS_WIDTH/2, 160);
  
  // Instructions
  p.textSize(12);
  p.fill(180, 200, 220);
  p.text("CONTROLS:", CANVAS_WIDTH/2, 200);
  p.textSize(11);
  p.text("SPACE: Draw cards / Claim routes", CANVAS_WIDTH/2, 220);
  p.text("SHIFT: Toggle between drawing and claiming", CANVAS_WIDTH/2, 235);
  p.text("ARROW KEYS: Navigate map and selections", CANVAS_WIDTH/2, 250);
  p.text("Z: View destination tickets", CANVAS_WIDTH/2, 265);
  
  // Start prompt
  p.fill(100, 255, 100);
  p.textSize(16);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, 320);
  
  // Tips
  p.fill(150, 170, 190);
  p.textSize(10);
  p.text("Tip: Collect matching colored cards to claim routes!", CANVAS_WIDTH/2, 360);
}

export function renderGameOverScreen(p) {
  p.background(20, 30, 50);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Title
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "VICTORY!" : "GAME OVER", CANVAS_WIDTH/2, 100);
  
  // Score
  p.fill(255, 220, 100);
  p.textSize(32);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, 160);
  
  // Details
  p.fill(200, 220, 240);
  p.textSize(14);
  const completed = gameState.destinationTickets.filter(t => t.completed).length;
  const total = gameState.destinationTickets.length;
  p.text(`Tickets Completed: ${completed}/${total}`, CANVAS_WIDTH/2, 210);
  p.text(`Routes Claimed: ${gameState.claimedRoutes.length}`, CANVAS_WIDTH/2, 230);
  
  // Restart
  p.fill(150, 200, 255);
  p.textSize(16);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH/2, 300);
}

export function renderPausedIndicator(p) {
  p.fill(255, 255, 100);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

export function renderGame(p) {
  p.background(240, 235, 220);
  
  // Render map
  renderMap(p);
  
  // Render UI
  renderUI(p);
  
  // Render mode indicator
  renderModeIndicator(p);
}

function renderMap(p) {
  p.push();
  
  // Draw routes first (behind cities)
  for (let i = 0; i < gameState.routes.length; i++) {
    const route = gameState.routes[i];
    const fromCity = gameState.cities[route.from];
    const toCity = gameState.cities[route.to];
    
    const isClaimed = gameState.claimedRoutes.includes(i);
    const isSelected = (gameState.uiMode === "CLAIM_ROUTE" && gameState.selectedRouteIndex === i);
    
    // Route line
    p.strokeWeight(isClaimed ? 6 : 4);
    
    if (isClaimed) {
      p.stroke(100, 200, 100);
    } else if (isSelected) {
      p.stroke(255, 255, 100);
    } else {
      const color = COLOR_VALUES[route.color];
      p.stroke(...color);
    }
    
    p.line(fromCity.x, fromCity.y, toCity.x, toCity.y);
    
    // Route length indicator
    const midX = (fromCity.x + toCity.x) / 2;
    const midY = (fromCity.y + toCity.y) / 2;
    
    if (!isClaimed) {
      p.fill(255);
      p.noStroke();
      p.circle(midX, midY, 16);
      p.fill(0);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(10);
      p.text(route.length, midX, midY);
    }
  }
  
  // Draw cities
  for (let i = 0; i < gameState.cities.length; i++) {
    const city = gameState.cities[i];
    
    p.fill(80, 60, 40);
    p.stroke(0);
    p.strokeWeight(2);
    p.circle(city.x, city.y, 14);
    
    // City name
    p.fill(40, 30, 20);
    p.noStroke();
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(9);
    p.text(city.name, city.x, city.y + 10);
  }
  
  p.pop();
}

function renderUI(p) {
  // Top bar background
  p.fill(50, 60, 80);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 35);
  
  // Score and train cars
  p.fill(255, 220, 100);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(12);
  p.text(`Score: ${gameState.score}`, 10, 17);
  p.text(`Train Cars: ${gameState.trainCars}`, 120, 17);
  
  // Current mode
  p.fill(200, 220, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(11);
  let modeText = "";
  if (gameState.uiMode === "DRAW_CARDS") {
    modeText = "DRAW CARDS";
  } else if (gameState.uiMode === "CLAIM_ROUTE") {
    modeText = "CLAIM ROUTE";
  } else if (gameState.uiMode === "VIEW_TICKETS") {
    modeText = "VIEW TICKETS";
  }
  p.text(modeText, CANVAS_WIDTH/2, 17);
  
  // Cards drawn indicator
  if (gameState.cardsDrawnThisTurn > 0) {
    p.fill(100, 255, 100);
    p.textAlign(p.RIGHT, p.CENTER);
    p.textSize(10);
    p.text(`Cards: ${gameState.cardsDrawnThisTurn}/2`, CANVAS_WIDTH - 10, 17);
  }
  
  // Bottom UI area
  const uiY = CANVAS_HEIGHT - 80;
  p.fill(60, 70, 90);
  p.rect(0, uiY, CANVAS_WIDTH, 80);
  
  if (gameState.uiMode === "DRAW_CARDS") {
    renderDrawCardsUI(p, uiY);
  } else if (gameState.uiMode === "CLAIM_ROUTE") {
    renderClaimRouteUI(p, uiY);
  } else if (gameState.uiMode === "VIEW_TICKETS") {
    renderViewTicketsUI(p, uiY);
  }
  
  // Instructions
  p.fill(180, 190, 200);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.textSize(9);
  p.text("SHIFT: Toggle Mode | Z: View Tickets | ARROWS: Navigate | SPACE: Confirm", CANVAS_WIDTH/2, CANVAS_HEIGHT - 5);
}

function renderDrawCardsUI(p, uiY) {
  // Face up cards
  p.fill(200, 220, 240);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(11);
  p.text("Face Up Cards (SPACE to draw):", 10, uiY + 8);
  
  for (let i = 0; i < gameState.faceUpCards.length; i++) {
    const cardX = 10 + i * 55;
    const cardY = uiY + 25;
    const isSelected = (i === gameState.selectedCardIndex);
    
    renderCard(p, cardX, cardY, gameState.faceUpCards[i], isSelected);
  }
  
  // Deck
  p.fill(200, 220, 240);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(11);
  p.text("Deck:", 300, uiY + 8);
  renderCardBack(p, 300, uiY + 25, gameState.selectedCardIndex === 5);
  
  // Player hand
  p.fill(200, 220, 240);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(11);
  p.text("Your Hand:", CANVAS_WIDTH - 10, uiY + 8);
  
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(9);
  const handY = uiY + 25;
  let handText = "";
  const colorCounts = {};
  for (let card of gameState.hand) {
    colorCounts[card] = (colorCounts[card] || 0) + 1;
  }
  
  let yOffset = 0;
  for (let color in colorCounts) {
    const colorVal = COLOR_VALUES[color];
    p.fill(...colorVal);
    p.text(`${color}: ${colorCounts[color]}`, CANVAS_WIDTH - 10, handY + yOffset);
    yOffset += 12;
  }
}

function renderClaimRouteUI(p, uiY) {
  p.fill(200, 220, 240);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(11);
  p.text("Select Route (ARROWS) then SPACE to claim:", 10, uiY + 8);
  
  if (gameState.selectedRouteIndex >= 0 && gameState.selectedRouteIndex < gameState.routes.length) {
    const route = gameState.routes[gameState.selectedRouteIndex];
    const fromCity = gameState.cities[route.from];
    const toCity = gameState.cities[route.to];
    
    p.textSize(10);
    p.text(`Route: ${fromCity.name} to ${toCity.name}`, 10, uiY + 25);
    p.text(`Length: ${route.length} | Color: ${route.color}`, 10, uiY + 40);
    p.text(`Cost: ${route.length} ${route.color} cards`, 10, uiY + 55);
  }
  
  // Player hand summary
  p.fill(200, 220, 240);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(9);
  const handY = uiY + 25;
  const colorCounts = {};
  for (let card of gameState.hand) {
    colorCounts[card] = (colorCounts[card] || 0) + 1;
  }
  
  let yOffset = 0;
  for (let color in colorCounts) {
    const colorVal = COLOR_VALUES[color];
    p.fill(...colorVal);
    p.text(`${color}: ${colorCounts[color]}`, CANVAS_WIDTH - 10, handY + yOffset);
    yOffset += 12;
  }
}

function renderViewTicketsUI(p, uiY) {
  p.fill(200, 220, 240);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(11);
  p.text("Destination Tickets:", 10, uiY + 5);
  
  p.textSize(9);
  let yOffset = 20;
  for (let ticket of gameState.destinationTickets) {
    const fromCity = gameState.cities[ticket.from];
    const toCity = gameState.cities[ticket.to];
    
    const color = ticket.completed ? [100, 255, 100] : [255, 200, 100];
    p.fill(...color);
    
    const status = ticket.completed ? "✓" : "○";
    p.text(`${status} ${fromCity.name} → ${toCity.name} (${ticket.points} pts)`, 10, uiY + yOffset);
    yOffset += 12;
  }
}

function renderCard(p, x, y, color, selected) {
  p.push();
  
  if (selected) {
    p.fill(255, 255, 100);
    p.rect(x - 2, y - 2, 49, 34);
  }
  
  p.fill(255);
  p.stroke(0);
  p.strokeWeight(1);
  p.rect(x, y, 45, 30);
  
  const colorVal = COLOR_VALUES[color];
  p.fill(...colorVal);
  p.noStroke();
  p.rect(x + 5, y + 5, 35, 20);
  
  p.pop();
}

function renderCardBack(p, x, y, selected) {
  p.push();
  
  if (selected) {
    p.fill(255, 255, 100);
    p.rect(x - 2, y - 2, 49, 34);
  }
  
  p.fill(100, 80, 120);
  p.stroke(0);
  p.strokeWeight(1);
  p.rect(x, y, 45, 30);
  
  p.fill(200, 180, 220);
  p.noStroke();
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 2; j++) {
      p.rect(x + 5 + i * 12, y + 5 + j * 12, 8, 8);
    }
  }
  
  p.pop();
}

function renderModeIndicator(p) {
  // Small help text
  p.fill(100, 110, 130);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(8);
  p.text("Press SHIFT to toggle mode", 5, CANVAS_HEIGHT - 95);
}