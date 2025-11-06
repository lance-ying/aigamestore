import { MINIGAME_TYPES } from './globals.js';

export class Minigame {
  constructor(p, type) {
    this.p = p;
    this.type = type;
    this.duration = 180; // 3 seconds
    this.timer = this.duration;
    this.score = 0;
    this.complete = false;
    this.targets = [];
    this.successThreshold = 0;
    
    this.initialize();
  }
  
  initialize() {
    switch(this.type) {
      case MINIGAME_TYPES.TAP_TIMING:
        this.targetTime = this.p.random(60, 120);
        this.window = 15;
        this.successThreshold = 1;
        this.hasPressed = false;
        break;
        
      case MINIGAME_TYPES.RAPID_TAP:
        this.tapCount = 0;
        this.successThreshold = 15;
        break;
        
      case MINIGAME_TYPES.SEQUENCE:
        this.sequence = [];
        this.currentIndex = 0;
        this.showSequence = true;
        this.sequenceTimer = 90;
        for (let i = 0; i < 5; i++) {
          this.sequence.push(Math.floor(this.p.random(0, 2))); // 0 = Space, 1 = Z
        }
        this.successThreshold = 5;
        break;
    }
  }
  
  update() {
    this.timer--;
    
    if (this.timer <= 0) {
      this.complete = true;
    }
    
    if (this.type === MINIGAME_TYPES.SEQUENCE && this.showSequence) {
      this.sequenceTimer--;
      if (this.sequenceTimer <= 0) {
        this.showSequence = false;
      }
    }
  }
  
  handleInput(keyCode) {
    if (this.complete) return;
    
    switch(this.type) {
      case MINIGAME_TYPES.TAP_TIMING:
        if (keyCode === 32 && !this.hasPressed) { // Space
          this.hasPressed = true;
          const diff = Math.abs(this.timer - (this.duration - this.targetTime));
          if (diff < this.window) {
            this.score = 1;
          }
        }
        break;
        
      case MINIGAME_TYPES.RAPID_TAP:
        if (keyCode === 32) { // Space
          this.tapCount++;
          this.score = this.tapCount;
        }
        break;
        
      case MINIGAME_TYPES.SEQUENCE:
        if (this.showSequence) return;
        
        let expectedKey = this.sequence[this.currentIndex];
        let pressed = -1;
        if (keyCode === 32) pressed = 0;
        if (keyCode === 90) pressed = 1;
        
        if (pressed === expectedKey) {
          this.currentIndex++;
          this.score = this.currentIndex;
          if (this.currentIndex >= this.sequence.length) {
            this.complete = true;
          }
        } else if (pressed !== -1) {
          // Wrong key pressed - reset
          this.currentIndex = 0;
          this.score = 0;
        }
        break;
    }
  }
  
  draw(p) {
    const x = p.width / 2;
    const y = p.height / 2;
    
    // Background overlay
    p.fill(0, 0, 0, 180);
    p.noStroke();
    p.rect(0, 0, p.width, p.height);
    
    // Minigame box
    p.fill(40);
    p.stroke(255);
    p.strokeWeight(3);
    p.rectMode(p.CENTER);
    p.rect(x, y, 400, 200, 10);
    
    // Title
    p.fill(255, 215, 0);
    p.noStroke();
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(20);
    p.text("MINIGAME!", x, y - 80);
    
    // Timer bar
    const barWidth = 300;
    const progress = this.timer / this.duration;
    p.fill(100);
    p.rect(x, y - 50, barWidth, 10);
    p.fill(100, 255, 100);
    p.rect(x - barWidth/2 + (barWidth * progress)/2, y - 50, barWidth * progress, 10);
    
    // Type-specific rendering
    p.textSize(14);
    p.fill(255);
    
    switch(this.type) {
      case MINIGAME_TYPES.TAP_TIMING:
        p.text("Press SPACE when the bar is in the green zone!", x, y - 20);
        
        // Moving indicator
        const targetProgress = 1 - (this.targetTime / this.duration);
        const currentProgress = 1 - (this.timer / this.duration);
        
        // Green zone
        p.fill(0, 255, 0, 100);
        const zoneStart = targetProgress - (this.window / this.duration);
        const zoneEnd = targetProgress + (this.window / this.duration);
        p.rect(x - barWidth/2 + (barWidth * targetProgress), y + 10, 
               (this.window * 2 / this.duration) * barWidth, 30);
        
        // Indicator
        p.fill(255, 0, 0);
        if (this.hasPressed) p.fill(255, 255, 0);
        p.rect(x - barWidth/2 + (barWidth * currentProgress), y + 10, 5, 30);
        
        break;
        
      case MINIGAME_TYPES.RAPID_TAP:
        p.text("Tap SPACE as fast as you can!", x, y - 20);
        p.textSize(32);
        p.fill(255, 215, 0);
        p.text(this.tapCount, x, y + 10);
        p.textSize(14);
        p.fill(255);
        p.text(`Goal: ${this.successThreshold} taps`, x, y + 50);
        break;
        
      case MINIGAME_TYPES.SEQUENCE:
        if (this.showSequence) {
          p.text("Memorize the sequence!", x, y - 20);
          
          // Show sequence
          let seqText = "";
          for (let i = 0; i < this.sequence.length; i++) {
            seqText += this.sequence[i] === 0 ? "SPACE " : "Z ";
          }
          p.textSize(18);
          p.fill(255, 215, 0);
          p.text(seqText, x, y + 10);
        } else {
          p.text("Repeat the sequence!", x, y - 20);
          
          // Show progress
          let progressText = "";
          for (let i = 0; i < this.sequence.length; i++) {
            if (i < this.currentIndex) {
              progressText += "✓ ";
            } else if (i === this.currentIndex) {
              progressText += this.sequence[i] === 0 ? "SPACE " : "Z ";
            } else {
              progressText += "? ";
            }
          }
          p.textSize(18);
          p.fill(255, 215, 0);
          p.text(progressText, x, y + 10);
        }
        break;
    }
    
    // Score
    p.textSize(14);
    p.fill(255);
    p.text(`Score: ${this.score} / ${this.successThreshold}`, x, y + 70);
  }
  
  getReward() {
    if (this.score >= this.successThreshold) {
      return 1000 + this.score * 100;
    } else if (this.score > 0) {
      return 200 + this.score * 50;
    }
    return 0;
  }
  
  isSuccess() {
    return this.score >= this.successThreshold;
  }
}