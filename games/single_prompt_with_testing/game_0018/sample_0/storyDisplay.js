// storyDisplay.js - Story fragment display system
import { gameState, STORY_DATA } from './globals.js';

export class StoryDisplay {
  constructor() {
    this.currentText = "";
    this.displayFrames = 0;
    this.maxDisplayFrames = 180; // 3 seconds
    this.fadeFrames = 30;
  }

  showStoryFragment(layer) {
    const fragment = STORY_DATA.find(f => f.layer === layer);
    if (fragment && gameState.currentStoryIndex < STORY_DATA.length) {
      this.currentText = fragment.text;
      this.displayFrames = this.maxDisplayFrames;
      gameState.currentStoryIndex++;
    }
  }

  update() {
    if (this.displayFrames > 0) {
      this.displayFrames--;
    }
  }

  draw(p) {
    if (this.displayFrames <= 0) return;

    p.push();
    
    // Calculate alpha for fade in/out
    let alpha = 255;
    if (this.displayFrames < this.fadeFrames) {
      alpha = (this.displayFrames / this.fadeFrames) * 255;
    } else if (this.displayFrames > this.maxDisplayFrames - this.fadeFrames) {
      alpha = ((this.maxDisplayFrames - this.displayFrames) / this.fadeFrames) * 255;
    }

    // Background box
    p.fill(0, 0, 0, alpha * 0.7);
    p.noStroke();
    p.rectMode(p.CENTER);
    p.rect(p.width / 2, p.height / 2, 500, 100, 8);

    // Story text
    p.fill(220, 240, 255, alpha);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(18);
    p.text(this.currentText, p.width / 2, p.height / 2);

    p.pop();
  }
}