// mathPuzzle.js - Math puzzle system
import { gameState } from './globals.js';

export class MathPuzzle {
  constructor(difficulty, type) {
    this.difficulty = difficulty;
    this.type = type; // 'addition', 'subtraction', 'multiplication', 'ordering'
    this.question = '';
    this.correctAnswer = 0;
    this.options = [];
    this.selectedOption = 0;
    this.answered = false;
    this.correct = false;
    
    this.generatePuzzle();
  }

  generatePuzzle() {
    const difficultyRanges = {
      1: { min: 1, max: 10 },
      2: { min: 5, max: 20 },
      3: { min: 10, max: 50 },
      4: { min: 1, max: 100 }
    };
    
    const range = difficultyRanges[Math.min(this.difficulty, 4)];
    
    if (this.type === 'addition') {
      const a = Math.floor(Math.random() * range.max) + range.min;
      const b = Math.floor(Math.random() * range.max) + range.min;
      this.question = `${a} + ${b} = ?`;
      this.correctAnswer = a + b;
    } else if (this.type === 'subtraction') {
      const a = Math.floor(Math.random() * range.max) + range.min;
      const b = Math.floor(Math.random() * Math.min(a, range.max));
      this.question = `${a} - ${b} = ?`;
      this.correctAnswer = a - b;
    } else if (this.type === 'multiplication') {
      const a = Math.floor(Math.random() * 10) + 1;
      const b = Math.floor(Math.random() * (this.difficulty + 5)) + 1;
      this.question = `${a} × ${b} = ?`;
      this.correctAnswer = a * b;
    } else if (this.type === 'ordering') {
      const numbers = [];
      for (let i = 0; i < 4; i++) {
        numbers.push(Math.floor(Math.random() * range.max) + range.min);
      }
      this.question = `Order: ${numbers.join(', ')}`;
      this.correctAnswer = numbers.sort((a, b) => a - b).join(',');
    }
    
    // Generate options
    this.options = this.generateOptions();
  }

  generateOptions() {
    const options = [this.correctAnswer];
    
    if (this.type === 'ordering') {
      // For ordering, create different permutations
      const nums = String(this.correctAnswer).split(',').map(Number);
      while (options.length < 4) {
        const shuffled = [...nums].sort(() => Math.random() - 0.5);
        const option = shuffled.join(',');
        if (!options.includes(option)) {
          options.push(option);
        }
      }
    } else {
      // For arithmetic, create nearby numbers
      while (options.length < 4) {
        const offset = Math.floor(Math.random() * 20) - 10;
        const option = this.correctAnswer + offset;
        if (option !== this.correctAnswer && !options.includes(option) && option >= 0) {
          options.push(option);
        }
      }
    }
    
    // Shuffle options
    return options.sort(() => Math.random() - 0.5);
  }

  selectOption(index) {
    if (!this.answered && index >= 0 && index < this.options.length) {
      this.selectedOption = index;
    }
  }

  submitAnswer() {
    if (!this.answered) {
      this.answered = true;
      const selectedValue = this.options[this.selectedOption];
      this.correct = String(selectedValue) === String(this.correctAnswer);
      return this.correct;
    }
    return false;
  }

  draw(p) {
    p.push();
    
    // Overlay
    p.fill(0, 0, 0, 180);
    p.rect(0, 0, 600, 400);
    
    // Puzzle box
    p.fill(240, 230, 200);
    p.rect(100, 80, 400, 240);
    
    // Title
    p.fill(80, 60, 40);
    p.textAlign(p.CENTER);
    p.textSize(20);
    p.text('Math Challenge!', 300, 110);
    
    // Question
    p.textSize(24);
    p.text(this.question, 300, 160);
    
    // Options
    p.textSize(16);
    for (let i = 0; i < this.options.length; i++) {
      const x = 150 + (i % 2) * 200;
      const y = 200 + Math.floor(i / 2) * 50;
      
      if (this.answered) {
        if (String(this.options[i]) === String(this.correctAnswer)) {
          p.fill(100, 200, 100);
        } else if (i === this.selectedOption) {
          p.fill(200, 100, 100);
        } else {
          p.fill(200, 200, 200);
        }
      } else {
        p.fill(i === this.selectedOption ? 150, 200, 255 : 200, 200, 200);
      }
      
      p.rect(x - 40, y - 20, 80, 35);
      p.fill(0, 0, 0);
      p.text(this.options[i], x, y);
    }
    
    // Instructions
    p.fill(80, 60, 40);
    p.textSize(12);
    if (!this.answered) {
      p.text('Arrow Keys: Select | Space: Submit', 300, 290);
    } else {
      if (this.correct) {
        p.fill(0, 150, 0);
        p.textSize(16);
        p.text('Correct! Press Z to continue', 300, 290);
      } else {
        p.fill(200, 0, 0);
        p.textSize(16);
        p.text('Try again! Press Z to retry', 300, 290);
      }
    }
    
    p.pop();
  }
}

export function createMathPuzzle(level) {
  const types = ['addition', 'subtraction', 'multiplication', 'ordering'];
  const difficulty = Math.floor(level / 2) + 1;
  const type = types[level % types.length];
  
  return new MathPuzzle(difficulty, type);
}