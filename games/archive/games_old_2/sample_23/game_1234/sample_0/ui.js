// ui.js - UI rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { loadLevel } from './game.js';

export function renderStartScreen(p) {
  p.background(135, 206, 235);
  
  // Title
  p.fill(255, 100, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text("Cut the Rope", CANVAS_WIDTH/2, 80);
  
  // Description
  p.fill(255);
  p.textSize(14);
  p.textStyle(p.NORMAL);
  const desc1 = "Help Om Nom get his candy!";
  const desc2 = "Cut ropes strategically, collect stars,";
  const desc3 = "and avoid hazards to complete each level.";
  p.text(desc1, CANVAS_WIDTH/2, 150);
  p.text(desc2, CANVAS_WIDTH/2, 170);
  p.text(desc3, CANVAS_WIDTH/2, 190);
  
  // Instructions
  p.textSize(12);
  p.text("CONTROLS:", CANVAS_WIDTH/2, 230);
  p.textAlign(p.LEFT, p.CENTER);
  p.text("• Drag mouse across rope to cut", 100, 255);
  p.text("• Click air cushions and bubbles", 100, 275);
  p.text("• SPACE: Magic Finger (once per level)", 100, 295);
  p.text("• Z: Restart level", 100, 315);
  p.text("• ESC: Pause", 100, 335);
  
  // Start prompt
  p.fill(255, 255, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.textStyle(p.BOLD);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, 370);
}

export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 30);
  
  p.textSize(16);
  p.textStyle(p.NORMAL);
  p.text("Press ESC to resume", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
  p.text("Press R to restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 45);
}

export function renderGameOver(p) {
  p.background(135, 206, 235);
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  // Title
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text(isWin ? "LEVEL COMPLETE!" : "LEVEL FAILED!", CANVAS_WIDTH/2, 80);
  
  if (isWin) {
    // Stars collected
    p.fill(255);
    p.textSize(24);
    p.text("Stars Collected:", CANVAS_WIDTH/2, 150);
    
    const starsCollected = gameState.starsCollected.filter(s => s).length;
    p.textSize(48);
    for (let i = 0; i < 3; i++) {
      p.text(i < starsCollected ? "★" : "☆", CANVAS_WIDTH/2 - 60 + i * 60, 200);
    }
    
    // Score
    p.textSize(24);
    p.text(`Score: ${gameState.score}`, CANVAS_WIDTH/2, 270);
    
    const highScore = gameState.highScores[gameState.currentLevel] || 0;
    p.textSize(16);
    p.text(`High Score: ${highScore}`, CANVAS_WIDTH/2, 300);
  } else {
    p.fill(255);
    p.textSize(20);
    p.text("Try again!", CANVAS_WIDTH/2, 150);
  }
  
  // Instructions
  p.fill(255, 255, 0);
  p.textSize(18);
  if (isWin && gameState.currentLevel < 4) {
    p.text("Press ENTER for next level", CANVAS_WIDTH/2, 350);
  }
  p.text("Press Z to retry", CANVAS_WIDTH/2, 375);
  p.text("Press R to return to menu", CANVAS_WIDTH/2, 400);
}

export function renderGameUI(p) {
  // Level indicator
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.textStyle(p.BOLD);
  p.text(`Level ${gameState.currentLevel + 1}`, 10, 10);
  
  // Score
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
  
  // Stars
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(24);
  for (let i = 0; i < 3; i++) {
    p.text(gameState.starsCollected[i] ? "★" : "☆", CANVAS_WIDTH/2 - 40 + i * 40, 10);
  }
  
  // Magic finger indicator
  if (!gameState.magicFingerUsed) {
    p.textAlign(p.LEFT, p.BOTTOM);
    p.textSize(12);
    p.fill(255, 255, 0);
    p.text("Magic Finger: SPACE", 10, CANVAS_HEIGHT - 10);
  }
}

export function handleGameOverInput(p) {
  if (p.keyCode === 13 && gameState.gamePhase === "GAME_OVER_WIN") { // ENTER
    if (gameState.currentLevel < 4) {
      gameState.currentLevel++;
      loadLevel(p, gameState.currentLevel);
      gameState.gamePhase = "PLAYING";
      gameState.levelStartTime = Date.now();
      p.logs.game_info.push({
        data: { gamePhase: "PLAYING", level: gameState.currentLevel },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  if (p.keyCode === 90) { // Z - Retry
    loadLevel(p, gameState.currentLevel);
    gameState.gamePhase = "PLAYING";
    gameState.levelStartTime = Date.now();
  }
}