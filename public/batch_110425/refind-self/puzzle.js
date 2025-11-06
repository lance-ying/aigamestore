// puzzle.js - Environmental puzzles and interactable objects

import { gameState } from './globals.js';

export class Puzzle {
  constructor(x, y, type, id) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 40;
    this.type = type; // 'pattern', 'sequence', 'choice'
    this.id = id;
    this.solved = false;
    this.active = false;
    
    // Visual
    this.color = [150, 150, 200];
    this.glowPhase = 0;
    
    this.initializePuzzle();
  }
  
  initializePuzzle() {
    switch(this.type) {
      case 'pattern':
        this.pattern = [0, 1, 2, 1]; // Simple pattern
        this.playerPattern = [];
        this.options = 3;
        break;
      case 'sequence':
        this.targetSequence = [2, 0, 1];
        this.currentSequence = [];
        this.options = 3;
        break;
      case 'choice':
        this.correctChoice = 1;
        this.options = 3;
        break;
    }
  }
  
  update(p) {
    this.glowPhase += 0.05;
  }
  
  draw(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Base
    const glow = Math.sin(this.glowPhase) * 20 + 30;
    p.fill(this.color[0] + glow, this.color[1] + glow, this.color[2] + glow);
    p.stroke(this.solved ? [100, 255, 100] : [100, 100, 150]);
    p.strokeWeight(2);
    p.rectMode(p.CENTER);
    p.rect(0, 0, this.width, this.height, 8);
    
    // Puzzle icon
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(20);
    p.text(this.solved ? "✓" : "?", 0, 0);
    
    // Interaction indicator
    if (this.canInteract() && !this.solved) {
      p.fill(255, 255, 100);
      p.textSize(12);
      p.text("SPACE", 0, -30);
    }
    
    p.pop();
    
    // Draw puzzle interface if active
    if (this.active) {
      this.drawPuzzleInterface(p);
    }
  }
  
  drawPuzzleInterface(p) {
    // Overlay
    p.fill(0, 0, 0, 150);
    p.noStroke();
    p.rectMode(p.CORNER);
    p.rect(0, 0, 600, 400);
    
    // Puzzle panel
    p.fill(40, 40, 60);
    p.stroke(100, 100, 150);
    p.strokeWeight(3);
    p.rectMode(p.CENTER);
    p.rect(300, 200, 400, 250, 10);
    
    // Title
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(20);
    p.text("Environmental Puzzle", 300, 100);
    
    // Instructions
    p.textSize(14);
    p.text("Use Arrow Keys to select, Z to confirm, ESC to cancel", 300, 130);
    
    // Draw options based on type
    this.drawPuzzleOptions(p);
  }
  
  drawPuzzleOptions(p) {
    const startY = 180;
    const spacing = 40;
    
    for (let i = 0; i < this.options; i++) {
      const y = startY + i * spacing;
      const isSelected = i === (this.selectedOption || 0);
      
      // Option box
      p.fill(isSelected ? [100, 150, 200] : [60, 60, 80]);
      p.stroke(isSelected ? [150, 200, 255] : [100, 100, 120]);
      p.strokeWeight(2);
      p.rectMode(p.CENTER);
      p.rect(300, y, 300, 30, 5);
      
      // Option text
      p.fill(255);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(14);
      p.text(`Option ${i + 1}`, 300, y);
    }
    
    // Progress indicator for pattern puzzles
    if (this.type === 'pattern' && this.playerPattern) {
      p.fill(200);
      p.textSize(12);
      p.text(`Progress: ${this.playerPattern.length}/${this.pattern.length}`, 300, 290);
    }
  }
  
  canInteract() {
    if (!gameState.player) return false;
    const dist = Math.hypot(this.x - gameState.player.x, this.y - gameState.player.y);
    return dist < 60;
  }
  
  activate() {
    this.active = true;
    this.selectedOption = 0;
  }
  
  deactivate() {
    this.active = false;
  }
  
  handleInput(keyCode) {
    if (!this.active) return false;
    
    // Arrow up - previous option
    if (keyCode === 38) {
      this.selectedOption = (this.selectedOption - 1 + this.options) % this.options;
      return true;
    }
    
    // Arrow down - next option
    if (keyCode === 40) {
      this.selectedOption = (this.selectedOption + 1) % this.options;
      return true;
    }
    
    // Z - confirm selection
    if (keyCode === 90) {
      return this.confirmSelection();
    }
    
    // ESC - cancel (handled in main game loop)
    
    return false;
  }
  
  confirmSelection() {
    const selected = this.selectedOption;
    
    switch(this.type) {
      case 'pattern':
        this.playerPattern.push(selected);
        if (this.playerPattern.length === this.pattern.length) {
          const correct = this.checkPattern();
          if (correct) {
            this.solved = true;
            this.deactivate();
            return true;
          } else {
            // Reset and try again
            this.playerPattern = [];
          }
        }
        return false;
        
      case 'sequence':
        this.currentSequence.push(selected);
        if (this.currentSequence.length === this.targetSequence.length) {
          const correct = this.checkSequence();
          if (correct) {
            this.solved = true;
            this.deactivate();
            return true;
          } else {
            this.currentSequence = [];
          }
        }
        return false;
        
      case 'choice':
        if (selected === this.correctChoice) {
          this.solved = true;
          this.deactivate();
          return true;
        }
        return false;
    }
    
    return false;
  }
  
  checkPattern() {
    if (this.playerPattern.length !== this.pattern.length) return false;
    for (let i = 0; i < this.pattern.length; i++) {
      if (this.playerPattern[i] !== this.pattern[i]) return false;
    }
    return true;
  }
  
  checkSequence() {
    if (this.currentSequence.length !== this.targetSequence.length) return false;
    for (let i = 0; i < this.targetSequence.length; i++) {
      if (this.currentSequence[i] !== this.targetSequence[i]) return false;
    }
    return true;
  }
  
  getBounds() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      width: this.width,
      height: this.height
    };
  }
}