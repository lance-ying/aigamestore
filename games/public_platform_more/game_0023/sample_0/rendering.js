// rendering.js - All rendering functions
import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, SUBPHASE_AGENT_PLACEMENT, SUBPHASE_REVEAL, SUBPHASE_COMBAT, SUBPHASE_CLEANUP, CANVAS_WIDTH, CANVAS_HEIGHT, FACTIONS } from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 15, 10);
  
  // Title with desert theme
  p.fill(220, 180, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.text("DUNE: IMPERIUM", CANVAS_WIDTH / 2, 60);
  
  // Subtitle
  p.textSize(16);
  p.fill(180, 140, 80);
  p.text("A Deck-Building Strategy Game", CANVAS_WIDTH / 2, 100);
  
  // Instructions
  p.textSize(14);
  p.fill(200, 200, 200);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    "OBJECTIVE: Be the first to reach 10 Victory Points!",
    "",
    "GAMEPLAY:",
    "• Draw 5 cards each round",
    "• Play cards to deploy agents to locations",
    "• Gather Spice and Solari resources",
    "• Gain influence with four factions",
    "• Win combat to earn Victory Points",
    "• Buy powerful cards to improve your deck",
    "",
    "CONTROLS:",
    "Arrow Keys: Navigate and select",
    "Space: Confirm selection",
    "Z: Cancel selection"
  ];
  
  let y = 140;
  for (const line of instructions) {
    p.text(line, 60, y);
    y += 18;
  }
  
  // Start prompt
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
}

export function renderPlayingScreen(p) {
  p.background(40, 30, 20);
  
  // Draw board background
  drawBoard(p);
  
  // Draw locations
  drawLocations(p);
  
  // Draw player info
  drawPlayerInfo(p, gameState.player, 10, 10, false);
  drawPlayerInfo(p, gameState.opponent, CANVAS_WIDTH - 180, 10, true);
  
  // Draw current player's hand
  if (gameState.currentPlayer === 0) {
    drawHand(p, gameState.player);
  }
  
  // Draw market cards if applicable
  if (gameState.subPhase === SUBPHASE_AGENT_PLACEMENT && gameState.selectedLocationIndex >= 0) {
    const loc = gameState.locations[gameState.selectedLocationIndex];
    if (loc.type === "market") {
      drawMarket(p);
    }
  }
  
  // Draw phase indicator
  drawPhaseIndicator(p);
  
  // Draw message
  if (gameState.messageText && gameState.messageTimer > 0) {
    drawMessage(p, gameState.messageText);
  }
}

function drawBoard(p) {
  // Desert background pattern
  p.fill(60, 45, 30);
  p.noStroke();
  p.rect(0, 80, CANVAS_WIDTH, 240);
  
  // Sand dunes pattern
  for (let i = 0; i < 10; i++) {
    p.fill(70 + i * 2, 50 + i * 2, 35 + i);
    p.ellipse(i * 70 + 30, 200, 80, 40);
  }
}

function drawLocations(p) {
  const locations = gameState.locations;
  const cols = 3;
  const rows = 3;
  const w = 170;
  const h = 70;
  const startX = 30;
  const startY = 90;
  const gapX = 15;
  const gapY = 10;
  
  for (let i = 0; i < locations.length; i++) {
    const loc = locations[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * (w + gapX);
    const y = startY + row * (h + gapY);
    
    drawLocation(p, loc, x, y, w, h, i === gameState.selectedLocationIndex);
  }
}

function drawLocation(p, loc, x, y, w, h, isSelected) {
  p.push();
  
  // Background color based on type
  let bgColor = [80, 70, 50];
  if (loc.isCombat) bgColor = [120, 40, 40];
  else if (loc.type === "resource") bgColor = [60, 80, 60];
  else if (loc.type === "influence") bgColor = [60, 60, 100];
  else if (loc.type === "market") bgColor = [100, 80, 50];
  
  // Highlight if selected
  if (isSelected) {
    p.fill(255, 220, 100, 100);
    p.stroke(255, 220, 100);
    p.strokeWeight(3);
    p.rect(x - 2, y - 2, w + 4, h + 4, 5);
  }
  
  // Location background
  p.fill(...bgColor);
  p.stroke(40, 30, 20);
  p.strokeWeight(2);
  p.rect(x, y, w, h, 5);
  
  // Location name
  p.fill(255, 255, 255);
  p.noStroke();
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(11);
  p.text(loc.name, x + w / 2, y + 5);
  
  // Reward info
  p.textSize(9);
  p.textAlign(p.LEFT, p.TOP);
  let rewardText = "";
  if (loc.reward) {
    if (loc.reward.type === "SPICE") rewardText = `Spice +${loc.reward.value}`;
    else if (loc.reward.type === "SOLARI") rewardText = `Solari +${loc.reward.value}`;
  }
  if (loc.influenceFaction) {
    rewardText += (rewardText ? ", " : "") + `${loc.influenceFaction.substring(0, 3)} +1`;
  }
  if (loc.isCombat && loc.vpReward > 0) {
    rewardText += (rewardText ? ", " : "") + `VP +${loc.vpReward}`;
  }
  p.text(rewardText, x + 5, y + 25);
  
  // Occupied indicator
  if (loc.occupied) {
    p.fill(loc.occupied === "player" ? [100, 150, 255] : [255, 100, 100]);
    p.ellipse(x + w - 15, y + h - 15, 20, 20);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.text(loc.occupied === "player" ? "P" : "A", x + w - 15, y + h - 15);
  }
  
  p.pop();
}

function drawPlayerInfo(p, player, x, y, isOpponent) {
  p.push();
  
  // Background
  p.fill(30, 25, 20, 200);
  p.stroke(100, 80, 60);
  p.strokeWeight(2);
  p.rect(x, y, 170, 65, 5);
  
  // Title
  p.fill(255, 220, 100);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text(isOpponent ? "OPPONENT" : "PLAYER", x + 5, y + 5);
  
  // VP
  p.fill(255, 255, 255);
  p.textSize(11);
  p.text(`VP: ${player.victoryPoints}`, x + 5, y + 22);
  
  // Resources
  p.textSize(10);
  p.text(`Spice: ${player.resources.SPICE}`, x + 5, y + 38);
  p.text(`Solari: ${player.resources.SOLARI}`, x + 90, y + 38);
  
  // Agents
  p.text(`Agents: ${player.agentsAvailable}`, x + 5, y + 52);
  
  // Combat strength (during combat phase)
  if (gameState.subPhase === SUBPHASE_COMBAT) {
    p.text(`Combat: ${player.combatStrength}`, x + 90, y + 52);
  }
  
  p.pop();
}

function drawHand(p, player) {
  const hand = player.hand;
  if (hand.length === 0) return;
  
  p.push();
  
  const cardWidth = 80;
  const cardHeight = 50;
  const startX = (CANVAS_WIDTH - hand.length * (cardWidth + 5)) / 2;
  const y = 330;
  
  for (let i = 0; i < hand.length; i++) {
    const card = hand[i];
    const x = startX + i * (cardWidth + 5);
    const isSelected = i === gameState.selectedCardIndex;
    
    drawCard(p, card, x, y, cardWidth, cardHeight, isSelected);
  }
  
  p.pop();
}

function drawCard(p, card, x, y, w, h, isSelected) {
  p.push();
  
  // Highlight if selected
  if (isSelected) {
    p.fill(255, 220, 100, 150);
    p.stroke(255, 220, 100);
    p.strokeWeight(3);
    p.rect(x - 2, y - 2, w + 4, h + 4, 3);
  }
  
  // Card background
  p.fill(60, 50, 40);
  p.stroke(100, 90, 70);
  p.strokeWeight(2);
  p.rect(x, y, w, h, 3);
  
  // Card name
  p.fill(255, 255, 255);
  p.noStroke();
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(9);
  p.text(card.name, x + w / 2, y + 3);
  
  // Combat value
  if (card.combat > 0) {
    p.fill(255, 100, 100);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(12);
    p.text(`⚔${card.combat}`, x + 3, y + 18);
  }
  
  // Agent effect indicator
  if (card.agentEffect) {
    p.fill(100, 200, 255);
    p.ellipse(x + w - 10, y + 25, 12, 12);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(8);
    p.text("A", x + w - 10, y + 25);
  }
  
  // Reveal effect indicator
  if (card.revealEffect) {
    p.fill(200, 200, 100);
    p.ellipse(x + w - 10, y + h - 10, 12, 12);
    p.fill(0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(8);
    p.text("R", x + w - 10, y + h - 10);
  }
  
  p.pop();
}

function drawMarket(p) {
  const marketCards = gameState.marketCards;
  
  p.push();
  
  // Market background
  p.fill(20, 15, 10, 230);
  p.stroke(180, 140, 80);
  p.strokeWeight(3);
  p.rect(50, 100, 500, 200, 10);
  
  // Title
  p.fill(220, 180, 100);
  p.noStroke();
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(16);
  p.text("SPICE MARKET - Select Card to Purchase", CANVAS_WIDTH / 2, 110);
  
  // Draw market cards
  const cardWidth = 100;
  const cardHeight = 60;
  const cols = 4;
  const rows = 2;
  const startX = 70;
  const startY = 140;
  const gapX = 10;
  const gapY = 10;
  
  for (let i = 0; i < marketCards.length && i < 8; i++) {
    const card = marketCards[i];
    if (!card) continue;
    
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * (cardWidth + gapX);
    const y = startY + row * (cardHeight + gapY);
    
    drawMarketCard(p, card, x, y, cardWidth, cardHeight, i === gameState.selectedCardIndex);
  }
  
  // Instructions
  p.fill(200, 200, 200);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.textSize(11);
  p.text("Arrow Keys: Select | Space: Buy | Z: Cancel", CANVAS_WIDTH / 2, 290);
  
  p.pop();
}

function drawMarketCard(p, card, x, y, w, h, isSelected) {
  p.push();
  
  const canAfford = gameState.player.canAffordCard(card);
  
  // Highlight if selected
  if (isSelected) {
    p.fill(255, 220, 100, 150);
    p.stroke(255, 220, 100);
    p.strokeWeight(3);
    p.rect(x - 2, y - 2, w + 4, h + 4, 3);
  }
  
  // Card background
  p.fill(canAfford ? [70, 60, 50] : [40, 35, 30]);
  p.stroke(canAfford ? [120, 100, 80] : [60, 50, 40]);
  p.strokeWeight(2);
  p.rect(x, y, w, h, 3);
  
  // Card name
  p.fill(canAfford ? [255, 255, 255] : [150, 150, 150]);
  p.noStroke();
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(9);
  p.text(card.name, x + w / 2, y + 3);
  
  // Cost
  p.fill(220, 180, 100);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(10);
  p.text(`${card.cost}§`, x + 3, y + 16);
  
  // Combat value
  if (card.combat > 0) {
    p.fill(255, 100, 100);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(11);
    p.text(`⚔${card.combat}`, x + w - 3, y + 16);
  }
  
  // Effects
  p.textSize(8);
  p.textAlign(p.LEFT, p.TOP);
  let effectY = y + 32;
  if (card.agentEffect) {
    p.fill(100, 200, 255);
    p.text("Agent", x + 3, effectY);
    effectY += 10;
  }
  if (card.revealEffect) {
    p.fill(200, 200, 100);
    p.text("Reveal", x + 3, effectY);
  }
  
  p.pop();
}

function drawPhaseIndicator(p) {
  p.push();
  
  let phaseText = "";
  switch (gameState.subPhase) {
    case SUBPHASE_AGENT_PLACEMENT:
      phaseText = gameState.currentPlayer === 0 ? "YOUR TURN - Play Card & Deploy Agent" : "OPPONENT'S TURN";
      break;
    case SUBPHASE_REVEAL:
      phaseText = "REVEAL PHASE";
      break;
    case SUBPHASE_COMBAT:
      phaseText = "COMBAT PHASE";
      break;
    case SUBPHASE_CLEANUP:
      phaseText = "ROUND END";
      break;
  }
  
  p.fill(20, 15, 10, 200);
  p.noStroke();
  p.rect(CANVAS_WIDTH / 2 - 100, 0, 200, 25);
  
  p.fill(220, 180, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(12);
  p.text(phaseText, CANVAS_WIDTH / 2, 12);
  
  // Round indicator
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(11);
  p.text(`Round ${gameState.round}`, 10, 385);
  
  p.pop();
}

function drawMessage(p, message) {
  p.push();
  
  p.fill(20, 15, 10, 230);
  p.stroke(220, 180, 100);
  p.strokeWeight(3);
  p.rect(CANVAS_WIDTH / 2 - 200, CANVAS_HEIGHT / 2 - 30, 400, 60, 10);
  
  p.fill(255, 255, 255);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  p.text(message, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  p.pop();
}

export function renderPausedScreen(p) {
  renderPlayingScreen(p);
  
  // Overlay
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Paused indicator
  p.fill(255, 220, 100);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

export function renderGameOverScreen(p) {
  p.background(20, 15, 10);
  
  const isWin = gameState.gamePhase === PHASE_GAME_OVER_WIN;
  
  // Title
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "VICTORY!" : "DEFEAT", CANVAS_WIDTH / 2, 100);
  
  // Final scores
  p.fill(220, 180, 100);
  p.textSize(24);
  p.text(`Your Victory Points: ${gameState.player.victoryPoints}`, CANVAS_WIDTH / 2, 160);
  p.text(`Opponent Victory Points: ${gameState.opponent.victoryPoints}`, CANVAS_WIDTH / 2, 200);
  
  // Stats
  p.fill(200, 200, 200);
  p.textSize(16);
  p.text(`Rounds Played: ${gameState.round}`, CANVAS_WIDTH / 2, 250);
  p.text(`Final Spice: ${gameState.player.resources.SPICE}`, CANVAS_WIDTH / 2, 280);
  p.text(`Final Solari: ${gameState.player.resources.SOLARI}`, CANVAS_WIDTH / 2, 310);
  
  // Restart prompt
  p.fill(255, 220, 100);
  p.textSize(18);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 360);
}