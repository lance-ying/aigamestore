// inventory.js
import { gameState } from './globals.js';

export function addToInventory(itemName) {
  if (!gameState.inventory.includes(itemName)) {
    gameState.inventory.push(itemName);
  }
}

export function removeFromInventory(itemName) {
  const index = gameState.inventory.indexOf(itemName);
  if (index > -1) {
    gameState.inventory.splice(index, 1);
  }
}

export function hasItem(itemName) {
  return gameState.inventory.includes(itemName);
}

export function canCombineItems(item1, item2) {
  const combinations = {
    "planks-nails": "barricade",
    "nails-planks": "barricade",
    "planks-hammer": "barricade_ready",
    "hammer-planks": "barricade_ready",
    "nails-hammer": "nails_ready",
    "hammer-nails": "nails_ready",
    "chain-lock": "locked_chain",
    "lock-chain": "locked_chain",
    "rope-chain": "rope_chain",
    "chain-rope": "rope_chain"
  };
  
  const key = `${item1}-${item2}`;
  return combinations[key] || null;
}

export function combineItems(item1, item2) {
  const result = canCombineItems(item1, item2);
  if (result) {
    removeFromInventory(item1);
    removeFromInventory(item2);
    addToInventory(result);
    return result;
  }
  return null;
}

export function renderInventory(p) {
  if (!gameState.inventoryOpen) return;
  
  const invX = 50;
  const invY = 50;
  const invWidth = 500;
  const invHeight = 300;
  
  // Background
  p.fill(30, 30, 40, 230);
  p.stroke(100, 100, 120);
  p.strokeWeight(3);
  p.rect(invX, invY, invWidth, invHeight, 10);
  
  // Title
  p.fill(220, 220, 200);
  p.noStroke();
  p.textSize(20);
  p.textAlign(p.CENTER, p.TOP);
  p.text("INVENTORY", invX + invWidth / 2, invY + 10);
  
  // Instructions
  p.textSize(12);
  p.text("Select 2 items with ARROW KEYS, press SHIFT to combine", invX + invWidth / 2, invY + 35);
  p.text("Press Z to close", invX + invWidth / 2, invY + 50);
  
  // Items
  const itemsPerRow = 4;
  const itemSize = 80;
  const startX = invX + 50;
  const startY = invY + 80;
  
  for (let i = 0; i < gameState.inventory.length; i++) {
    const col = i % itemsPerRow;
    const row = Math.floor(i / itemsPerRow);
    const x = startX + col * (itemSize + 20);
    const y = startY + row * (itemSize + 30);
    
    // Item box
    const isSelected = i === gameState.selectedInventoryIndex;
    p.fill(isSelected ? 100 : 60, isSelected ? 100 : 60, isSelected ? 80 : 60);
    p.stroke(isSelected ? 200 : 120, isSelected ? 200 : 120, isSelected ? 150 : 120);
    p.strokeWeight(isSelected ? 3 : 2);
    p.rect(x, y, itemSize, itemSize, 5);
    
    // Item name
    p.fill(220, 220, 200);
    p.noStroke();
    p.textSize(11);
    p.textAlign(p.CENTER, p.CENTER);
    const itemName = gameState.inventory[i];
    const displayName = itemName.replace(/_/g, ' ').toUpperCase();
    p.text(displayName, x + itemSize / 2, y + itemSize / 2);
  }
}