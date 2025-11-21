// suspect.js - NPCs and suspects

import { gameState } from './globals.js';

export class Suspect {
  constructor(x, y, id, name, role) {
    this.x = x;
    this.y = y;
    this.id = id;
    this.name = name;
    this.role = role;
    this.width = 40;
    this.height = 60;
    this.highlighted = false;
    this.dialogues = [];
    this.currentDialogueIndex = 0;
  }
  
  addDialogue(text, requiredClues = []) {
    this.dialogues.push({ text, requiredClues, shown: false });
  }
  
  interact() {
    // Find next available dialogue
    for (let i = 0; i < this.dialogues.length; i++) {
      const dialogue = this.dialogues[i];
      if (!dialogue.shown) {
        // Check if player has required clues
        const hasRequiredClues = dialogue.requiredClues.every(clueId =>
          gameState.inventory.find(c => c.id === clueId)
        );
        
        if (hasRequiredClues || dialogue.requiredClues.length === 0) {
          dialogue.shown = true;
          gameState.suspects[this.id].interviewed = true;
          return { speaker: this.name, text: dialogue.text };
        }
      }
    }
    
    return { speaker: this.name, text: "I have nothing more to say." };
  }
  
  render(p) {
    p.push();
    
    // Highlight if interactable
    if (this.highlighted) {
      p.fill(255, 255, 0, 100);
      p.noStroke();
      p.ellipse(this.x, this.y, this.width + 20, this.height + 20);
    }
    
    // Draw character
    this.renderCharacter(p);
    
    // Speech bubble indicator if has dialogue
    if (this.hasAvailableDialogue()) {
      p.fill(255);
      p.stroke(0);
      p.strokeWeight(2);
      p.ellipse(this.x + 25, this.y - 40, 20, 20);
      p.triangle(this.x + 18, this.y - 32, this.x + 22, this.y - 25, this.x + 25, this.y - 32);
      
      p.fill(0);
      p.noStroke();
      p.textSize(16);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("?", this.x + 25, this.y - 40);
    }
    
    p.pop();
  }
  
  renderCharacter(p) {
    // Override in subclasses
    p.fill(150);
    p.stroke(0);
    p.strokeWeight(2);
    p.rect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
  }
  
  hasAvailableDialogue() {
    for (let dialogue of this.dialogues) {
      if (!dialogue.shown) {
        const hasRequiredClues = dialogue.requiredClues.every(clueId =>
          gameState.inventory.find(c => c.id === clueId)
        );
        if (hasRequiredClues || dialogue.requiredClues.length === 0) {
          return true;
        }
      }
    }
    return false;
  }
  
  contains(px, py) {
    return px > this.x - this.width / 2 && px < this.x + this.width / 2 &&
           py > this.y - this.height / 2 && py < this.y + this.height / 2;
  }
}

export class Mayor extends Suspect {
  constructor(x, y) {
    super(x, y, "MAYOR", "Mayor Thompson", "Town Mayor");
    this.setupDialogues();
  }
  
  setupDialogues() {
    this.addDialogue("Terrible tragedy! Lord Redhorn was a pillar of our community.");
    this.addDialogue("I was at a council meeting all evening. Many witnesses.", ["CLUE_TIME"]);
    this.addDialogue("The financial troubles? Just rumors, I'm sure.", ["CLUE_MOTIVE"]);
    this.addDialogue("I... I may have borrowed money from him. But I paid it back!", ["CLUE_EVIDENCE"]);
  }
  
  renderCharacter(p) {
    // Body - fancy suit
    p.fill(40, 40, 60);
    p.stroke(0);
    p.strokeWeight(2);
    p.rect(this.x - 20, this.y - 10, 40, 50);
    
    // Head
    p.fill(220, 180, 150);
    p.ellipse(this.x, this.y - 30, 30, 35);
    
    // Top hat
    p.fill(20, 20, 30);
    p.rect(this.x - 15, this.y - 50, 30, 10);
    p.rect(this.x - 10, this.y - 65, 20, 15);
    
    // Mustache
    p.fill(80, 60, 40);
    p.ellipse(this.x - 8, this.y - 25, 8, 4);
    p.ellipse(this.x + 8, this.y - 25, 8, 4);
  }
}

export class Doctor extends Suspect {
  constructor(x, y) {
    super(x, y, "DOCTOR", "Dr. Whitmore", "Town Doctor");
    this.setupDialogues();
  }
  
  setupDialogues() {
    this.addDialogue("I examined the body. Death by stabbing, around midnight.");
    this.addDialogue("The wound was precise. Someone knew what they were doing.", ["CLUE_WEAPON"]);
    this.addDialogue("I was making house calls that night. No solid alibi, I'm afraid.", ["CLUE_TIME"]);
    this.addDialogue("Lord Redhorn owed me nothing. But his brother did.", ["CLUE_CONNECTION"]);
  }
  
  renderCharacter(p) {
    // White coat
    p.fill(240, 240, 245);
    p.stroke(0);
    p.strokeWeight(2);
    p.rect(this.x - 20, this.y - 10, 40, 50);
    
    // Head
    p.fill(220, 180, 150);
    p.ellipse(this.x, this.y - 30, 28, 32);
    
    // Glasses
    p.noFill();
    p.stroke(0);
    p.strokeWeight(2);
    p.ellipse(this.x - 8, this.y - 30, 10, 10);
    p.ellipse(this.x + 8, this.y - 30, 10, 10);
    p.line(this.x - 3, this.y - 30, this.x + 3, this.y - 30);
    
    // Stethoscope
    p.stroke(60, 60, 80);
    p.noFill();
    p.arc(this.x, this.y + 20, 20, 30, 0, p.PI);
  }
}

export class Merchant extends Suspect {
  constructor(x, y) {
    super(x, y, "MERCHANT", "Marcus Gold", "Wealthy Merchant");
    this.setupDialogues();
  }
  
  setupDialogues() {
    this.addDialogue("Lord Redhorn? We had business dealings. Nothing personal.");
    this.addDialogue("I was at the docks checking shipments. Alone, unfortunately.", ["CLUE_TIME"]);
    this.addDialogue("He owed me a fortune! Refused to pay!", ["CLUE_MOTIVE"]);
    this.addDialogue("That knife... I sold it to him years ago. How did it...", ["CLUE_WEAPON"]);
  }
  
  renderCharacter(p) {
    // Rich clothing
    p.fill(120, 40, 40);
    p.stroke(0);
    p.strokeWeight(2);
    p.rect(this.x - 20, this.y - 10, 40, 50);
    
    // Gold trim
    p.stroke(200, 180, 0);
    p.strokeWeight(3);
    p.line(this.x - 20, this.y - 10, this.x + 20, this.y - 10);
    p.line(this.x, this.y - 10, this.x, this.y + 40);
    
    // Head
    p.fill(220, 180, 150);
    p.stroke(0);
    p.strokeWeight(2);
    p.ellipse(this.x, this.y - 30, 32, 35);
    
    // Beard
    p.fill(60, 40, 20);
    p.arc(this.x, this.y - 20, 30, 25, 0, p.PI);
  }
}

export class Butler extends Suspect {
  constructor(x, y) {
    super(x, y, "BUTLER", "James the Butler", "Redhorn Family Butler");
    this.setupDialogues();
  }
  
  setupDialogues() {
    this.addDialogue("I served the family for thirty years. This is devastating.");
    this.addDialogue("I found the body at midnight. The clock had stopped.", ["CLUE_BODY"]);
    this.addDialogue("I saw someone leaving through the garden. Couldn't see who.", ["CLUE_WITNESS"]);
    this.addDialogue("Master Redhorn changed his will last week. I witnessed it.", ["CLUE_CONNECTION"]);
    this.addDialogue("The killer... was his own nephew. I saw the family ring on his hand that night.", ["CLUE_EVIDENCE", "CLUE_CONNECTION", "CLUE_WITNESS"]);
  }
  
  renderCharacter(p) {
    // Butler suit
    p.fill(30, 30, 40);
    p.stroke(0);
    p.strokeWeight(2);
    p.rect(this.x - 20, this.y - 10, 40, 50);
    
    // White shirt
    p.fill(255);
    p.triangle(this.x - 8, this.y - 10, this.x + 8, this.y - 10, this.x, this.y + 20);
    
    // Bow tie
    p.fill(200, 20, 20);
    p.rect(this.x - 10, this.y - 8, 20, 8);
    p.triangle(this.x - 10, this.y - 4, this.x - 16, this.y - 8, this.x - 16, this.y);
    p.triangle(this.x + 10, this.y - 4, this.x + 16, this.y - 8, this.x + 16, this.y);
    
    // Head
    p.fill(220, 180, 150);
    p.ellipse(this.x, this.y - 30, 26, 30);
    
    // Hair
    p.fill(120, 120, 130);
    p.arc(this.x, this.y - 35, 28, 20, p.PI, 0);
  }
}