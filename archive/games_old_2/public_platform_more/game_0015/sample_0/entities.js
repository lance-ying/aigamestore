// entities.js - Game entities
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 40;
    this.color = [70, 130, 180];
    this.name = "Investigator";
  }
  
  update() {
    // Player position is managed by location system
  }
  
  draw(p) {
    p.push();
    p.fill(...this.color);
    p.stroke(40, 80, 120);
    p.strokeWeight(2);
    
    // Body
    p.rect(this.x - this.width/2, this.y - this.height/2, this.width, this.height * 0.6, 5);
    
    // Head
    p.fill(240, 200, 160);
    p.circle(this.x, this.y - this.height/2 + 8, 16);
    
    // Arms
    p.stroke(70, 130, 180);
    p.strokeWeight(3);
    p.line(this.x - this.width/2, this.y - this.height/4, this.x - this.width/2 - 8, this.y);
    p.line(this.x + this.width/2, this.y - this.height/4, this.x + this.width/2 + 8, this.y);
    
    // Legs
    p.line(this.x - 5, this.y + this.height/4, this.x - 8, this.y + this.height/2);
    p.line(this.x + 5, this.y + this.height/4, this.x + 8, this.y + this.height/2);
    
    p.pop();
  }
}

export class Hotspot {
  constructor(id, x, y, width, height, type, data) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type; // "examine", "pickup", "interact", "dialogue"
    this.data = data;
    this.active = true;
    this.examined = false;
    this.collected = false;
  }
  
  draw(p, isSelected) {
    if (!this.active || this.collected) return;
    
    p.push();
    
    if (isSelected) {
      p.fill(255, 255, 0, 150);
      p.stroke(255, 255, 0);
      p.strokeWeight(3);
    } else {
      p.fill(100, 200, 255, 100);
      p.stroke(100, 200, 255);
      p.strokeWeight(2);
    }
    
    p.rect(this.x, this.y, this.width, this.height, 5);
    
    // Icon based on type
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    
    const icon = this.type === "pickup" ? "📦" : 
                 this.type === "dialogue" ? "💬" : 
                 this.type === "examine" ? "🔍" : "⭐";
    p.text(icon, this.x + this.width/2, this.y + this.height/2);
    
    p.pop();
  }
  
  contains(x, y) {
    return x >= this.x && x <= this.x + this.width && 
           y >= this.y && y <= this.y + this.height;
  }
}

export class NPC {
  constructor(id, name, x, y, dialogues) {
    this.id = id;
    this.name = name;
    this.x = x;
    this.y = y;
    this.width = 35;
    this.height = 45;
    this.dialogues = dialogues;
    this.currentDialogueSet = 0;
    this.color = [180, 130, 70];
  }
  
  draw(p) {
    p.push();
    p.fill(...this.color);
    p.stroke(120, 80, 40);
    p.strokeWeight(2);
    
    // Body
    p.rect(this.x - this.width/2, this.y - this.height/2, this.width, this.height * 0.6, 5);
    
    // Head
    p.fill(240, 200, 160);
    p.circle(this.x, this.y - this.height/2 + 8, 18);
    
    // Arms
    p.stroke(180, 130, 70);
    p.strokeWeight(3);
    p.line(this.x - this.width/2, this.y - this.height/4, this.x - this.width/2 - 6, this.y + 5);
    p.line(this.x + this.width/2, this.y - this.height/4, this.x + this.width/2 + 6, this.y + 5);
    
    p.pop();
    
    // Name label
    p.push();
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER);
    p.textSize(10);
    p.text(this.name, this.x, this.y + this.height/2 + 15);
    p.pop();
  }
  
  getDialogues() {
    return this.dialogues[this.currentDialogueSet] || this.dialogues[0];
  }
}