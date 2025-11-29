// dialogue.js - Dialogue system

import { gameState } from './globals.js';
import { trackAction } from './personality.js';

export class DialogueBox {
  constructor(npc, dialogue) {
    this.npc = npc;
    this.dialogue = dialogue;
    this.selectedChoice = 0;
    this.visible = true;
  }
  
  draw(p) {
    if (!this.visible) return;
    
    const boxHeight = this.dialogue.choices.length > 0 ? 180 : 120;
    const boxY = 400 - boxHeight - 20;
    
    // Background
    p.fill(30, 30, 40, 240);
    p.stroke(100, 200, 255);
    p.strokeWeight(2);
    p.rect(20, boxY, 560, boxHeight, 8);
    
    // NPC name
    p.fill(100, 200, 255);
    p.noStroke();
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(14);
    p.text(this.npc.name, 35, boxY + 15);
    
    // Dialogue text
    p.fill(255);
    p.textSize(13);
    p.text(this.dialogue.text, 35, boxY + 40, 530, 60);
    
    // Choices
    if (this.dialogue.choices.length > 0) {
      p.textSize(12);
      for (let i = 0; i < this.dialogue.choices.length; i++) {
        const choiceY = boxY + 100 + i * 25;
        const isSelected = i === this.selectedChoice;
        
        // Highlight selected choice
        if (isSelected) {
          p.fill(100, 200, 255, 100);
          p.noStroke();
          p.rect(30, choiceY - 2, 540, 20, 4);
        }
        
        p.fill(isSelected ? 255 : 200);
        p.textAlign(p.LEFT, p.TOP);
        p.text(`${i + 1}. ${this.dialogue.choices[i].text}`, 40, choiceY);
      }
      
      // Instructions
      p.fill(150);
      p.textSize(10);
      p.textAlign(p.RIGHT, p.BOTTOM);
      p.text("Arrow keys to select, SPACE/Z to confirm", 570, boxY + boxHeight - 10);
    } else {
      // Continue prompt
      p.fill(150);
      p.textSize(11);
      p.textAlign(p.CENTER, p.BOTTOM);
      p.text("Press SPACE or Z to continue", 300, boxY + boxHeight - 10);
    }
  }
  
  selectNext() {
    if (this.dialogue.choices.length > 0) {
      this.selectedChoice = (this.selectedChoice + 1) % this.dialogue.choices.length;
    }
  }
  
  selectPrevious() {
    if (this.dialogue.choices.length > 0) {
      this.selectedChoice = (this.selectedChoice - 1 + this.dialogue.choices.length) % this.dialogue.choices.length;
    }
  }
  
  confirm() {
    if (this.dialogue.choices.length > 0) {
      const choice = this.dialogue.choices[this.selectedChoice];
      
      // Track the choice
      trackAction('dialogue_choice', { 
        npc: this.npc.name,
        choice: choice.text,
        trait: choice.trait
      });
      
      // Record in history
      gameState.dialogueHistory.push({
        npc: this.npc.name,
        text: this.dialogue.text,
        choice: choice.text
      });
      
      return 'choice_made';
    }
    return 'continue';
  }
}

export function startDialogue(npc) {
  const dialogue = npc.getNextDialogue();
  gameState.activeDialogue = new DialogueBox(npc, dialogue);
  
  // Track interaction
  trackAction('npc_interaction', { npc: npc.name });
  
  // Mark dialogue as completed
  gameState.dialoguesCompleted[npc.name] = (gameState.dialoguesCompleted[npc.name] || 0) + 1;
}

export function closeDialogue() {
  gameState.activeDialogue = null;
}