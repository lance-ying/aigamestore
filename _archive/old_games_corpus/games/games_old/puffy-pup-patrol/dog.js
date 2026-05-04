// dog.js - Dog entity and related logic
import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class Dog {
  constructor(p) {
    this.p = p;
    this.x = CANVAS_WIDTH / 2;
    this.y = CANVAS_HEIGHT / 2 + 20;
    this.baseSize = 80;
    this.jiggleOffset = { x: 0, y: 0 };
    this.jiggleTime = 0;
  }

  update() {
    // Update jiggle animation
    this.jiggleTime += 0.1;
    const jiggleIntensity = gameState.currentLevel * 0.5;
    this.jiggleOffset.x = this.p.sin(this.jiggleTime) * jiggleIntensity;
    this.jiggleOffset.y = this.p.cos(this.jiggleTime * 1.3) * jiggleIntensity;
    
    // Update head scale based on swelling meter
    const targetScale = 1.0 + (gameState.swellingMeter / 100) * 0.5;
    gameState.dogHeadScale = this.p.lerp(gameState.dogHeadScale, targetScale, 0.1);
    
    // Update mood based on swelling
    if (gameState.swellingMeter < 40) {
      gameState.dogMood = 'happy';
    } else if (gameState.swellingMeter < 70) {
      gameState.dogMood = 'neutral';
    } else {
      gameState.dogMood = 'worried';
    }
  }

  draw() {
    const p = this.p;
    const drawX = this.x + this.jiggleOffset.x;
    const drawY = this.y + this.jiggleOffset.y;
    
    p.push();
    p.translate(drawX, drawY);
    
    // Draw swelling pulse if meter is high
    if (gameState.swellingMeter > 80) {
      const pulseAlpha = (p.sin(p.frameCount * 0.2) + 1) / 2 * 100;
      p.fill(255, 100, 100, pulseAlpha);
      p.noStroke();
      p.ellipse(0, -20, this.baseSize * gameState.dogHeadScale * 1.3);
    }
    
    // Draw body
    p.fill(139, 90, 43);
    p.noStroke();
    p.ellipse(0, 30, 100, 120);
    
    // Draw head
    p.fill(160, 110, 60);
    p.ellipse(0, -20, this.baseSize * gameState.dogHeadScale);
    
    // Draw ears
    p.fill(130, 85, 45);
    p.ellipse(-35, -30, 30, 50);
    p.ellipse(35, -30, 30, 50);
    
    // Draw snout
    p.fill(140, 100, 55);
    p.ellipse(0, 0, 40, 30);
    
    // Draw nose
    p.fill(50, 30, 30);
    p.ellipse(0, 5, 15, 12);
    
    // Draw eyes based on mood
    p.fill(50, 30, 30);
    const eyeY = gameState.dogMood === 'happy' ? -25 : -22;
    const eyeSize = gameState.dogMood === 'worried' ? 8 : 6;
    
    if (gameState.dogMood === 'happy') {
      // Happy eyes (curved)
      p.noFill();
      p.stroke(50, 30, 30);
      p.strokeWeight(2);
      p.arc(-15, eyeY, 12, 8, 0, p.PI);
      p.arc(15, eyeY, 12, 8, 0, p.PI);
    } else {
      // Neutral/worried eyes
      p.noStroke();
      p.ellipse(-15, eyeY, eyeSize, eyeSize);
      p.ellipse(15, eyeY, eyeSize, eyeSize);
      
      if (gameState.dogMood === 'worried') {
        // Worried eyebrows
        p.stroke(50, 30, 30);
        p.strokeWeight(2);
        p.line(-20, -32, -10, -30);
        p.line(10, -30, 20, -32);
      }
    }
    
    p.pop();
  }

  getHeadBounds() {
    return {
      x: this.x + this.jiggleOffset.x,
      y: this.y + this.jiggleOffset.y - 20,
      radius: (this.baseSize * gameState.dogHeadScale) / 2
    };
  }
}