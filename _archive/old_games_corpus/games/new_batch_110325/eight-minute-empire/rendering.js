// rendering.js - Rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_START, PHASE_PLAYING, PHASE_PAUSED } from './globals.js';
import { PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, MAP_DATA } from './globals.js';

export function renderGame(p) {
  gameState.animationFrame++;
  
  if (gameState.gamePhase === PHASE_START) {
    renderStartScreen(p);
  } else if (gameState.gamePhase === PHASE_PLAYING) {
    renderPlayingScreen(p);
  } else if (gameState.gamePhase === PHASE_PAUSED) {
    renderPlayingScreen(p);
    renderPausedOverlay(p);
  } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
    renderGameOverScreen(p);
  }
}

function renderStartScreen(p) {
  p.background(20, 30, 50);
  
  // Title
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("EIGHT-MINUTE EMPIRE", CANVAS_WIDTH / 2, 80);
  
  // Description
  p.fill(200, 200, 220);
  p.textSize(14);
  p.text("Command your forces across the map", CANVAS_WIDTH / 2, 140);
  p.text("Select cards to gain resources and execute actions", CANVAS_WIDTH / 2, 165);
  p.text("Control territories to earn victory points", CANVAS_WIDTH / 2, 190);
  
  // Instructions
  p.fill(180, 220, 255);
  p.textSize(12);
  p.text("ARROW KEYS: Navigate selection", CANVAS_WIDTH / 2, 230);
  p.text("SPACE: Confirm selection", CANVAS_WIDTH / 2, 250);
  p.text("Z: Cancel action", CANVAS_WIDTH / 2, 270);
  p.text("ESC: Pause/Unpause", CANVAS_WIDTH / 2, 290);
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textSize(16);
  const alpha = 128 + 127 * Math.sin(gameState.animationFrame * 0.1);
  p.fill(255, 255, 100, alpha);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 340);
}

function renderPlayingScreen(p) {
  p.background(40, 50, 70);
  
  // Render map background
  renderMap(p);
  
  // Render UI
  renderUI(p);
  
  // Render card market
  renderCardMarket(p);
  
  // Render message
  if (gameState.messageTimer > 0) {
    renderMessage(p);
    gameState.messageTimer--;
  }
}

function renderMap(p) {
  // Draw continent backgrounds
  MAP_DATA.continents.forEach((continent, idx) => {
    const colors = [
      [80, 100, 60],   // West - green
      [100, 80, 60],   // Central - brown
      [60, 80, 100]    // East - blue
    ];
    
    p.fill(...colors[idx], 40);
    p.noStroke();
    
    const regions = continent.regions;
    const minX = Math.min(...regions.map(r => r.x)) - 40;
    const maxX = Math.max(...regions.map(r => r.x)) + 40;
    const minY = Math.min(...regions.map(r => r.y)) - 40;
    const maxY = Math.max(...regions.map(r => r.y)) + 40;
    
    p.rect(minX, minY, maxX - minX, maxY - minY, 10);
  });
  
  // Draw connections
  p.stroke(100, 100, 120, 100);
  p.strokeWeight(2);
  gameState.regions.forEach(region => {
    region.adjacent.forEach(adjId => {
      if (adjId > region.id) { // Draw each connection once
        const adjRegion = gameState.regions[adjId];
        p.line(region.x, region.y, adjRegion.x, adjRegion.y);
      }
    });
  });
  
  // Draw regions
  gameState.regions.forEach((region, idx) => {
    const isSelected = gameState.selectedRegionId === idx;
    const controller = region.getController();
    
    // Region circle
    p.strokeWeight(isSelected ? 4 : 2);
    p.stroke(isSelected ? [255, 255, 100] : [80, 80, 100]);
    
    if (controller === 0) {
      p.fill(100, 150, 255); // Player blue
    } else if (controller === 1) {
      p.fill(255, 100, 100); // AI red
    } else {
      p.fill(120, 120, 140); // Neutral
    }
    
    p.circle(region.x, region.y, region.isCity ? 40 : 30);
    
    // City marker
    if (region.isCity) {
      p.fill(255, 220, 100);
      p.noStroke();
      p.rect(region.x - 8, region.y - 12, 16, 8);
      p.triangle(region.x - 10, region.y - 12, region.x + 10, region.y - 12, region.x, region.y - 20);
    }
    
    // Castle marker
    if (region.castle !== null) {
      p.fill(region.castle === 0 ? [100, 150, 255] : [255, 100, 100]);
      p.noStroke();
      p.rect(region.x - 6, region.y + 8, 12, 8);
      p.rect(region.x - 3, region.y + 4, 6, 4);
    }
    
    // Troop counts
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.fill(255);
    p.noStroke();
    
    if (region.troops[0] > 0) {
      p.text(region.troops[0], region.x - 10, region.y);
    }
    if (region.troops[1] > 0) {
      p.text(region.troops[1], region.x + 10, region.y);
    }
    
    // Region name
    p.textSize(8);
    p.fill(220);
    p.text(region.name, region.x, region.y - 18);
  });
}

function renderUI(p) {
  // Top bar
  p.fill(30, 40, 60);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 50);
  
  // Round counter
  p.fill(255, 220, 100);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(14);
  p.text(`Round ${gameState.currentRound + 1}/${8}`, 10, 25);
  
  // Current player
  const currentPlayer = gameState.players[gameState.currentPlayer];
  p.fill(currentPlayer.id === 0 ? [100, 150, 255] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  p.text(`${currentPlayer.name}'s Turn`, CANVAS_WIDTH / 2, 25);
  
  // Player info
  const player = gameState.players[0];
  p.fill(200);
  p.textAlign(p.RIGHT, p.CENTER);
  p.textSize(10);
  p.text(`Troops: ${player.troops}`, CANVAS_WIDTH - 10, 15);
  p.text(`C:${player.resources.COIN} F:${player.resources.FOOD} W:${player.resources.WOOD}`, CANVAS_WIDTH - 10, 35);
}

function renderCardMarket(p) {
  const cardWidth = 80;
  const cardHeight = 100;
  const startX = 40;
  const startY = 300;
  
  gameState.cardMarket.forEach((card, idx) => {
    const x = startX + idx * (cardWidth + 5);
    const isSelected = gameState.selectedCardIndex === idx;
    
    // Card background
    p.strokeWeight(isSelected ? 3 : 1);
    p.stroke(isSelected ? [255, 255, 100] : [100, 100, 120]);
    p.fill(60, 70, 90);
    p.rect(x, startY, cardWidth, cardHeight, 5);
    
    // Resource
    const resourceColors = {
      COIN: [255, 220, 100],
      FOOD: [100, 255, 100],
      WOOD: [150, 100, 50]
    };
    p.fill(...resourceColors[card.resource]);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text(`${card.resource}`, x + cardWidth / 2, startY + 15);
    p.text(`+${card.amount}`, x + cardWidth / 2, startY + 30);
    
    // Action
    p.fill(200);
    p.textSize(10);
    p.text(card.action, x + cardWidth / 2, startY + 55);
    p.text(`(${card.value})`, x + cardWidth / 2, startY + 70);
    
    // Cost
    p.fill(255, 100, 100);
    p.textSize(10);
    p.text(`Cost: ${card.cost}`, x + cardWidth / 2, startY + 88);
    
    // Selection indicator
    if (gameState.actionState === "SELECT_CARD") {
      if (idx === 0) {
        p.fill(255, 255, 100);
        p.noStroke();
        p.triangle(x - 10, startY + cardHeight / 2 - 5, x - 10, startY + cardHeight / 2 + 5, x - 5, startY + cardHeight / 2);
      }
    }
  });
}

function renderMessage(p) {
  p.fill(30, 30, 40, 200);
  p.noStroke();
  p.rect(50, 250, CANVAS_WIDTH - 100, 40, 5);
  
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(12);
  p.text(gameState.messageText, CANVAS_WIDTH / 2, 270);
}

function renderPausedOverlay(p) {
  p.fill(255, 255, 100);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(12);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

function renderGameOverScreen(p) {
  p.background(20, 30, 50);
  
  const player = gameState.players[0];
  const ai = gameState.players[1];
  
  // Title
  p.fill(gameState.gamePhase === PHASE_GAME_OVER_WIN ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text(gameState.gamePhase === PHASE_GAME_OVER_WIN ? "VICTORY!" : "DEFEAT", CANVAS_WIDTH / 2, 80);
  
  // Scores
  p.fill(200);
  p.textSize(16);
  p.text("FINAL SCORES", CANVAS_WIDTH / 2, 140);
  
  p.textSize(14);
  p.fill(100, 150, 255);
  p.text(`PLAYER: ${player.score}`, CANVAS_WIDTH / 2, 180);
  
  p.fill(255, 100, 100);
  p.text(`AI: ${ai.score}`, CANVAS_WIDTH / 2, 210);
  
  // Breakdown
  p.fill(180);
  p.textSize(11);
  p.textAlign(p.LEFT, p.CENTER);
  
  const breakdownX = 150;
  p.text(`Resources: ${player.resources.COIN + player.resources.FOOD + player.resources.WOOD}`, breakdownX, 250);
  const playerRegions = gameState.regions.filter(r => r.getController() === 0).length;
  p.text(`Regions Controlled: ${playerRegions}`, breakdownX, 270);
  p.text(`Castles: ${player.castles.length}`, breakdownX, 290);
  
  // Restart prompt
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(16);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 340);
}