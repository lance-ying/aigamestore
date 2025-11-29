// renderer.js - Rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { TRAIN_COLORS } from './globals.js';

export function renderGame(p) {
  p.background(240, 230, 210);
  
  if (gameState.gamePhase === "START") {
    renderStartScreen(p);
  } else if (gameState.gamePhase === "PLAYING") {
    renderPlayingScreen(p);
  } else if (gameState.gamePhase === "PAUSED") {
    renderPlayingScreen(p);
    renderPausedOverlay(p);
  } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
    renderGameOverScreen(p);
  }
}

function renderStartScreen(p) {
  p.fill(20, 40, 60);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("Aventureros al Tren®", CANVAS_WIDTH / 2, 80);
  
  p.textSize(14);
  p.fill(60, 80, 100);
  const instructions = [
    "Build railway routes across North America!",
    "",
    "COLLECT colored train cards",
    "CLAIM routes by spending matching cards",
    "COMPLETE destination tickets for bonus points",
    "",
    "Arrow Keys: Navigate menus",
    "Space: Confirm action",
    "Shift: Change action (Draw/Claim/Destinations)",
    "Z: Cancel or go back",
    "",
    "Game ends when trains run low.",
    "Win with 60+ points!"
  ];
  
  let y = 150;
  instructions.forEach(line => {
    p.text(line, CANVAS_WIDTH / 2, y);
    y += 18;
  });
  
  p.textSize(18);
  p.fill(180, 50, 50);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
}

function renderPlayingScreen(p) {
  // Render map background
  p.fill(220, 210, 190);
  p.noStroke();
  p.rect(10, 10, 380, 280);
  
  // Render routes
  gameState.routes.forEach((route, index) => {
    const highlight = (gameState.currentAction === "CLAIM_ROUTE" && 
                      gameState.selectedRouteIndex === gameState.routes.filter(r => !r.claimed).indexOf(route));
    renderRoute(p, route, highlight);
  });
  
  // Render cities
  gameState.cities.forEach(city => {
    renderCity(p, city);
  });
  
  // Render UI
  renderUI(p);
  
  // Render message
  if (gameState.messageTimer > 0) {
    p.fill(0, 0, 0, 200);
    p.noStroke();
    p.rect(100, 180, 400, 40, 5);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.text(gameState.message, 300, 200);
  }
}

function renderRoute(p, route, highlight) {
  const color = getColorRGB(route.color);
  
  p.push();
  if (route.claimed) {
    p.strokeWeight(6);
    p.stroke(100, 100, 100);
    p.line(route.x1, route.y1, route.x2, route.y2);
    
    // Draw claimed indicator
    const mx = (route.x1 + route.x2) / 2;
    const my = (route.y1 + route.y2) / 2;
    p.noStroke();
    p.fill(60, 60, 60);
    p.circle(mx, my, 8);
  } else {
    p.strokeWeight(highlight ? 5 : 3);
    p.stroke(...color, highlight ? 255 : 150);
    p.line(route.x1, route.y1, route.x2, route.y2);
    
    // Draw segments
    const dx = (route.x2 - route.x1) / route.length;
    const dy = (route.y2 - route.y1) / route.length;
    p.noStroke();
    p.fill(...color, 200);
    for (let i = 0; i < route.length; i++) {
      const x = route.x1 + dx * (i + 0.5);
      const y = route.y1 + dy * (i + 0.5);
      p.circle(x, y, highlight ? 6 : 4);
    }
  }
  p.pop();
}

function renderCity(p, city) {
  p.fill(40, 40, 40);
  p.noStroke();
  p.circle(city.x, city.y, 8);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(8);
  p.text(city.name, city.x, city.y - 12);
}

function renderUI(p) {
  // Right panel
  p.fill(250, 245, 235);
  p.stroke(100);
  p.strokeWeight(1);
  p.rect(400, 10, 190, 380);
  
  let y = 20;
  
  // Score and trains
  p.fill(20);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text(`Score: ${gameState.score}`, 410, y);
  y += 20;
  p.text(`Trains: ${gameState.trainsRemaining}`, 410, y);
  y += 25;
  
  // Hand
  p.textSize(12);
  p.text("Hand:", 410, y);
  y += 18;
  renderHand(p, 410, y);
  y += 60;
  
  // Face-up cards
  if (gameState.currentAction === "DRAW_CARDS") {
    p.text("Face-up cards:", 410, y);
    y += 18;
    renderFaceUpCards(p, 410, y);
    y += 50;
  }
  
  // Destinations
  p.text("Destinations:", 410, y);
  y += 18;
  renderDestinations(p, 410, y);
  y += Math.max(gameState.playerDestinations.length * 25, 30);
  
  // Action menu
  if (!gameState.currentAction || gameState.currentAction === null) {
    p.text("Choose action (SHIFT):", 410, y);
    y += 18;
    const actions = ["Draw Cards", "Claim Route", "Draw Destinations"];
    actions.forEach((action, i) => {
      if (i === gameState.menuSelection) {
        p.fill(180, 50, 50);
        p.text("> " + action, 410, y);
      } else {
        p.fill(100);
        p.text("  " + action, 410, y);
      }
      y += 18;
    });
    p.fill(20);
    p.textSize(10);
    p.text("Press SPACE to select", 410, y);
  } else if (gameState.currentAction === "DRAW_CARDS") {
    p.fill(180, 50, 50);
    p.text("Drawing cards...", 410, y);
    y += 18;
    p.fill(100);
    p.textSize(10);
    p.text(`${gameState.cardsDrawnThisTurn}/2 drawn`, 410, y);
    y += 15;
    p.text("Arrow keys + SPACE", 410, y);
    y += 12;
    p.text("Z to cancel", 410, y);
  } else if (gameState.currentAction === "CLAIM_ROUTE") {
    p.fill(180, 50, 50);
    p.text("Claiming route...", 410, y);
    y += 18;
    p.fill(100);
    p.textSize(10);
    p.text("Arrow keys to select", 410, y);
    y += 12;
    p.text("SPACE to claim", 410, y);
    y += 12;
    p.text("Z to cancel", 410, y);
  } else if (gameState.currentAction === "SELECTING_DESTINATIONS" || 
             gameState.currentAction === "CHOOSE_INITIAL_DESTINATIONS") {
    p.fill(180, 50, 50);
    p.text("Select destinations:", 410, y);
    y += 18;
    renderDestinationSelection(p, 410, y);
  }
  
  // Instructions at bottom
  p.fill(100);
  p.textSize(9);
  p.textAlign(p.LEFT, p.BOTTOM);
  p.text("ESC: Pause | R: Restart", 410, 385);
}

function renderHand(p, x, y) {
  const cardCounts = {};
  gameState.playerHand.forEach(card => {
    cardCounts[card] = (cardCounts[card] || 0) + 1;
  });
  
  let cx = x;
  let cy = y;
  Object.keys(cardCounts).forEach(color => {
    const count = cardCounts[color];
    const rgb = getColorRGB(color);
    p.fill(...rgb);
    p.stroke(50);
    p.strokeWeight(1);
    p.rect(cx, cy, 20, 30, 2);
    
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text(count, cx + 10, cy + 15);
    
    cx += 25;
    if (cx > x + 150) {
      cx = x;
      cy += 35;
    }
  });
}

function renderFaceUpCards(p, x, y) {
  for (let i = 0; i < 5; i++) {
    const card = gameState.faceUpCards[i];
    const rgb = getColorRGB(card);
    
    const highlight = (gameState.currentAction === "DRAW_CARDS" && gameState.selectedCardIndex === i);
    
    p.fill(...rgb);
    p.stroke(highlight ? 255 : 50);
    p.strokeWeight(highlight ? 3 : 1);
    p.rect(x + i * 25, y, 20, 30, 2);
  }
  
  // Deck indicator
  const deckHighlight = (gameState.currentAction === "DRAW_CARDS" && gameState.selectedCardIndex === 5);
  p.fill(100);
  p.stroke(deckHighlight ? 255 : 50);
  p.strokeWeight(deckHighlight ? 3 : 1);
  p.rect(x + 5 * 25 + 10, y, 20, 30, 2);
  p.fill(255);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(10);
  p.text("?", x + 5 * 25 + 20, y + 15);
}

function renderDestinations(p, x, y) {
  if (gameState.playerDestinations.length === 0) {
    p.fill(150);
    p.textSize(10);
    p.text("None yet", x, y);
    return;
  }
  
  gameState.playerDestinations.forEach((dest, i) => {
    p.fill(dest.completed ? 50 : 100);
    p.textSize(9);
    const text = `${dest.city1.substring(0, 8)}-${dest.city2.substring(0, 8)} (${dest.points})`;
    p.text(text, x, y + i * 12);
    if (dest.completed) {
      p.stroke(50, 150, 50);
      p.strokeWeight(1);
      p.line(x, y + i * 12 + 5, x + 150, y + i * 12 + 5);
      p.noStroke();
    }
  });
}

function renderDestinationSelection(p, x, y) {
  gameState.destinationsDrawn.forEach((dest, i) => {
    const selected = dest.selected || false;
    const highlight = i === gameState.menuSelection;
    
    p.fill(highlight ? 180 : 100);
    p.textSize(10);
    const checkbox = selected ? "[X]" : "[ ]";
    const text = `${checkbox} ${dest.city1.substring(0, 6)}-${dest.city2.substring(0, 6)} (${dest.points}pts)`;
    p.text(text, x, y + i * 15);
  });
  
  p.fill(150);
  p.textSize(9);
  p.text("SPACE: toggle | Z: confirm", x, y + gameState.destinationsDrawn.length * 15 + 10);
}

function renderPausedOverlay(p) {
  p.fill(255);
  p.noStroke();
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

function renderGameOverScreen(p) {
  p.background(240, 230, 210);
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  p.fill(isWin ? 50 : 150, isWin ? 150 : 50, 50);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(42);
  p.text(isWin ? "VICTORY!" : "GAME OVER", CANVAS_WIDTH / 2, 100);
  
  p.fill(60);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 160);
  
  p.textSize(16);
  p.fill(100);
  let y = 210;
  
  p.text(`Routes Claimed: ${gameState.claimedRoutes.length}`, CANVAS_WIDTH / 2, y);
  y += 25;
  
  const completedDests = gameState.playerDestinations.filter(d => d.completed).length;
  p.text(`Destinations Completed: ${completedDests}/${gameState.playerDestinations.length}`, CANVAS_WIDTH / 2, y);
  y += 25;
  
  p.text(`Trains Remaining: ${gameState.trainsRemaining}`, CANVAS_WIDTH / 2, y);
  y += 50;
  
  p.fill(180, 50, 50);
  p.textSize(20);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 340);
}

function getColorRGB(colorName) {
  const colors = {
    'RED': [220, 50, 50],
    'BLUE': [50, 100, 200],
    'GREEN': [50, 180, 80],
    'YELLOW': [240, 200, 50],
    'BLACK': [40, 40, 40],
    'WHITE': [240, 240, 240],
    'ORANGE': [255, 140, 50],
    'PURPLE': [180, 80, 200],
    'RAINBOW': [150, 100, 255],
    'GRAY': [150, 150, 150]
  };
  return colors[colorName] || [128, 128, 128];
}