// shop.js
import { CANVAS_WIDTH, CANVAS_HEIGHT, SHOP_ITEMS, gameState } from './globals.js';

export class Shop {
  constructor(p) {
    this.p = p;
    this.items = [
      { id: "DYNAMITE", ...SHOP_ITEMS.DYNAMITE },
      { id: "STRENGTH", ...SHOP_ITEMS.STRENGTH }
    ];
  }

  buyItem() {
    const selectedItem = this.items[gameState.shopSelection];
    if (gameState.totalMoney >= selectedItem.cost) {
      gameState.totalMoney -= selectedItem.cost;
      
      if (selectedItem.id === "DYNAMITE") {
        gameState.inventory.dynamite++;
      } else if (selectedItem.id === "STRENGTH") {
        gameState.inventory.strength++;
      }
      
      return true;
    }
    return false;
  }

  render() {
    const p = this.p;
    
    p.push();
    
    // Background
    p.fill(20, 20, 40, 240);
    p.rect(50, 80, CANVAS_WIDTH - 100, CANVAS_HEIGHT - 160);
    
    // Title
    p.fill(255, 215, 0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(24);
    p.text("SHOP", CANVAS_WIDTH / 2, 110);
    
    // Money display
    p.fill(255);
    p.textSize(16);
    p.text(`Money: $${gameState.totalMoney}`, CANVAS_WIDTH / 2, 140);
    
    // Items
    let startY = 180;
    let itemHeight = 60;
    
    for (let i = 0; i < this.items.length; i++) {
      let item = this.items[i];
      let y = startY + i * itemHeight;
      
      // Selection highlight
      if (i === gameState.shopSelection) {
        p.fill(255, 215, 0, 100);
        p.rect(70, y - 5, CANVAS_WIDTH - 140, itemHeight - 10);
      }
      
      // Item info
      p.fill(255);
      p.textAlign(p.LEFT, p.CENTER);
      p.textSize(16);
      p.text(`${item.name} - $${item.cost}`, 90, y + 10);
      
      p.textSize(12);
      p.fill(200);
      p.text(item.description, 90, y + 30);
      
      // Owned count
      let owned = 0;
      if (item.id === "DYNAMITE") owned = gameState.inventory.dynamite;
      if (item.id === "STRENGTH") owned = gameState.inventory.strength;
      
      p.textAlign(p.RIGHT, p.CENTER);
      p.fill(100, 255, 100);
      p.text(`Owned: ${owned}`, CANVAS_WIDTH - 90, y + 20);
    }
    
    // Instructions
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.text("Arrow Keys: Select | Right Arrow: Buy | ENTER: Continue", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
    
    p.pop();
  }
}