// entities.js - Game entities

import { gameState } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 30;
    this.h = 40;
    this.color = [80, 120, 200];
  }
  
  update() {
    // Player is stationary in this point-and-click game
  }
  
  render(p) {
    p.push();
    p.fill(...this.color);
    p.noStroke();
    // Draw simple character
    p.ellipse(this.x, this.y - 20, 20, 20); // head
    p.rect(this.x - 8, this.y - 10, 16, 25); // body
    p.rect(this.x - 10, this.y + 15, 6, 15); // left leg
    p.rect(this.x + 4, this.y + 15, 6, 15); // right leg
    p.pop();
  }
}

export class Hotspot {
  constructor(data) {
    this.id = data.id;
    this.x = data.x;
    this.y = data.y;
    this.w = data.w;
    this.h = data.h;
    this.type = data.type; // 'item', 'interact', 'goal'
    this.name = data.name;
    this.collected = data.collected || false;
    this.state = data.state || 'default';
    this.visible = data.visible !== false;
    this.interactionCount = 0;
  }
  
  render(p, isSelected) {
    if (!this.visible) return;
    
    p.push();
    
    // Draw hotspot based on type
    if (this.type === 'item' && !this.collected) {
      p.fill(255, 220, 100, isSelected ? 255 : 180);
      p.stroke(200, 150, 50);
      p.strokeWeight(2);
      p.rect(this.x - this.w/2, this.y - this.h/2, this.w, this.h, 5);
      
      // Item icon
      p.fill(50);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(10);
      p.text(this.name.substring(0, 3), this.x, this.y);
    } else if (this.type === 'interact') {
      p.fill(150, 200, 255, isSelected ? 200 : 100);
      p.stroke(100, 150, 255);
      p.strokeWeight(isSelected ? 3 : 2);
      p.rect(this.x - this.w/2, this.y - this.h/2, this.w, this.h, 5);
      
      // Interaction visual
      this.renderInteractState(p);
    } else if (this.type === 'goal' && this.visible) {
      p.fill(100, 255, 150, isSelected ? 200 : 150);
      p.stroke(50, 200, 100);
      p.strokeWeight(3);
      p.rect(this.x - this.w/2, this.y - this.h/2, this.w, this.h, 5);
    }
    
    // Selection indicator
    if (isSelected) {
      p.noFill();
      p.stroke(255, 255, 0);
      p.strokeWeight(3);
      p.rect(this.x - this.w/2 - 5, this.y - this.h/2 - 5, this.w + 10, this.h + 10, 8);
    }
    
    p.pop();
  }
  
  renderInteractState(p) {
    p.fill(50);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(9);
    
    const stateText = this.state.substring(0, 4);
    p.text(stateText, this.x, this.y);
  }
  
  interact(inventoryItem) {
    this.interactionCount++;
    
    if (this.type === 'item' && !this.collected) {
      this.collected = true;
      return { success: true, message: `Collected ${this.name}`, addToInventory: this.name };
    }
    
    return { success: false, message: 'Cannot interact' };
  }
}

export class Tree {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.growth = 0; // 0 to 1
    this.branches = [];
  }
  
  grow(amount) {
    this.growth = Math.min(1, this.growth + amount);
  }
  
  render(p, levelIndex) {
    p.push();
    
    const trunkHeight = 100 + this.growth * 50;
    const trunkWidth = 20 + this.growth * 10;
    
    // Trunk
    p.fill(101, 67, 33);
    p.noStroke();
    p.rect(this.x - trunkWidth/2, this.y, trunkWidth, trunkHeight);
    
    // Roots (visible in early levels)
    if (levelIndex <= 1) {
      p.stroke(80, 50, 20);
      p.strokeWeight(3);
      for (let i = 0; i < 5; i++) {
        const angle = p.map(i, 0, 5, -p.PI/3, p.PI/3);
        const endX = this.x + Math.sin(angle) * 40;
        const endY = this.y + trunkHeight + 20;
        p.line(this.x, this.y + trunkHeight, endX, endY);
      }
    }
    
    // Branches (visible in later levels)
    if (levelIndex >= 2) {
      p.stroke(101, 67, 33);
      p.strokeWeight(5);
      // Left branches
      p.line(this.x, this.y + 30, this.x - 60, this.y);
      p.line(this.x - 60, this.y, this.x - 80, this.y - 20);
      // Right branches
      p.line(this.x, this.y + 30, this.x + 60, this.y);
      p.line(this.x + 60, this.y, this.x + 80, this.y - 20);
    }
    
    // Leaves (visible in level 3+)
    if (levelIndex >= 3) {
      p.fill(34, 139, 34, 200);
      p.noStroke();
      p.ellipse(this.x, this.y - 20, 120, 80);
      p.ellipse(this.x - 50, this.y, 80, 60);
      p.ellipse(this.x + 50, this.y, 80, 60);
    }
    
    // Fruits (visible in level 4+)
    if (levelIndex >= 4) {
      // Golden fruit
      p.fill(255, 215, 0);
      p.ellipse(this.x - 30, this.y - 10, 20, 20);
      // Silver fruit
      p.fill(192, 192, 192);
      p.ellipse(this.x + 30, this.y - 5, 20, 20);
    }
    
    p.pop();
  }
}