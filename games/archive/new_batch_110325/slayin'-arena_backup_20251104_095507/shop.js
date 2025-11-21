// shop.js - Shop interface and purchasing logic

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { SHOP_ITEMS } from './entities.js';

export function openShop() {
  gameState.shopOpen = true;
  gameState.selectedShopItem = 0;
}

export function closeShop() {
  gameState.shopOpen = false;
}

export function purchaseItem(itemIndex, p) {
  if (itemIndex < 0 || itemIndex >= SHOP_ITEMS.length) return;
  
  const item = SHOP_ITEMS[itemIndex];
  
  if (gameState.coins >= item.cost) {
    gameState.coins -= item.cost;
    applyItemEffect(item, p);
    return true;
  }
  
  return false;
}

function applyItemEffect(item, p) {
  if (!gameState.player) return;
  
  switch (item.type) {
    case "consumable":
      gameState.player.health = Math.min(gameState.player.health + 50, gameState.player.maxHealth);
      break;
    case "damage":
      gameState.player.damage += 5;
      break;
    case "armor":
      gameState.player.armor += 3;
      break;
    case "speed":
      gameState.player.speed += 0.5;
      break;
    case "health":
      gameState.player.maxHealth += 20;
      gameState.player.health += 20;
      break;
  }
}

export function drawShop(p) {
  if (!gameState.shopOpen) return;
  
  // Semi-transparent background
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Shop panel
  p.fill(50, 40, 60);
  p.stroke(200, 180, 100);
  p.strokeWeight(3);
  p.rect(100, 50, 400, 300, 10);
  
  // Title
  p.fill(255, 220, 100);
  p.noStroke();
  p.textAlign(p.CENTER);
  p.textSize(24);
  p.text("MERCHANT'S SHOP", CANVAS_WIDTH / 2, 85);
  
  // Coins display
  p.textSize(16);
  p.fill(255, 255, 100);
  p.text(`Coins: ${gameState.coins}`, CANVAS_WIDTH / 2, 110);
  
  // Shop items
  p.textAlign(p.LEFT);
  p.textSize(14);
  
  SHOP_ITEMS.forEach((item, index) => {
    const y = 140 + index * 35;
    
    // Highlight selected item
    if (index === gameState.selectedShopItem) {
      p.fill(100, 80, 120);
      p.noStroke();
      p.rect(110, y - 18, 380, 30, 5);
    }
    
    // Item name and cost
    const canAfford = gameState.coins >= item.cost;
    p.fill(canAfford ? [255, 255, 255] : [150, 150, 150]);
    p.text(`${item.name} - ${item.cost} coins`, 120, y);
    
    // Item description
    p.textSize(11);
    p.fill(200, 200, 200);
    p.text(item.description, 120, y + 12);
    p.textSize(14);
  });
  
  // Instructions
  p.textAlign(p.CENTER);
  p.textSize(12);
  p.fill(200, 200, 200);
  p.text("Arrow Keys: Select | Space: Purchase | ESC: Close", CANVAS_WIDTH / 2, 330);
}