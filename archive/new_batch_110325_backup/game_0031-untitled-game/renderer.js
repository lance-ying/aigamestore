// renderer.js - Rendering functions

import { gameState, GAME_PHASES, CARD_COLORS, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 30, 50);
  
  // Title
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("TICKET TO RIDE", CANVAS_WIDTH / 2, 80);
  
  // Instructions
  p.fill(200, 220, 255);
  p.textSize(14);
  p.text("Build railway routes to connect cities!", CANVAS_WIDTH / 2, 140);
  p.text("Complete destination tickets to score points", CANVAS_WIDTH / 2, 165);
  p.text("Game ends when any player has ≤3 trains left", CANVAS_WIDTH / 2, 190);
  
  p.textSize(12);
  p.fill(150, 200, 255);
  p.text("Arrow Keys: Navigate menus", CANVAS_WIDTH / 2, 230);
  p.text("Space: Select/Confirm", CANVAS_WIDTH / 2, 250);
  p.text("Z: Cancel/Back", CANVAS_WIDTH / 2, 270);
  p.text("Shift: View destinations (hold)", CANVAS_WIDTH / 2, 290);
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textSize(18);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 350);
}

export function renderGame(p) {
  p.background(240, 235, 220);
  
  // Draw map
  drawMap(p);
  
  // Draw UI panels
  drawUIPanel(p);
  
  // Draw current action UI
  if (gameState.turnPhase === "CHOOSE_ACTION") {
    drawActionMenu(p);
  } else if (gameState.turnPhase === "DRAWING_CARDS") {
    drawCardDrawingUI(p);
  } else if (gameState.turnPhase === "CLAIMING_ROUTE") {
    drawRouteClaimingUI(p);
  } else if (gameState.turnPhase === "CHOOSING_DESTINATIONS") {
    drawDestinationChoiceUI(p);
  }
  
  // Show destinations if shift held
  if (p.keyIsDown(16)) {
    drawDestinationOverlay(p);
  }
  
  // Paused indicator
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.fill(255);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }
}

function drawMap(p) {
  // Draw routes first
  gameState.routes.forEach((route, index) => {
    const city1 = gameState.cities[route.city1Index];
    const city2 = gameState.cities[route.city2Index];
    
    p.push();
    
    // Route color
    if (route.claimedBy !== -1) {
      const player = gameState.players[route.claimedBy];
      const playerColors = [[50, 150, 255], [255, 100, 100], [100, 255, 100], [255, 255, 100]];
      p.stroke(...playerColors[player.colorIndex]);
      p.strokeWeight(6);
    } else {
      const colorObj = CARD_COLORS.find(c => c.name === route.color);
      if (colorObj) {
        p.stroke(...colorObj.color);
      } else {
        p.stroke(150, 150, 150);
      }
      p.strokeWeight(4);
    }
    
    // Highlight selected route
    if (gameState.turnPhase === "CLAIMING_ROUTE") {
      const unclaimedRoutes = gameState.routes
        .map((r, i) => ({ route: r, index: i }))
        .filter(item => item.route.claimedBy === -1);
      
      if (gameState.menuSelection < unclaimedRoutes.length) {
        const selectedRouteIndex = unclaimedRoutes[gameState.menuSelection].index;
        if (index === selectedRouteIndex) {
          p.strokeWeight(8);
          p.stroke(255, 255, 0);
        }
      }
    }
    
    p.line(city1.x, city1.y, city2.x, city2.y);
    
    // Draw route length markers
    const midX = (city1.x + city2.x) / 2;
    const midY = (city1.y + city2.y) / 2;
    p.fill(255);
    p.noStroke();
    p.ellipse(midX, midY, 16, 16);
    p.fill(0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.text(route.length, midX, midY);
    
    p.pop();
  });
  
  // Draw cities
  gameState.cities.forEach((city, index) => {
    p.fill(80, 60, 40);
    p.noStroke();
    p.ellipse(city.x, city.y, 20, 20);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(9);
    p.text(city.name, city.x, city.y - 20);
  });
}

function drawUIPanel(p) {
  // Top bar with player info
  p.fill(40, 50, 70);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 30);
  
  const player = gameState.players[gameState.currentPlayerIndex];
  p.fill(255, 220, 100);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(12);
  p.text(`${player.name}'s Turn | Trains: ${player.trainPieces} | Score: ${player.score}`, 10, 15);
  
  // Cards count
  p.textAlign(p.RIGHT, p.CENTER);
  p.text(`Cards: ${player.getTotalCards()} | Destinations: ${player.destinationTickets.length}`, CANVAS_WIDTH - 10, 15);
}

function drawActionMenu(p) {
  const actions = ["Draw Cards", "Claim Route", "Draw Destinations"];
  
  p.fill(255, 255, 255, 230);
  p.rect(180, 120, 240, 160);
  
  p.fill(40, 50, 70);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(16);
  p.text("Choose Action", 300, 130);
  
  actions.forEach((action, index) => {
    const y = 160 + index * 35;
    
    if (index === gameState.menuSelection) {
      p.fill(100, 150, 255);
      p.rect(190, y - 5, 220, 30, 5);
    }
    
    p.fill(index === gameState.menuSelection ? 255 : 40);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.text(action, 300, y + 10);
  });
}

function drawCardDrawingUI(p) {
  p.fill(255, 255, 255, 230);
  p.rect(20, 320, CANVAS_WIDTH - 40, 70);
  
  p.fill(40, 50, 70);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text(`Draw Card (${gameState.cardsDrawnThisTurn}/2)`, 30, 330);
  
  // Visible cards
  gameState.visibleCards.forEach((cardColor, index) => {
    const x = 40 + index * 50;
    const y = 350;
    
    if (index === gameState.menuSelection) {
      p.fill(255, 255, 0);
      p.rect(x - 3, y - 3, 40, 26);
    }
    
    const colorObj = CARD_COLORS.find(c => c.name === cardColor);
    if (colorObj) {
      p.fill(...colorObj.color);
    } else {
      p.fill(150);
    }
    p.rect(x, y, 34, 20);
  });
  
  // Deck
  const deckX = 40 + gameState.visibleCards.length * 50;
  if (gameState.menuSelection === gameState.visibleCards.length) {
    p.fill(255, 255, 0);
    p.rect(deckX - 3, 347, 40, 26);
  }
  p.fill(100, 100, 100);
  p.rect(deckX, 350, 34, 20);
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(10);
  p.text("DECK", deckX + 17, 360);
  
  // Instructions
  p.fill(40, 50, 70);
  p.textAlign(p.RIGHT, p.BOTTOM);
  p.textSize(10);
  p.text("Arrow Keys: Select | Space: Draw | Z: Cancel", CANVAS_WIDTH - 30, 380);
}

function drawRouteClaimingUI(p) {
  const player = gameState.players[gameState.currentPlayerIndex];
  const unclaimedRoutes = gameState.routes
    .map((route, index) => ({ route, index }))
    .filter(item => item.route.claimedBy === -1);
  
  if (unclaimedRoutes.length === 0) return;
  
  p.fill(255, 255, 255, 230);
  p.rect(420, 60, 170, 250);
  
  p.fill(40, 50, 70);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(12);
  p.text("Select Route", 505, 70);
  
  const displayCount = Math.min(6, unclaimedRoutes.length);
  const startIdx = Math.max(0, gameState.menuSelection - 2);
  
  for (let i = 0; i < displayCount; i++) {
    const routeIdx = startIdx + i;
    if (routeIdx >= unclaimedRoutes.length) break;
    
    const { route, index } = unclaimedRoutes[routeIdx];
    const city1 = gameState.cities[route.city1Index];
    const city2 = gameState.cities[route.city2Index];
    const y = 95 + i * 35;
    
    if (routeIdx === gameState.menuSelection) {
      p.fill(100, 150, 255);
      p.rect(425, y - 5, 160, 30, 3);
    }
    
    p.fill(routeIdx === gameState.menuSelection ? 255 : 40);
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(9);
    const routeText = `${city1.name.substring(0, 6)}-${city2.name.substring(0, 6)}`;
    p.text(routeText, 430, y + 5);
    
    // Color indicator
    const colorObj = CARD_COLORS.find(c => c.name === route.color);
    if (colorObj) {
      p.fill(...colorObj.color);
    } else {
      p.fill(150);
    }
    p.rect(430, y + 12, 12, 8);
    
    // Length
    p.fill(routeIdx === gameState.menuSelection ? 255 : 40);
    p.textAlign(p.RIGHT, p.CENTER);
    p.text(`x${route.length}`, 580, y + 10);
  }
  
  p.fill(40, 50, 70);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.textSize(9);
  p.text("Space: Claim | Z: Back", 505, 305);
}

function drawDestinationChoiceUI(p) {
  p.fill(0, 0, 0, 180);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 255, 255);
  p.rect(150, 80, 300, 240);
  
  p.fill(40, 50, 70);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(14);
  p.text("Choose Destinations (min 1)", 300, 95);
  
  gameState.tempDestinations.forEach((dest, index) => {
    const city1 = gameState.cities[dest.city1Index];
    const city2 = gameState.cities[dest.city2Index];
    const y = 130 + index * 50;
    
    const isSelected = gameState.selectedCardIndices.includes(index);
    const isHighlighted = index === gameState.menuSelection;
    
    if (isHighlighted) {
      p.fill(100, 150, 255);
      p.rect(160, y - 5, 280, 40, 5);
    }
    
    if (isSelected) {
      p.fill(50, 200, 100);
      p.rect(165, y, 10, 30);
    }
    
    p.fill(isHighlighted ? 255 : 40);
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(12);
    p.text(`${city1.name} → ${city2.name}`, 180, y + 10);
    p.textAlign(p.RIGHT, p.CENTER);
    p.text(`${dest.points} pts`, 430, y + 10);
  });
  
  p.fill(40, 50, 70);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.textSize(10);
  p.text("Space: Toggle | Z: Confirm", 300, 310);
}

function drawDestinationOverlay(p) {
  const player = gameState.players[gameState.currentPlayerIndex];
  if (player.destinationTickets.length === 0) return;
  
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 255, 255);
  p.rect(100, 50, 400, 300);
  
  p.fill(40, 50, 70);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(16);
  p.text("Your Destination Tickets", 300, 65);
  
  player.destinationTickets.forEach((dest, index) => {
    const city1 = gameState.cities[dest.city1Index];
    const city2 = gameState.cities[dest.city2Index];
    const y = 100 + index * 40;
    
    if (y > 320) return; // Don't overflow
    
    const completed = dest.completed;
    p.fill(completed ? [50, 200, 100] : [40, 50, 70]);
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(12);
    p.text(`${city1.name} → ${city2.name}`, 120, y);
    p.textAlign(p.RIGHT, p.CENTER);
    p.text(`${dest.points} pts`, 460, y);
    
    if (completed) {
      p.textAlign(p.RIGHT, p.CENTER);
      p.textSize(10);
      p.text("✓", 480, y);
    }
  });
}

export function renderGameOver(p) {
  p.background(20, 30, 50);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Title
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text(isWin ? "YOU WIN!" : "GAME OVER", CANVAS_WIDTH / 2, 80);
  
  // Scores
  p.fill(200, 220, 255);
  p.textSize(16);
  p.text("Final Scores", CANVAS_WIDTH / 2, 130);
  
  gameState.players.forEach((player, index) => {
    const y = 160 + index * 30;
    p.textSize(14);
    p.fill(index === 0 ? [255, 255, 150] : [180, 180, 180]);
    p.text(`${player.name}: ${player.score} points`, CANVAS_WIDTH / 2, y);
  });
  
  // Longest route bonus
  if (gameState.longestRoutePlayer !== -1) {
    const longestPlayer = gameState.players[gameState.longestRoutePlayer];
    p.fill(150, 200, 255);
    p.textSize(12);
    p.text(`Longest Route: ${longestPlayer.name} (+10 pts)`, CANVAS_WIDTH / 2, 280);
  }
  
  // Restart prompt
  p.fill(255, 255, 100);
  p.textSize(18);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 340);
}