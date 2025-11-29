// puzzle.js - Puzzle mode logic
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class PuzzleItem {
  constructor(id, name, x, y, type) {
    this.id = id;
    this.name = name;
    this.x = x;
    this.y = y;
    this.width = 80;
    this.height = 60;
    this.type = type; // 'file', 'key', 'code'
    this.selected = false;
    this.color = this.getColorByType();
    this.hovered = false;
  }
  
  getColorByType() {
    switch(this.type) {
      case 'file': return [100, 200, 100];
      case 'key': return [255, 200, 50];
      case 'code': return [255, 100, 100];
      default: return [150, 150, 150];
    }
  }
  
  contains(mx, my) {
    return mx > this.x && mx < this.x + this.width &&
           my > this.y && my < this.y + this.height;
  }
  
  render(p) {
    p.push();
    
    // Draw item box
    if (this.selected) {
      p.fill(255, 255, 0, 100);
      p.stroke(255, 255, 0);
    } else if (this.hovered) {
      p.fill(...this.color, 150);
      p.stroke(255, 255, 255);
    } else {
      p.fill(...this.color, 100);
      p.stroke(200);
    }
    p.strokeWeight(2);
    p.rect(this.x, this.y, this.width, this.height, 5);
    
    // Draw icon
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.text(this.name, this.x + this.width / 2, this.y + this.height / 2);
    
    p.pop();
  }
}

export class DecryptionNode {
  constructor(x, y, value, correct) {
    this.x = x;
    this.y = y;
    this.size = 50;
    this.value = value;
    this.correct = correct;
    this.revealed = false;
    this.selected = false;
  }
  
  contains(mx, my) {
    const dx = mx - this.x;
    const dy = my - this.y;
    return (dx * dx + dy * dy) < (this.size / 2) * (this.size / 2);
  }
  
  render(p) {
    p.push();
    
    if (this.revealed) {
      p.fill(this.correct ? [0, 255, 0] : [255, 0, 0]);
    } else if (this.selected) {
      p.fill(255, 255, 0);
    } else {
      p.fill(50, 50, 100);
    }
    p.stroke(0, 255, 255);
    p.strokeWeight(2);
    p.ellipse(this.x, this.y, this.size);
    
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.text(this.revealed ? this.value : '?', this.x, this.y);
    
    p.pop();
  }
}

export function initializePuzzle(chapter) {
  gameState.puzzleItems = [];
  gameState.selectedItems = [];
  gameState.puzzleSolved = false;
  gameState.decryptionProgress = 0;
  
  // Chapter-specific puzzles
  if (chapter === 0) {
    // First chapter: Simple item combination
    gameState.puzzleItems.push(
      new PuzzleItem(0, 'ACCESS_LOG', 100, 150, 'file'),
      new PuzzleItem(1, 'DECRYPT_KEY', 220, 150, 'key'),
      new PuzzleItem(2, 'FIREWALL', 340, 150, 'code'),
      new PuzzleItem(3, 'PASSWORD', 460, 150, 'file')
    );
  } else if (chapter === 1) {
    // Second chapter: More complex
    gameState.puzzleItems.push(
      new PuzzleItem(0, 'SERVER_LOG', 80, 120, 'file'),
      new PuzzleItem(1, 'CIPHER_A', 200, 120, 'key'),
      new PuzzleItem(2, 'CIPHER_B', 320, 120, 'key'),
      new PuzzleItem(3, 'DATABASE', 440, 120, 'code'),
      new PuzzleItem(4, 'TRACE_DATA', 200, 220, 'file')
    );
  } else {
    // Final chapter
    gameState.puzzleItems.push(
      new PuzzleItem(0, 'EVIDENCE_1', 70, 100, 'file'),
      new PuzzleItem(1, 'EVIDENCE_2', 180, 100, 'file'),
      new PuzzleItem(2, 'MASTER_KEY', 290, 100, 'key'),
      new PuzzleItem(3, 'ALGORITHM', 400, 100, 'code'),
      new PuzzleItem(4, 'WITNESS', 510, 100, 'file'),
      new PuzzleItem(5, 'FINAL_CODE', 240, 200, 'code')
    );
  }
}

export function checkPuzzleSolution(chapter) {
  const selected = gameState.selectedItems;
  
  if (chapter === 0) {
    // Need ACCESS_LOG + DECRYPT_KEY
    return selected.includes(0) && selected.includes(1);
  } else if (chapter === 1) {
    // Need SERVER_LOG + both CIPHERS
    return selected.includes(0) && selected.includes(1) && selected.includes(2);
  } else {
    // Need EVIDENCE_1 + EVIDENCE_2 + MASTER_KEY + FINAL_CODE
    return selected.includes(0) && selected.includes(1) && 
           selected.includes(2) && selected.includes(5);
  }
}

export function updatePuzzleMode(p) {
  // Puzzle solving is handled via keyboard selection
  // Items can be navigated and selected with arrow keys and space
}

export function renderPuzzleMode(p) {
  p.push();
  
  // Background
  p.fill(10, 20, 40);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Grid pattern
  p.stroke(30, 50, 80, 100);
  p.strokeWeight(1);
  for (let i = 0; i < CANVAS_WIDTH; i += 20) {
    p.line(i, 0, i, CANVAS_HEIGHT);
  }
  for (let j = 0; j < CANVAS_HEIGHT; j += 20) {
    p.line(0, j, CANVAS_WIDTH, j);
  }
  
  // Title
  p.fill(0, 255, 255);
  p.noStroke();
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(18);
  p.text('DECRYPT THE DATA', CANVAS_WIDTH / 2, 20);
  
  // Instructions
  p.textSize(11);
  p.fill(200);
  p.text('Use ARROW KEYS to navigate, SPACE to select items', CANVAS_WIDTH / 2, 50);
  
  // Chapter info
  p.textSize(12);
  p.fill(100, 200, 255);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`CHAPTER ${gameState.currentChapter + 1}/${gameState.totalChapters}`, 20, 20);
  
  // Render puzzle items
  for (let item of gameState.puzzleItems) {
    item.render(p);
  }
  
  // Show selected items
  if (gameState.selectedItems.length > 0) {
    p.fill(255, 255, 0);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.textSize(11);
    p.text(`Selected: ${gameState.selectedItems.length} items`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 80);
  }
  
  // Decryption progress
  if (gameState.decryptionProgress > 0) {
    p.fill(0, 255, 0);
    p.noStroke();
    p.rect(100, CANVAS_HEIGHT - 60, (CANVAS_WIDTH - 200) * (gameState.decryptionProgress / 100), 20);
    p.stroke(0, 255, 0);
    p.noFill();
    p.strokeWeight(2);
    p.rect(100, CANVAS_HEIGHT - 60, CANVAS_WIDTH - 200, 20);
    
    p.fill(0, 255, 0);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text(`DECRYPTING... ${Math.floor(gameState.decryptionProgress)}%`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
  }
  
  // Completion message
  if (gameState.puzzleSolved) {
    p.fill(0, 255, 0);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.textSize(14);
    p.text('PUZZLE SOLVED! Transitioning to parkour...', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20);
  }
  
  p.pop();
}