// inventory.js - Inventory system

import { gameState, CANVAS_WIDTH } from './globals.js';

export class InventoryManager {
  constructor(p) {
    this.p = p;
  }

  addItem(itemId) {
    const levelData = gameState.allLevelsData[gameState.currentLevel];
    const itemData = levelData.items[itemId];
    
    if (itemData && !gameState.inventory.find(i => i.id === itemId)) {
      gameState.inventory.push({
        id: itemId,
        ...itemData
      });
      gameState.score += 200;
      gameState.levelScore += 200;
      return true;
    }
    return false;
  }

  removeItem(itemId) {
    const index = gameState.inventory.findIndex(i => i.id === itemId);
    if (index !== -1) {
      gameState.inventory.splice(index, 1);
      return true;
    }
    return false;
  }

  hasItem(itemId) {
    return gameState.inventory.some(i => i.id === itemId);
  }

  getActiveItem() {
    if (gameState.activeInventoryItemId) {
      return gameState.inventory.find(i => i.id === gameState.activeInventoryItemId);
    }
    return null;
  }

  render() {
    if (!gameState.inventoryOpen) return;

    const p = this.p;
    
    // Overlay background
    p.fill(0, 0, 0, 180);
    p.rect(0, 0, 600, 400);

    // Inventory panel
    p.fill(40, 35, 45);
    p.stroke(100, 90, 110);
    p.strokeWeight(2);
    p.rect(50, 50, 500, 300, 10);

    // Title
    p.fill(200, 190, 210);
    p.noStroke();
    p.textSize(24);
    p.textAlign(p.CENTER, p.CENTER);
    p.text('INVENTORY', 300, 80);

    // Instructions
    p.textSize(14);
    p.fill(150, 140, 160);
    p.text('A/D: Navigate  |  Z: Close/Select  |  Space: Use on object', 300, 110);

    // Item slots
    const slotSize = 70;
    const slotSpacing = 85;
    const startX = 100;
    const startY = 160;
    const itemsPerRow = 5;

    for (let i = 0; i < gameState.inventory.length; i++) {
      const item = gameState.inventory[i];
      const row = Math.floor(i / itemsPerRow);
      const col = i % itemsPerRow;
      const x = startX + col * slotSpacing;
      const y = startY + row * slotSpacing;

      // Slot background
      const isSelected = i === gameState.selectedInventoryIndex;
      p.fill(isSelected ? 60 : 50, isSelected ? 55 : 45, isSelected ? 65 : 55);
      p.stroke(isSelected ? 150 : 80, isSelected ? 200 : 70, isSelected ? 100 : 80);
      p.strokeWeight(isSelected ? 3 : 1);
      p.rect(x, y, slotSize, slotSize, 5);

      // Item representation
      this.renderItemIcon(item, x + slotSize / 2, y + slotSize / 2, 50);

      // Active indicator
      if (item.id === gameState.activeInventoryItemId) {
        p.noFill();
        p.stroke(100, 255, 100);
        p.strokeWeight(3);
        p.rect(x - 3, y - 3, slotSize + 6, slotSize + 6, 7);
      }
    }

    // Selected item description
    if (gameState.inventory.length > 0 && gameState.selectedInventoryIndex < gameState.inventory.length) {
      const selectedItem = gameState.inventory[gameState.selectedInventoryIndex];
      p.fill(180, 170, 190);
      p.textSize(16);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(selectedItem.name, 300, 310);
      p.textSize(12);
      p.fill(140, 130, 150);
      p.text(selectedItem.description, 300, 330);
    }
  }

  renderItemIcon(item, x, y, size) {
    const p = this.p;
    p.push();

    // Different visuals based on item type
    if (item.id.includes('key') || item.id.includes('fragment')) {
      // Key-like items
      p.fill(180, 160, 100);
      p.noStroke();
      p.ellipse(x - size / 4, y, size / 3, size / 3);
      p.rect(x - size / 8, y - size / 6, size / 2, size / 10);
      p.rect(x + size / 4, y - size / 8, size / 12, size / 6);
      p.rect(x + size / 4, y + size / 16, size / 12, size / 8);
    } else if (item.id.includes('scroll')) {
      // Scroll items
      p.fill(230, 220, 190);
      p.stroke(120, 110, 90);
      p.strokeWeight(2);
      p.rect(x - size / 3, y - size / 3, size * 2 / 3, size * 2 / 3, 3);
      p.stroke(150, 140, 120);
      p.strokeWeight(1);
      for (let i = 0; i < 4; i++) {
        p.line(x - size / 4, y - size / 5 + i * size / 8, x + size / 4, y - size / 5 + i * size / 8);
      }
    } else if (item.id.includes('liquid') || item.id.includes('vial')) {
      // Liquid containers
      p.fill(100, 150, 200, 150);
      p.stroke(80, 120, 160);
      p.strokeWeight(2);
      p.rect(x - size / 4, y - size / 4, size / 2, size / 2, 5);
      p.fill(120, 180, 220, 180);
      p.noStroke();
      p.rect(x - size / 5, y, size * 2 / 5, size / 4, 3);
    } else if (item.id.includes('tool')) {
      // Tool items
      p.fill(140, 130, 120);
      p.stroke(100, 90, 80);
      p.strokeWeight(2);
      p.line(x - size / 3, y + size / 4, x, y - size / 4);
      p.line(x, y - size / 4, x + size / 3, y + size / 4);
      p.fill(160, 150, 140);
      p.ellipse(x, y - size / 4, size / 6, size / 6);
    } else if (item.id.includes('relic')) {
      // Relic items
      p.fill(180, 150, 200);
      p.stroke(140, 110, 160);
      p.strokeWeight(2);
      p.ellipse(x, y, size * 2 / 3, size * 2 / 3);
      p.fill(200, 170, 220);
      p.noStroke();
      p.triangle(x, y - size / 4, x - size / 6, y + size / 6, x + size / 6, y + size / 6);
    } else {
      // Default item
      p.fill(180, 170, 160);
      p.stroke(120, 110, 100);
      p.strokeWeight(2);
      p.rect(x - size / 3, y - size / 3, size * 2 / 3, size * 2 / 3, 5);
    }

    p.pop();
  }
}