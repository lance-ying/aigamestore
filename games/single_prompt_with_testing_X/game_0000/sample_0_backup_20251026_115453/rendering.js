// rendering.js - All rendering functions

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, SHOP_ITEMS } from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 15, 30);
  
  // Title
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text("黄金矿工", CANVAS_WIDTH / 2, 80);
  
  p.fill(255, 200, 0);
  p.textSize(32);
  p.text("GOLD MINER", CANVAS_WIDTH / 2, 120);
  
  // Instructions
  p.fill(255);
  p.textSize(16);
  p.textStyle(p.NORMAL);
  p.text("Swing your claw and grab valuable items!", CANVAS_WIDTH / 2, 180);
  p.text("Meet the money target before time runs out!", CANVAS_WIDTH / 2, 205);
  
  p.textSize(14);
  p.fill(200, 200, 200);
  p.text("SPACE - Deploy Claw", CANVAS_WIDTH / 2, 250);
  p.text("D - Use Dynamite (destroy item)", CANVAS_WIDTH / 2, 275);
  p.text("S - Use Strength Potion (speed boost)", CANVAS_WIDTH / 2, 300);
  
  // Press ENTER prompt
  p.fill(255, 255, 0);
  p.textSize(20);
  const pulse = Math.abs(Math.sin(p.frameCount * 0.05));
  p.fill(255, 255, 0, 150 + pulse * 105);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 350);
  
  p.textAlign(p.LEFT, p.TOP);
}

export function renderGame(p) {
  // Background - mine shaft
  const gradient = p.drawingContext.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  gradient.addColorStop(0, '#87CEEB');
  gradient.addColorStop(0.2, '#654321');
  gradient.addColorStop(1, '#2C1810');
  p.drawingContext.fillStyle = gradient;
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Ground texture
  for (let i = 0; i < 20; i++) {
    p.fill(60, 40, 20, 30);
    p.noStroke();
    const x = (i * 37 + p.frameCount * 0.1) % CANVAS_WIDTH;
    const y = 100 + Math.sin(i * 1.3) * 30;
    p.circle(x, y, 40);
  }
  
  // Draw items
  for (let item of gameState.items) {
    if (!item.grabbed) {
      item.render(p);
    }
  }
  
  // Draw claw
  if (gameState.player) {
    gameState.player.render(p);
  }
  
  // Draw UI
  renderUI(p);
}

export function renderUI(p) {
  // Top bar background
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 35);
  
  // Money
  p.fill(255, 215, 0);
  p.textSize(18);
  p.textAlign(p.LEFT, p.TOP);
  p.textStyle(p.BOLD);
  p.text(`💰 $${gameState.money}`, 10, 8);
  
  // Target
  p.fill(255, 255, 255);
  p.text(`Target: $${gameState.target}`, 150, 8);
  
  // Time
  const timeColor = gameState.timeLeft < 10 ? [255, 0, 0] : [255, 255, 255];
  p.fill(...timeColor);
  p.text(`⏱ ${Math.ceil(gameState.timeLeft)}s`, 320, 8);
  
  // Level
  p.fill(150, 255, 150);
  p.text(`Level ${gameState.level}`, 450, 8);
  
  // Power-ups
  if (gameState.dynamiteCount > 0 || gameState.strengthPotionCount > 0) {
    p.textSize(14);
    let powerUpX = 10;
    const powerUpY = CANVAS_HEIGHT - 25;
    
    if (gameState.dynamiteCount > 0) {
      p.fill(255, 100, 0);
      p.text(`💣 x${gameState.dynamiteCount} (D)`, powerUpX, powerUpY);
      powerUpX += 100;
    }
    
    if (gameState.strengthPotionCount > 0) {
      p.fill(150, 100, 255);
      p.text(`⚡ x${gameState.strengthPotionCount} (S)`, powerUpX, powerUpY);
    }
  }
  
  // Strength potion active indicator
  if (gameState.strengthActive) {
    p.fill(200, 150, 255);
    p.textSize(16);
    p.textAlign(p.CENTER, p.TOP);
    p.text(`⚡ STRENGTH ACTIVE: ${Math.ceil(gameState.strengthTimeLeft)}s`, CANVAS_WIDTH / 2, 40);
  }
  
  p.textAlign(p.LEFT, p.TOP);
  p.textStyle(p.NORMAL);
}

export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  p.textSize(20);
  p.textStyle(p.NORMAL);
  p.text("Press ESC to continue", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
  
  p.textAlign(p.LEFT, p.TOP);
}

export function renderShopScreen(p) {
  p.background(40, 30, 50);
  
  // Title
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.textStyle(p.BOLD);
  p.text("⚒ SHOP ⚒", CANVAS_WIDTH / 2, 50);
  
  // Money
  p.fill(255, 255, 255);
  p.textSize(20);
  p.text(`Your Money: $${gameState.money}`, CANVAS_WIDTH / 2, 90);
  
  // Shop items
  const items = [
    { name: "DYNAMITE", price: SHOP_ITEMS.DYNAMITE.price, desc: "Destroy unwanted item" },
    { name: "STRENGTH_POTION", price: SHOP_ITEMS.STRENGTH_POTION.price, desc: "50% faster retraction (10s)" }
  ];
  
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(18);
  
  items.forEach((item, index) => {
    const y = 140 + index * 80;
    const selected = gameState.shopSelection === index;
    
    // Background
    if (selected) {
      p.fill(100, 80, 120);
    } else {
      p.fill(60, 50, 70);
    }
    p.rect(50, y, CANVAS_WIDTH - 100, 70, 10);
    
    // Item info
    p.fill(255);
    p.textStyle(p.BOLD);
    p.text(item.name.replace('_', ' '), 70, y + 15);
    
    p.textStyle(p.NORMAL);
    p.textSize(14);
    p.fill(200, 200, 200);
    p.text(item.desc, 70, y + 40);
    
    // Price
    p.textSize(18);
    const canAfford = gameState.money >= item.price;
    p.fill(canAfford ? [100, 255, 100] : [255, 100, 100]);
    p.textAlign(p.RIGHT, p.TOP);
    p.text(`$${item.price}`, CANVAS_WIDTH - 70, y + 20);
    p.textAlign(p.LEFT, p.TOP);
  });
  
  // Instructions
  p.fill(255, 255, 0);
  p.textSize(16);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("↑↓ Select  |  SPACE Buy  |  ENTER Continue", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
  
  p.textAlign(p.LEFT, p.TOP);
  p.textStyle(p.NORMAL);
}

export function renderGameOver(p) {
  p.background(20, 15, 30);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Title
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  
  if (isWin) {
    p.fill(100, 255, 100);
    p.text("LEVEL COMPLETE!", CANVAS_WIDTH / 2, 100);
  } else {
    p.fill(255, 100, 100);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 100);
  }
  
  // Stats
  p.fill(255);
  p.textSize(24);
  p.textStyle(p.NORMAL);
  p.text(`Level: ${gameState.level}`, CANVAS_WIDTH / 2, 160);
  p.text(`Money Earned: $${gameState.money}`, CANVAS_WIDTH / 2, 200);
  p.text(`Target: $${gameState.target}`, CANVAS_WIDTH / 2, 240);
  
  if (isWin) {
    p.fill(255, 255, 0);
    p.textSize(20);
    p.text("PRESS ENTER FOR SHOP", CANVAS_WIDTH / 2, 320);
  } else {
    p.fill(255, 100, 100);
    p.textSize(20);
    p.text("Time ran out!", CANVAS_WIDTH / 2, 280);
    
    p.fill(255, 255, 0);
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 320);
  }
  
  p.textAlign(p.LEFT, p.TOP);
}