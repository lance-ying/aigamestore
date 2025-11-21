// wordle.js - Wordle game logic

import { gameState, LEVELS, COLOR_CORRECT, COLOR_WRONG_POSITION, COLOR_INCORRECT } from './globals.js';

export function initWordle(p, level) {
  const levelData = LEVELS[level - 1];
  const wordIndex = Math.floor(p.random(levelData.wordle.words.length));
  const targetWord = levelData.wordle.words[wordIndex];
  
  gameState.wordle.targetWord = targetWord;
  gameState.wordle.currentRow = 0;
  gameState.wordle.currentCol = 0;
  gameState.wordle.isSubmitting = false;
  gameState.wordle.animationFrame = 0;
  gameState.wordle.timeRemaining = levelData.wordle.timeLimit;
  gameState.wordle.startTime = Date.now();
  
  // Initialize grid
  gameState.wordle.grid = [];
  for (let r = 0; r < 6; r++) {
    gameState.wordle.grid[r] = [];
    for (let c = 0; c < 5; c++) {
      gameState.wordle.grid[r][c] = { letter: "", state: "empty" };
    }
  }
  
  gameState.wordle.guesses = [];
}

export function updateWordle(p) {
  // Update timer
  const elapsed = (Date.now() - gameState.wordle.startTime) / 1000;
  gameState.wordle.timeRemaining = Math.max(0, LEVELS[gameState.currentLevel - 1].wordle.timeLimit - elapsed);
  
  // Handle animation
  if (gameState.wordle.isSubmitting) {
    gameState.wordle.animationFrame++;
    if (gameState.wordle.animationFrame > 30) {
      gameState.wordle.isSubmitting = false;
      gameState.wordle.animationFrame = 0;
    }
  }
}

export function handleWordleInput(p, key, keyCode) {
  if (gameState.wordle.isSubmitting) return;
  
  // Letter input
  if (keyCode >= 65 && keyCode <= 90) {
    if (gameState.wordle.currentCol < 5) {
      gameState.wordle.grid[gameState.wordle.currentRow][gameState.wordle.currentCol].letter = key.toUpperCase();
      gameState.wordle.currentCol++;
    }
  }
  
  // Backspace or Shift
  if (keyCode === 8 || keyCode === 16) {
    if (gameState.wordle.currentCol > 0) {
      gameState.wordle.currentCol--;
      gameState.wordle.grid[gameState.wordle.currentRow][gameState.wordle.currentCol].letter = "";
    }
  }
  
  // Submit (Enter or Space)
  if ((keyCode === 13 || keyCode === 32) && gameState.wordle.currentCol === 5) {
    submitWordleGuess(p);
  }
  
  // Arrow keys for cursor movement
  if (keyCode === 37 && gameState.wordle.currentCol > 0) {
    gameState.wordle.currentCol--;
  }
  if (keyCode === 39 && gameState.wordle.currentCol < 5) {
    gameState.wordle.currentCol++;
  }
}

function submitWordleGuess(p) {
  const guess = gameState.wordle.grid[gameState.wordle.currentRow].map(cell => cell.letter).join("");
  gameState.wordle.guesses.push(guess);
  
  // Check guess against target
  const target = gameState.wordle.targetWord;
  const targetLetters = target.split("");
  const guessLetters = guess.split("");
  
  // First pass: mark correct positions
  const matched = new Array(5).fill(false);
  const targetUsed = new Array(5).fill(false);
  
  for (let i = 0; i < 5; i++) {
    if (guessLetters[i] === targetLetters[i]) {
      gameState.wordle.grid[gameState.wordle.currentRow][i].state = "correct";
      matched[i] = true;
      targetUsed[i] = true;
    }
  }
  
  // Second pass: mark wrong positions
  for (let i = 0; i < 5; i++) {
    if (!matched[i]) {
      let found = false;
      for (let j = 0; j < 5; j++) {
        if (!targetUsed[j] && guessLetters[i] === targetLetters[j]) {
          gameState.wordle.grid[gameState.wordle.currentRow][i].state = "wrong_position";
          targetUsed[j] = true;
          found = true;
          break;
        }
      }
      if (!found) {
        gameState.wordle.grid[gameState.wordle.currentRow][i].state = "incorrect";
      }
    }
  }
  
  gameState.wordle.isSubmitting = true;
  gameState.wordle.currentRow++;
  gameState.wordle.currentCol = 0;
}

export function checkWordleWinLose() {
  const lastGuess = gameState.wordle.guesses[gameState.wordle.guesses.length - 1];
  
  // Win condition
  if (lastGuess === gameState.wordle.targetWord) {
    const attempts = gameState.wordle.guesses.length;
    const pointsMap = [1000, 800, 600, 400, 200, 100];
    const points = pointsMap[attempts - 1] || 0;
    const timeBonus = Math.floor(gameState.wordle.timeRemaining * 5);
    gameState.score += points + timeBonus;
    return "win";
  }
  
  // Lose condition
  if (gameState.wordle.currentRow >= 6) {
    return "lose";
  }
  
  return null;
}

export function drawWordle(p) {
  const cellSize = 50;
  const gap = 5;
  const startX = 150;
  const startY = 50;
  
  // Draw grid
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 5; c++) {
      const x = startX + c * (cellSize + gap);
      const y = startY + r * (cellSize + gap);
      const cell = gameState.wordle.grid[r][c];
      
      // Cell background
      if (cell.state === "correct") {
        p.fill(...COLOR_CORRECT);
      } else if (cell.state === "wrong_position") {
        p.fill(...COLOR_WRONG_POSITION);
      } else if (cell.state === "incorrect") {
        p.fill(...COLOR_INCORRECT);
      } else {
        p.fill(255);
      }
      
      p.stroke(211, 214, 218);
      p.strokeWeight(2);
      
      // Highlight current cell
      if (r === gameState.wordle.currentRow && c === gameState.wordle.currentCol && !gameState.wordle.isSubmitting) {
        p.strokeWeight(3);
        p.stroke(100, 150, 255);
      }
      
      p.rect(x, y, cellSize, cellSize);
      
      // Draw letter
      if (cell.letter) {
        p.fill(cell.state === "empty" ? 0 : 255);
        p.noStroke();
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(32);
        p.text(cell.letter, x + cellSize / 2, y + cellSize / 2);
      }
    }
  }
  
  // Draw timer
  const minutes = Math.floor(gameState.wordle.timeRemaining / 60);
  const seconds = Math.floor(gameState.wordle.timeRemaining % 60);
  p.fill(255);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text(`TIME: ${minutes}:${seconds.toString().padStart(2, '0')}`, 10, 10);
  
  // Draw score
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`SCORE: ${gameState.score}`, 590, 10);
  
  // Draw level
  p.textAlign(p.LEFT, p.BOTTOM);
  p.text(`LEVEL: ${gameState.currentLevel}`, 10, 390);
  
  // Draw instructions
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(12);
  p.text("Type letters, ENTER/SPACE to submit, BACKSPACE to delete", 300, 370);
}