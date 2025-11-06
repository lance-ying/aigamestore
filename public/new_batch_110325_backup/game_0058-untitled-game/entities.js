// entities.js - Game entities

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Player {
  constructor(p) {
    this.p = p;
    this.screenX = CANVAS_WIDTH / 2;
    this.screenY = CANVAS_HEIGHT / 2;
    this.size = 40;
  }
  
  update() {
    // Player position is mostly fixed in center for point-and-click style
  }
  
  render() {
    const p = this.p;
    
    // Draw Professor Layton
    p.push();
    p.translate(this.screenX, this.screenY);
    
    // Body (brown coat)
    p.fill(101, 67, 33);
    p.rect(-12, -5, 24, 30, 5);
    
    // Head
    p.fill(255, 220, 177);
    p.ellipse(0, -20, 20, 25);
    
    // Hat (iconic top hat)
    p.fill(40, 40, 40);
    p.rect(-10, -35, 20, 8);
    p.rect(-7, -43, 14, 8);
    
    // Eyes
    p.fill(0);
    p.ellipse(-4, -22, 2, 2);
    p.ellipse(4, -22, 2, 2);
    
    // Mustache
    p.stroke(40, 40, 40);
    p.strokeWeight(2);
    p.noFill();
    p.arc(-5, -15, 5, 3, 0, p.PI);
    p.arc(5, -15, 5, 3, 0, p.PI);
    p.noStroke();
    
    p.pop();
  }
}

export class Hotspot {
  constructor(p, x, y, type, id, label = "") {
    this.p = p;
    this.x = x;
    this.y = y;
    this.type = type;
    this.id = id;
    this.label = label;
    this.size = 30;
    this.hovered = false;
    this.collected = false;
  }
  
  isHovered(cursorX, cursorY) {
    const dist = this.p.dist(this.x, this.y, cursorX, cursorY);
    return dist < this.size;
  }
  
  render() {
    const p = this.p;
    
    if (this.collected) return;
    
    p.push();
    
    // Glow effect when hovered
    if (this.hovered) {
      p.fill(255, 255, 0, 100);
      p.noStroke();
      p.ellipse(this.x, this.y, this.size * 2, this.size * 2);
    }
    
    // Draw based on type
    switch(this.type) {
      case "puzzle":
        p.fill(200, 100, 255, 150);
        p.stroke(150, 50, 200);
        p.strokeWeight(2);
        p.ellipse(this.x, this.y, this.size, this.size);
        
        // Question mark
        p.fill(255);
        p.noStroke();
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(20);
        p.text("?", this.x, this.y - 2);
        break;
        
      case "npc":
        p.fill(100, 200, 255, 150);
        p.stroke(50, 150, 200);
        p.strokeWeight(2);
        p.ellipse(this.x, this.y, this.size, this.size);
        
        // Smiley face
        p.fill(255);
        p.noStroke();
        p.ellipse(this.x - 5, this.y - 3, 3, 3);
        p.ellipse(this.x + 5, this.y - 3, 3, 3);
        p.arc(this.x, this.y + 2, 10, 8, 0, p.PI);
        break;
        
      case "hint_coin":
        p.fill(255, 215, 0);
        p.stroke(200, 165, 0);
        p.strokeWeight(2);
        p.ellipse(this.x, this.y, this.size * 0.7, this.size * 0.7);
        
        // Coin sparkle
        p.fill(255, 255, 200);
        p.noStroke();
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(12);
        p.text("H", this.x, this.y - 1);
        break;
    }
    
    // Label
    if (this.hovered && this.label) {
      p.fill(0, 0, 0, 200);
      p.noStroke();
      p.rect(this.x - 40, this.y - 50, 80, 20, 5);
      p.fill(255);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(12);
      p.text(this.label, this.x, this.y - 40);
    }
    
    p.pop();
  }
}

export class Cursor {
  constructor(p) {
    this.p = p;
    this.x = CANVAS_WIDTH / 2;
    this.y = CANVAS_HEIGHT / 2;
    this.speed = 5;
  }
  
  move(dx, dy) {
    this.x += dx * this.speed;
    this.y += dy * this.speed;
    
    // Clamp to canvas
    this.x = this.p.constrain(this.x, 20, CANVAS_WIDTH - 20);
    this.y = this.p.constrain(this.y, 20, CANVAS_HEIGHT - 20);
  }
  
  render() {
    const p = this.p;
    
    p.push();
    p.stroke(255, 200, 0);
    p.strokeWeight(3);
    p.noFill();
    
    // Crosshair cursor
    p.line(this.x - 10, this.y, this.x - 3, this.y);
    p.line(this.x + 3, this.y, this.x + 10, this.y);
    p.line(this.x, this.y - 10, this.x, this.y - 3);
    p.line(this.x, this.y + 3, this.x, this.y + 10);
    
    // Center dot
    p.fill(255, 200, 0);
    p.noStroke();
    p.ellipse(this.x, this.y, 4, 4);
    
    p.pop();
  }
}