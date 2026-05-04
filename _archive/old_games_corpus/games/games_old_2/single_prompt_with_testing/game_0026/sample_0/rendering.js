// rendering.js - Rendering functions
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, CARD_TYPES } from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 25, 35);
  
  // Title
  p.fill(220, 180, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("STEAMWORLD QUEST", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(180, 160, 120);
  p.textSize(20);
  p.text("Card Combat Adventure", CANVAS_WIDTH / 2, 120);
  
  // Description
  p.fill(200, 200, 200);
  p.textSize(14);
  p.textAlign(p.CENTER, p.TOP);
  const desc = [
    "Command a party of steampunk heroes in turn-based card battles!",
    "Build your deck, play 3 cards per turn, and defeat 5 encounters.",
    "",
    "Defeat all enemies to progress. Lose if all heroes fall.",
    "Earn gold to buy new cards and level up your heroes!"
  ];
  for (let i = 0; i < desc.length; i++) {
    p.text(desc[i], CANVAS_WIDTH / 2, 160 + i * 20);
  }
  
  // Controls
  p.fill(255, 220, 150);
  p.textSize(13);
  p.textAlign(p.LEFT, p.TOP);
  const controls = [
    "Arrow Keys: Navigate",
    "Space: Confirm / Execute turn",
    "Shift: View card details",
    "Z: Cancel selection",
    "ESC: Pause",
    "R: Restart"
  ];
  for (let i = 0; i < controls.length; i++) {
    p.text(controls[i], 50, 270 + i * 18);
  }
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textSize(20);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
}

export function renderGameplay(p) {
  p.background(30, 35, 45);
  
  // Render heroes
  for (const hero of gameState.heroes) {
    renderHero(p, hero);
  }
  
  // Render enemies
  for (const enemy of gameState.enemies) {
    renderEnemy(p, enemy);
  }
  
  // Render hand
  renderHand(p);
  
  // Render UI
  renderUI(p);
  
  // Shop overlay
  if (gameState.shopOpen) {
    renderShop(p);
  }
  
  // Detail view
  if (gameState.detailCardIndex >= 0 && gameState.detailCardIndex < gameState.hand.length) {
    renderCardDetail(p, gameState.hand[gameState.detailCardIndex]);
  }
  
  // Paused indicator
  if (gameState.gamePhase === "PAUSED") {
    p.fill(255, 255, 255);
    p.textSize(16);
    p.textAlign(p.RIGHT, p.TOP);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }
}

function renderHero(p, hero) {
  p.push();
  p.translate(hero.x + hero.animOffsetX, hero.y + hero.animOffsetY);
  
  // Body
  const fillColor = hero.flashTimer > 0 ? [255, 255, 255] : hero.color;
  p.fill(...fillColor);
  p.stroke(0);
  p.strokeWeight(2);
  p.rect(-hero.width / 2, -hero.height / 2, hero.width, hero.height, 5);
  
  // Health bar
  p.fill(40, 40, 40);
  p.noStroke();
  p.rect(-hero.width / 2, -hero.height / 2 - 15, hero.width, 8);
  
  const healthPercent = hero.health / hero.maxHealth;
  p.fill(healthPercent > 0.5 ? 100 : 200, healthPercent > 0.5 ? 200 : 100, 50);
  p.rect(-hero.width / 2, -hero.height / 2 - 15, hero.width * healthPercent, 8);
  
  // Health text
  p.fill(255);
  p.textSize(10);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(`${Math.ceil(hero.health)}/${hero.maxHealth}`, 0, -hero.height / 2 - 11);
  
  // Name
  p.textSize(9);
  p.text(hero.name, 0, hero.height / 2 + 10);
  
  // Level indicator
  p.fill(255, 220, 100);
  p.textSize(8);
  p.text(`Lv${hero.level}`, 0, hero.height / 2 + 20);
  
  p.pop();
}

function renderEnemy(p, enemy) {
  p.push();
  p.translate(enemy.x + enemy.animOffsetX, enemy.y + enemy.animOffsetY);
  
  // Body
  const fillColor = enemy.flashTimer > 0 ? [255, 255, 255] : enemy.color;
  p.fill(...fillColor);
  p.stroke(0);
  p.strokeWeight(2);
  
  // Different shapes for variety
  if (enemy.type === "GOBLIN") {
    p.ellipse(0, 0, enemy.width, enemy.height);
  } else if (enemy.type === "ROBOT") {
    p.rect(-enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height);
  } else {
    p.triangle(-enemy.width / 2, enemy.height / 2, 
               enemy.width / 2, enemy.height / 2,
               0, -enemy.height / 2);
  }
  
  // Health bar
  p.fill(40, 40, 40);
  p.noStroke();
  p.rect(-enemy.width / 2, -enemy.height / 2 - 15, enemy.width, 8);
  
  const healthPercent = enemy.health / enemy.maxHealth;
  p.fill(200, 50, 50);
  p.rect(-enemy.width / 2, -enemy.height / 2 - 15, enemy.width * healthPercent, 8);
  
  // Health text
  p.fill(255);
  p.textSize(10);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(`${Math.ceil(enemy.health)}`, 0, -enemy.height / 2 - 11);
  
  // Intent indicator
  p.textSize(12);
  if (enemy.intentDefend) {
    p.fill(100, 150, 255);
    p.text("🛡", 0, -enemy.height / 2 - 30);
  } else {
    p.fill(255, 100, 100);
    p.text(`⚔${enemy.intentDamage}`, 0, -enemy.height / 2 - 30);
  }
  
  p.pop();
}

function renderHand(p) {
  const cardWidth = 70;
  const cardHeight = 90;
  const cardSpacing = 5;
  const startX = 20;
  const startY = CANVAS_HEIGHT - cardHeight - 10;
  
  for (let i = 0; i < gameState.hand.length; i++) {
    const card = gameState.hand[i];
    const x = startX + i * (cardWidth + cardSpacing);
    const y = startY;
    
    const isSelected = gameState.selectedCards.includes(card);
    const isHighlighted = i === gameState.selectedHandIndex && gameState.turnPhase === "SELECT_CARDS";
    
    renderCard(p, card, x, y, cardWidth, cardHeight, isSelected, isHighlighted);
  }
  
  // Selected cards count
  if (gameState.turnPhase === "SELECT_CARDS") {
    p.fill(255, 255, 100);
    p.textSize(14);
    p.textAlign(p.RIGHT, p.BOTTOM);
    p.text(`Selected: ${gameState.selectedCards.length}/3`, CANVAS_WIDTH - 20, CANVAS_HEIGHT - 10);
    
    if (gameState.selectedCards.length === 3) {
      p.fill(100, 255, 100);
      p.text("Press SPACE to execute!", CANVAS_WIDTH - 20, CANVAS_HEIGHT - 30);
    }
  }
}

function renderCard(p, card, x, y, w, h, isSelected, isHighlighted) {
  p.push();
  
  // Card background
  if (isSelected) {
    p.fill(255, 255, 150, 200);
  } else if (isHighlighted) {
    p.fill(200, 220, 255, 230);
  } else {
    p.fill(60, 70, 90, 220);
  }
  p.stroke(isHighlighted ? 255 : 150);
  p.strokeWeight(isHighlighted ? 3 : 2);
  p.rect(x, y, w, h, 5);
  
  // Card type color bar
  let typeColor;
  if (card.type === CARD_TYPES.ATTACK) {
    typeColor = [220, 80, 80];
  } else if (card.type === CARD_TYPES.DEFEND) {
    typeColor = [80, 120, 220];
  } else {
    typeColor = [180, 120, 220];
  }
  p.fill(...typeColor);
  p.noStroke();
  p.rect(x, y, w, 15, 5, 5, 0, 0);
  
  // Card name
  p.fill(255);
  p.textSize(10);
  p.textAlign(p.CENTER, p.TOP);
  p.text(card.name, x + w / 2, y + 2);
  
  // Stats
  p.textSize(16);
  p.textAlign(p.CENTER, p.CENTER);
  
  if (card.damage > 0) {
    p.fill(255, 100, 100);
    p.text(`⚔${card.getDisplayDamage()}`, x + w / 2, y + h / 2 - 10);
  }
  
  if (card.defense > 0) {
    p.fill(100, 150, 255);
    p.text(`🛡${card.getDisplayDefense()}`, x + w / 2, y + h / 2 + 10);
  }
  
  if (card.special) {
    p.fill(220, 180, 255);
    p.textSize(9);
    p.text(card.special, x + w / 2, y + h - 15);
  }
  
  p.pop();
}

function renderUI(p) {
  // Top bar
  p.fill(20, 25, 35, 220);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 35);
  
  // Encounter
  p.fill(255, 220, 150);
  p.textSize(14);
  p.textAlign(p.LEFT, p.CENTER);
  p.text(`Encounter: ${gameState.currentEncounter}/${gameState.totalEncounters}`, 10, 17);
  
  // Gold
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(`Gold: ${gameState.gold}`, CANVAS_WIDTH / 2, 17);
  
  // Experience
  p.fill(150, 255, 150);
  p.textAlign(p.RIGHT, p.CENTER);
  p.text(`Level: ${gameState.level}`, CANVAS_WIDTH - 10, 17);
}

function renderShop(p) {
  // Overlay
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Shop panel
  const panelW = 500;
  const panelH = 350;
  const panelX = (CANVAS_WIDTH - panelW) / 2;
  const panelY = (CANVAS_HEIGHT - panelH) / 2;
  
  p.fill(40, 45, 60);
  p.stroke(200, 180, 100);
  p.strokeWeight(3);
  p.rect(panelX, panelY, panelW, panelH, 10);
  
  // Title
  p.fill(255, 220, 150);
  p.textSize(24);
  p.textAlign(p.CENTER, p.TOP);
  p.text("CARD SHOP", CANVAS_WIDTH / 2, panelY + 15);
  
  p.textSize(14);
  p.fill(200, 200, 200);
  p.text("Select cards to purchase with gold", CANVAS_WIDTH / 2, panelY + 45);
  
  // Available cards
  const cardW = 80;
  const cardH = 100;
  const spacing = 10;
  const startX = panelX + 20;
  const startY = panelY + 80;
  
  for (let i = 0; i < Math.min(gameState.availableCards.length, 5); i++) {
    const card = gameState.availableCards[i];
    const x = startX + i * (cardW + spacing);
    const isHighlighted = i === gameState.selectedShopIndex;
    
    renderShopCard(p, card, x, startY, cardW, cardH, isHighlighted);
  }
  
  // Instructions
  p.fill(255, 255, 100);
  p.textSize(13);
  p.textAlign(p.CENTER, p.TOP);
  p.text("Arrow Keys: Navigate | Space: Buy | Z: Close Shop", CANVAS_WIDTH / 2, panelY + panelH - 40);
  
  // Gold display
  p.fill(255, 215, 0);
  p.textSize(16);
  p.text(`Your Gold: ${gameState.gold}`, CANVAS_WIDTH / 2, panelY + panelH - 20);
}

function renderShopCard(p, card, x, y, w, h, isHighlighted) {
  p.push();
  
  // Card background
  p.fill(isHighlighted ? 100 : 60, isHighlighted ? 110 : 70, isHighlighted ? 130 : 90);
  p.stroke(isHighlighted ? 255 : 150);
  p.strokeWeight(isHighlighted ? 3 : 2);
  p.rect(x, y, w, h, 5);
  
  // Card name
  p.fill(255);
  p.textSize(11);
  p.textAlign(p.CENTER, p.TOP);
  p.text(card.name, x + w / 2, y + 5);
  
  // Stats
  p.textSize(14);
  p.textAlign(p.CENTER, p.CENTER);
  
  if (card.damage > 0) {
    p.fill(255, 100, 100);
    p.text(`⚔${card.damage}`, x + w / 2, y + h / 2 - 15);
  }
  
  if (card.defense > 0) {
    p.fill(100, 150, 255);
    p.text(`🛡${card.defense}`, x + w / 2, y + h / 2);
  }
  
  if (card.special) {
    p.fill(220, 180, 255);
    p.textSize(9);
    p.text(card.special, x + w / 2, y + h / 2 + 15);
  }
  
  // Cost
  p.fill(255, 215, 0);
  p.textSize(12);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.text(`${card.cost}G`, x + w / 2, y + h - 5);
  
  p.pop();
}

function renderCardDetail(p, card) {
  // Detail panel
  const panelW = 250;
  const panelH = 200;
  const panelX = CANVAS_WIDTH - panelW - 20;
  const panelY = 50;
  
  p.fill(30, 35, 45, 240);
  p.stroke(200, 200, 200);
  p.strokeWeight(2);
  p.rect(panelX, panelY, panelW, panelH, 5);
  
  // Card name
  p.fill(255, 220, 150);
  p.textSize(16);
  p.textAlign(p.CENTER, p.TOP);
  p.text(card.name, panelX + panelW / 2, panelY + 10);
  
  // Type
  p.fill(200, 200, 200);
  p.textSize(12);
  p.text(card.type, panelX + panelW / 2, panelY + 30);
  
  // Stats
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  let yOffset = 55;
  
  if (card.damage > 0) {
    p.fill(255, 100, 100);
    p.text(`Damage: ${card.getDisplayDamage()}`, panelX + 15, panelY + yOffset);
    yOffset += 20;
  }
  
  if (card.defense > 0) {
    p.fill(100, 150, 255);
    p.text(`Defense: ${card.getDisplayDefense()}`, panelX + 15, panelY + yOffset);
    yOffset += 20;
  }
  
  if (card.special) {
    p.fill(220, 180, 255);
    p.text(`Special: ${card.special}`, panelX + 15, panelY + yOffset);
    yOffset += 20;
  }
  
  // Description
  p.fill(200, 200, 200);
  p.textSize(11);
  p.text(card.description, panelX + 15, panelY + yOffset);
  
  // Level
  p.fill(255, 220, 100);
  p.textSize(12);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.text(`Level ${card.level}`, panelX + panelW / 2, panelY + panelH - 10);
}

export function renderGameOver(p) {
  p.background(20, 25, 35);
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  // Title
  p.fill(isWin ? 100 : 200, isWin ? 255 : 100, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "VICTORY!" : "DEFEAT", CANVAS_WIDTH / 2, 100);
  
  // Stats
  p.fill(255, 255, 255);
  p.textSize(18);
  p.text(`Encounters Won: ${gameState.battlesWon}`, CANVAS_WIDTH / 2, 160);
  p.text(`Final Level: ${gameState.level}`, CANVAS_WIDTH / 2, 190);
  p.text(`Gold Earned: ${gameState.gold}`, CANVAS_WIDTH / 2, 220);
  
  // Message
  p.fill(200, 200, 200);
  p.textSize(14);
  if (isWin) {
    p.text("You have mastered the art of card combat!", CANVAS_WIDTH / 2, 270);
    p.text("The realm is safe thanks to your heroic party!", CANVAS_WIDTH / 2, 290);
  } else {
    p.text("Your heroes have fallen in battle.", CANVAS_WIDTH / 2, 270);
    p.text("Try again with better strategy and deck building!", CANVAS_WIDTH / 2, 290);
  }
  
  // Restart
  p.fill(255, 255, 100);
  p.textSize(20);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 350);
}