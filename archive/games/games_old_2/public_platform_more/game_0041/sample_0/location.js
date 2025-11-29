// location.js - Location and scene management

import { gameState, LOCATIONS } from './globals.js';

export class Location {
  constructor(id, name, description) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.objects = [];
    this.suspects = [];
    this.bgColor = [180, 160, 140];
  }
  
  addObject(obj) {
    this.objects.push(obj);
  }
  
  addSuspect(suspect) {
    this.suspects.push(suspect);
  }
  
  render(p) {
    // Render location background
    p.push();
    p.fill(...this.bgColor);
    p.noStroke();
    p.rect(0, 60, 600, 280);
    
    // Render location-specific background elements
    this.renderBackground(p);
    
    // Render objects in the location
    for (let obj of this.objects) {
      obj.render(p);
    }
    
    // Render suspects in the location
    for (let suspect of this.suspects) {
      suspect.render(p);
    }
    
    p.pop();
  }
  
  renderBackground(p) {
    // Override in specific locations
  }
}

export class TownSquare extends Location {
  constructor() {
    super("TOWN_SQUARE", "Town Square", "The heart of the town, where the investigation begins.");
    this.bgColor = [150, 180, 200];
  }
  
  renderBackground(p) {
    // Draw buildings
    p.fill(120, 100, 80);
    p.rect(50, 120, 100, 150);
    p.rect(450, 120, 100, 150);
    
    // Windows
    p.fill(200, 220, 255);
    for (let i = 0; i < 3; i++) {
      p.rect(70 + i * 25, 140, 20, 30);
      p.rect(470 + i * 25, 140, 20, 30);
    }
    
    // Fountain in center
    p.fill(100, 120, 140);
    p.ellipse(300, 220, 80, 40);
    p.fill(150, 180, 200);
    p.ellipse(300, 210, 60, 60);
  }
}

export class Manor extends Location {
  constructor() {
    super("MANOR", "Redhorn Manor", "The grand estate where the murder took place.");
    this.bgColor = [130, 120, 140];
  }
  
  renderBackground(p) {
    // Draw manor
    p.fill(80, 60, 70);
    p.rect(150, 100, 300, 180);
    
    // Roof
    p.fill(60, 40, 50);
    p.triangle(140, 100, 300, 60, 460, 100);
    
    // Door
    p.fill(50, 30, 40);
    p.rect(270, 200, 60, 80);
    
    // Windows
    p.fill(255, 200, 100, 100);
    p.rect(180, 130, 40, 50);
    p.rect(380, 130, 40, 50);
    p.rect(220, 130, 30, 40);
    p.rect(350, 130, 30, 40);
  }
}

export class Market extends Location {
  constructor() {
    super("MARKET", "Market District", "A busy marketplace with many vendors.");
    this.bgColor = [180, 160, 130];
  }
  
  renderBackground(p) {
    // Market stalls
    for (let i = 0; i < 3; i++) {
      p.fill(150, 100, 60);
      p.rect(100 + i * 160, 180, 120, 100);
      
      // Awning
      p.fill(200, 80, 60);
      p.triangle(100 + i * 160, 180, 160 + i * 160, 150, 220 + i * 160, 180);
      
      // Items on display
      p.fill(100 + i * 30, 150 - i * 20, 80);
      p.ellipse(140 + i * 160, 230, 20, 20);
      p.ellipse(170 + i * 160, 230, 20, 20);
    }
  }
}

export class Church extends Location {
  constructor() {
    super("CHURCH", "Old Church", "An ancient church on the outskirts of town.");
    this.bgColor = [140, 140, 160];
  }
  
  renderBackground(p) {
    // Church building
    p.fill(100, 100, 120);
    p.rect(200, 120, 200, 160);
    
    // Steeple
    p.rect(280, 80, 40, 40);
    p.triangle(280, 80, 300, 50, 320, 80);
    
    // Cross
    p.stroke(255);
    p.strokeWeight(4);
    p.line(300, 60, 300, 75);
    p.line(295, 65, 305, 65);
    p.noStroke();
    
    // Door
    p.fill(60, 60, 80);
    p.arc(300, 280, 80, 100, p.PI, 0);
  }
}

export class Docks extends Location {
  constructor() {
    super("DOCKS", "Harbor Docks", "The waterfront where ships arrive and depart.");
    this.bgColor = [120, 150, 180];
  }
  
  renderBackground(p) {
    // Water
    p.fill(80, 120, 160);
    p.rect(0, 220, 600, 120);
    
    // Waves
    p.stroke(100, 140, 180);
    p.strokeWeight(2);
    for (let i = 0; i < 600; i += 30) {
      p.noFill();
      p.arc(i, 240, 20, 10, 0, p.PI);
    }
    p.noStroke();
    
    // Dock
    p.fill(100, 80, 60);
    p.rect(0, 200, 600, 20);
    
    // Posts
    for (let i = 0; i < 600; i += 80) {
      p.rect(i + 20, 140, 15, 80);
    }
    
    // Ship silhouette
    p.fill(60, 60, 80);
    p.rect(400, 180, 80, 40);
    p.triangle(400, 180, 400, 140, 420, 180);
  }
}