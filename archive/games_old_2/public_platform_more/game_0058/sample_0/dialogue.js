// dialogue.js - NPC dialogue system

import { gameState, NPCS, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class DialogueManager {
  constructor(p) {
    this.p = p;
  }
  
  startDialogue(npcId) {
    const npc = NPCS[npcId];
    if (!npc) return false;
    
    gameState.inDialogue = true;
    gameState.currentDialogue = npcId;
    gameState.dialogueIndex = 0;
    
    return true;
  }
  
  nextDialogue() {
    const npc = NPCS[gameState.currentDialogue];
    if (!npc) return;
    
    gameState.dialogueIndex++;
    
    if (gameState.dialogueIndex >= npc.dialogue.length) {
      this.exitDialogue();
    }
  }
  
  exitDialogue() {
    gameState.inDialogue = false;
    gameState.currentDialogue = null;
    gameState.dialogueIndex = 0;
  }
  
  render() {
    const p = this.p;
    const npc = NPCS[gameState.currentDialogue];
    
    if (!npc) return;
    
    const text = npc.dialogue[gameState.dialogueIndex];
    
    // Dialogue box
    p.fill(0, 0, 0, 200);
    p.noStroke();
    p.rect(50, CANVAS_HEIGHT - 120, CANVAS_WIDTH - 100, 100, 10);
    
    // NPC name
    p.fill(255, 215, 0);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(16);
    p.text(npc.name, 70, CANVAS_HEIGHT - 110);
    
    // Dialogue text
    p.fill(255);
    p.textSize(14);
    p.textAlign(p.LEFT, p.TOP);
    const lines = this.wrapText(text, CANVAS_WIDTH - 140);
    let yPos = CANVAS_HEIGHT - 85;
    lines.forEach(line => {
      p.text(line, 70, yPos);
      yPos += 18;
    });
    
    // Prompt
    p.fill(200, 200, 200);
    p.textAlign(p.RIGHT, p.BOTTOM);
    p.textSize(11);
    p.text("SPACE: Continue", CANVAS_WIDTH - 70, CANVAS_HEIGHT - 30);
  }
  
  wrapText(text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = "";
    
    words.forEach(word => {
      const testLine = currentLine + (currentLine ? " " : "") + word;
      const testWidth = this.p.textWidth(testLine);
      
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }
}