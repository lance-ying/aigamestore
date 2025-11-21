// puzzles.js - Puzzle system and logic

import { gameState } from './globals.js';

export class PuzzleManager {
  constructor(p) {
    this.p = p;
  }

  activatePuzzle(puzzleId) {
    const levelData = gameState.allLevelsData[gameState.currentLevel];
    if (levelData.puzzles[puzzleId]) {
      gameState.activePuzzleId = puzzleId;
      if (!gameState.puzzleAttempts[puzzleId]) {
        gameState.puzzleAttempts[puzzleId] = 0;
      }
      return true;
    }
    return false;
  }

  closePuzzle() {
    gameState.activePuzzleId = null;
  }

  getCurrentPuzzle() {
    if (!gameState.activePuzzleId) return null;
    const levelData = gameState.allLevelsData[gameState.currentLevel];
    return levelData.puzzles[gameState.activePuzzleId];
  }

  handlePuzzleInput(key, keyCode) {
    const puzzle = this.getCurrentPuzzle();
    if (!puzzle) return;

    if (puzzle.type === 'sequence') {
      this.handleSequencePuzzle(key, keyCode);
    } else if (puzzle.type === 'cipher') {
      this.handleCipherPuzzle(key, keyCode);
    } else if (puzzle.type === 'slider') {
      this.handleSliderPuzzle(key, keyCode);
    } else if (puzzle.type === 'matching') {
      this.handleMatchingPuzzle(key, keyCode);
    } else if (puzzle.type === 'riddle') {
      this.handleRiddlePuzzle(key, keyCode);
    } else if (puzzle.type === 'sequence_timed') {
      this.handleTimedSequencePuzzle(key, keyCode);
    }
  }

  handleSequencePuzzle(key, keyCode) {
    const puzzle = this.getCurrentPuzzle();
    // Arrow keys to cycle through order
    if (keyCode === 37 || keyCode === 38) { // Left or Up
      const temp = puzzle.currentOrder[0];
      puzzle.currentOrder[0] = puzzle.currentOrder[1];
      puzzle.currentOrder[1] = puzzle.currentOrder[2];
      puzzle.currentOrder[2] = temp;
    } else if (keyCode === 39 || keyCode === 40) { // Right or Down
      const temp = puzzle.currentOrder[2];
      puzzle.currentOrder[2] = puzzle.currentOrder[1];
      puzzle.currentOrder[1] = puzzle.currentOrder[0];
      puzzle.currentOrder[0] = temp;
    } else if (keyCode === 32) { // Space to confirm
      this.checkSequenceSolution();
    }
  }

  checkSequenceSolution() {
    const puzzle = this.getCurrentPuzzle();
    const puzzleId = gameState.activePuzzleId;
    
    if (JSON.stringify(puzzle.currentOrder) === JSON.stringify(puzzle.solution)) {
      gameState.hotspotStates[puzzleId + '_solved'] = true;
      gameState.score += 500;
      gameState.levelScore += 500;
      this.closePuzzle();
      
      // Special handling for tablet order in level 1
      if (puzzleId === 'tablet_order') {
        // Reveal the wooden box
        gameState.hotspotStates['cipher_box_available'] = true;
      }
    } else {
      gameState.puzzleAttempts[puzzleId]++;
    }
  }

  handleCipherPuzzle(key, keyCode) {
    const puzzle = this.getCurrentPuzzle();
    
    if (keyCode >= 65 && keyCode <= 90) { // A-Z
      if (puzzle.currentInput.length < puzzle.solution.length) {
        puzzle.currentInput += key.toUpperCase();
      }
    } else if (keyCode === 8) { // Backspace
      puzzle.currentInput = puzzle.currentInput.slice(0, -1);
    } else if (keyCode === 32) { // Space to confirm
      this.checkCipherSolution();
    }
  }

  checkCipherSolution() {
    const puzzle = this.getCurrentPuzzle();
    const puzzleId = gameState.activePuzzleId;
    
    if (puzzle.currentInput === puzzle.solution) {
      gameState.hotspotStates[puzzleId + '_solved'] = true;
      gameState.score += 500;
      gameState.levelScore += 500;
      
      // Give key fragment
      const levelData = gameState.allLevelsData[gameState.currentLevel];
      if (levelData.items.rusty_key_fragment_2) {
        gameState.inventory.push({
          id: 'rusty_key_fragment_2',
          ...levelData.items.rusty_key_fragment_2
        });
      }
      
      // Combine fragments into complete key
      if (gameState.inventory.find(i => i.id === 'rusty_key_fragment_1') &&
          gameState.inventory.find(i => i.id === 'rusty_key_fragment_2')) {
        gameState.inventory = gameState.inventory.filter(i => 
          i.id !== 'rusty_key_fragment_1' && i.id !== 'rusty_key_fragment_2'
        );
        gameState.inventory.push({
          id: 'complete_key',
          ...levelData.items.complete_key
        });
      }
      
      this.closePuzzle();
    } else {
      gameState.puzzleAttempts[puzzleId]++;
      puzzle.currentInput = '';
    }
  }

  handleSliderPuzzle(key, keyCode) {
    const puzzle = this.getCurrentPuzzle();
    const size = puzzle.size;
    const emptyRow = Math.floor(puzzle.emptyIndex / size);
    const emptyCol = puzzle.emptyIndex % size;
    
    let newRow = emptyRow;
    let newCol = emptyCol;
    
    if (keyCode === 37) newCol--; // Left
    else if (keyCode === 39) newCol++; // Right
    else if (keyCode === 38) newRow--; // Up
    else if (keyCode === 40) newRow++; // Down
    else if (keyCode === 32) { // Space to check
      this.checkSliderSolution();
      return;
    }
    
    if (newRow >= 0 && newRow < size && newCol >= 0 && newCol < size) {
      const newIndex = newRow * size + newCol;
      // Swap
      const temp = puzzle.currentState[puzzle.emptyIndex];
      puzzle.currentState[puzzle.emptyIndex] = puzzle.currentState[newIndex];
      puzzle.currentState[newIndex] = temp;
      puzzle.emptyIndex = newIndex;
    }
  }

  checkSliderSolution() {
    const puzzle = this.getCurrentPuzzle();
    const puzzleId = gameState.activePuzzleId;
    
    if (JSON.stringify(puzzle.currentState) === JSON.stringify(puzzle.solution)) {
      gameState.hotspotStates[puzzleId + '_solved'] = true;
      gameState.score += 1000;
      gameState.levelScore += 1000;
      this.closePuzzle();
    } else {
      gameState.puzzleAttempts[puzzleId]++;
    }
  }

  handleMatchingPuzzle(key, keyCode) {
    const puzzle = this.getCurrentPuzzle();
    
    // Number keys 1-4 to select symbol
    if (keyCode >= 49 && keyCode <= 52) {
      const symbolIndex = keyCode - 49;
      // Find first empty slot
      const emptySlot = puzzle.currentInput.findIndex(v => v === -1);
      if (emptySlot !== -1) {
        puzzle.currentInput[emptySlot] = symbolIndex;
      }
    } else if (keyCode === 8) { // Backspace to clear last
      for (let i = puzzle.currentInput.length - 1; i >= 0; i--) {
        if (puzzle.currentInput[i] !== -1) {
          puzzle.currentInput[i] = -1;
          break;
        }
      }
    } else if (keyCode === 32) { // Space to confirm
      this.checkMatchingSolution();
    }
  }

  checkMatchingSolution() {
    const puzzle = this.getCurrentPuzzle();
    const puzzleId = gameState.activePuzzleId;
    
    if (JSON.stringify(puzzle.currentInput) === JSON.stringify(puzzle.solution)) {
      gameState.hotspotStates[puzzleId + '_solved'] = true;
      gameState.score += 1000;
      gameState.levelScore += 1000;
      this.closePuzzle();
    } else {
      gameState.puzzleAttempts[puzzleId]++;
    }
  }

  handleRiddlePuzzle(key, keyCode) {
    const puzzle = this.getCurrentPuzzle();
    
    if (keyCode >= 65 && keyCode <= 90) {
      if (puzzle.currentInput.length < puzzle.solution.length) {
        puzzle.currentInput += key.toUpperCase();
      }
    } else if (keyCode === 8) {
      puzzle.currentInput = puzzle.currentInput.slice(0, -1);
    } else if (keyCode === 32) {
      this.checkRiddleSolution();
    }
  }

  checkRiddleSolution() {
    const puzzle = this.getCurrentPuzzle();
    const puzzleId = gameState.activePuzzleId;
    
    if (puzzle.currentInput === puzzle.solution) {
      gameState.hotspotStates[puzzleId + '_solved'] = true;
      gameState.score += 1000;
      gameState.levelScore += 1000;
      this.closePuzzle();
    } else {
      gameState.puzzleAttempts[puzzleId]++;
      puzzle.currentInput = '';
    }
  }

  handleTimedSequencePuzzle(key, keyCode) {
    const puzzle = this.getCurrentPuzzle();
    
    // Number keys 1-4 for levers
    if (keyCode >= 49 && keyCode <= 52) {
      const leverIndex = keyCode - 49;
      if (leverIndex < puzzle.leverCount) {
        puzzle.currentSequence.push(leverIndex);
        
        if (puzzle.currentSequence.length >= puzzle.solution.length) {
          this.checkTimedSequenceSolution();
        }
      }
    } else if (keyCode === 8) { // Backspace to reset
      puzzle.currentSequence = [];
    }
  }

  checkTimedSequenceSolution() {
    const puzzle = this.getCurrentPuzzle();
    const puzzleId = gameState.activePuzzleId;
    
    if (JSON.stringify(puzzle.currentSequence) === JSON.stringify(puzzle.solution)) {
      gameState.hotspotStates[puzzleId + '_solved'] = true;
      gameState.score += 1000;
      gameState.levelScore += 1000;
      this.closePuzzle();
    } else {
      gameState.puzzleAttempts[puzzleId]++;
      puzzle.currentSequence = [];
    }
  }

  render() {
    if (!gameState.activePuzzleId) return;

    const p = this.p;
    const puzzle = this.getCurrentPuzzle();
    
    // Overlay
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, 600, 400);

    // Puzzle panel
    p.fill(30, 25, 35);
    p.stroke(80, 70, 90);
    p.strokeWeight(3);
    p.rect(50, 30, 500, 340, 10);

    if (puzzle.type === 'sequence') {
      this.renderSequencePuzzle(puzzle);
    } else if (puzzle.type === 'cipher') {
      this.renderCipherPuzzle(puzzle);
    } else if (puzzle.type === 'slider') {
      this.renderSliderPuzzle(puzzle);
    } else if (puzzle.type === 'matching') {
      this.renderMatchingPuzzle(puzzle);
    } else if (puzzle.type === 'riddle') {
      this.renderRiddlePuzzle(puzzle);
    } else if (puzzle.type === 'sequence_timed') {
      this.renderTimedSequencePuzzle(puzzle);
    }

    // Instructions
    p.fill(150, 140, 160);
    p.textSize(12);
    p.textAlign(p.CENTER, p.CENTER);
    p.text('ESC to close', 300, 355);
  }

  renderSequencePuzzle(puzzle) {
    const p = this.p;
    
    p.fill(180, 170, 190);
    p.textSize(18);
    p.textAlign(p.CENTER, p.CENTER);
    p.text('Arrange the Moon Phases', 300, 70);
    
    p.textSize(14);
    p.fill(140, 130, 150);
    p.text('Arrow Keys: Rotate | Space: Confirm', 300, 100);

    const phases = ['New Moon', 'Full Moon', 'Crescent'];
    const x = 200;
    const spacing = 100;
    
    for (let i = 0; i < 3; i++) {
      const phaseIndex = puzzle.currentOrder[i];
      p.fill(60, 55, 70);
      p.stroke(100, 90, 110);
      p.strokeWeight(2);
      p.rect(x + i * spacing, 150, 80, 100, 5);
      
      // Moon visual
      p.fill(220, 210, 200);
      p.noStroke();
      if (phaseIndex === 0) { // New moon
        p.fill(40, 35, 45);
        p.ellipse(x + i * spacing + 40, 180, 50, 50);
      } else if (phaseIndex === 1) { // Full moon
        p.ellipse(x + i * spacing + 40, 180, 50, 50);
      } else { // Crescent
        p.ellipse(x + i * spacing + 40, 180, 50, 50);
        p.fill(40, 35, 45);
        p.ellipse(x + i * spacing + 50, 180, 40, 50);
      }
      
      p.fill(180, 170, 190);
      p.textSize(12);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(phases[phaseIndex], x + i * spacing + 40, 230);
    }
  }

  renderCipherPuzzle(puzzle) {
    const p = this.p;
    
    p.fill(180, 170, 190);
    p.textSize(18);
    p.textAlign(p.CENTER, p.CENTER);
    p.text('Wooden Box Cipher', 300, 70);
    
    p.textSize(14);
    p.fill(140, 130, 150);
    p.text('Type the word | Backspace: Delete | Space: Confirm', 300, 100);

    // Input display
    p.fill(50, 45, 60);
    p.stroke(100, 90, 110);
    p.strokeWeight(2);
    p.rect(150, 150, 300, 60, 5);
    
    p.fill(200, 190, 210);
    p.textSize(32);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(puzzle.currentInput || '_', 300, 180);

    // Hint about length
    p.fill(120, 110, 130);
    p.textSize(12);
    p.text(`${puzzle.currentInput.length} / ${puzzle.solution.length} letters`, 300, 230);
  }

  renderSliderPuzzle(puzzle) {
    const p = this.p;
    
    p.fill(180, 170, 190);
    p.textSize(18);
    p.textAlign(p.CENTER, p.CENTER);
    p.text('Sliding Tile Puzzle', 300, 70);
    
    p.textSize(14);
    p.fill(140, 130, 150);
    p.text('Arrow Keys: Move | Space: Check Solution', 300, 100);

    const size = puzzle.size;
    const tileSize = 60;
    const startX = 300 - (size * tileSize) / 2;
    const startY = 160;

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const index = i * size + j;
        const value = puzzle.currentState[index];
        const x = startX + j * tileSize;
        const y = startY + i * tileSize;

        if (index === puzzle.emptyIndex) {
          p.fill(30, 25, 35);
          p.noStroke();
        } else {
          p.fill(70, 65, 80);
          p.stroke(100, 90, 110);
          p.strokeWeight(2);
        }
        
        p.rect(x, y, tileSize - 4, tileSize - 4, 3);

        if (index !== puzzle.emptyIndex) {
          p.fill(180, 170, 190);
          p.textSize(16);
          p.textAlign(p.CENTER, p.CENTER);
          p.text(value + 1, x + tileSize / 2 - 2, y + tileSize / 2 - 2);
        }
      }
    }
  }

  renderMatchingPuzzle(puzzle) {
    const p = this.p;
    
    p.fill(180, 170, 190);
    p.textSize(18);
    p.textAlign(p.CENTER, p.CENTER);
    p.text('Symbol Matching', 300, 70);
    
    p.textSize(14);
    p.fill(140, 130, 150);
    p.text('Keys 1-4: Select Symbol | Backspace: Undo | Space: Confirm', 300, 100);

    const symbolNames = ['Sun', 'Moon', 'Star', 'Spiral'];
    const symbolsY = 140;
    
    // Available symbols
    p.textSize(12);
    p.fill(160, 150, 170);
    p.text('Available Symbols:', 300, 125);
    
    for (let i = 0; i < 4; i++) {
      const x = 150 + i * 90;
      p.fill(60, 55, 70);
      p.stroke(100, 90, 110);
      p.strokeWeight(2);
      p.rect(x, symbolsY, 60, 60, 5);
      
      this.renderSymbol(puzzle.symbols[i], x + 30, symbolsY + 30, 40);
      
      p.fill(180, 170, 190);
      p.textSize(10);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(`${i + 1}`, x + 30, symbolsY + 70);
    }

    // Input slots
    const slotsY = 240;
    p.textSize(12);
    p.fill(160, 150, 170);
    p.text('Your Answer:', 300, 225);
    
    for (let i = 0; i < 4; i++) {
      const x = 180 + i * 70;
      p.fill(50, 45, 60);
      p.stroke(100, 90, 110);
      p.strokeWeight(2);
      p.rect(x, slotsY, 50, 50, 5);
      
      if (puzzle.currentInput[i] !== -1) {
        this.renderSymbol(puzzle.symbols[puzzle.currentInput[i]], x + 25, slotsY + 25, 35);
      }
    }
  }

  renderSymbol(symbol, x, y, size) {
    const p = this.p;
    p.push();
    p.noStroke();
    
    if (symbol === 'sun') {
      p.fill(255, 220, 100);
      p.ellipse(x, y, size * 0.5, size * 0.5);
      for (let i = 0; i < 8; i++) {
        const angle = i * p.PI / 4;
        const x1 = x + p.cos(angle) * size * 0.3;
        const y1 = y + p.sin(angle) * size * 0.3;
        const x2 = x + p.cos(angle) * size * 0.5;
        const y2 = y + p.sin(angle) * size * 0.5;
        p.stroke(255, 220, 100);
        p.strokeWeight(2);
        p.line(x1, y1, x2, y2);
      }
    } else if (symbol === 'moon') {
      p.fill(220, 220, 240);
      p.ellipse(x, y, size * 0.6, size * 0.6);
      p.fill(30, 25, 35);
      p.ellipse(x + size * 0.15, y, size * 0.5, size * 0.6);
    } else if (symbol === 'star') {
      p.fill(255, 255, 200);
      for (let i = 0; i < 5; i++) {
        const angle = i * p.TWO_PI / 5 - p.PI / 2;
        const x1 = x + p.cos(angle) * size * 0.5;
        const y1 = y + p.sin(angle) * size * 0.5;
        const angle2 = (i + 0.5) * p.TWO_PI / 5 - p.PI / 2;
        const x2 = x + p.cos(angle2) * size * 0.2;
        const y2 = y + p.sin(angle2) * size * 0.2;
        p.triangle(x, y, x1, y1, x2, y2);
      }
    } else if (symbol === 'spiral') {
      p.noFill();
      p.stroke(150, 200, 255);
      p.strokeWeight(2);
      p.beginShape();
      for (let i = 0; i < 50; i++) {
        const angle = i * 0.3;
        const radius = i * size * 0.015;
        p.vertex(x + p.cos(angle) * radius, y + p.sin(angle) * radius);
      }
      p.endShape();
    }
    
    p.pop();
  }

  renderRiddlePuzzle(puzzle) {
    const p = this.p;
    
    p.fill(180, 170, 190);
    p.textSize(18);
    p.textAlign(p.CENTER, p.CENTER);
    p.text('Ancient Riddle', 300, 70);

    // Riddle text
    p.fill(200, 190, 210);
    p.textSize(14);
    const words = puzzle.question.split(' ');
    let line = '';
    let y = 110;
    for (let word of words) {
      if (p.textWidth(line + word) > 400) {
        p.text(line, 300, y);
        line = word + ' ';
        y += 20;
      } else {
        line += word + ' ';
      }
    }
    p.text(line, 300, y);

    // Input
    p.fill(50, 45, 60);
    p.stroke(100, 90, 110);
    p.strokeWeight(2);
    p.rect(150, 220, 300, 60, 5);
    
    p.fill(200, 190, 210);
    p.textSize(28);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(puzzle.currentInput || '_', 300, 250);

    p.fill(140, 130, 150);
    p.textSize(12);
    p.text('Type answer | Space: Confirm', 300, 300);
  }

  renderTimedSequencePuzzle(puzzle) {
    const p = this.p;
    
    p.fill(180, 170, 190);
    p.textSize(18);
    p.textAlign(p.CENTER, p.CENTER);
    p.text('Lever Mechanism', 300, 70);
    
    p.textSize(14);
    p.fill(140, 130, 150);
    p.text('Press 1-4 in correct order | Backspace: Reset', 300, 100);

    // Levers
    const leverSpacing = 100;
    const startX = 150;
    
    for (let i = 0; i < puzzle.leverCount; i++) {
      const x = startX + i * leverSpacing;
      const y = 180;
      
      // Lever base
      p.fill(60, 55, 60);
      p.stroke(100, 90, 100);
      p.strokeWeight(2);
      p.rect(x, y, 60, 100, 5);
      
      // Lever handle
      const pulled = puzzle.currentSequence.includes(i);
      p.fill(pulled ? 100 : 140, pulled ? 180 : 120, pulled ? 100 : 100);
      p.rect(x + 15, y + (pulled ? 40 : 20), 30, 40, 3);
      
      p.fill(180, 170, 190);
      p.textSize(16);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(i + 1, x + 30, y + 110);
    }

    // Sequence display
    p.fill(160, 150, 170);
    p.textSize(14);
    p.text('Sequence:', 150, 310);
    
    p.fill(200, 190, 210);
    p.textSize(18);
    const seqText = puzzle.currentSequence.map(i => i + 1).join(' → ');
    p.text(seqText || '...', 350, 310);
  }
}