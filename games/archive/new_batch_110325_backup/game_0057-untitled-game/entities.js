// entities.js - Game entities

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 40;
    this.color = [255, 180, 100];
    this.isVisible = true;
  }

  update() {
    // Player is mostly stationary in this game
  }

  render(p) {
    if (!this.isVisible) return;
    
    p.push();
    p.translate(this.x, this.y);
    
    // Draw detective character
    // Body
    p.fill(...this.color);
    p.noStroke();
    p.rect(-this.width/2, -this.height/2, this.width, this.height * 0.6, 5);
    
    // Head
    p.fill(255, 220, 180);
    p.ellipse(0, -this.height/2 - 8, 18, 20);
    
    // Hat
    p.fill(60, 50, 40);
    p.ellipse(0, -this.height/2 - 15, 22, 8);
    p.rect(-8, -this.height/2 - 20, 16, 8);
    
    // Eyes
    p.fill(0);
    p.circle(-4, -this.height/2 - 10, 3);
    p.circle(4, -this.height/2 - 10, 3);
    
    // Legs
    p.fill(...this.color);
    p.rect(-10, this.height/2 - 15, 8, 20);
    p.rect(2, this.height/2 - 15, 8, 20);
    
    p.pop();
  }
}

export class Hotspot {
  constructor(x, y, width, height, type, clueId, locationId) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type; // 'clue', 'suspect', 'puzzle', 'exit'
    this.clueId = clueId;
    this.locationId = locationId;
    this.isInteracted = false;
    this.pulse = 0;
  }

  update(frameCount) {
    this.pulse = Math.sin(frameCount * 0.1) * 0.3 + 0.7;
  }

  render(p, isSelected) {
    if (this.isInteracted && this.type === 'clue') return;
    
    p.push();
    
    if (isSelected) {
      p.fill(255, 255, 0, 150 * this.pulse);
      p.stroke(255, 255, 0);
    } else {
      p.fill(100, 200, 255, 100 * this.pulse);
      p.stroke(100, 200, 255);
    }
    
    p.strokeWeight(2);
    p.rect(this.x, this.y, this.width, this.height, 5);
    
    // Icon based on type
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16);
    
    if (this.type === 'clue') p.text('🔍', this.x + this.width/2, this.y + this.height/2);
    else if (this.type === 'suspect') p.text('👤', this.x + this.width/2, this.y + this.height/2);
    else if (this.type === 'puzzle') p.text('🧩', this.x + this.width/2, this.y + this.height/2);
    else if (this.type === 'exit') p.text('→', this.x + this.width/2, this.y + this.height/2);
    
    p.pop();
  }
}

export class Location {
  constructor(id, name, description, bgColor) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.bgColor = bgColor;
    this.hotspots = [];
    this.visited = false;
    this.decorations = [];
  }

  addHotspot(hotspot) {
    this.hotspots.push(hotspot);
  }

  addDecoration(decoration) {
    this.decorations.push(decoration);
  }

  render(p) {
    // Background
    p.fill(...this.bgColor);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Decorations
    this.decorations.forEach(deco => deco.render(p));
    
    // Location name
    p.fill(255, 255, 255, 200);
    p.noStroke();
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(16);
    p.text(this.name, 10, 10);
  }
}

export class Clue {
  constructor(id, name, description, locationId) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.locationId = locationId;
    this.collected = false;
  }
}

export class Suspect {
  constructor(id, name, description, dialogue, locationId) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.dialogue = dialogue; // Array of dialogue nodes
    this.locationId = locationId;
    this.interrogated = false;
    this.currentDialogueIndex = 0;
  }
}

export class Puzzle {
  constructor(id, type, solution, locationId) {
    this.id = id;
    this.type = type; // 'code', 'document', 'fingerprint'
    this.solution = solution;
    this.locationId = locationId;
    this.solved = false;
    this.currentInput = [];
  }
}

export class Decoration {
  constructor(x, y, renderFunc) {
    this.x = x;
    this.y = y;
    this.renderFunc = renderFunc;
  }

  render(p) {
    p.push();
    p.translate(this.x, this.y);
    this.renderFunc(p);
    p.pop();
  }
}