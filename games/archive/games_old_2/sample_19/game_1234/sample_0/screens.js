// screens.js - Screen rendering functions

import { gameState, PHASE_START, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, SUBSTATE_LEVEL_TRANSITION } from './globals.js';

export function drawStartScreen(p) {
  p.background(30, 30, 50);
  
  // Title
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(42);
  p.text("WORD PUZZLES", 300, 80);
  
  // Subtitle
  p.fill(200, 200, 220);
  p.textSize(18);
  p.text("Wordle & Crossword Challenge", 300, 120);
  
  // Description
  p.fill(180, 180, 200);
  p.textSize(14);
  p.textAlign(p.CENTER, p.TOP);
  const desc = [
    "Complete 3 levels of word puzzles!",
    "",
    "Each level has a Wordle puzzle and a Mini Crossword.",
    "Deduce the 5-letter word in 6 attempts.",
    "Solve the crossword before time runs out.",
    "",
    "Win both puzzles to advance. One failure ends the game!"
  ];
  let y = 160;
  for (const line of desc) {
    p.text(line, 300, y);
    y += 18;
  }
  
  // Controls
  p.fill(150, 220, 255);
  p.textSize(13);
  y += 10;
  const controls = [
    "WORDLE: Type letters, ENTER/SPACE to submit, BACKSPACE to delete",
    "CROSSWORD: Arrow keys to move, Type letters, SPACE to toggle direction",
    "ESC: Pause | R: Restart"
  ];
  for (const line of controls) {
    p.text(line, 300, y);
    y += 16;
  }
  
  // Start prompt
  p.fill(100, 255, 100);
  p.textSize(24);
  p.text("PRESS ENTER TO START", 300, 360);
}

export function drawPausedOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, 600, 400);
  
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(20);
  p.text("PAUSED", 590, 10);
  
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(16);
  p.text("Press ESC to resume", 300, 200);
  p.text("Press R to restart", 300, 230);
}

export function drawGameOverScreen(p, isWin) {
  p.background(isWin ? [40, 80, 40] : [80, 40, 40]);
  
  // Title
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "YOU WIN!" : "GAME OVER", 300, 120);
  
  // Score
  p.textSize(32);
  p.fill(255, 220, 100);
  p.text(`Final Score: ${gameState.score}`, 300, 200);
  
  // Levels completed
  p.textSize(20);
  p.fill(200, 200, 220);
  if (isWin) {
    p.text("All levels completed!", 300, 250);
  } else {
    p.text(`Reached Level ${gameState.currentLevel}`, 300, 250);
  }
  
  // Restart prompt
  p.fill(150, 255, 150);
  p.textSize(24);
  p.text("PRESS R TO RESTART", 300, 340);
}

export function drawLevelTransition(p) {
  p.background(50, 50, 80);
  
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  
  const elapsed = (Date.now() - gameState.levelTransition.startTime) / 1000;
  
  if (elapsed < 2) {
    p.text(gameState.levelTransition.message, 300, 180);
  } else {
    p.text(`Next: ${gameState.levelTransition.nextMessage}`, 300, 180);
  }
  
  // Score display
  p.fill(200, 200, 220);
  p.textSize(24);
  p.text(`Score: ${gameState.score}`, 300, 240);
}