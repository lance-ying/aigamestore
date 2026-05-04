// rendering.js - Rendering functions

import { gameState, GAME_PHASES, COMBAT_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { renderAnimations } from './combat.js';

export function renderStartScreen(p) {
  p.background(20, 20, 40);
  
  // Title
  p.fill(255, 200, 100);
  p.textSize(32);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("NOVELS ROGUE", CANVAS_WIDTH / 2, 80);
  
  p.fill(200, 180, 255);
  p.textSize(14);
  p.text("Otherworld Old Bookstore", CANVAS_WIDTH / 2, 110);
  
  // Instructions
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    "OBJECTIVE:",
    "• Defeat enemies using cards from your hand",
    "• Progress through 5 floors to defeat the boss",
    "• Build your deck by choosing reward cards",
    "",
    "CONTROLS:",
    "• Arrow Keys: Navigate cards/targets/menus",
    "• Space: Confirm selection",
    "• Z: Cancel/Back",
    "• ESC: Pause",
    "",
    "COMBAT:",
    "• Select a card from your hand",
    "• Choose an enemy target",
    "• After all enemies act, draw new cards",
    "• Defeat all enemies to advance"
  ];
  
  let y = 150;
  instructions.forEach(line => {
    p.text(line, 80, y);
    y += 16;
  });
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textSize(20);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}

export function renderPlayingScreen(p) {
  p.background(30, 30, 50);
  
  // Floor indicator
  p.fill(255, 200, 100);
  p.textSize(16);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Floor ${gameState.currentFloor}/${gameState.maxFloors}`, 10, 10);
  
  // Score
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
  
  // Render entities
  gameState.player.render(p);
  gameState.enemies.forEach(e => e.render(p));
  
  // Render animations
  renderAnimations(p);
  
  // Render based on combat phase
  if (gameState.combatPhase === COMBAT_PHASES.SELECT_CARD) {
    renderHand(p);
    renderCardSelectionUI(p);
  } else if (gameState.combatPhase === COMBAT_PHASES.SELECT_TARGET) {
    renderHand(p);
    renderTargetSelectionUI(p);
  } else if (gameState.combatPhase === COMBAT_PHASES.ANIMATING) {
    renderHand(p);
    p.fill(255, 255, 100);
    p.textSize(14);
    p.textAlign(p.CENTER, p.TOP);
    p.text("Resolving...", CANVAS_WIDTH / 2, 340);
  } else if (gameState.combatPhase === COMBAT_PHASES.ENEMY_TURN) {
    renderHand(p);
    p.fill(255, 100, 100);
    p.textSize(14);
    p.textAlign(p.CENTER, p.TOP);
    p.text("Enemy Turn...", CANVAS_WIDTH / 2, 340);
  } else if (gameState.combatPhase === COMBAT_PHASES.REWARD) {
    renderRewardScreen(p);
  } else if (gameState.combatPhase === COMBAT_PHASES.NEXT_FLOOR) {
    p.fill(255, 255, 100);
    p.textSize(20);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("Advancing to next floor...", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  }
  
  // Deck info
  p.fill(200);
  p.textSize(10);
  p.textAlign(p.LEFT, p.BOTTOM);
  p.text(`Deck: ${gameState.deck.length}`, 10, CANVAS_HEIGHT - 10);
  p.text(`Discard: ${gameState.discardPile.length}`, 10, CANVAS_HEIGHT - 25);
}

export function renderHand(p) {
  const cardWidth = 70;
  const cardHeight = 90;
  const spacing = 5;
  const startX = (CANVAS_WIDTH - (cardWidth + spacing) * gameState.hand.length) / 2;
  const y = CANVAS_HEIGHT - cardHeight - 10;
  
  gameState.hand.forEach((card, index) => {
    const x = startX + index * (cardWidth + spacing);
    const isSelected = index === gameState.selectedCardIndex && 
                       gameState.combatPhase === COMBAT_PHASES.SELECT_CARD;
    
    renderCard(p, card, x, y, cardWidth, cardHeight, isSelected);
  });
}

export function renderCard(p, card, x, y, width, height, isSelected) {
  p.push();
  
  // Card background
  if (isSelected) {
    p.fill(255, 255, 150);
    p.stroke(255, 255, 0);
    p.strokeWeight(3);
  } else {
    p.fill(60, 60, 80);
    p.stroke(100, 100, 120);
    p.strokeWeight(2);
  }
  p.rect(x, y, width, height, 5);
  
  // Card type color bar
  if (card.type === "ATTACK") {
    p.fill(255, 100, 100);
  } else if (card.type === "SKILL") {
    p.fill(100, 255, 100);
  } else {
    p.fill(200, 100, 255);
  }
  p.noStroke();
  p.rect(x, y, width, 15, 5, 5, 0, 0);
  
  // Card name
  p.fill(255);
  p.textSize(10);
  p.textAlign(p.CENTER, p.TOP);
  p.text(card.name, x + width / 2, y + 20);
  
  // Card damage/effect
  if (card.damage > 0) {
    p.textSize(24);
    p.fill(255, 200, 100);
    p.text(card.damage, x + width / 2, y + 38);
  }
  
  // Card description
  p.fill(220);
  p.textSize(8);
  const words = card.description.split(' ');
  let line = '';
  let descY = y + 65;
  
  words.forEach(word => {
    const testLine = line + word + ' ';
    if (p.textWidth(testLine) > width - 8 && line.length > 0) {
      p.text(line, x + width / 2, descY);
      line = word + ' ';
      descY += 9;
    } else {
      line = testLine;
    }
  });
  p.text(line, x + width / 2, descY);
  
  p.pop();
}

export function renderCardSelectionUI(p) {
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.CENTER, p.TOP);
  p.text("Select a card (Arrow Keys, Space to confirm)", CANVAS_WIDTH / 2, 340);
}

export function renderTargetSelectionUI(p) {
  p.fill(255, 255, 100);
  p.textSize(12);
  p.textAlign(p.CENTER, p.TOP);
  p.text("Select target (Arrow Keys, Space to confirm, Z to cancel)", CANVAS_WIDTH / 2, 340);
  
  // Arrow pointing to selected target
  const target = gameState.enemies[gameState.selectedTargetIndex];
  if (target && target.hp > 0) {
    p.push();
    p.fill(255, 255, 0);
    p.noStroke();
    p.triangle(
      target.x, target.y - 60,
      target.x - 10, target.y - 75,
      target.x + 10, target.y - 75
    );
    p.pop();
  }
}

export function renderRewardScreen(p) {
  p.background(20, 30, 50);
  
  p.fill(255, 255, 100);
  p.textSize(24);
  p.textAlign(p.CENTER, p.TOP);
  p.text("Victory!", CANVAS_WIDTH / 2, 30);
  
  p.fill(255);
  p.textSize(14);
  p.text("Choose a card to add to your deck:", CANVAS_WIDTH / 2, 70);
  
  const cardWidth = 100;
  const cardHeight = 130;
  const spacing = 30;
  const startX = (CANVAS_WIDTH - (cardWidth + spacing) * 3 + spacing) / 2;
  const y = 110;
  
  gameState.rewardCards.forEach((card, index) => {
    const x = startX + index * (cardWidth + spacing);
    const isSelected = index === gameState.selectedRewardIndex;
    renderCard(p, card, x, y, cardWidth, cardHeight, isSelected);
  });
  
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.text("Arrow Keys to select, Space to confirm", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20);
}

export function renderPauseOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textSize(16);
  p.textAlign(p.RIGHT, p.TOP);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

export function renderGameOverScreen(p, isWin) {
  p.background(20, 20, 40);
  
  if (isWin) {
    p.fill(100, 255, 100);
    p.textSize(40);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("VICTORY!", CANVAS_WIDTH / 2, 120);
    
    p.fill(255);
    p.textSize(16);
    p.text("You defeated the Dark Witch!", CANVAS_WIDTH / 2, 170);
  } else {
    p.fill(255, 100, 100);
    p.textSize(40);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("DEFEAT", CANVAS_WIDTH / 2, 120);
    
    p.fill(255);
    p.textSize(16);
    p.text("Your journey ends here...", CANVAS_WIDTH / 2, 170);
  }
  
  p.fill(255, 255, 100);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 230);
  
  p.fill(255);
  p.textSize(14);
  p.text(`Reached Floor: ${gameState.currentFloor}`, CANVAS_WIDTH / 2, 270);
  
  p.fill(255, 200, 100);
  p.textSize(18);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 60);
}