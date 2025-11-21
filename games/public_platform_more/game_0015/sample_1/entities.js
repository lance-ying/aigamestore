// entities.js - Game entities

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Player {
  constructor() {
    this.x = CANVAS_WIDTH / 2;
    this.y = CANVAS_HEIGHT / 2;
    this.size = 30;
    this.color = [100, 150, 255];
  }
  
  update() {
    // Player position is mostly static in point-and-click style
  }
  
  draw(p) {
    p.push();
    p.fill(...this.color);
    p.stroke(80, 120, 200);
    p.strokeWeight(2);
    
    // Draw a simple detective figure
    // Head
    p.circle(this.x, this.y - 10, 15);
    
    // Body
    p.fill(60, 60, 80);
    p.rect(this.x - 8, this.y, 16, 20, 3);
    
    // Hat (detective style)
    p.fill(40, 40, 60);
    p.rect(this.x - 10, this.y - 20, 20, 5, 2);
    p.ellipse(this.x, this.y - 22, 18, 6);
    
    p.pop();
  }
}

export class Hotspot {
  constructor(data, locationName) {
    this.id = data.id;
    this.x = data.x;
    this.y = data.y;
    this.radius = data.radius;
    this.type = data.type;
    this.label = data.label;
    this.target = data.target || null;
    this.location = locationName;
    this.interacted = false;
  }
  
  isHovered(mouseX, mouseY) {
    const dist = Math.sqrt((mouseX - this.x) ** 2 + (mouseY - this.y) ** 2);
    return dist < this.radius;
  }
  
  draw(p, isHovered) {
    p.push();
    
    // Draw hotspot indicator
    if (isHovered) {
      p.fill(255, 255, 100, 150);
      p.stroke(255, 255, 0);
      p.strokeWeight(3);
    } else {
      p.fill(200, 200, 255, 80);
      p.stroke(150, 150, 255);
      p.strokeWeight(2);
    }
    
    p.circle(this.x, this.y, this.radius * 2);
    
    // Draw icon based on type
    p.stroke(0);
    p.strokeWeight(2);
    p.noFill();
    
    if (this.type === "examine") {
      // Magnifying glass
      p.circle(this.x - 3, this.y - 3, 12);
      p.line(this.x + 4, this.y + 4, this.x + 8, this.y + 8);
    } else if (this.type === "talk") {
      // Speech bubble
      p.ellipse(this.x, this.y - 2, 16, 12);
      p.triangle(this.x - 4, this.y + 4, this.x - 2, this.y + 3, this.x - 6, this.y + 7);
    } else if (this.type === "travel") {
      // Arrow
      p.line(this.x - 8, this.y, this.x + 8, this.y);
      p.line(this.x + 8, this.y, this.x + 4, this.y - 4);
      p.line(this.x + 8, this.y, this.x + 4, this.y + 4);
    }
    
    // Label
    if (isHovered) {
      p.fill(0);
      p.noStroke();
      p.textAlign(p.CENTER);
      p.textSize(12);
      p.text(this.label, this.x, this.y + this.radius + 15);
    }
    
    p.pop();
  }
}

export class InventoryItem {
  constructor(itemId, itemData) {
    this.id = itemId;
    this.name = itemData.name;
    this.description = itemData.description;
    this.combinable = itemData.combinable;
  }
  
  draw(p, x, y, size, isSelected) {
    p.push();
    
    // Background
    if (isSelected) {
      p.fill(100, 200, 255);
      p.stroke(50, 150, 255);
    } else {
      p.fill(80, 80, 100);
      p.stroke(120, 120, 140);
    }
    p.strokeWeight(2);
    p.rect(x, y, size, size, 5);
    
    // Item icon (simplified)
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    
    // Draw first letter of item
    const initial = this.name.charAt(0);
    p.text(initial, x + size / 2, y + size / 2);
    
    p.pop();
  }
}