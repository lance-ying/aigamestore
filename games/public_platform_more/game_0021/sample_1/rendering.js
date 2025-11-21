// rendering.js - All rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, DIFFICULTY_LEVELS } from './globals.js';
import { getCurrentDifficultyLevel } from './utils.js';

export function drawStartScreen(p) {
  p.background(20, 20, 40);
  
  // Title
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text("PRIMEE!", CANVAS_WIDTH / 2, 60);
  
  // Subtitle with animation
  const pulse = Math.sin(p.frameCount * 0.05) * 10 + 245;
  p.fill(pulse, 180, 220);
  p.textSize(16);
  p.textStyle(p.NORMAL);
  p.text("Prime Number Puzzle Action", CANVAS_WIDTH / 2, 95);
  
  // Instructions box
  p.fill(40, 40, 60, 200);
  p.noStroke();
  p.rect(50, 120, CANVAS_WIDTH - 100, 200, 10);
  
  // Instructions
  p.fill(255, 255, 255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.textStyle(p.BOLD);
  p.text("HOW TO PLAY:", 70, 135);
  
  p.textStyle(p.NORMAL);
  p.textSize(12);
  const instructions = [
    "• Move left/right with ARROW KEYS to catch numbers",
    "• SPACE to tap PRIME numbers (2, 3, 5, 7, 11, ...)",
    "• Z KEY to SLICE composite numbers into prime factors",
    "• Tap the resulting prime factors for points!",
    "• Tapping composite directly = -5 points penalty",
    "• Reach 300 points to WIN before time runs out!",
    "",
    "5 difficulty levels unlock as you score higher.",
    "Numbers fall faster and get larger!"
  ];
  
  let yPos = 160;
  instructions.forEach(line => {
    p.text(line, 70, yPos);
    yPos += 18;
  });
  
  // Start prompt
  const promptPulse = Math.sin(p.frameCount * 0.1) * 20 + 235;
  p.fill(promptPulse, 255, promptPulse);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  p.textStyle(p.BOLD);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 355);
}

export function drawPlayingScreen(p) {
  // Background with gradient effect
  for (let i = 0; i < CANVAS_HEIGHT; i += 2) {
    const col = p.map(i, 0, CANVAS_HEIGHT, 30, 15);
    p.stroke(col, col, col + 20);
    p.line(0, i, CANVAS_WIDTH, i);
  }
  
  // Draw slicing line if active
  if (gameState.slicingLine) {
    const line = gameState.slicingLine;
    p.stroke(255, 200, 50, 200);
    p.strokeWeight(4);
    p.line(line.x1, line.y1, line.x2, line.y2);
    
    // Glow effect
    p.stroke(255, 220, 100, 100);
    p.strokeWeight(8);
    p.line(line.x1, line.y1, line.x2, line.y2);
  }
  
  // Draw all entities
  gameState.entities.forEach(entity => {
    if (entity.draw) {
      entity.draw(p);
    }
  });
  
  // Draw player
  if (gameState.player) {
    gameState.player.draw(p);
  }
  
  // UI Elements
  drawUI(p);
  
  // Paused indicator
  if (gameState.gamePhase === PHASE_PAUSED) {
    p.fill(255, 255, 255);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(14);
    p.textStyle(p.BOLD);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }
}

export function drawUI(p) {
  // Score display
  p.fill(40, 40, 60, 200);
  p.noStroke();
  p.rect(10, 10, 180, 70, 5);
  
  p.fill(255, 220, 100);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.textStyle(p.BOLD);
  p.text("SCORE", 20, 18);
  
  p.fill(255, 255, 255);
  p.textSize(24);
  p.text(gameState.score, 20, 38);
  
  // Time remaining
  p.fill(40, 40, 60, 200);
  p.rect(CANVAS_WIDTH - 190, 10, 180, 70, 5);
  
  const timeColor = gameState.timeRemaining < 15 ? [255, 100, 100] : [100, 220, 255];
  p.fill(...timeColor);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.textStyle(p.BOLD);
  p.text("TIME", CANVAS_WIDTH - 20, 18);
  
  p.fill(255, 255, 255);
  p.textSize(24);
  p.text(Math.ceil(gameState.timeRemaining) + "s", CANVAS_WIDTH - 20, 38);
  
  // Level indicator
  const currentDifficulty = getCurrentDifficultyLevel(gameState.score, DIFFICULTY_LEVELS);
  p.fill(40, 40, 60, 200);
  p.rect(10, 90, 180, 35, 5);
  
  p.fill(200, 150, 255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.textStyle(p.BOLD);
  p.text(`LEVEL ${currentDifficulty.level}`, 20, 95);
  
  p.textStyle(p.NORMAL);
  p.textSize(10);
  p.fill(180, 180, 180);
  if (currentDifficulty.level < 5) {
    const nextLevel = DIFFICULTY_LEVELS[currentDifficulty.level];
    const pointsNeeded = nextLevel.scoreThreshold - gameState.score;
    p.text(`${pointsNeeded} pts to next level`, 20, 110);
  } else {
    p.text("MAX LEVEL!", 20, 110);
  }
}

export function drawGameOverScreen(p) {
  p.background(20, 20, 40);
  
  const isWin = gameState.gamePhase === PHASE_GAME_OVER_WIN;
  
  // Result message
  if (isWin) {
    p.fill(100, 255, 150);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(56);
    p.textStyle(p.BOLD);
    p.text("VICTORY!", CANVAS_WIDTH / 2, 100);
    
    p.fill(200, 255, 200);
    p.textSize(20);
    p.textStyle(p.NORMAL);
    p.text("You're a Prime Master!", CANVAS_WIDTH / 2, 150);
  } else {
    p.fill(255, 120, 120);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(56);
    p.textStyle(p.BOLD);
    p.text("TIME'S UP!", CANVAS_WIDTH / 2, 100);
    
    p.fill(255, 200, 200);
    p.textSize(20);
    p.textStyle(p.NORMAL);
    p.text("Keep practicing your prime skills!", CANVAS_WIDTH / 2, 150);
  }
  
  // Final score
  p.fill(255, 220, 100);
  p.textSize(18);
  p.textStyle(p.BOLD);
  p.text("FINAL SCORE", CANVAS_WIDTH / 2, 210);
  
  p.fill(255, 255, 255);
  p.textSize(48);
  p.text(gameState.score, CANVAS_WIDTH / 2, 250);
  
  // Stats
  const reachedLevel = getCurrentDifficultyLevel(gameState.score, DIFFICULTY_LEVELS).level;
  p.fill(180, 180, 220);
  p.textSize(14);
  p.textStyle(p.NORMAL);
  p.text(`Reached Level ${reachedLevel}`, CANVAS_WIDTH / 2, 300);
  
  // Restart prompt
  const pulse = Math.sin(p.frameCount * 0.1) * 20 + 235;
  p.fill(pulse, pulse, 255);
  p.textSize(18);
  p.textStyle(p.BOLD);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 350);
}