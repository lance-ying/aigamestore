import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class DesktopApp {
  constructor(name, type, x, y, width, height, icon) {
    this.name = name;
    this.type = type;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.icon = icon;
    this.isOpen = false;
  }
  
  render(p, isSelected) {
    p.push();
    
    // App icon background
    if (isSelected) {
      p.fill(80, 120, 200, 100);
      p.stroke(120, 160, 255);
    } else {
      p.fill(60, 60, 80);
      p.stroke(100, 100, 120);
    }
    p.strokeWeight(2);
    p.rect(this.x, this.y, this.width, this.height, 8);
    
    // Icon
    p.fill(200, 200, 220);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(32);
    p.text(this.icon, this.x + this.width / 2, this.y + this.height / 2 - 15);
    
    // Label
    p.textSize(11);
    p.fill(220, 220, 240);
    p.text(this.name, this.x + this.width / 2, this.y + this.height - 10);
    
    p.pop();
  }
}

export class Player {
  constructor() {
    this.x = CANVAS_WIDTH / 2;
    this.y = CANVAS_HEIGHT / 2;
  }
  
  update() {
    // Player doesn't move in this game, just exists for state tracking
  }
  
  render(p) {
    // Player is represented by the cursor selection
  }
}

export class Window {
  constructor(title, x, y, width, height) {
    this.title = title;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
  
  render(p) {
    p.push();
    
    // Window background
    p.fill(40, 40, 50);
    p.stroke(80, 80, 100);
    p.strokeWeight(2);
    p.rect(this.x, this.y, this.width, this.height, 4);
    
    // Title bar
    p.fill(60, 60, 80);
    p.noStroke();
    p.rect(this.x, this.y, this.width, 25, 4, 4, 0, 0);
    
    // Title text
    p.fill(220, 220, 240);
    p.textSize(12);
    p.textAlign(p.LEFT, p.CENTER);
    p.text(this.title, this.x + 10, this.y + 12);
    
    // Close button
    p.fill(200, 80, 80);
    p.circle(this.x + this.width - 15, this.y + 12, 10);
    p.fill(255);
    p.textSize(10);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("X", this.x + this.width - 15, this.y + 12);
    
    p.pop();
  }
  
  renderContent(p, content) {
    p.push();
    p.fill(220, 220, 240);
    p.textSize(11);
    p.textAlign(p.LEFT, p.TOP);
    
    const padding = 15;
    const textX = this.x + padding;
    const textY = this.y + 35;
    const maxWidth = this.width - padding * 2;
    
    p.text(content, textX, textY, maxWidth);
    p.pop();
  }
}