// puzzles.js - Puzzle system

import { gameState, PUZZLES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class PuzzleManager {
  constructor(p) {
    this.p = p;
  }
  
  startPuzzle(puzzleId) {
    const puzzle = PUZZLES[puzzleId];
    if (!puzzle) return false;
    
    gameState.inPuzzle = true;
    gameState.currentPuzzle = puzzleId;
    gameState.puzzleInput = "";
    gameState.hintsUsed = 0;
    
    return true;
  }
  
  submitAnswer() {
    const puzzle = PUZZLES[gameState.currentPuzzle];
    if (!puzzle) return false;
    
    const isCorrect = gameState.puzzleInput.trim().toLowerCase() === puzzle.answer.toLowerCase();
    
    if (isCorrect) {
      gameState.solvedPuzzles.add(gameState.currentPuzzle);
      gameState.score += 100;
      
      // Award rewards
      if (puzzle.reward) {
        if (puzzle.reward.type === "trinket") {
          gameState.trinkets.push(puzzle.reward.id);
        } else if (puzzle.reward.type === "furniture") {
          gameState.furniture.push(puzzle.reward.id);
        } else if (puzzle.reward.type === "story") {
          gameState.storyFlags.add(puzzle.reward.flag);
        }
      }
      
      // Check for story progression
      if (gameState.solvedPuzzles.size >= 2) {
        gameState.storyFlags.add("solved_2_puzzles");
      }
      
      this.exitPuzzle();
      return true;
    }
    
    return false;
  }
  
  exitPuzzle() {
    gameState.inPuzzle = false;
    gameState.currentPuzzle = null;
    gameState.puzzleInput = "";
    gameState.hintsUsed = 0;
  }
  
  useHint() {
    if (gameState.hintCoins <= 0) return null;
    
    const puzzle = PUZZLES[gameState.currentPuzzle];
    if (!puzzle) return null;
    
    if (gameState.hintsUsed >= puzzle.hints.length) return null;
    
    gameState.hintCoins--;
    const hint = puzzle.hints[gameState.hintsUsed];
    gameState.hintsUsed++;
    
    return hint;
  }
  
  render() {
    const p = this.p;
    const puzzle = PUZZLES[gameState.currentPuzzle];
    
    if (!puzzle) return;
    
    // Puzzle background
    p.fill(240, 235, 220);
    p.stroke(100, 80, 60);
    p.strokeWeight(3);
    p.rect(50, 50, CANVAS_WIDTH - 100, CANVAS_HEIGHT - 100, 10);
    
    // Title
    p.fill(80, 50, 30);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(20);
    p.text(puzzle.name, CANVAS_WIDTH / 2, 80);
    
    // Question
    p.textSize(14);
    p.textAlign(p.CENTER, p.TOP);
    const lines = this.wrapText(puzzle.question, CANVAS_WIDTH - 140);
    let yPos = 120;
    lines.forEach(line => {
      p.text(line, CANVAS_WIDTH / 2, yPos);
      yPos += 20;
    });
    
    // Input box
    p.fill(255);
    p.stroke(100, 80, 60);
    p.strokeWeight(2);
    p.rect(150, 240, 300, 40, 5);
    
    // Input text
    p.fill(0);
    p.noStroke();
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(18);
    p.text(gameState.puzzleInput + "_", 160, 260);
    
    // Hint display
    if (gameState.hintsUsed > 0) {
      const hintY = 290;
      p.fill(255, 240, 200);
      p.stroke(200, 180, 140);
      p.strokeWeight(2);
      p.rect(70, hintY, CANVAS_WIDTH - 140, 60, 5);
      
      p.fill(100, 80, 50);
      p.noStroke();
      p.textAlign(p.LEFT, p.TOP);
      p.textSize(11);
      const hintText = "Hint " + gameState.hintsUsed + ": " + puzzle.hints[gameState.hintsUsed - 1];
      const hintLines = this.wrapText(hintText, CANVAS_WIDTH - 160);
      let hintYPos = hintY + 10;
      hintLines.forEach(line => {
        p.text(line, 80, hintYPos);
        hintYPos += 15;
      });
    }
    
    // Controls
    p.fill(100, 80, 60);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(11);
    p.text("Type answer | SPACE: Submit | Z: Use Hint Coin (" + gameState.hintCoins + " left)", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
  }
  
  wrapText(text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = "";
    
    words.forEach(word => {
      const testLine = currentLine + (currentLine ? " " : "") + word;
      const testWidth = this.p.textWidth(testLine);
      
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }
  
  handleTyping(key) {
    if (key.length === 1) {
      if (gameState.puzzleInput.length < 20) {
        gameState.puzzleInput += key;
      }
    } else if (key === "Backspace") {
      gameState.puzzleInput = gameState.puzzleInput.slice(0, -1);
    }
  }
}