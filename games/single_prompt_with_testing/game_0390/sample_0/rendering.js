// rendering.js - Rendering functions

import { gameState, GAME_PHASES, PLAY_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, INGREDIENT_TYPES } from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 15, 30);
  
  // Title
  p.fill(255, 200, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("POTION SHOP TYCOON", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.textSize(16);
  p.fill(200, 150, 200);
  p.text("Brew, Haggle, Prosper!", CANVAS_WIDTH / 2, 120);
  
  // Story
  p.textSize(14);
  p.fill(220, 220, 220);
  p.textAlign(p.CENTER, p.TOP);
  const story = [
    "You've inherited your uncle's potion shop—and a huge debt!",
    "Brew potions, negotiate with customers, and pay off 500 gold",
    "before the debt collectors arrive in 60 days.",
    "",
    "Upgrade ingredients, master haggling, and become",
    "the most successful potion merchant in Rafta!"
  ];
  let y = 160;
  for (const line of story) {
    p.text(line, CANVAS_WIDTH / 2, y);
    y += 20;
  }
  
  // Controls
  p.textSize(13);
  p.fill(150, 200, 255);
  p.textAlign(p.LEFT, p.TOP);
  const controls = [
    "CONTROLS:",
    "Arrow Keys - Navigate menus",
    "Space - Confirm / Play card",
    "Z - Cancel / Back",
    "Shift - View details",
    "ESC - Pause game"
  ];
  y = 280;
  for (const line of controls) {
    p.text(line, 40, y);
    y += 18;
  }
  
  // Start prompt
  p.textSize(20);
  p.fill(100, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  const flash = Math.sin(p.frameCount * 0.1) * 0.5 + 0.5;
  p.fill(100 + flash * 155, 255, 100 + flash * 155);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
}

export function renderGameOverScreen(p) {
  p.background(20, 15, 30);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Title
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.fill(...(isWin ? [100, 255, 100] : [255, 100, 100]));
  p.text(isWin ? "SUCCESS!" : "GAME OVER", CANVAS_WIDTH / 2, 100);
  
  // Message
  p.textSize(18);
  p.fill(220, 220, 220);
  if (isWin) {
    p.text("You've paid off the debt!", CANVAS_WIDTH / 2, 150);
    p.text("The shop is yours!", CANVAS_WIDTH / 2, 180);
  } else {
    p.text("Time ran out...", CANVAS_WIDTH / 2, 150);
    p.text("The debt collectors have arrived.", CANVAS_WIDTH / 2, 180);
  }
  
  // Stats
  p.textSize(16);
  p.fill(200, 200, 200);
  p.textAlign(p.LEFT, p.TOP);
  let y = 230;
  const stats = [
    `Days Survived: ${gameState.day}`,
    `Potions Brewed: ${gameState.potionsBrewed}`,
    `Potions Sold: ${gameState.potionsSold}`,
    `Total Revenue: ${gameState.totalRevenue}g`,
    `Final Debt: ${gameState.debt}g`,
    `Gold Remaining: ${gameState.gold}g`
  ];
  for (const stat of stats) {
    p.text(stat, 200, y);
    y += 22;
  }
  
  // Restart prompt
  p.textSize(20);
  p.fill(100, 200, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 370);
}

export function renderShopMenu(p) {
  p.background(40, 30, 50);
  
  // Header
  renderHeader(p);
  
  // Menu title
  p.fill(255, 200, 100);
  p.textSize(24);
  p.textAlign(p.CENTER, p.TOP);
  p.text("SHOP MENU", CANVAS_WIDTH / 2, 80);
  
  // Menu options
  const options = [
    "1. Brew Potion",
    "2. Sell to Customer",
    "3. Buy Ingredients (10g per unit)",
    "4. Upgrade Ingredient (30g × level)",
    "5. Pay Debt",
    "6. End Day"
  ];
  
  p.textSize(18);
  p.textAlign(p.LEFT, p.TOP);
  let y = 130;
  for (let i = 0; i < options.length; i++) {
    if (i === gameState.menuSelection) {
      p.fill(255, 255, 100);
      p.rect(80, y - 2, 440, 28);
      p.fill(0);
    } else {
      p.fill(220, 220, 220);
    }
    p.text(options[i], 90, y);
    y += 35;
  }
  
  // Inventory summary
  p.textSize(12);
  p.fill(150, 150, 150);
  p.text(`Potions ready: ${gameState.potions.length}`, 90, y + 10);
}

export function renderBrewing(p) {
  p.background(30, 40, 60);
  
  renderHeader(p);
  
  // Title
  p.fill(255, 200, 100);
  p.textSize(24);
  p.textAlign(p.CENTER, p.TOP);
  p.text("BREW POTION", CANVAS_WIDTH / 2, 80);
  
  // Instructions
  p.textSize(12);
  p.fill(200, 200, 200);
  p.text("Select 3 ingredients (Arrows to navigate, Space to add, Z to cancel)", CANVAS_WIDTH / 2, 110);
  
  // Brewing slots
  const slotY = 150;
  for (let i = 0; i < 3; i++) {
    const x = 150 + i * 100;
    const slot = gameState.brewingSlots[i];
    
    // Slot background
    if (i === gameState.selectedSlot) {
      p.fill(100, 100, 150);
    } else {
      p.fill(50, 50, 80);
    }
    p.rect(x - 35, slotY - 35, 70, 70, 5);
    
    // Ingredient
    if (slot) {
      const color = INGREDIENT_TYPES[slot.type].color;
      p.fill(...color);
      p.ellipse(x, slotY, 50, 50);
      p.fill(255);
      p.textSize(10);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(`Lv${slot.level}`, x, slotY + 30);
    } else {
      p.fill(100, 100, 100);
      p.textSize(24);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("?", x, slotY);
    }
  }
  
  // Available ingredients
  p.textSize(16);
  p.fill(200, 200, 200);
  p.textAlign(p.LEFT, p.TOP);
  p.text("Available Ingredients:", 80, 250);
  
  let y = 280;
  let idx = 0;
  for (const ing of gameState.ingredients) {
    if (ing.count > 0) {
      const color = INGREDIENT_TYPES[ing.type].color;
      p.fill(...color);
      p.ellipse(100, y, 20, 20);
      
      p.fill(220, 220, 220);
      p.textSize(14);
      p.text(`${INGREDIENT_TYPES[ing.type].name} Lv${ing.level} × ${ing.count}`, 120, y - 8);
    }
    y += 25;
    idx++;
  }
  
  // Brew button
  if (gameState.brewingSlots.every(s => s !== null)) {
    p.fill(100, 255, 100);
    p.rect(CANVAS_WIDTH / 2 - 80, 350, 160, 35, 5);
    p.fill(0);
    p.textSize(16);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("PRESS SPACE TO BREW", CANVAS_WIDTH / 2, 367);
  }
}

export function renderNegotiation(p) {
  p.background(50, 30, 40);
  
  renderHeader(p);
  
  // Customer info
  p.fill(255, 200, 100);
  p.textSize(20);
  p.textAlign(p.CENTER, p.TOP);
  p.text(`Customer: ${gameState.currentCustomer.name}`, CANVAS_WIDTH / 2, 80);
  
  // Potion being sold
  const potion = gameState.currentCustomer.desiredPotion;
  if (potion) {
    p.textSize(14);
    p.fill(200, 200, 200);
    p.text(potion.getName(), CANVAS_WIDTH / 2, 105);
    
    // Potion visual
    const potionColor = potion.getColor();
    p.fill(...potionColor);
    p.ellipse(CANVAS_WIDTH / 2, 145, 40, 40);
  }
  
  // Price progress
  p.textSize(16);
  p.fill(220, 220, 220);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Current Price: ${gameState.currentPrice}g`, 80, 180);
  p.text(`Target: ${gameState.priceTarget}g`, 80, 205);
  
  // Progress bar
  const progress = Math.min(1, gameState.currentPrice / gameState.priceTarget);
  p.fill(100, 100, 100);
  p.rect(80, 230, 440, 20);
  p.fill(100, 255, 100);
  p.rect(80, 230, 440 * progress, 20);
  
  // Stress meters
  p.textSize(14);
  p.fill(220, 220, 220);
  p.text("Customer Stress:", 80, 265);
  const custStressRatio = gameState.customerStress / gameState.currentCustomer.patience;
  p.fill(60, 60, 60);
  p.rect(210, 267, 200, 15);
  p.fill(255 * custStressRatio, 255 * (1 - custStressRatio), 0);
  p.rect(210, 267, 200 * custStressRatio, 15);
  
  p.fill(220, 220, 220);
  p.text("Your Stress:", 80, 290);
  const playerStressRatio = gameState.playerStress / 100;
  p.fill(60, 60, 60);
  p.rect(210, 292, 200, 15);
  p.fill(255 * playerStressRatio, 255 * (1 - playerStressRatio), 0);
  p.rect(210, 292, 200 * playerStressRatio, 15);
  
  // Cards
  p.textSize(14);
  p.fill(200, 200, 200);
  p.text("Negotiation Cards (Space to play):", 80, 320);
  
  const cardStartX = 100;
  const cardY = 355;
  for (let i = 0; i < gameState.negotiationCards.length; i++) {
    const card = gameState.negotiationCards[i];
    const x = cardStartX + i * 90;
    
    // Card background
    if (i === gameState.selectedCard) {
      p.fill(255, 255, 150);
      p.rect(x - 32, cardY - 22, 64, 44, 3);
    }
    
    const color = card.getColor();
    p.fill(...color);
    p.rect(x - 30, cardY - 20, 60, 40, 3);
    
    // Card text
    p.fill(0);
    p.textSize(10);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(card.getName(), x, cardY - 8);
    p.text(`+${card.getValue()}g`, x, cardY + 5);
  }
}

export function renderHeader(p) {
  p.fill(30, 30, 30);
  p.rect(0, 0, CANVAS_WIDTH, 70);
  
  // Title
  p.fill(255, 200, 100);
  p.textSize(18);
  p.textAlign(p.LEFT, p.TOP);
  p.text("Potion Shop", 20, 15);
  
  // Stats
  p.textSize(14);
  p.fill(220, 220, 220);
  p.text(`Day ${gameState.day}/${gameState.maxDays}`, 20, 40);
  
  p.fill(255, 215, 0);
  p.text(`Gold: ${gameState.gold}g`, 150, 15);
  
  p.fill(255, 100, 100);
  p.text(`Debt: ${gameState.debt}g`, 150, 40);
  
  p.fill(150, 150, 255);
  p.text(`Potions: ${gameState.potions.length}`, 300, 15);
}

export function renderPausedIndicator(p) {
  p.fill(255, 255, 0);
  p.textSize(16);
  p.textAlign(p.RIGHT, p.TOP);
  p.text("PAUSED", CANVAS_WIDTH - 20, 20);
}

export function render(p) {
  if (gameState.gamePhase === GAME_PHASES.START) {
    renderStartScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    renderGameOverScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    if (gameState.playPhase === PLAY_PHASES.SHOP_MENU) {
      renderShopMenu(p);
    } else if (gameState.playPhase === PLAY_PHASES.BREWING) {
      renderBrewing(p);
    } else if (gameState.playPhase === PLAY_PHASES.NEGOTIATION) {
      renderNegotiation(p);
    }
  }
  
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    renderPausedIndicator(p);
  }
}