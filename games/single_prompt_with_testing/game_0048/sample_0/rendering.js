// rendering.js - All rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASE, COMBAT_STATE, BOOKS, CARD_TYPES } from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 15, 30);
  
  // Title
  p.fill(220, 180, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("ノベルズローグ", CANVAS_WIDTH / 2, 60);
  
  p.textSize(16);
  p.fill(180, 150, 200);
  p.text("～異世界古書堂と封印の魔女～", CANVAS_WIDTH / 2, 95);
  
  // Description
  p.textSize(12);
  p.fill(200, 200, 220);
  const descLines = [
    "Welcome to the Ancient Bookstore!",
    "Enter sealed books and battle through dungeons",
    "using strategic card-based combat.",
    "",
    "Build your deck, collect relics, defeat bosses,",
    "and unlock the mysteries within!"
  ];
  
  descLines.forEach((line, i) => {
    p.text(line, CANVAS_WIDTH / 2, 140 + i * 16);
  });
  
  // Controls
  p.textSize(11);
  p.fill(150, 200, 255);
  const controls = [
    "Arrow Keys: Navigate | Space: Confirm | Z: Back",
    "Shift: View Card Details | ESC: Pause | R: Restart"
  ];
  
  controls.forEach((line, i) => {
    p.text(line, CANVAS_WIDTH / 2, 270 + i * 14);
  });
  
  // Start prompt
  p.textSize(16);
  p.fill(255, 220, 100);
  const pulse = 0.5 + 0.5 * Math.sin(p.frameCount * 0.1);
  p.fill(255, 220, 100, 150 + 105 * pulse);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 340);
}

export function renderBookSelection(p) {
  p.background(30, 25, 40);
  
  // Title
  p.fill(220, 200, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  p.text("Select a Book", CANVAS_WIDTH / 2, 30);
  
  // Books
  const bookWidth = 120;
  const bookHeight = 140;
  const spacing = 20;
  const startX = (CANVAS_WIDTH - (bookWidth * 4 + spacing * 3)) / 2;
  
  BOOKS.forEach((book, i) => {
    const x = startX + i * (bookWidth + spacing);
    const y = 80;
    
    const isSelected = gameState.menuSelection === i;
    const isCompleted = gameState.booksCompleted.includes(book.id);
    
    // Book background
    p.push();
    if (isSelected) {
      p.fill(255, 255, 200, 50);
      p.rect(x - 5, y - 5, bookWidth + 10, bookHeight + 10, 5);
    }
    p.pop();
    
    // Book cover
    p.fill(...book.color);
    p.rect(x, y, bookWidth, bookHeight, 5);
    
    // Book title
    p.fill(255);
    p.textSize(10);
    p.text(book.name, x + bookWidth / 2, y + 20);
    
    // Book theme
    p.textSize(9);
    p.fill(200);
    p.text(book.theme, x + bookWidth / 2, y + 40);
    
    // Status
    if (isCompleted) {
      p.fill(100, 255, 100);
      p.textSize(10);
      p.text("✓ Cleared", x + bookWidth / 2, y + bookHeight - 15);
    }
    
    // Floor indicator
    p.fill(220);
    p.textSize(9);
    p.text(`${gameState.maxFloor} Floors`, x + bookWidth / 2, y + 70);
  });
  
  // Instructions
  p.textSize(11);
  p.fill(200, 200, 220);
  p.text("Arrow Keys to Select | Space to Enter | Z to Cancel", CANVAS_WIDTH / 2, 280);
  
  // Stats
  p.textSize(10);
  p.fill(180, 180, 200);
  p.text(`Resources: ${gameState.resources}`, CANVAS_WIDTH / 2, 320);
  p.text(`HP: ${gameState.player.health}/${gameState.player.maxHealth}`, CANVAS_WIDTH / 2, 340);
}

export function renderCombat(p) {
  p.background(40, 35, 50);
  
  // Floor indicator
  p.fill(200, 200, 220);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(11);
  p.text(`Floor ${gameState.currentFloor}/${gameState.maxFloor}`, 10, 10);
  
  // Player stats
  renderPlayerStats(p);
  
  // Enemies
  renderEnemies(p);
  
  // Hand
  renderHand(p);
  
  // Turn indicator
  p.fill(220, 200, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(12);
  if (gameState.combatState === COMBAT_STATE.PLAYER_TURN) {
    p.text("Your Turn", CANVAS_WIDTH / 2, 30);
  }
}

function renderPlayerStats(p) {
  const x = 20;
  const y = 40;
  
  // Health bar
  p.fill(60, 60, 80);
  p.rect(x, y, 150, 20, 3);
  
  const healthPercent = gameState.player.health / gameState.player.maxHealth;
  p.fill(220, 50, 50);
  p.rect(x, y, 150 * healthPercent, 20, 3);
  
  p.fill(255);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(11);
  p.text(`HP: ${gameState.player.health}/${gameState.player.maxHealth}`, x + 5, y + 10);
  
  // Mana
  p.fill(100, 150, 255);
  p.textSize(12);
  p.text(`Mana: ${gameState.player.mana}/${gameState.player.maxMana}`, x, y + 30);
  
  // Block
  if (gameState.player.block > 0) {
    p.fill(150, 150, 200);
    p.text(`Block: ${gameState.player.block}`, x, y + 50);
  }
}

function renderEnemies(p) {
  const enemyCount = gameState.enemies.filter(e => !e.isDead).length;
  const spacing = 100;
  const startX = CANVAS_WIDTH / 2 - (enemyCount - 1) * spacing / 2;
  
  let visibleIndex = 0;
  gameState.enemies.forEach((enemy, i) => {
    if (enemy.isDead) return;
    
    const x = startX + visibleIndex * spacing;
    const y = 120;
    
    const isTargeted = gameState.selectedEnemyIndex === i;
    
    // Target indicator
    if (isTargeted && gameState.combatState === COMBAT_STATE.PLAYER_TURN) {
      p.fill(255, 255, 100, 100);
      p.ellipse(x, y, 70, 70);
    }
    
    // Enemy body
    p.fill(...enemy.color);
    if (enemy.isBoss) {
      p.ellipse(x, y, 60, 60);
    } else {
      p.ellipse(x, y, 45, 45);
    }
    
    // Enemy name
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(enemy.isBoss ? 10 : 9);
    p.text(enemy.name, x, y + (enemy.isBoss ? 45 : 35));
    
    // Health bar
    const barWidth = enemy.isBoss ? 60 : 50;
    const barX = x - barWidth / 2;
    const barY = y + (enemy.isBoss ? 60 : 48);
    
    p.fill(60, 60, 80);
    p.rect(barX, barY, barWidth, 8, 2);
    
    const healthPercent = enemy.health / enemy.maxHealth;
    p.fill(220, 50, 50);
    p.rect(barX, barY, barWidth * healthPercent, 8, 2);
    
    p.fill(255);
    p.textSize(8);
    p.text(`${enemy.health}/${enemy.maxHealth}`, x, barY + 4);
    
    // Intent
    renderEnemyIntent(p, enemy, x, y - (enemy.isBoss ? 45 : 35));
    
    // Block
    if (enemy.block > 0) {
      p.fill(150, 150, 200);
      p.textSize(9);
      p.text(`Shield: ${enemy.block}`, x, barY + 18);
    }
    
    visibleIndex++;
  });
}

function renderEnemyIntent(p, enemy, x, y) {
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(9);
  
  switch (enemy.intent) {
    case "ATTACK":
      p.fill(255, 150, 150);
      p.text(`⚔ ${enemy.intentValue}`, x, y);
      break;
    case "STRONG_ATTACK":
      p.fill(255, 100, 100);
      p.text(`⚔⚔ ${enemy.intentValue}`, x, y);
      break;
    case "DEFEND":
      p.fill(150, 150, 255);
      p.text(`🛡 ${enemy.intentValue}`, x, y);
      break;
  }
  
  // Debuffs
  if (enemy.debuffs.weak > 0) {
    p.fill(200, 150, 255);
    p.textSize(8);
    p.text("Weak", x, y - 12);
  }
  if (enemy.debuffs.poison > 0) {
    p.fill(150, 255, 150);
    p.textSize(8);
    p.text(`Poison ${enemy.debuffs.poison}`, x, y - 12);
  }
}

function renderHand(p) {
  const cardWidth = 70;
  const cardHeight = 90;
  const spacing = 10;
  const handSize = gameState.hand.length;
  const totalWidth = handSize * cardWidth + (handSize - 1) * spacing;
  const startX = (CANVAS_WIDTH - totalWidth) / 2;
  const y = CANVAS_HEIGHT - cardHeight - 15;
  
  gameState.hand.forEach((card, i) => {
    const x = startX + i * (cardWidth + spacing);
    const isSelected = gameState.selectedCardIndex === i;
    
    renderCard(p, card, x, y, cardWidth, cardHeight, isSelected);
  });
  
  // End turn button
  p.fill(100, 100, 150);
  p.rect(CANVAS_WIDTH - 90, CANVAS_HEIGHT - 30, 80, 25, 3);
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(11);
  p.text("End Turn (Z)", CANVAS_WIDTH - 50, CANVAS_HEIGHT - 17);
}

function renderCard(p, card, x, y, w, h, isSelected) {
  // Card background
  p.push();
  if (isSelected) {
    p.translate(0, -10);
  }
  
  // Check if playable
  const canPlay = card.cost <= gameState.player.mana;
  
  // Card border
  if (isSelected) {
    p.fill(255, 255, 150);
    p.rect(x - 2, y - 2, w + 4, h + 4, 5);
  }
  
  // Card base
  let cardColor = [80, 80, 100];
  switch (card.type) {
    case CARD_TYPES.ATTACK:
      cardColor = [180, 80, 80];
      break;
    case CARD_TYPES.DEFEND:
      cardColor = [80, 120, 180];
      break;
    case CARD_TYPES.SKILL:
      cardColor = [100, 180, 100];
      break;
  }
  
  if (!canPlay) {
    cardColor = cardColor.map(c => c * 0.5);
  }
  
  p.fill(...cardColor);
  p.rect(x, y, w, h, 5);
  
  // Card name
  p.fill(255);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(9);
  p.text(card.name, x + w / 2, y + 5);
  
  // Cost
  p.fill(255, 220, 100);
  p.ellipse(x + 12, y + 12, 18, 18);
  p.fill(0);
  p.textSize(11);
  p.text(card.cost, x + 12, y + 8);
  
  // Description
  p.fill(220);
  p.textSize(8);
  p.textAlign(p.CENTER, p.CENTER);
  
  const descLines = wrapText(card.description, w - 10);
  descLines.forEach((line, i) => {
    p.text(line, x + w / 2, y + 40 + i * 10);
  });
  
  p.pop();
}

function wrapText(text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  
  words.forEach(word => {
    if (currentLine.length + word.length < maxWidth / 5) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  });
  
  if (currentLine) lines.push(currentLine);
  return lines;
}

export function renderRewards(p) {
  p.background(40, 35, 50);
  
  // Title
  p.fill(220, 200, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.text("Victory! Choose a Reward", CANVAS_WIDTH / 2, 40);
  
  // Reward cards
  const cardWidth = 100;
  const cardHeight = 130;
  const spacing = 30;
  const startX = (CANVAS_WIDTH - (cardWidth * 3 + spacing * 2)) / 2;
  
  gameState.rewardCards.forEach((card, i) => {
    const x = startX + i * (cardWidth + spacing);
    const y = 100;
    const isSelected = gameState.selectedRewardIndex === i;
    
    renderRewardCard(p, card, x, y, cardWidth, cardHeight, isSelected);
  });
  
  // Instructions
  p.fill(200, 200, 220);
  p.textSize(11);
  p.text("Arrow Keys to Select | Space to Choose", CANVAS_WIDTH / 2, 280);
  p.text(`Next: Floor ${gameState.currentFloor + 1}`, CANVAS_WIDTH / 2, 300);
}

function renderRewardCard(p, card, x, y, w, h, isSelected) {
  if (isSelected) {
    p.fill(255, 255, 150, 100);
    p.rect(x - 5, y - 5, w + 10, h + 10, 5);
  }
  
  let cardColor = [80, 80, 100];
  switch (card.type) {
    case CARD_TYPES.ATTACK:
      cardColor = [180, 80, 80];
      break;
    case CARD_TYPES.DEFEND:
      cardColor = [80, 120, 180];
      break;
    case CARD_TYPES.SKILL:
      cardColor = [100, 180, 100];
      break;
  }
  
  p.fill(...cardColor);
  p.rect(x, y, w, h, 5);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(11);
  p.text(card.name, x + w / 2, y + 10);
  
  p.fill(255, 220, 100);
  p.ellipse(x + 15, y + 15, 22, 22);
  p.fill(0);
  p.textSize(13);
  p.text(card.cost, x + 15, y + 10);
  
  p.fill(220);
  p.textSize(9);
  p.textAlign(p.CENTER, p.CENTER);
  const descLines = wrapText(card.description, w - 10);
  descLines.forEach((line, i) => {
    p.text(line, x + w / 2, y + 50 + i * 12);
  });
}

export function renderPaused(p) {
  p.fill(255, 255, 100);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

export function renderGameOver(p, isWin) {
  p.background(isWin ? [30, 50, 30] : [50, 30, 30]);
  
  p.fill(isWin ? [150, 255, 150] : [255, 150, 150]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text(isWin ? "VICTORY!" : "DEFEATED", CANVAS_WIDTH / 2, 100);
  
  if (isWin) {
    p.textSize(16);
    p.fill(200, 200, 255);
    p.text("You cleared the book!", CANVAS_WIDTH / 2, 150);
    p.text("The seal has been broken.", CANVAS_WIDTH / 2, 175);
  } else {
    p.textSize(16);
    p.fill(200, 200, 220);
    p.text("Your journey ends here...", CANVAS_WIDTH / 2, 150);
  }
  
  p.textSize(14);
  p.fill(220, 220, 255);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  p.text(`Floors Cleared: ${gameState.currentFloor - (isWin ? 0 : 1)}/${gameState.maxFloor}`, CANVAS_WIDTH / 2, 245);
  
  p.textSize(16);
  p.fill(255, 220, 100);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 320);
}