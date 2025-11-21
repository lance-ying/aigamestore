// letterWheel.js - Letter wheel rendering and interaction

import { gameState } from './globals.js';
import { getCurrentLevel, submitWord } from './levelManager.js';

export class LetterWheel {
  constructor(p, centerX, centerY, radius) {
    this.p = p;
    this.centerX = centerX;
    this.centerY = centerY;
    this.radius = radius;
    this.letters = [];
    this.letterPositions = [];
  }
  
  setup(letters) {
    this.letters = letters;
    this.letterPositions = [];
    
    const angleStep = this.p.TWO_PI / letters.length;
    for (let i = 0; i < letters.length; i++) {
      const angle = angleStep * i - this.p.HALF_PI;
      const x = this.centerX + this.p.cos(angle) * this.radius;
      const y = this.centerY + this.p.sin(angle) * this.radius;
      this.letterPositions.push({ x, y, letter: letters[i] });
    }
  }
  
  draw() {
    const p = this.p;
    
    // Draw connecting lines between selected letters
    if (gameState.selectedLetters.length > 1) {
      p.stroke(100, 150, 255);
      p.strokeWeight(3);
      p.noFill();
      p.beginShape();
      for (let idx of gameState.selectedLetters) {
        const pos = this.letterPositions[idx];
        p.vertex(pos.x, pos.y);
      }
      p.endShape();
    }
    
    // Draw letter buttons
    for (let i = 0; i < this.letterPositions.length; i++) {
      const pos = this.letterPositions[i];
      const isSelected = gameState.selectedLetters.includes(i);
      const isKeyboardSelected = gameState.keyboardSelectedIndex === i;
      const isHovered = gameState.hoveredLetterIndex === i;
      
      // Button background
      if (isSelected || isKeyboardSelected) {
        p.fill(255, 220, 100);
        const scale = isSelected ? 1.15 : 1.1;
        p.circle(pos.x, pos.y, 55 * scale);
      } else if (isHovered) {
        p.fill(255, 240, 150);
        p.circle(pos.x, pos.y, 58);
      } else {
        p.fill(240, 240, 240);
        p.circle(pos.x, pos.y, 50);
      }
      
      // Letter text
      p.fill(40, 40, 60);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(28);
      p.textStyle(p.BOLD);
      p.text(pos.letter, pos.x, pos.y);
    }
  }
  
  getLetterIndexAt(x, y) {
    for (let i = 0; i < this.letterPositions.length; i++) {
      const pos = this.letterPositions[i];
      const dist = this.p.dist(x, y, pos.x, pos.y);
      if (dist < 30) {
        return i;
      }
    }
    return -1;
  }
  
  handleMousePressed(mouseX, mouseY) {
    const idx = this.getLetterIndexAt(mouseX, mouseY);
    if (idx !== -1) {
      gameState.currentWord = [this.letters[idx]];
      gameState.selectedLetters = [idx];
    }
  }
  
  handleMouseDragged(mouseX, mouseY) {
    if (gameState.selectedLetters.length === 0) return;
    
    const idx = this.getLetterIndexAt(mouseX, mouseY);
    if (idx !== -1 && !gameState.selectedLetters.includes(idx)) {
      gameState.currentWord.push(this.letters[idx]);
      gameState.selectedLetters.push(idx);
    }
  }
  
  handleMouseReleased() {
    if (gameState.selectedLetters.length > 0) {
      submitWord();
    }
  }
  
  handleKeyboardNavigation(keyCode) {
    const level = getCurrentLevel();
    const numLetters = level.letters.length;
    
    if (keyCode === 37) { // Left arrow
      if (gameState.keyboardSelectedIndex === -1) {
        gameState.keyboardSelectedIndex = 0;
      } else {
        gameState.keyboardSelectedIndex = (gameState.keyboardSelectedIndex - 1 + numLetters) % numLetters;
      }
    } else if (keyCode === 39) { // Right arrow
      if (gameState.keyboardSelectedIndex === -1) {
        gameState.keyboardSelectedIndex = 0;
      } else {
        gameState.keyboardSelectedIndex = (gameState.keyboardSelectedIndex + 1) % numLetters;
      }
    } else if (keyCode === 32) { // Space - select/deselect
      if (gameState.keyboardSelectedIndex !== -1) {
        const idx = gameState.keyboardSelectedIndex;
        if (!gameState.selectedLetters.includes(idx)) {
          gameState.currentWord.push(this.letters[idx]);
          gameState.selectedLetters.push(idx);
        }
      }
    } else if (keyCode === 90) { // Z - submit
      submitWord();
    }
  }
}