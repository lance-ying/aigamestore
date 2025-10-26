// ui.js - UI rendering
import { gameState, GAME_PHASE, LEVELS, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function drawStartScreen(p) {
  p.push();
  
  p.background(30, 30, 50);
  
  // Title
  p.fill(255, 200, 50);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("BUDDY BRAWLER", CANVAS_WIDTH / 2, 80);
  p.textSize(32);
  p.text("BLITZ", CANVAS_WIDTH / 2, 120);
  
  // Description
  p.fill(200);
  p.textSize(14);
  p.text("Hit Buddy with weapons to score points!", CANVAS_WIDTH / 2, 170);
  p.text("Complete each level's target score before time runs out.", CANVAS_WIDTH / 2, 190);
  
  // Instructions
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.fill(180);
  const instructions = [
    "SPACE: Kick at cursor",
    "Z: Use selected weapon",
    "LEFT/RIGHT: Cycle weapons",
    "SHIFT: Precision mode",
    "ESC: Pause",
    "R: Restart"
  ];
  
  let y = 230;
  for (let inst of instructions) {
    p.text(inst, 150, y);
    y += 18;
  }
  
  // Start prompt
  p.fill(100, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  const alpha = 128 + Math.sin(p.frameCount * 0.1) * 127;
  p.fill(100, 255, 100, alpha);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
  
  p.pop();
}

export function drawPausedIndicator(p) {
  p.push();
  p.fill(255, 255, 0);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  p.pop();
}

export function drawGameOverScreen(p, isWin) {
  p.push();
  
  // Semi-transparent overlay
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.textAlign(p.CENTER, p.CENTER);
  
  if (isWin) {
    p.fill(100, 255, 100);
    p.textSize(48);
    p.text("LEVEL COMPLETE!", CANVAS_WIDTH / 2, 120);
    
    if (gameState.currentLevel >= LEVELS.length) {
      p.fill(255, 200, 50);
      p.textSize(36);
      p.text("YOU WIN!", CANVAS_WIDTH / 2, 180);
    }
  } else {
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text("TIME'S UP!", CANVAS_WIDTH / 2, 120);
  }
  
  p.fill(255);
  p.textSize(20);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  p.text(`Coins Earned: ${Math.floor(gameState.score / 100)}`, CANVAS_WIDTH / 2, 250);
  
  p.fill(200);
  p.textSize(16);
  const alpha = 128 + Math.sin(p.frameCount * 0.1) * 127;
  p.fill(200, 200, 200, alpha);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 320);
  
  p.pop();
}

export function drawHUD(p) {
  p.push();
  
  // Score
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text(`SCORE: ${gameState.score.toString().padStart(5, '0')}`, CANVAS_WIDTH - 10, 10);
  
  // Level
  p.textAlign(p.LEFT, p.TOP);
  p.text(`LEVEL: ${gameState.currentLevel}`, 10, 10);
  
  // Timer
  p.textAlign(p.CENTER, p.TOP);
  const minutes = Math.floor(gameState.timeRemaining / 60);
  const seconds = Math.floor(gameState.timeRemaining % 60);
  const timeColor = gameState.timeRemaining < 10 ? [255, 100, 100] : [255, 255, 255];
  p.fill(...timeColor);
  p.text(`TIME: ${minutes}:${seconds.toString().padStart(2, '0')}`, CANVAS_WIDTH / 2, 10);
  
  // Target Score
  p.fill(200);
  p.textSize(12);
  const currentLevelData = LEVELS[gameState.currentLevel - 1];
  p.text(`Target: ${currentLevelData.targetScore}`, CANVAS_WIDTH / 2, 30);
  
  // Coins
  p.fill(255, 200, 50);
  p.textAlign(p.CENTER, p.TOP);
  p.text(`COINS: ${gameState.coins}`, CANVAS_WIDTH / 2, 50);
  
  // Combo indicator
  if (gameState.comboTimer > 0) {
    p.fill(255, 200, 0, gameState.comboTimer * 4);
    p.textSize(16);
    p.textAlign(p.CENTER, p.CENTER);
    if (gameState.comboCount >= 3) {
      p.text(`${gameState.comboCount}x COMBO!`, CANVAS_WIDTH / 2, 100);
    }
  }
  
  p.pop();
}