// puzzle_ui.js - Puzzle interface rendering and interaction

import { gameState } from './globals.js';

export function renderPuzzleUI(p, puzzle) {
  // Dark overlay
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, 600, 400);
  
  // Puzzle window
  p.fill(240, 230, 210);
  p.stroke(100, 70, 40);
  p.strokeWeight(4);
  p.rect(50, 50, 500, 300, 10);
  
  // Title bar
  p.fill(120, 90, 60);
  p.noStroke();
  p.rect(50, 50, 500, 40, 10, 10, 0, 0);
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  p.text(`Puzzle #${puzzle.id + 1} - ${puzzle.type.toUpperCase()}`, 300, 70);
  
  // Difficulty stars
  p.textSize(16);
  let stars = "";
  for (let i = 0; i < puzzle.difficulty; i++) stars += "★";
  p.text(stars, 300, 95);
  
  // Question
  p.fill(40, 30, 20);
  p.textSize(14);
  p.textAlign(p.CENTER, p.TOP);
  const lines = puzzle.question.split('\n');
  lines.forEach((line, idx) => {
    p.text(line, 300, 130 + idx * 20);
  });
  
  // Input field
  p.fill(255);
  p.stroke(100, 70, 40);
  p.strokeWeight(2);
  p.rect(150, 260, 300, 30, 5);
  
  // User input
  p.fill(0);
  p.noStroke();
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(16);
  p.text(gameState.puzzleInput + "_", 160, 275);
  
  // Instructions
  p.fill(100, 70, 40);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(12);
  p.text("Type answer and press SPACE to submit", 300, 310);
  p.text(`Press Z to use hint (${gameState.collectedCoins} coins available)`, 300, 330);
  
  // Show hint if active
  if (gameState.showingHint && gameState.currentHintLevel > 0) {
    renderHint(p, puzzle);
  }
}

function renderHint(p, puzzle) {
  p.fill(255, 255, 200);
  p.stroke(200, 180, 100);
  p.strokeWeight(2);
  p.rect(75, 150, 450, 80, 5);
  
  p.fill(100, 80, 40);
  p.noStroke();
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(13);
  p.text(`Hint ${gameState.currentHintLevel}:`, 300, 160);
  
  const hintLines = puzzle.hints[gameState.currentHintLevel - 1].split('\n');
  hintLines.forEach((line, idx) => {
    p.text(line, 300, 180 + idx * 16);
  });
}

export function handlePuzzleInput(p, key, keyCode) {
  if (keyCode === 32) { // SPACE - submit answer
    if (gameState.currentPuzzle.checkAnswer(gameState.puzzleInput)) {
      // Correct answer
      gameState.currentPuzzle.solved = true;
      const hotspot = gameState.puzzleHotspots.find(h => h.puzzleId === gameState.currentPuzzle.id);
      if (hotspot) hotspot.solved = true;
      
      gameState.puzzlesSolved++;
      gameState.score += gameState.currentPuzzle.difficulty * 100;
      
      gameState.inPuzzleMode = false;
      gameState.currentPuzzle = null;
      gameState.puzzleInput = "";
      gameState.showingHint = false;
      gameState.currentHintLevel = 0;
      
      // Check if all mandatory puzzles in area are solved
      checkAreaCompletion();
    } else {
      // Wrong answer - just clear input
      gameState.puzzleInput = "";
      gameState.puzzleAttempts++;
    }
  } else if (keyCode === 90) { // Z - use hint
    if (gameState.collectedCoins > 0 && gameState.currentHintLevel < 3) {
      gameState.collectedCoins--;
      gameState.currentHintLevel++;
      gameState.showingHint = true;
    }
  } else if (keyCode === 8) { // BACKSPACE
    gameState.puzzleInput = gameState.puzzleInput.slice(0, -1);
  } else if (key && key.length === 1) {
    // Add character to input
    if (gameState.puzzleInput.length < 20) {
      gameState.puzzleInput += key;
    }
  }
}

function checkAreaCompletion() {
  const currentArea = gameState.areas[gameState.currentArea];
  const mandatoryPuzzlesInArea = currentArea.puzzleHotspots.filter(h => h.mandatory);
  const allMandatorySolved = mandatoryPuzzlesInArea.every(h => {
    const puzzle = gameState.puzzles.find(p => p.id === h.puzzleId);
    return puzzle && puzzle.solved;
  });
  
  if (allMandatorySolved) {
    // Progress to next area
    if (gameState.currentArea < gameState.totalAreas - 1) {
      gameState.currentArea++;
      gameState.storyProgress++;
      const areaModule = require('./areas.js');
      areaModule.initializeArea(gameState.p5Instance, gameState, gameState.currentArea);
    } else {
      // All areas complete - check win condition
      const allMandatoryPuzzles = gameState.puzzles.filter(p => p.mandatory);
      if (allMandatoryPuzzles.every(p => p.solved)) {
        gameState.gamePhase = "GAME_OVER_WIN";
      }
    }
  }
}