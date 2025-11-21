// ui.js - UI rendering functions

import { gameState, CATEGORIES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderHUD(p) {
  // Score (top-right)
  p.fill(255);
  p.textAlign(p.RIGHT);
  p.textSize(16);
  p.text(`SCORE: ${gameState.currentScore}`, CANVAS_WIDTH - 20, 30);
  
  // Level (top-left)
  p.textAlign(p.LEFT);
  p.textSize(16);
  p.text(`LEVEL: ${gameState.currentLevel}`, 20, 30);
  
  if (gameState.levelConfig) {
    p.textSize(12);
    p.text(gameState.levelConfig.name, 20, 50);
  }
  
  // Lives
  p.textAlign(p.LEFT);
  p.textSize(14);
  let heartsText = "LIVES: ";
  for (let i = 0; i < gameState.livesRemaining; i++) {
    heartsText += "❤️";
  }
  p.text(heartsText, 20, 70);
  
  // Category crowns
  p.textSize(12);
  p.textAlign(p.LEFT);
  let crownY = 90;
  for (let i = 0; i < CATEGORIES.length; i++) {
    const cat = CATEGORIES[i];
    const hasCrown = gameState.earnedCrowns[cat.name];
    const correctCount = gameState.categoryCorrectCounts[cat.name];
    
    p.fill(...cat.color);
    p.text(`${cat.icon} ${cat.name}: ${correctCount}/3 ${hasCrown ? "👑" : ""}`, 20, crownY);
    crownY += 20;
  }
  
  // Crowns needed for level
  if (gameState.levelConfig) {
    const crownsEarned = Object.values(gameState.earnedCrowns).filter(c => c).length;
    p.fill(255, 215, 0);
    p.textSize(14);
    p.textAlign(p.RIGHT);
    p.text(`Crowns: ${crownsEarned}/${gameState.levelConfig.crownsRequired}`, CANVAS_WIDTH - 20, 60);
  }
}

export function renderPausedIndicator(p) {
  p.fill(255);
  p.textAlign(p.RIGHT);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 20, 30);
}

export function renderStartScreen(p) {
  p.background(30, 20, 50);
  
  // Title
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER);
  p.textSize(36);
  p.text("TRIVIA CRACK", CANVAS_WIDTH / 2, 60);
  
  p.fill(255, 140, 0);
  p.textSize(16);
  p.text("Brain Quiz Games", CANVAS_WIDTH / 2, 90);
  
  // Description
  p.fill(255);
  p.textSize(13);
  p.textAlign(p.CENTER);
  const desc = [
    "Test your knowledge across 6 categories!",
    "Spin the wheel, answer questions, earn crowns.",
    "Complete 5 levels of increasing difficulty."
  ];
  
  let y = 130;
  for (const line of desc) {
    p.text(line, CANVAS_WIDTH / 2, y);
    y += 20;
  }
  
  // Instructions
  p.fill(100, 200, 255);
  p.textSize(14);
  p.textAlign(p.LEFT);
  p.text("HOW TO PLAY:", 80, 200);
  
  p.fill(255);
  p.textSize(11);
  const instructions = [
    "• SPACE - Spin wheel / Select answer",
    "• Arrow Keys - Choose answer option",
    "• Z - Skip question (power-up)",
    "• SHIFT - Remove 2 wrong answers (power-up)",
    "• ESC - Pause game",
    "• R - Restart to main menu"
  ];
  
  y = 220;
  for (const inst of instructions) {
    p.text(inst, 80, y);
    y += 18;
  }
  
  // Objective
  p.fill(255, 215, 0);
  p.textSize(13);
  p.textAlign(p.CENTER);
  p.text("Earn crowns by answering 3 questions correctly per category", CANVAS_WIDTH / 2, 340);
  
  // Start prompt
  p.fill(50, 255, 50);
  p.textSize(18);
  const blink = Math.floor(p.frameCount / 30) % 2 === 0;
  if (blink) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 380);
  }
}

export function renderLevelComplete(p) {
  p.background(30, 20, 50);
  
  const crownsEarned = Object.values(gameState.earnedCrowns).filter(c => c).length;
  
  // Title
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER);
  p.textSize(42);
  p.text("LEVEL COMPLETE!", CANVAS_WIDTH / 2, 80);
  
  // Level name
  p.fill(255);
  p.textSize(20);
  p.text(gameState.levelConfig.name, CANVAS_WIDTH / 2, 120);
  
  // Score
  p.fill(100, 200, 255);
  p.textSize(24);
  p.text(`Score: ${gameState.currentScore}`, CANVAS_WIDTH / 2, 160);
  
  // Crowns earned
  p.fill(255, 215, 0);
  p.textSize(18);
  p.text(`Crowns Earned: ${crownsEarned}`, CANVAS_WIDTH / 2, 200);
  
  // Show which crowns
  let y = 230;
  p.textSize(14);
  for (const cat of CATEGORIES) {
    if (gameState.earnedCrowns[cat.name]) {
      p.fill(...cat.color);
      p.text(`${cat.icon} ${cat.name} 👑`, CANVAS_WIDTH / 2, y);
      y += 25;
    }
  }
  
  // Continue prompt
  p.fill(50, 255, 50);
  p.textSize(18);
  const blink = Math.floor(p.frameCount / 30) % 2 === 0;
  if (blink) {
    const nextLevel = gameState.currentLevel + 1;
    if (nextLevel <= 5) {
      p.text("PRESS SPACE TO CONTINUE", CANVAS_WIDTH / 2, 370);
    } else {
      p.text("PRESS SPACE FOR FINAL RESULTS", CANVAS_WIDTH / 2, 370);
    }
  }
}

export function renderGameOver(p, isWin) {
  p.background(30, 20, 50);
  
  // Title
  if (isWin) {
    p.fill(50, 255, 50);
    p.textAlign(p.CENTER);
    p.textSize(48);
    p.text("YOU WIN!", CANVAS_WIDTH / 2, 100);
    
    p.fill(255, 215, 0);
    p.textSize(24);
    p.text("Trivia Titan Achieved!", CANVAS_WIDTH / 2, 140);
  } else {
    p.fill(220, 20, 60);
    p.textAlign(p.CENTER);
    p.textSize(48);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 100);
  }
  
  // Final score
  p.fill(255);
  p.textSize(28);
  p.text(`Final Score: ${gameState.currentScore}`, CANVAS_WIDTH / 2, 190);
  
  // High score
  p.textSize(18);
  p.fill(255, 215, 0);
  p.text(`High Score: ${gameState.highScore}`, CANVAS_WIDTH / 2, 230);
  
  // Level reached
  p.fill(200);
  p.textSize(16);
  p.text(`Level Reached: ${gameState.currentLevel}`, CANVAS_WIDTH / 2, 260);
  
  // Restart prompt
  p.fill(100, 200, 255);
  p.textSize(20);
  const blink = Math.floor(p.frameCount / 30) % 2 === 0;
  if (blink) {
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 320);
  }
}