import { MINIGAME_TYPES } from './globals.js';

export class SpellTraceMiniGame {
  constructor(pattern, difficulty) {
    this.pattern = pattern; // Array of direction keys: ['W', 'A', 'S', 'D']
    this.difficulty = difficulty;
    this.currentIndex = 0;
    this.completed = false;
    this.failed = false;
    this.timeLimit = 5000 - (difficulty * 500); // Less time at higher difficulty
    this.startTime = Date.now();
    this.tracePoints = this.generateTracePoints();
  }
  
  generateTracePoints() {
    const points = [];
    const centerX = 300;
    const centerY = 150;
    const radius = 60;
    
    for (let i = 0; i < this.pattern.length; i++) {
      const angle = (i / this.pattern.length) * Math.PI * 2 - Math.PI / 2;
      points.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        key: this.pattern[i]
      });
    }
    
    return points;
  }
  
  handleInput(key) {
    if (this.completed || this.failed) return;
    
    const expectedKey = this.pattern[this.currentIndex];
    if (key === expectedKey) {
      this.currentIndex++;
      if (this.currentIndex >= this.pattern.length) {
        this.completed = true;
      }
    } else {
      this.failed = true;
    }
  }
  
  update() {
    if (this.completed || this.failed) return;
    
    const elapsed = Date.now() - this.startTime;
    if (elapsed > this.timeLimit) {
      this.failed = true;
    }
  }
  
  render(p) {
    p.push();
    
    // Background
    p.fill(10, 10, 30, 200);
    p.noStroke();
    p.rect(0, 0, 600, 400);
    
    // Title
    p.fill(220, 180, 100);
    p.textSize(20);
    p.textAlign(p.CENTER, p.TOP);
    p.text("Cast the Spell!", 300, 30);
    
    // Instructions
    p.fill(180);
    p.textSize(12);
    p.text(`Press: ${this.pattern.join(' - ')}`, 300, 60);
    
    // Timer bar
    const elapsed = Date.now() - this.startTime;
    const timeRatio = 1 - (elapsed / this.timeLimit);
    p.fill(timeRatio > 0.3 ? [100, 200, 100] : [200, 100, 100]);
    p.rect(150, 230, 300 * Math.max(0, timeRatio), 15);
    p.noFill();
    p.stroke(150);
    p.strokeWeight(2);
    p.rect(150, 230, 300, 15);
    
    // Trace points
    for (let i = 0; i < this.tracePoints.length; i++) {
      const point = this.tracePoints[i];
      
      if (i < this.currentIndex) {
        p.fill(100, 200, 255);
      } else if (i === this.currentIndex) {
        p.fill(255, 220, 100);
      } else {
        p.fill(100);
      }
      
      p.stroke(255);
      p.strokeWeight(2);
      p.circle(point.x, point.y, 30);
      
      // Key label
      p.fill(255);
      p.noStroke();
      p.textSize(14);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(point.key, point.x, point.y);
      
      // Draw line to next point
      if (i < this.tracePoints.length - 1) {
        const nextPoint = this.tracePoints[i + 1];
        p.stroke(i < this.currentIndex ? [100, 200, 255] : [100, 100, 100]);
        p.strokeWeight(3);
        p.line(point.x, point.y, nextPoint.x, nextPoint.y);
      }
    }
    
    // Result message
    if (this.completed) {
      p.fill(100, 255, 100);
      p.textSize(24);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("Success!", 300, 280);
    } else if (this.failed) {
      p.fill(255, 100, 100);
      p.textSize(24);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("Failed!", 300, 280);
    }
    
    p.pop();
  }
}

export class QTEMiniGame {
  constructor(difficulty) {
    this.difficulty = difficulty;
    this.completed = false;
    this.failed = false;
    this.indicatorPos = 0;
    this.indicatorSpeed = 1 + (difficulty * 0.5);
    this.targetZoneStart = 0.4;
    this.targetZoneEnd = 0.6;
    this.targetZoneSize = 0.2 - (difficulty * 0.03);
    this.targetZoneStart = 0.5 - this.targetZoneSize / 2;
    this.targetZoneEnd = 0.5 + this.targetZoneSize / 2;
    this.direction = 1;
  }
  
  handleInput(key) {
    if (this.completed || this.failed) return;
    
    if (key === ' ') {
      if (this.indicatorPos >= this.targetZoneStart && this.indicatorPos <= this.targetZoneEnd) {
        this.completed = true;
      } else {
        this.failed = true;
      }
    }
  }
  
  update() {
    if (this.completed || this.failed) return;
    
    this.indicatorPos += this.indicatorSpeed * 0.01 * this.direction;
    
    if (this.indicatorPos >= 1) {
      this.indicatorPos = 1;
      this.direction = -1;
    } else if (this.indicatorPos <= 0) {
      this.indicatorPos = 0;
      this.direction = 1;
    }
  }
  
  render(p) {
    p.push();
    
    // Background
    p.fill(10, 10, 30, 200);
    p.noStroke();
    p.rect(0, 0, 600, 400);
    
    // Title
    p.fill(220, 180, 100);
    p.textSize(20);
    p.textAlign(p.CENTER, p.TOP);
    p.text("Perfect Timing!", 300, 30);
    
    // Instructions
    p.fill(180);
    p.textSize(12);
    p.text("Press SPACE when the indicator is in the green zone!", 300, 60);
    
    // Bar background
    p.fill(40);
    p.stroke(150);
    p.strokeWeight(2);
    p.rect(100, 180, 400, 40);
    
    // Target zone
    const targetX = 100 + this.targetZoneStart * 400;
    const targetWidth = (this.targetZoneEnd - this.targetZoneStart) * 400;
    p.fill(100, 200, 100);
    p.noStroke();
    p.rect(targetX, 180, targetWidth, 40);
    
    // Indicator
    const indicatorX = 100 + this.indicatorPos * 400;
    p.fill(255, 220, 100);
    p.stroke(255);
    p.strokeWeight(3);
    p.rect(indicatorX - 3, 175, 6, 50);
    
    // Result message
    if (this.completed) {
      p.fill(100, 255, 100);
      p.textSize(24);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("Perfect!", 300, 280);
    } else if (this.failed) {
      p.fill(255, 100, 100);
      p.textSize(24);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("Missed!", 300, 280);
    }
    
    p.pop();
  }
}