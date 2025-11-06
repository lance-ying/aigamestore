// character.js
import { gameState, ALIEN_WORDS } from './globals.js';

export class Character {
  constructor(x, y, p) {
    this.x = x;
    this.y = y;
    this.p = p;
    this.animationFrame = 0;
    this.mood = "neutral";
    this.currentDialogue = "";
    this.dialogueTimer = 0;
  }
  
  update() {
    this.animationFrame += 0.05;
    this.mood = gameState.characterMood;
    
    if (this.dialogueTimer > 0) {
      this.dialogueTimer--;
    }
  }
  
  draw() {
    const p = this.p;
    p.push();
    
    // Shadow
    p.fill(0, 0, 0, 50);
    p.noStroke();
    p.ellipse(this.x, this.y + 70, 50, 15);
    
    // Body
    const bodyBob = Math.sin(this.animationFrame) * 2;
    p.fill(80, 100, 140);
    p.stroke(60, 80, 120);
    p.strokeWeight(2);
    p.ellipse(this.x, this.y + 40 + bodyBob, 60, 80);
    
    // Head
    const headColor = this.getMoodColor();
    p.fill(...headColor);
    p.stroke(headColor[0] - 30, headColor[1] - 30, headColor[2] - 30);
    p.circle(this.x, this.y + bodyBob, 50);
    
    // Eyes
    p.fill(255);
    p.noStroke();
    const eyeOffset = Math.sin(this.animationFrame * 2) * 2;
    p.ellipse(this.x - 12, this.y - 5 + bodyBob + eyeOffset, 12, 16);
    p.ellipse(this.x + 12, this.y - 5 + bodyBob + eyeOffset, 12, 16);
    
    // Pupils
    p.fill(50, 50, 100);
    p.circle(this.x - 12, this.y - 3 + bodyBob + eyeOffset, 6);
    p.circle(this.x + 12, this.y - 3 + bodyBob + eyeOffset, 6);
    
    // Mouth based on mood
    this.drawMouth(bodyBob);
    
    // Arms
    p.stroke(60, 80, 120);
    p.strokeWeight(8);
    p.noFill();
    const armWave = Math.sin(this.animationFrame * 1.5) * 10;
    p.line(this.x - 30, this.y + 30 + bodyBob, this.x - 40, this.y + 50 + bodyBob + armWave);
    p.line(this.x + 30, this.y + 30 + bodyBob, this.x + 40, this.y + 50 + bodyBob - armWave);
    
    p.pop();
    
    // Draw dialogue if active
    if (this.dialogueTimer > 0 && this.currentDialogue) {
      this.drawDialogueBubble();
    }
  }
  
  getMoodColor() {
    switch (this.mood) {
      case "happy": return [255, 200, 100];
      case "sad": return [100, 120, 180];
      case "confused": return [180, 160, 200];
      case "angry": return [220, 100, 100];
      case "afraid": return [150, 150, 200];
      default: return [200, 180, 160];
    }
  }
  
  drawMouth(bodyBob) {
    const p = this.p;
    p.noFill();
    p.stroke(100, 80, 70);
    p.strokeWeight(2);
    
    switch (this.mood) {
      case "happy":
        p.arc(this.x, this.y + 8 + bodyBob, 20, 15, 0, p.PI);
        break;
      case "sad":
        p.arc(this.x, this.y + 18 + bodyBob, 20, 15, p.PI, 0);
        break;
      case "confused":
        p.line(this.x - 8, this.y + 12 + bodyBob, this.x + 8, this.y + 12 + bodyBob);
        break;
      case "angry":
        p.line(this.x - 10, this.y + 15 + bodyBob, this.x + 10, this.y + 15 + bodyBob);
        break;
      default:
        p.line(this.x - 8, this.y + 12 + bodyBob, this.x + 8, this.y + 12 + bodyBob);
    }
  }
  
  speak(dialogue, duration = 180) {
    this.currentDialogue = dialogue;
    this.dialogueTimer = duration;
  }
  
  drawDialogueBubble() {
    const p = this.p;
    p.push();
    
    // Bubble
    const bubbleX = this.x + 70;
    const bubbleY = this.y - 30;
    const bubbleWidth = 180;
    const bubbleHeight = 60;
    
    p.fill(255, 255, 240);
    p.stroke(100);
    p.strokeWeight(2);
    p.rect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, 10);
    
    // Pointer
    p.triangle(
      bubbleX - 10, bubbleY + 30,
      bubbleX, bubbleY + 25,
      bubbleX, bubbleY + 35
    );
    
    // Text
    p.fill(50);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    
    // Word wrap
    const words = this.currentDialogue.split(' ');
    let line = '';
    let y = bubbleY + 20;
    const maxWidth = bubbleWidth - 20;
    
    for (let word of words) {
      const testLine = line + word + ' ';
      const testWidth = p.textWidth(testLine);
      
      if (testWidth > maxWidth && line !== '') {
        p.text(line, bubbleX + bubbleWidth / 2, y);
        line = word + ' ';
        y += 18;
      } else {
        line = testLine;
      }
    }
    p.text(line, bubbleX + bubbleWidth / 2, y);
    
    p.pop();
  }
}