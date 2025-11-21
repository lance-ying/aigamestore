// interactable.js - Interactive objects and clues

import { gameState } from './globals.js';

export class InteractableObject {
  constructor(x, y, id, name, clueId = null) {
    this.x = x;
    this.y = y;
    this.id = id;
    this.name = name;
    this.clueId = clueId;
    this.examined = false;
    this.width = 40;
    this.height = 40;
    this.highlighted = false;
  }
  
  interact() {
    if (!this.examined) {
      this.examined = true;
      gameState.interactedObjects.push(this.id);
      
      if (this.clueId && !gameState.inventory.find(c => c.id === this.clueId)) {
        gameState.inventory.push({
          id: this.clueId,
          name: this.name,
          description: this.getDescription()
        });
        return `Found: ${this.name}`;
      }
    }
    return this.getExaminedText();
  }
  
  getDescription() {
    return "An important clue.";
  }
  
  getExaminedText() {
    return "Nothing more to see here.";
  }
  
  render(p) {
    p.push();
    
    // Highlight if interactable
    if (this.highlighted) {
      p.fill(255, 255, 0, 100);
      p.noStroke();
      p.ellipse(this.x, this.y, this.width + 20, this.height + 20);
    }
    
    // Draw object
    this.renderObject(p);
    
    // Exclamation mark if not examined
    if (!this.examined) {
      p.fill(255, 200, 0);
      p.textSize(20);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("!", this.x, this.y - 30);
    }
    
    p.pop();
  }
  
  renderObject(p) {
    // Override in subclasses
    p.fill(150);
    p.stroke(0);
    p.strokeWeight(2);
    p.rect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
  }
  
  contains(px, py) {
    return px > this.x - this.width / 2 && px < this.x + this.width / 2 &&
           py > this.y - this.height / 2 && py < this.y + this.height / 2;
  }
}

export class CrimeSceneMarker extends InteractableObject {
  constructor(x, y) {
    super(x, y, "CRIME_SCENE", "Crime Scene Report", "CLUE_BODY");
  }
  
  getDescription() {
    return "Detailed report of the crime scene. Victim found in the study.";
  }
  
  renderObject(p) {
    // Crime scene tape
    p.fill(255, 200, 0);
    p.stroke(0);
    p.strokeWeight(2);
    p.rect(this.x - 30, this.y - 5, 60, 10);
    p.fill(0);
    p.textSize(8);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("CRIME SCENE", this.x, this.y);
  }
}

export class Clock extends InteractableObject {
  constructor(x, y) {
    super(x, y, "CLOCK", "Time of Death", "CLUE_TIME");
  }
  
  getDescription() {
    return "Clock stopped at 11:47 PM. Likely time of death.";
  }
  
  renderObject(p) {
    // Clock face
    p.fill(240, 240, 240);
    p.stroke(0);
    p.strokeWeight(2);
    p.ellipse(this.x, this.y, 40, 40);
    
    // Clock hands (stopped at 11:47)
    p.stroke(0);
    p.strokeWeight(3);
    p.line(this.x, this.y, this.x - 5, this.y - 12); // Hour
    p.line(this.x, this.y, this.x + 8, this.y - 8); // Minute
  }
}

export class Knife extends InteractableObject {
  constructor(x, y) {
    super(x, y, "KNIFE", "Murder Weapon", "CLUE_WEAPON");
  }
  
  getDescription() {
    return "Ornate knife with Redhorn family crest. The murder weapon.";
  }
  
  renderObject(p) {
    // Knife
    p.fill(180, 180, 200);
    p.stroke(0);
    p.strokeWeight(2);
    
    // Blade
    p.beginShape();
    p.vertex(this.x - 20, this.y);
    p.vertex(this.x + 15, this.y - 3);
    p.vertex(this.x + 15, this.y + 3);
    p.endShape(p.CLOSE);
    
    // Handle
    p.fill(120, 80, 40);
    p.rect(this.x + 10, this.y - 4, 15, 8);
  }
}

export class Documents extends InteractableObject {
  constructor(x, y) {
    super(x, y, "DOCUMENTS", "Financial Records", "CLUE_MOTIVE");
  }
  
  getDescription() {
    return "Financial documents showing large debts and inheritance disputes.";
  }
  
  renderObject(p) {
    // Papers
    p.fill(240, 235, 220);
    p.stroke(0);
    p.strokeWeight(2);
    for (let i = 0; i < 3; i++) {
      p.rect(this.x - 15 + i * 3, this.y - 15 + i * 2, 30, 35);
    }
    
    // Text lines
    p.stroke(0);
    p.strokeWeight(1);
    for (let i = 0; i < 4; i++) {
      p.line(this.x - 10, this.y - 5 + i * 6, this.x + 10, this.y - 5 + i * 6);
    }
  }
}

export class Letter extends InteractableObject {
  constructor(x, y) {
    super(x, y, "LETTER", "Alibi Statement", "CLUE_ALIBI");
  }
  
  getDescription() {
    return "Letter providing an alibi that doesn't match the timeline.";
  }
  
  renderObject(p) {
    // Envelope
    p.fill(255, 240, 220);
    p.stroke(0);
    p.strokeWeight(2);
    p.rect(this.x - 20, this.y - 15, 40, 30);
    
    // Seal
    p.fill(180, 50, 50);
    p.ellipse(this.x + 10, this.y + 5, 12, 12);
  }
}

export class Photograph extends InteractableObject {
  constructor(x, y) {
    super(x, y, "PHOTO", "Witness Account", "CLUE_WITNESS");
  }
  
  getDescription() {
    return "Photograph showing an unexpected person at the scene.";
  }
  
  renderObject(p) {
    // Photo
    p.fill(220, 220, 230);
    p.stroke(0);
    p.strokeWeight(2);
    p.rect(this.x - 18, this.y - 18, 36, 36);
    
    // Image content (simplified silhouette)
    p.fill(80, 80, 100);
    p.ellipse(this.x, this.y - 5, 15, 15);
    p.rect(this.x - 10, this.y + 3, 20, 15);
  }
}

export class BloodStain extends InteractableObject {
  constructor(x, y) {
    super(x, y, "BLOOD", "Physical Evidence", "CLUE_EVIDENCE");
  }
  
  getDescription() {
    return "Blood stain analysis reveals two different blood types.";
  }
  
  renderObject(p) {
    // Blood stain
    p.fill(120, 20, 20);
    p.noStroke();
    p.ellipse(this.x, this.y, 30, 25);
    p.ellipse(this.x + 10, this.y - 8, 15, 12);
    p.ellipse(this.x - 8, this.y + 10, 18, 15);
  }
}

export class FamilyTree extends InteractableObject {
  constructor(x, y) {
    super(x, y, "TREE", "Family Connection", "CLUE_CONNECTION");
  }
  
  getDescription() {
    return "Family tree revealing hidden relationships and heirs.";
  }
  
  renderObject(p) {
    // Frame
    p.fill(100, 70, 40);
    p.stroke(0);
    p.strokeWeight(3);
    p.rect(this.x - 20, this.y - 25, 40, 50);
    
    // Tree diagram
    p.stroke(60, 40, 20);
    p.strokeWeight(2);
    p.line(this.x, this.y - 15, this.x, this.y + 15);
    p.line(this.x - 12, this.y, this.x + 12, this.y);
    p.line(this.x - 12, this.y, this.x - 12, this.y + 10);
    p.line(this.x + 12, this.y, this.x + 12, this.y + 10);
  }
}